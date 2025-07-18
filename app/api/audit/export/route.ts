import { NextRequest, NextResponse } from 'next/server'
import { ExportRequest, AuditReport } from '@/types/audit'


export async function POST(request: NextRequest) {
  try {
    const { reportId, format, report }: ExportRequest = await request.json()
    
    if (!report) {
      return NextResponse.json({ error: 'Report data required' }, { status: 400 })
    }

    if (format === 'markdown') {
      const markdown = generateMarkdownReport(report)
      return new NextResponse(markdown, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': `attachment; filename="audit-${reportId}.md"`
        }
      })
    }

    if (format === 'html') {
      const htmlContent = await generateHTMLReport(report)
      return new NextResponse(htmlContent, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="audit-${reportId}.html"`
        }
      })
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
    
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}

function generateMarkdownReport(report: AuditReport): string {
  const getSecurityScore = () => {
    const totalHeaders = Object.keys(report.security.headers).length
    const presentHeaders = Object.values(report.security.headers).filter(Boolean).length
    return Math.round((presentHeaders / totalHeaders) * 100)
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return `# Website Audit Report

**URL:** ${report.url}  
**Date:** ${new Date(report.timestamp).toLocaleDateString()}  
**Time:** ${new Date(report.timestamp).toLocaleTimeString()}  

## Summary

| Metric | Value |
|--------|-------|
| HTTP Status | ${report.status.code} ${report.status.message} |
| TTFB | ${report.performance.ttfb}ms |
| Security Score | ${getSecurityScore()}/100 |
| Page Size | ${formatBytes(report.performance.contentSize)} |

## Performance Analysis

- **Time to First Byte (TTFB):** ${report.performance.ttfb}ms
- **Content Size:** ${formatBytes(report.performance.contentSize)}
- **Assets Count:** ${report.performance.assetsCount}

## Security Assessment

### SSL Certificate
- **Valid:** ${report.security.ssl.valid ? '✅ Yes' : '❌ No'}
- **Expiry:** ${new Date(report.security.ssl.expiry).toLocaleDateString()}
- **Issuer:** ${report.security.ssl.issuer}

### Security Headers
${Object.entries(report.security.headers).map(([header, present]) => 
  `- **${header}:** ${present ? '✅ Present' : '❌ Missing'}`
).join('\n')}

## SEO & Accessibility

### Meta Information
- **Title:** ${report.seo.title || 'Not found'}
- **Description:** ${report.seo.description || 'Not found'}

### Heading Structure
- **H1 Tags:** ${report.seo.headings.h1}
- **H2 Tags:** ${report.seo.headings.h2}
- **H3 Tags:** ${report.seo.headings.h3}

### Images
- **Total Images:** ${report.seo.totalImages}
- **Images with Alt Tags:** ${report.seo.altTags}
- **Alt Tag Coverage:** ${report.seo.totalImages > 0 ? Math.round((report.seo.altTags / report.seo.totalImages) * 100) : 0}%

## Server Information

- **IP Address:** ${report.server.ip}
- **Location:** ${report.server.location}
- **Reverse DNS:** ${report.server.reverseDns}

### Technology Stack
${report.server.techStack.length > 0 
  ? report.server.techStack.map(tech => `- ${tech}`).join('\n')
  : '- No technology stack detected'
}

---

*Report generated by Automation Aid QA Testing Suite*
`
}

async function generateHTMLReport(report: AuditReport): Promise<string> {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getSecurityScore = () => {
    const totalHeaders = Object.keys(report.security.headers).length
    const presentHeaders = Object.values(report.security.headers).filter(Boolean).length
    return Math.round((presentHeaders / totalHeaders) * 100)
  }

  const getStatusColor = (code: number) => {
    if (code >= 200 && code < 300) return 'bg-green-100 text-green-800'
    if (code >= 300 && code < 400) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-100 text-green-800'
      case 'B': return 'bg-blue-100 text-blue-800'
      case 'C': return 'bg-yellow-100 text-yellow-800'
      case 'D': return 'bg-orange-100 text-orange-800'
      case 'F': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-50 text-red-700 border-red-200'
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'low': return 'bg-green-50 text-green-700 border-green-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Website Audit Report - ${report.url}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; background: #f9fafb; }
        .container { max-width: 1200px; margin: 0 auto; padding: 24px; }
        .card { background: white; border-radius: 8px; border: 1px solid #e5e7eb; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 32px; }
        .header h1 { font-size: 32px; font-weight: bold; color: #1f2937; margin-bottom: 8px; }
        .header .url { font-size: 18px; color: #374151; margin-bottom: 4px; }
        .header .date { font-size: 14px; color: #6b7280; }
        .grid { display: grid; gap: 16px; }
        .grid-2 { grid-template-columns: 1fr 1fr; }
        .grid-3 { grid-template-columns: 1fr 1fr 1fr; }
        .grid-4 { grid-template-columns: 1fr 1fr 1fr 1fr; }
        .metric-card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
        .metric-icon { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
        .metric-label { font-size: 14px; color: #6b7280; margin-bottom: 4px; }
        .metric-value { font-size: 20px; font-weight: bold; color: #1f2937; }
        .section-title { font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
        .subsection-title { font-size: 16px; font-weight: 600; color: #374151; margin-bottom: 12px; }
        .ai-section { background: linear-gradient(to right, #dbeafe, #faf5ff); border: 1px solid #3b82f6; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
        .grade-badge { display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 600; }
        .score-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
        .score-card { background: white; border-radius: 8px; padding: 16px; text-align: center; }
        .score-number { font-size: 24px; font-weight: bold; color: #3b82f6; margin-bottom: 4px; }
        .score-label { font-size: 12px; color: #6b7280; }
        .recommendation { border-radius: 8px; padding: 12px; margin-bottom: 8px; border-left: 4px solid; }
        .recommendation-title { font-weight: 600; margin-bottom: 4px; }
        .recommendation-desc { font-size: 14px; opacity: 0.9; }
        .recommendation-time { font-size: 12px; font-weight: 600; margin-top: 4px; }
        .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
        .flex { display: flex; }
        .items-center { align-items: center; }
        .justify-between { justify-content: space-between; }
        .gap-2 { gap: 8px; }
        .gap-4 { gap: 16px; }
        .mb-2 { margin-bottom: 8px; }
        .mb-4 { margin-bottom: 16px; }
        .text-sm { font-size: 14px; }
        .text-xs { font-size: 12px; }
        .text-green-600 { color: #059669; }
        .text-red-600 { color: #dc2626; }
        .bg-green-50 { background-color: #f0fdf4; }
        .bg-red-50 { background-color: #fef2f2; }
        .bg-blue-50 { background-color: #eff6ff; }
        .bg-orange-50 { background-color: #fff7ed; }
        .bg-gray-50 { background-color: #f9fafb; }
        .border-t { border-top: 1px solid #e5e7eb; }
        .pt-4 { padding-top: 16px; }
        .print-only { display: none; }
        @media print {
            .print-only { display: block; }
            body { background: white; }
            .card { box-shadow: none; border: 1px solid #e5e7eb; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Website Audit Report</h1>
            <div class="url">${report.url}</div>
            <div class="date">${new Date(report.timestamp).toLocaleDateString()} at ${new Date(report.timestamp).toLocaleTimeString()}</div>
        </div>

        <!-- Status Overview -->
        <div class="card">
            <h2 class="section-title">Overview</h2>
            <div class="grid grid-4">
                <div class="metric-card">
                    <div class="metric-icon ${getStatusColor(report.status.code)}">
                        ${report.status.code >= 200 && report.status.code < 300 ? '✓' : '✗'}
                    </div>
                    <div class="metric-label">HTTP Status</div>
                    <div class="metric-value">${report.status.code} ${report.status.message}</div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon bg-orange-50">⚡</div>
                    <div class="metric-label">TTFB</div>
                    <div class="metric-value">${report.performance.ttfb}ms</div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon bg-green-50">🛡️</div>
                    <div class="metric-label">Security Score</div>
                    <div class="metric-value">${getSecurityScore()}/100</div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon bg-blue-50">📄</div>
                    <div class="metric-label">Page Size</div>
                    <div class="metric-value">${formatBytes(report.performance.contentSize)}</div>
                </div>
            </div>
        </div>

        ${report.aiAnalysis ? `
        <!-- AI Analysis Section -->
        <div class="ai-section">
            <h2 class="section-title">🧠 AI-Powered Analysis</h2>
            <p style="color: #6b7280; margin-bottom: 24px;">Intelligent insights and recommendations</p>

            <!-- Scores and Grades -->
            <div class="score-grid">
                <div class="score-card">
                    <div class="score-number">${report.aiAnalysis.summary.overallScore}</div>
                    <div class="score-label">Overall Score</div>
                </div>
                <div class="score-card">
                    <div class="grade-badge ${getGradeColor(report.aiAnalysis.summary.performanceGrade)}">${report.aiAnalysis.summary.performanceGrade}</div>
                    <div class="score-label">Performance</div>
                </div>
                <div class="score-card">
                    <div class="grade-badge ${getGradeColor(report.aiAnalysis.summary.securityGrade)}">${report.aiAnalysis.summary.securityGrade}</div>
                    <div class="score-label">Security</div>
                </div>
                <div class="score-card">
                    <div class="grade-badge ${getGradeColor(report.aiAnalysis.summary.seoGrade)}">${report.aiAnalysis.summary.seoGrade}</div>
                    <div class="score-label">SEO</div>
                </div>
            </div>

            <!-- Key Issues and Quick Wins -->
            <div class="grid grid-2 mb-4">
                <div class="card">
                    <h3 class="subsection-title">⚠️ Key Issues</h3>
                    <ul style="list-style: none; padding: 0;">
                        ${report.aiAnalysis.summary.keyIssues.map(issue => `
                            <li style="margin-bottom: 8px; display: flex; align-items: start; gap: 8px;">
                                <span style="color: #dc2626; margin-top: 2px;">•</span>
                                <span style="font-size: 14px;">${issue}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                <div class="card">
                    <h3 class="subsection-title">🎯 Quick Wins</h3>
                    <ul style="list-style: none; padding: 0;">
                        ${report.aiAnalysis.summary.quickWins.map(win => `
                            <li style="margin-bottom: 8px; display: flex; align-items: start; gap: 8px;">
                                <span style="color: #059669; margin-top: 2px;">•</span>
                                <span style="font-size: 14px;">${win}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>

            <!-- Implementation Plan -->
            <div class="card">
                <h3 class="subsection-title">📈 Implementation Plan (${report.aiAnalysis.implementationPlan.totalEstimatedTime})</h3>
                <div class="grid grid-3">
                    <div>
                        <h4 style="color: #dc2626; font-weight: 600; margin-bottom: 8px;">Phase 1: Critical</h4>
                        <ul style="list-style: none; padding: 0;">
                            ${report.aiAnalysis.implementationPlan.phase1.map(item => `
                                <li style="font-size: 14px; margin-bottom: 4px;">• ${item}</li>
                            `).join('')}
                        </ul>
                    </div>
                    <div>
                        <h4 style="color: #d97706; font-weight: 600; margin-bottom: 8px;">Phase 2: Important</h4>
                        <ul style="list-style: none; padding: 0;">
                            ${report.aiAnalysis.implementationPlan.phase2.map(item => `
                                <li style="font-size: 14px; margin-bottom: 4px;">• ${item}</li>
                            `).join('')}
                        </ul>
                    </div>
                    <div>
                        <h4 style="color: #059669; font-weight: 600; margin-bottom: 8px;">Phase 3: Enhancements</h4>
                        <ul style="list-style: none; padding: 0;">
                            ${report.aiAnalysis.implementationPlan.phase3.map(item => `
                                <li style="font-size: 14px; margin-bottom: 4px;">• ${item}</li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        ` : ''}

        <!-- Detailed Results -->
        <div class="grid grid-2">
            <!-- Performance -->
            <div class="card">
                <h2 class="section-title">⚡ Performance</h2>
                <div style="margin-bottom: 16px;">
                    <div class="flex justify-between mb-2">
                        <span class="text-sm">Time to First Byte</span>
                        <span class="text-sm font-weight: 600;">${report.performance.ttfb}ms</span>
                    </div>
                    <div class="flex justify-between mb-2">
                        <span class="text-sm">Content Size</span>
                        <span class="text-sm font-weight: 600;">${formatBytes(report.performance.contentSize)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm">Assets Count</span>
                        <span class="text-sm font-weight: 600;">${report.performance.assetsCount}</span>
                    </div>
                </div>
                
                ${report.aiAnalysis?.performance ? `
                <div class="border-t pt-4">
                    <h4 class="subsection-title">🧠 AI Analysis</h4>
                    <p class="text-sm mb-4">${report.aiAnalysis.performance.analysis}</p>
                    ${report.aiAnalysis.performance.recommendations.slice(0, 2).map(rec => `
                        <div class="recommendation ${getPriorityColor(rec.priority)}">
                            <div class="recommendation-title">${rec.title}</div>
                            <div class="recommendation-desc">${rec.description}</div>
                            <div class="recommendation-time">${rec.estimatedTime}</div>
                        </div>
                    `).join('')}
                </div>
                ` : ''}
            </div>

            <!-- Security -->
            <div class="card">
                <h2 class="section-title">🛡️ Security</h2>
                <div style="margin-bottom: 16px;">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-sm">SSL Certificate</span>
                        <span class="status-badge ${report.security.ssl.valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                            ${report.security.ssl.valid ? '✓ Valid' : '✗ Invalid'}
                        </span>
                    </div>
                    <div class="flex justify-between mb-2">
                        <span class="text-sm">SSL Expiry</span>
                        <span class="text-sm font-weight: 600;">${new Date(report.security.ssl.expiry).toLocaleDateString()}</span>
                    </div>
                    <div class="flex justify-between mb-4">
                        <span class="text-sm">SSL Issuer</span>
                        <span class="text-sm font-weight: 600;">${report.security.ssl.issuer}</span>
                    </div>
                    <div>
                        <p class="subsection-title">Security Headers</p>
                        ${Object.entries(report.security.headers).map(([header, present]) => `
                            <div class="flex justify-between items-center mb-1">
                                <span class="text-xs">${header}</span>
                                <span class="${present ? 'text-green-600' : 'text-red-600'}">${present ? '✓' : '✗'}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                ${report.aiAnalysis?.security ? `
                <div class="border-t pt-4">
                    <h4 class="subsection-title">🧠 AI Security Analysis</h4>
                    <p class="text-sm mb-4">${report.aiAnalysis.security.analysis}</p>
                    ${report.aiAnalysis.security.recommendations.slice(0, 2).map(rec => `
                        <div class="recommendation ${getPriorityColor(rec.priority)}">
                            <div class="recommendation-title">${rec.title}</div>
                            <div class="recommendation-desc">${rec.description}</div>
                            <div class="recommendation-time">${rec.estimatedTime}</div>
                        </div>
                    `).join('')}
                </div>
                ` : ''}
            </div>

            <!-- SEO -->
            <div class="card">
                <h2 class="section-title">👁️ SEO & Accessibility</h2>
                <div style="margin-bottom: 16px;">
                    <div class="mb-4">
                        <span class="text-sm text-gray-600">Title</span>
                        <p class="text-sm font-weight: 600;">${report.seo.title || 'Not found'}</p>
                    </div>
                    <div class="mb-4">
                        <span class="text-sm text-gray-600">Description</span>
                        <p class="text-sm font-weight: 600;">${report.seo.description || 'Not found'}</p>
                    </div>
                    <div class="flex justify-between mb-2">
                        <span class="text-sm">H1 Tags</span>
                        <span class="text-sm font-weight: 600;">${report.seo.headings.h1}</span>
                    </div>
                    <div class="flex justify-between mb-2">
                        <span class="text-sm">H2 Tags</span>
                        <span class="text-sm font-weight: 600;">${report.seo.headings.h2}</span>
                    </div>
                    <div class="flex justify-between mb-2">
                        <span class="text-sm">H3 Tags</span>
                        <span class="text-sm font-weight: 600;">${report.seo.headings.h3}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm">Images with Alt Tags</span>
                        <span class="text-sm font-weight: 600;">${report.seo.altTags}/${report.seo.totalImages}</span>
                    </div>
                </div>
            </div>

            <!-- Server Info -->
            <div class="card">
                <h2 class="section-title">🖥️ Server Information</h2>
                <div>
                    <div class="flex justify-between mb-2">
                        <span class="text-sm">IP Address</span>
                        <span class="text-sm font-weight: 600;">${report.server.ip}</span>
                    </div>
                    <div class="flex justify-between mb-2">
                        <span class="text-sm">Location</span>
                        <span class="text-sm font-weight: 600;">${report.server.location}</span>
                    </div>
                    <div class="flex justify-between mb-4">
                        <span class="text-sm">Reverse DNS</span>
                        <span class="text-sm font-weight: 600;">${report.server.reverseDns}</span>
                    </div>
                    ${report.server.techStack.length > 0 ? `
                    <div>
                        <span class="text-sm text-gray-600">Tech Stack</span>
                        <div style="margin-top: 8px; display: flex; flex-wrap: gap: 4px;">
                            ${report.server.techStack.map(tech => `
                                <span style="background: #f3f4f6; color: #374151; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">${tech}</span>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 32px; padding: 16px; color: #6b7280; font-size: 12px;">
            Generated by Automation Aid QA Testing Suite on ${new Date().toLocaleDateString()}
        </div>
    </div>
</body>
</html>`
}