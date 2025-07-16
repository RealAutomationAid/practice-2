import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase-types'

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

// Initialize Supabase client
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SUT_ANALYSIS_PROMPT = `You are a senior QA engineer and test strategist analyzing a comprehensive crawl of a web application (System Under Test). 

Provide a detailed, professional SUT Analysis that covers all the requirements from the crawl data. Structure your analysis in the following format:

## 1. Application Overview
- **Purpose & Business Functions**: Describe what the application does, its main business value, and user goals
- **Application Category**: E-commerce, SaaS, CMS, etc.
- **Technology Stack**: Visible technologies, frameworks, libraries detected
- **User Roles & Personas**: Identify different user types and their access levels
- **Key Business Workflows**: Main user journeys and critical business processes

## 2. Site Structure & Navigation
- **Site Architecture**: Overall structure and page hierarchy
- **Navigation Patterns**: Main navigation, footer links, breadcrumbs
- **Page Inventory**: List all discovered pages with their purpose
- **Information Architecture**: Content organization and categorization
- **URL Structure**: Patterns and conventions observed

## 3. Feature Inventory & Risk Assessment
For each major feature discovered, provide:
- **Feature Name**: Clear descriptive name
- **Business Criticality**: High/Medium/Low
- **User Impact**: Effect on user experience if broken
- **UI Complexity**: Simple/Medium/Complex
- **Dependencies**: External systems, APIs, third-party services
- **Risk Factors**: Potential failure points and testing challenges

## 4. Page-Level Analysis
For each significant page, analyze:
- **Page Purpose**: Business function and user goals
- **Key Components**: Main UI elements and sections
- **Interactive Elements**: Forms, buttons, modals, dynamic content
- **Content Types**: Text, images, media, data displays
- **Testing Considerations**: What needs validation on this page

## 5. Forms & Input Analysis
For each form discovered:
- **Form Purpose**: Registration, contact, checkout, etc.
- **Input Fields**: Types, validation rules, required fields
- **Business Logic**: Data processing and validation rules
- **Error Handling**: Validation messages and error states
- **Security Considerations**: Input sanitization, authentication
- **Accessibility**: Labels, ARIA attributes, keyboard navigation

## 6. Interactive Elements Catalog
- **Buttons & CTAs**: Primary actions and their importance
- **Links**: Internal vs external, navigation patterns
- **Media Elements**: Images, videos, file uploads
- **Dynamic Components**: Modals, accordions, tabs, carousels
- **Third-party Integrations**: Social media, analytics, chatbots

## 7. Security & Authentication Analysis
- **Authentication Flow**: Login/logout process and user management
- **Password Requirements**: Security policies if visible
- **Session Management**: Timeout, persistence, security
- **Data Protection**: HTTPS usage, security headers
- **Access Control**: Role-based permissions and restrictions

## 8. Testing Strategy Recommendations
- **Critical Test Areas**: High-priority testing focus areas
- **Testing Types Needed**: Functional, usability, security, performance
- **Test Environment Considerations**: Data requirements, test users
- **Automation Opportunities**: Repetitive workflows for automation
- **Risk-Based Testing**: High-risk areas requiring thorough testing

## 9. Technical Recommendations
- **Performance Concerns**: Loading issues, optimization opportunities
- **Compatibility Testing**: Browser, device, accessibility requirements
- **Data Testing**: Database operations, data integrity, edge cases
- **Integration Testing**: API calls, third-party services, data flow
- **Security Testing**: Vulnerability assessment priorities

## 10. Implementation Priorities
- **Phase 1 (High Priority)**: Critical functionality and security
- **Phase 2 (Medium Priority)**: User experience and edge cases
- **Phase 3 (Low Priority)**: Nice-to-have features and optimizations
- **Estimated Testing Timeline**: Realistic time estimates for each phase

Be specific, actionable, and focus on practical testing guidance. Use the actual data from the crawl to make concrete recommendations.

Return the analysis as structured text, not JSON.`;

interface AnalysisRequest {
  sutAnalysisId: string
}

// Fallback analysis when OpenAI is not available
function generateFallbackAnalysis(crawlData: any): string {
  const pages = crawlData.pages || []
  const features = crawlData.features || {}
  const summary = crawlData.summary || {}

  return `# SUT Analysis Report

## 1. Application Overview
- **Pages Discovered**: ${summary.totalPages || 0}
- **Forms Found**: ${summary.totalForms || 0}
- **Total Links**: ${summary.totalLinks || 0}
- **Images**: ${summary.totalImages || 0}

## 2. Feature Analysis
- **Login System**: ${features.hasLogin ? 'Present' : 'Not detected'}
- **Search Functionality**: ${features.hasSearch ? 'Present' : 'Not detected'}
- **Shopping Cart**: ${features.hasCart ? 'Present' : 'Not detected'}
- **User Profiles**: ${features.hasUserProfile ? 'Present' : 'Not detected'}
- **Comments/Reviews**: ${features.hasComments ? 'Present' : 'Not detected'}
- **Rating System**: ${features.hasRatings ? 'Present' : 'Not detected'}

## 3. Page Inventory
${pages.map((page: any, index: number) => `
### Page ${index + 1}: ${page.title || 'Untitled'}
- **URL**: ${page.url}
- **Forms**: ${page.forms?.length || 0}
- **Links**: ${page.links?.length || 0}
- **Images**: ${page.images?.length || 0}
- **Buttons**: ${page.buttons?.length || 0}
`).join('')}

## 4. Testing Recommendations
- **Critical Areas**: Login functionality, form submissions, core user workflows
- **Testing Types**: Functional testing, UI testing, cross-browser compatibility
- **Risk Areas**: User authentication, data submission, navigation flows
- **Automation Opportunities**: Repetitive form testing, navigation testing

## 5. Implementation Priority
- **High Priority**: Core functionality testing, security testing
- **Medium Priority**: UI/UX testing, browser compatibility
- **Low Priority**: Performance optimization, advanced features

*Note: This is a basic analysis. For detailed insights, configure OpenAI API key.*`
}

export async function POST(request: NextRequest) {
  try {
    const { sutAnalysisId }: AnalysisRequest = await request.json()
    
    if (!sutAnalysisId) {
      return NextResponse.json({ error: 'SUT Analysis ID is required' }, { status: 400 })
    }

    // Fetch the SUT analysis data
    const { data: sutData, error: fetchError } = await supabase
      .from('winners_sut_analysis')
      .select('*')
      .eq('id', sutAnalysisId)
      .single()

    if (fetchError || !sutData) {
      return NextResponse.json({ error: 'SUT analysis not found' }, { status: 404 })
    }

    if (!sutData.crawl_data) {
      return NextResponse.json({ error: 'No crawl data available for analysis' }, { status: 400 })
    }

    let analysis: string

    const openai = getOpenAIClient()
    if (openai) {
      const maxRetries = 3
      const baseDelay = 1000
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          console.log(`Generating AI SUT analysis for: ${sutData.name} (attempt ${attempt + 1})`)
          
          // Prepare crawl data summary for AI (with size limit)
          const crawlDataSummary = JSON.stringify({
            targetUrl: sutData.target_url,
            pages: sutData.crawl_data.pages,
            features: sutData.crawl_data.features,
            navigation: sutData.crawl_data.navigation,
            summary: sutData.crawl_data.summary
          }, null, 2).slice(0, 12000) // Limit size to avoid token limits

          const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
              { role: 'system', content: SUT_ANALYSIS_PROMPT },
              { 
                role: 'user', 
                content: `Analyze this System Under Test based on the comprehensive crawl data:

**Application Name**: ${sutData.name}
**Target URL**: ${sutData.target_url}
**Login Credentials Used**: ${sutData.username ? 'Yes' : 'No'}

**Crawl Results**:
${crawlDataSummary}

Please provide a comprehensive SUT analysis following the structured format.`
              }
            ],
            temperature: 0.3,
            max_tokens: 4000
          })

          const responseText = completion.choices[0]?.message?.content
          if (!responseText) {
            throw new Error('No response from OpenAI')
          }

          analysis = responseText
          console.log('AI SUT analysis generated successfully')
          break // Success, exit retry loop
          
        } catch (aiError: any) {
          console.error(`AI SUT analysis attempt ${attempt + 1} failed:`, aiError.message)
          
          // Check if it's a rate limit error
          if (aiError.status === 429 && attempt < maxRetries - 1) {
            const delay = baseDelay * Math.pow(2, attempt)
            console.log(`Rate limited, waiting ${delay}ms before retry...`)
            await new Promise(resolve => setTimeout(resolve, delay))
            continue
          }

          // Check if it's a server error and we can retry
          if ((aiError.status >= 500 || aiError.code === 'ECONNRESET') && attempt < maxRetries - 1) {
            const delay = baseDelay * Math.pow(2, attempt)
            console.log(`Server error, waiting ${delay}ms before retry...`)
            await new Promise(resolve => setTimeout(resolve, delay))
            continue
          }

          // If this is the last attempt, use fallback
          if (attempt === maxRetries - 1) {
            console.error('All AI SUT analysis attempts failed, using fallback')
            analysis = generateFallbackAnalysis(sutData.crawl_data)
          }
        }
      }
    } else {
      console.log('OpenAI not available, using fallback analysis')
      analysis = generateFallbackAnalysis(sutData.crawl_data)
    }

    // Update the SUT analysis with AI analysis
    const { error: updateError } = await supabase
      .from('winners_sut_analysis')
      .update({
        ai_analysis: { analysis, generated_at: new Date().toISOString() },
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', sutAnalysisId)

    if (updateError) {
      console.error('Failed to save AI analysis:', updateError)
      return NextResponse.json({ error: 'Failed to save AI analysis' }, { status: 500 })
    }

    console.log('AI SUT analysis saved successfully for:', sutAnalysisId)

    return NextResponse.json({ 
      analysis,
      message: 'SUT analysis completed successfully'
    })
    
  } catch (error) {
    console.error('SUT AI Analysis API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate SUT analysis' },
      { status: 500 }
    )
  }
}

// GET - Retrieve existing AI analysis
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sutAnalysisId = searchParams.get('id')
    
    if (!sutAnalysisId) {
      return NextResponse.json({ error: 'SUT Analysis ID is required' }, { status: 400 })
    }

    const { data: sutData, error: fetchError } = await supabase
      .from('winners_sut_analysis')
      .select('ai_analysis, name, target_url, status')
      .eq('id', sutAnalysisId)
      .single()

    if (fetchError || !sutData) {
      return NextResponse.json({ error: 'SUT analysis not found' }, { status: 404 })
    }

    if (!sutData.ai_analysis) {
      return NextResponse.json({ error: 'No AI analysis available yet' }, { status: 404 })
    }

    return NextResponse.json({
      analysis: sutData.ai_analysis,
      name: sutData.name,
      target_url: sutData.target_url,
      status: sutData.status
    })
    
  } catch (error) {
    console.error('GET SUT AI Analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch AI analysis' },
      { status: 500 }
    )
  }
}