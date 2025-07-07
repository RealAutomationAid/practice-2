import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { AuditReport } from '@/types/audit'

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const AI_ANALYSIS_PROMPT = `You are a senior web performance and security consultant analyzing a website audit report. Provide intelligent, actionable insights and recommendations.

Given the audit data, analyze and provide:

1. **Performance Analysis**
   - TTFB assessment and optimization recommendations
   - Content size analysis and compression suggestions
   - Asset optimization opportunities
   - Loading speed improvements

2. **Security Assessment**
   - SSL/TLS security evaluation
   - Missing security headers and their importance
   - Vulnerability explanations and remediation steps
   - Risk level assessment

3. **SEO & Accessibility Analysis**
   - Meta tag optimization suggestions
   - Heading structure improvements
   - Image alt tag recommendations
   - Content structure analysis

4. **Technical Recommendations**
   - Server and infrastructure improvements
   - Technology stack optimization
   - Implementation priorities (High/Medium/Low)
   - Estimated implementation time and effort

5. **Business Impact**
   - Performance impact on user experience
   - Security risks and their business implications
   - SEO impact on organic traffic
   - Conversion rate optimization opportunities

Return analysis as JSON in this exact structure:
{
  "summary": {
    "overallScore": number (0-100),
    "performanceGrade": "A|B|C|D|F",
    "securityGrade": "A|B|C|D|F",
    "seoGrade": "A|B|C|D|F",
    "keyIssues": ["string", "string"],
    "quickWins": ["string", "string"]
  },
  "performance": {
    "analysis": "detailed analysis text",
    "recommendations": [
      {
        "title": "string",
        "description": "string",
        "priority": "high|medium|low",
        "effort": "low|medium|high",
        "impact": "low|medium|high",
        "estimatedTime": "string (e.g., '2-4 hours')"
      }
    ]
  },
  "security": {
    "analysis": "detailed analysis text",
    "recommendations": [
      {
        "title": "string",
        "description": "string",
        "priority": "high|medium|low",
        "effort": "low|medium|high",
        "impact": "low|medium|high",
        "estimatedTime": "string"
      }
    ]
  },
  "seo": {
    "analysis": "detailed analysis text",
    "recommendations": [
      {
        "title": "string",
        "description": "string",
        "priority": "high|medium|low",
        "effort": "low|medium|high",
        "impact": "low|medium|high",
        "estimatedTime": "string"
      }
    ]
  },
  "businessImpact": {
    "userExperience": "analysis of UX impact",
    "searchRanking": "analysis of SEO impact",
    "conversion": "analysis of conversion impact",
    "riskAssessment": "security and performance risks"
  },
  "implementationPlan": {
    "phase1": ["high priority items"],
    "phase2": ["medium priority items"],
    "phase3": ["low priority items"],
    "totalEstimatedTime": "string (e.g., '2-3 weeks')"
  }
}

Be specific, actionable, and provide realistic timelines. Focus on practical improvements that will have measurable impact.`

interface AnalysisRequest {
  auditReport: AuditReport
  reportId?: string
}

// Fallback analysis when OpenAI is not available
function generateFallbackAnalysis(report: AuditReport): any {
  const performanceGrade = report.performance.ttfb < 500 ? 'A' : 
                         report.performance.ttfb < 1000 ? 'B' : 
                         report.performance.ttfb < 2000 ? 'C' : 'D'

  const securityScore = Object.values(report.security.headers).filter(Boolean).length / Object.keys(report.security.headers).length * 100
  const securityGrade = securityScore >= 90 ? 'A' : 
                       securityScore >= 70 ? 'B' : 
                       securityScore >= 50 ? 'C' : 'D'

  const seoGrade = report.seo.title && report.seo.description ? 'B' : 'C'

  return {
    summary: {
      overallScore: Math.round((
        (performanceGrade === 'A' ? 90 : performanceGrade === 'B' ? 75 : 60) +
        securityScore +
        (seoGrade === 'B' ? 75 : 60)
      ) / 3),
      performanceGrade,
      securityGrade,
      seoGrade,
      keyIssues: [
        report.performance.ttfb > 1000 ? `Slow TTFB: ${report.performance.ttfb}ms` : null,
        !report.security.ssl.valid ? 'Invalid SSL certificate' : null,
        !report.seo.title ? 'Missing page title' : null
      ].filter(Boolean),
      quickWins: [
        'Enable gzip compression',
        'Add missing security headers',
        'Optimize images with alt tags'
      ]
    },
    performance: {
      analysis: `Your website has a TTFB of ${report.performance.ttfb}ms and a page size of ${Math.round(report.performance.contentSize / 1024)}KB.`,
      recommendations: [
        {
          title: 'Optimize Time to First Byte',
          description: report.performance.ttfb > 1000 ? 'TTFB is above 1 second, consider server optimization' : 'TTFB is acceptable but can be improved',
          priority: report.performance.ttfb > 1000 ? 'high' : 'medium',
          effort: 'medium',
          impact: 'high',
          estimatedTime: '4-8 hours'
        }
      ]
    },
    security: {
      analysis: `Security headers coverage: ${Math.round(securityScore)}%. SSL certificate is ${report.security.ssl.valid ? 'valid' : 'invalid'}.`,
      recommendations: [
        {
          title: 'Implement Missing Security Headers',
          description: 'Add missing security headers to protect against common attacks',
          priority: 'high',
          effort: 'low',
          impact: 'high',
          estimatedTime: '1-2 hours'
        }
      ]
    },
    seo: {
      analysis: `Page has ${report.seo.title ? 'a title' : 'no title'} and ${report.seo.description ? 'a description' : 'no description'}. ${report.seo.altTags}/${report.seo.totalImages} images have alt tags.`,
      recommendations: [
        {
          title: 'Optimize Meta Tags',
          description: 'Ensure all pages have unique, descriptive titles and meta descriptions',
          priority: 'medium',
          effort: 'low',
          impact: 'medium',
          estimatedTime: '2-3 hours'
        }
      ]
    },
    businessImpact: {
      userExperience: report.performance.ttfb > 1000 ? 'Slow loading may impact user satisfaction' : 'Loading speed is acceptable',
      searchRanking: 'SEO optimizations can improve search visibility',
      conversion: 'Performance and security improvements typically increase conversion rates',
      riskAssessment: !report.security.ssl.valid ? 'Security issues present moderate risk' : 'Security risk is low'
    },
    implementationPlan: {
      phase1: ['Fix SSL certificate', 'Add security headers'],
      phase2: ['Optimize performance', 'Improve SEO meta tags'],
      phase3: ['Advanced optimizations', 'Monitoring setup'],
      totalEstimatedTime: '1-2 weeks'
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { auditReport, reportId }: AnalysisRequest = await request.json()
    
    if (!auditReport) {
      return NextResponse.json({ error: 'Audit report is required' }, { status: 400 })
    }

    let analysis

    if (openai) {
      try {
        console.log('Generating AI analysis for:', auditReport.url)
        
        const completion = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: AI_ANALYSIS_PROMPT },
            { 
              role: 'user', 
              content: `Analyze this website audit report:\n\n${JSON.stringify(auditReport, null, 2)}`
            }
          ],
          temperature: 0.3,
          max_tokens: 3000
        })

        const responseText = completion.choices[0]?.message?.content
        if (!responseText) {
          throw new Error('No response from OpenAI')
        }

        // Parse the JSON response
        analysis = JSON.parse(responseText)
        console.log('AI analysis generated successfully')
        
      } catch (aiError) {
        console.error('AI analysis failed, using fallback:', aiError)
        analysis = generateFallbackAnalysis(auditReport)
      }
    } else {
      console.log('OpenAI not available, using fallback analysis')
      analysis = generateFallbackAnalysis(auditReport)
    }

    // Save analysis to database if reportId is provided
    if (reportId) {
      try {
        await supabase
          .from('winners_audit_reports')
          .update({
            ai_analysis: analysis,
            updated_at: new Date().toISOString()
          })
          .eq('id', reportId)
        
        console.log('AI analysis saved to database for report:', reportId)
      } catch (dbError) {
        console.error('Failed to save AI analysis to database:', dbError)
        // Don't fail the request if database save fails
      }
    }

    return NextResponse.json({ analysis })
    
  } catch (error) {
    console.error('AI Analysis API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate analysis' },
      { status: 500 }
    )
  }
}