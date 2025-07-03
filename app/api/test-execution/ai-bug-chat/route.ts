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
}

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

// Initialize Supabase client with service role key
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SYSTEM_PROMPT = `You are an AI assistant that helps create bug reports from user descriptions. You should be very flexible and create bug reports even with minimal information.

AVAILABLE FIELDS in the database:
- title (required): Brief summary of the bug
- description (optional): Detailed description
- severity (optional): low|medium|high|critical (defaults to medium)
- priority (optional): low|medium|high|urgent (defaults to medium)
- status (optional): open|in_progress|resolved|closed|duplicate (defaults to open)
- reporter_name (optional): Person reporting (defaults to 'admin')
- reporter_email (optional): Email (defaults to 'admin@test.com')
- assigned_to (optional): Who it's assigned to
- environment (optional): production|staging|development (defaults to production)
- browser (optional): Browser used (chrome|firefox|safari|edge|unknown)
- device (optional): desktop|mobile|tablet (defaults to desktop)
- os (optional): Operating system (defaults to unknown)
- url (optional): URL where bug occurred
- steps_to_reproduce (optional): Array of steps
- expected_result (optional): What should happen
- actual_result (optional): What actually happened
- tags (optional): Array of tags for categorization
- attachments (optional): File attachments (handled separately)

GUIDELINES:
1. CREATE bug reports liberally - even for vague descriptions like "login broken" or "page doesn't work"
2. ALWAYS generate a meaningful title from the user's input
3. Use the user's exact words when possible for description and actual_result
4. Fill in reasonable defaults for missing information
5. Set shouldCreateBug to true unless the user is clearly NOT reporting a bug (like asking questions about the system)

Respond with JSON in this exact format:
{
  "shouldCreateBug": boolean,
  "response": "helpful message to user",
  "bugData": {
    "title": "string (required)",
    "description": "string (optional)",
    "severity": "low|medium|high|critical",
    "priority": "low|medium|high|urgent", 
    "environment": "production|staging|development",
    "browser": "string",
    "device": "desktop|mobile|tablet",
    "os": "string",
    "url": "string",
    "steps_to_reproduce": "string",
    "expected_result": "string", 
    "actual_result": "string",
    "tags": ["array", "of", "strings"]
  }
}

EXAMPLES:
- "login broken" → title: "Login functionality not working", description: "User reported login broken"
- "page crashes on Chrome" → title: "Page crash in Chrome browser", browser: "chrome"
- "can't save" → title: "Save functionality issue", actual_result: "Unable to save"

Be helpful and confirm what bug report was created.`

// Fallback keyword-based extraction
function extractBugDataFallback(message: string): any {
  const bugKeywords = ['bug', 'error', 'issue', 'problem', 'broken', 'not working', 'crash', 'fail', 'incorrect', 'wrong', 'broken', 'doesn\'t work', 'can\'t', 'unable', 'freeze', 'slow', 'missing']
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
  if (message.toLowerCase().match(/(critical|crash|down|broken|freeze|freezes|hang)/i)) {
    severity = 'high'
  } else if (message.toLowerCase().match(/(minor|small|cosmetic|typo)/i)) {
    severity = 'low'
  }

  // Determine priority
  let priority = 'medium'
  if (message.toLowerCase().match(/(urgent|asap|critical|blocker)/i)) {
    priority = 'urgent'
  } else if (message.toLowerCase().match(/(low|minor|nice to have)/i)) {
    priority = 'low'
  }

  // Generate title from message
  let title = message.substring(0, 60).trim()
  if (title.length >= 60) title += '...'
  if (!title.toLowerCase().includes('bug') && !title.toLowerCase().includes('issue')) {
    title = `Issue: ${title}`
  }

  return {
    shouldCreateBug: true,
    response: "I've created a bug report based on your description. The bug has been logged and you can view it in the bug reports list above.",
    bugData: {
      title,
      description: message,
      severity,
      priority,
      environment: 'local',
      browser,
      device,
      os: 'unknown',
      url,
      steps_to_reproduce: message.length > 20 ? message : '',
      expected_result: 'System should work correctly',
      actual_result: message,
      tags: []
    }
  }
}

// OpenAI-based extraction
async function extractBugDataWithAI(message: string, conversationHistory: ChatMessage[]): Promise<any> {
  if (!openai) {
    return extractBugDataFallback(message)
  }

  try {
    // Build conversation context
    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...conversationHistory.slice(-5).map(msg => ({
        role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      })),
      { role: 'user' as const, content: message }
    ]

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages,
      temperature: 0.3,
      max_tokens: 1000
    })

    const responseText = completion.choices[0]?.message?.content
    if (!responseText) {
      throw new Error('No response from OpenAI')
    }

    // Parse JSON response
    const parsed = JSON.parse(responseText)
    
    // Ensure browser/environment defaults
    if (parsed.bugData) {
      if (!parsed.bugData.browser) parsed.bugData.browser = 'chrome';
      if (!parsed.bugData.environment) parsed.bugData.environment = 'local';
    }
    return parsed
  } catch (error) {
    console.error('OpenAI extraction failed:', error)
    return extractBugDataFallback(message)
  }
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
      tags: bugData.tags || []
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

    // Handle image attachments if provided
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
    const { message, conversationHistory, attachments } = body

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Extract bug information using AI or fallback
    const extractionResult = await extractBugDataWithAI(message, conversationHistory)
    
    let bugId: string | null = null
    let bugCreated = false

    // Create bug report if needed
    if (extractionResult.shouldCreateBug && extractionResult.bugData) {
      bugId = await createBugReport(extractionResult.bugData, attachments)
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