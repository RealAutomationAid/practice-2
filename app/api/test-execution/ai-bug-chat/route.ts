import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { Database, BugReportInsert } from '@/lib/supabase-types'

interface ChatMessage {
  id: string
  type: 'user' | 'ai' | 'system'
  content: string
  timestamp: Date
  bugCreated?: boolean
  bugId?: string
}

interface RequestBody {
  message: string
  conversationHistory: ChatMessage[]
  attachments?: {
    name: string
    type: string
    size: number
    data: string // base64 encoded data
  }[]
  test_project_id?: string
}

// Initialize OpenAI client dynamically on each request
function getOpenAIClient() {
  // Force load from .env.local first, then .env, then system env
  const fs = require('fs')
  let apiKey = process.env.OPENAI_API_KEY
  
  // Override system env with .env.local if exists
  if (fs.existsSync('.env.local')) {
    const envContent = fs.readFileSync('.env.local', 'utf8')
    const match = envContent.match(/OPENAI_API_KEY=(.+)/)
    if (match) {
      apiKey = match[1].trim()
      console.log('Using API key from .env.local (ends with:', apiKey.slice(-8) + ')')
    }
  }
  
  // Override with .env if .env.local doesn't have it
  if (!apiKey && fs.existsSync('.env')) {
    const envContent = fs.readFileSync('.env', 'utf8')
    const match = envContent.match(/OPENAI_API_KEY=(.+)/)
    if (match) {
      apiKey = match[1].trim()
      console.log('Using API key from .env (ends with:', apiKey.slice(-8) + ')')
    }
  }
  
  if (!apiKey) {
    console.error('OpenAI API key not configured')
    return null
  }
  
  return new OpenAI({ apiKey })
}

// Initialize Supabase client with service role key
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SYSTEM_PROMPT = `You are an AI assistant that helps create bug reports from user descriptions. You should be very flexible and create bug reports even with minimal information.

Your goal is to extract structured bug information from natural language descriptions and create comprehensive bug reports. Even if the user provides minimal information like "login broken" or "page doesn't work", you should still create a bug report.

CRITICAL: You must respond with ONLY valid JSON. Do not use markdown code blocks or any other formatting. Just pure JSON.

Respond with JSON in this exact format:
{
  "shouldCreateBug": boolean,
  "response": "helpful message to user",
  "bugData": {
    "title": "string (required - brief summary)",
    "description": "string (detailed description)",
    "severity": "low|medium|high|critical",
    "priority": "low|medium|high|urgent", 
    "environment": "production|staging|development|local",
    "browser": "chrome|firefox|safari|edge|unknown",
    "device": "desktop|mobile|tablet",
    "os": "windows|mac|linux|android|ios|unknown",
    "url": "string (URL where bug occurred)",
    "steps_to_reproduce": "string (detailed steps)",
    "expected_result": "string (what should happen)", 
    "actual_result": "string (what actually happened)",
    "tags": ["array", "of", "strings"]
  }
}

GUIDELINES:
1. ALWAYS create bug reports unless the user is asking questions about the system
2. Generate meaningful titles from user input
3. Expand minimal descriptions into detailed bug reports
4. Use reasonable defaults for missing information
5. Extract all available context from the user's message
6. Ask clarifying questions in your response if needed
7. RESPOND WITH ONLY JSON - NO MARKDOWN, NO CODE BLOCKS, NO EXTRA TEXT

EXAMPLES:
- "login broken" → Create bug with title "Login functionality not working", expand with likely scenarios
- "page crashes" → Create bug with title "Page crash issue", ask for browser/steps
- "can't save" → Create bug with title "Save functionality issue", expand with typical save scenarios

Always be helpful and confirm what bug report was created.`

// Fallback keyword-based extraction
function extractBugDataFallback(message: string): any {
  const bugKeywords = ['bug', 'error', 'issue', 'problem', 'broken', 'not working', 'crash', 'fail', 'incorrect', 'wrong', 'doesn\'t work', 'can\'t', 'unable', 'freeze', 'slow', 'missing', 'glitch', 'stopped', 'hanging', 'timeout']
  const questionKeywords = ['how', 'what', 'when', 'where', 'why', 'help', 'explain']
  
  const hasBugKeywords = bugKeywords.some(keyword => 
    message.toLowerCase().includes(keyword)
  )
  
  const isQuestion = questionKeywords.some(keyword => 
    message.toLowerCase().startsWith(keyword)
  ) && message.includes('?')
  
  // Be very liberal - create bug reports unless it's clearly a question
  if (isQuestion && !hasBugKeywords) {
    return {
      shouldCreateBug: false,
      response: "I'd be happy to help you create a bug report! Could you describe the issue you're experiencing?",
      bugData: null
    }
  }

  // Extract URL
  const urlMatch = message.match(/https?:\/\/[^\s]+/i)
  const url = urlMatch ? urlMatch[0] : ''

  // Extract browser
  const browserMatch = message.toLowerCase().match(/(chrome|firefox|safari|edge|internet explorer|ie)/i)
  const browser = browserMatch ? browserMatch[1] : 'chrome'

  // Extract OS
  const osMatch = message.toLowerCase().match(/(windows|mac|linux|android|ios|ubuntu|debian)/i)
  const os = osMatch ? osMatch[1] : 'unknown'

  // Extract device
  const deviceMatch = message.toLowerCase().match(/(mobile|phone|tablet|ipad|android|desktop|laptop)/i)
  let device = 'desktop'
  if (deviceMatch) {
    const deviceType = deviceMatch[1].toLowerCase()
    if (['mobile', 'phone', 'android'].includes(deviceType)) device = 'mobile'
    else if (['tablet', 'ipad'].includes(deviceType)) device = 'tablet'
  }

  // Determine severity
  let severity = 'medium'
  if (message.toLowerCase().match(/(critical|crash|down|broken|freeze|freezes|hang|blocker|urgent)/i)) {
    severity = 'high'
  } else if (message.toLowerCase().match(/(minor|small|cosmetic|typo|slight)/i)) {
    severity = 'low'
  }

  // Determine priority
  let priority = 'medium'
  if (message.toLowerCase().match(/(urgent|asap|critical|blocker|high priority)/i)) {
    priority = 'urgent'
  } else if (message.toLowerCase().match(/(low|minor|nice to have|low priority)/i)) {
    priority = 'low'
  }

  // Generate more intelligent title
  let title = message.substring(0, 60).trim()
  if (title.length >= 60) title += '...'
  
  // Improve title based on common patterns
  if (message.toLowerCase().includes('login')) {
    title = 'Login functionality issue'
  } else if (message.toLowerCase().includes('save')) {
    title = 'Save functionality issue'
  } else if (message.toLowerCase().includes('load')) {
    title = 'Loading issue'
  } else if (message.toLowerCase().includes('crash')) {
    title = 'Application crash'
  } else if (message.toLowerCase().includes('slow')) {
    title = 'Performance issue'
  } else if (!title.toLowerCase().includes('bug') && !title.toLowerCase().includes('issue')) {
    title = `Issue: ${title}`
  }

  // Generate more detailed description
  const description = message.length > 10 ? message : `User reported: ${message}`

  // Generate better steps to reproduce
  const steps = message.length > 20 ? 
    `Steps based on user description:\n1. ${message}` : 
    `1. User reported: ${message}\n2. Investigation needed for exact reproduction steps`

  // Generate better expected/actual results
  const expectedResult = message.toLowerCase().includes('crash') ? 'Application should work without crashing' :
                        message.toLowerCase().includes('slow') ? 'Application should perform at normal speed' :
                        message.toLowerCase().includes('login') ? 'Login should work successfully' :
                        message.toLowerCase().includes('save') ? 'Save operation should complete successfully' :
                        'System should work correctly'

  const actualResult = message.toLowerCase().includes('crash') ? 'Application crashes' :
                      message.toLowerCase().includes('slow') ? 'Application runs slowly' :
                      message.toLowerCase().includes('login') ? 'Login fails' :
                      message.toLowerCase().includes('save') ? 'Save operation fails' :
                      message

  return {
    shouldCreateBug: true,
    response: "I've created a bug report based on your description. The bug has been logged and you can view it in the bug reports list above. If you have more details about the issue, feel free to share them!",
    bugData: {
      title,
      description,
      severity,
      priority,
      environment: 'local',
      browser,
      device,
      os,
      url,
      steps_to_reproduce: steps,
      expected_result: expectedResult,
      actual_result: actualResult,
      tags: []
    }
  }
}

// OpenAI-based extraction with retry mechanism
async function extractBugDataWithAI(message: string, conversationHistory: ChatMessage[], systemPrompt: string = SYSTEM_PROMPT): Promise<any> {
  const openai = getOpenAIClient()
  if (!openai) {
    console.log('OpenAI client not available, using fallback')
    return extractBugDataFallback(message)
  }

  // Input validation
  if (!message?.trim()) {
    console.error('Invalid message input for OpenAI')
    return extractBugDataFallback(message)
  }

  const maxRetries = 3
  const baseDelay = 1000

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Build conversation context
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...conversationHistory.slice(-5).map(msg => ({
          role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content.slice(0, 1000) // Limit context length
        })),
        { role: 'user' as const, content: message.slice(0, 2000) } // Limit input length
      ]

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        temperature: 0.3,
        max_tokens: 1000
      })

      const responseText = completion.choices[0]?.message?.content
      if (!responseText) {
        throw new Error('No response from OpenAI')
      }

      // Parse JSON response with better error handling
      let parsed
      try {
        // Extract JSON from markdown code blocks if present
        let jsonText = responseText.trim()
        
        // Remove markdown code blocks if present
        if (jsonText.startsWith('```json')) {
          jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
        } else if (jsonText.startsWith('```')) {
          jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '')
        }
        
        // Try to find JSON object if response contains other text
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          jsonText = jsonMatch[0]
        }
        
        parsed = JSON.parse(jsonText)
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', parseError)
        console.error('Raw response:', responseText)
        throw new Error('Invalid JSON response from OpenAI')
      }

      // Validate response structure
      if (!parsed.hasOwnProperty('shouldCreateBug') || !parsed.hasOwnProperty('response')) {
        console.error('Invalid response structure from OpenAI')
        throw new Error('Invalid response structure')
      }
      
      // Ensure browser/environment defaults
      if (parsed.bugData) {
        if (!parsed.bugData.browser) parsed.bugData.browser = 'chrome'
        if (!parsed.bugData.environment) parsed.bugData.environment = 'local'
      }
      
      return parsed

    } catch (error: any) {
      console.error(`OpenAI extraction attempt ${attempt + 1} failed:`, error.message)
      
      // Check if it's a rate limit error
      if (error.status === 429 && attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt)
        console.log(`Rate limited, waiting ${delay}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }

      // Check if it's a timeout or server error and we can retry
      if ((error.status >= 500 || error.code === 'ECONNRESET' || error.name === 'AbortError') && attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt)
        console.log(`Server error, waiting ${delay}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }

      // If this is the last attempt or a non-retryable error, fall back
      if (attempt === maxRetries - 1) {
        console.error('All OpenAI attempts failed, using fallback')
        return extractBugDataFallback(message)
      }
    }
  }

  return extractBugDataFallback(message)
}

// Create bug report in Supabase
async function createBugReport(bugData: any, attachments?: any[]): Promise<string | null> {
  try {
    const bugReport: BugReportInsert = {
      title: bugData.title || 'Untitled Bug',
      description: bugData.description || '',
      severity: bugData.severity || 'medium',
      priority: bugData.priority || 'medium',
      reporter_name: 'Sava/Slav',
      reporter_email: 'sava@slav.com',
      assigned_to: bugData.assigned_to || null,
      environment: bugData.environment || 'local',
      browser: bugData.browser || 'chrome',
      device: bugData.device || 'desktop',
      os: bugData.os || 'unknown',
      url: bugData.url || '',
      steps_to_reproduce: bugData.steps_to_reproduce ? [bugData.steps_to_reproduce] : [],
      expected_result: bugData.expected_result || '',
      actual_result: bugData.actual_result || '',
      status: 'open',
      tags: bugData.tags || [],
      test_project_id: bugData.test_project_id || undefined
    }

    const { data, error } = await supabase
      .from('winners_bug_reports')
      .insert(bugReport)
      .select('id')
      .single()

    if (error) {
      console.error('Supabase insertion error:', error)
      return null
    }

    const bugId = data.id

    // Handle file attachments (images and videos) if provided
    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        try {
          // Upload to Supabase storage
          const fileExtension = attachment.type.split('/')[1] || 'jpg'
          const fileName = `${bugId}_${Date.now()}.${fileExtension}`
          const filePath = `bug-attachments/${fileName}`

          // Convert base64 to buffer
          const base64Data = attachment.data.split(',')[1] // Remove data:image/jpeg;base64, prefix
          const buffer = Buffer.from(base64Data, 'base64')

          const { error: uploadError } = await supabase.storage
            .from('winners-test-assets')
            .upload(filePath, buffer, {
              contentType: attachment.type,
              upsert: false
            })

          if (uploadError) {
            console.error('Failed to upload attachment:', uploadError)
            continue
          }

          // Create attachment record in database
          const attachmentRecord = {
            bug_id: bugId,
            file_name: attachment.name,
            file_type: attachment.type,
            file_size: attachment.size,
            storage_path: filePath,
            mime_type: attachment.type
          }

          const { error: attachmentError } = await supabase
            .from('winners_attachments')
            .insert(attachmentRecord)

          if (attachmentError) {
            console.error('Failed to create attachment record:', attachmentError)
          }
        } catch (attachmentError) {
          console.error('Error processing attachment:', attachmentError)
        }
      }
    }

    return bugId
  } catch (error) {
    console.error('Failed to create bug report:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json()
    const { message, conversationHistory, attachments, test_project_id } = body

    // Input validation
    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { error: 'Message too long (max 5000 characters)' },
        { status: 400 }
      )
    }

    if (conversationHistory && !Array.isArray(conversationHistory)) {
      return NextResponse.json(
        { error: 'Invalid conversation history format' },
        { status: 400 }
      )
    }

    if (attachments && (!Array.isArray(attachments) || attachments.length > 10)) {
      return NextResponse.json(
        { error: 'Invalid attachments format or too many attachments (max 10)' },
        { status: 400 }
      )
    }

    // Fetch test project context if provided
    let projectContext = ''
    if (test_project_id) {
      const { data: project, error } = await supabase
        .from('winners_test_projects')
        .select('sut_analysis, test_plan, requirements, testing_types, tools_frameworks, more_context, allocated_hours, number_of_test_cases, risk_matrix_generation')
        .eq('id', test_project_id)
        .single()
      if (project && !error) {
        projectContext = `\n\nTEST PROJECT CONTEXT:\n` +
          (project.sut_analysis ? `SUT Analysis: ${project.sut_analysis}\n` : '') +
          (project.test_plan ? `Test Plan: ${project.test_plan}\n` : '') +
          (project.requirements ? `Requirements: ${project.requirements}\n` : '') +
          (project.testing_types ? `Testing Types: ${JSON.stringify(project.testing_types)}\n` : '') +
          (project.tools_frameworks ? `Tools/Frameworks: ${project.tools_frameworks}\n` : '') +
          (project.more_context ? `More Context: ${project.more_context}\n` : '') +
          (project.allocated_hours ? `Allocated Hours: ${project.allocated_hours}\n` : '') +
          (project.number_of_test_cases ? `Number of Test Cases: ${project.number_of_test_cases}\n` : '') +
          (project.risk_matrix_generation ? `Risk Matrix Generation: true\n` : '')
      }
    }

    // Enhance SYSTEM_PROMPT with project context
    const systemPromptWithContext = SYSTEM_PROMPT + projectContext

    // Extract bug information using AI or fallback
    const extractionResult = await extractBugDataWithAI(message, conversationHistory, systemPromptWithContext)
    
    let bugId: string | null = null
    let bugCreated = false

    // Create bug report if needed
    if (extractionResult.shouldCreateBug && extractionResult.bugData) {
      bugId = await createBugReport({ ...extractionResult.bugData, test_project_id }, attachments)
      bugCreated = !!bugId
      
      if (!bugCreated) {
        return NextResponse.json({
          response: "I understand you're describing a bug, but I encountered an error creating the bug report. Please try again or create it manually.",
          bugCreated: false
        })
      }
    }

    return NextResponse.json({
      response: extractionResult.response,
      bugCreated,
      bugId
    })

  } catch (error) {
    console.error('AI Bug Chat API error:', error)
    return NextResponse.json(
      { 
        response: "I apologize, but I encountered an error processing your message. Please try again.",
        bugCreated: false 
      },
      { status: 500 }
    )
  }
} 