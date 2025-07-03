'use client'

import React, { useState } from 'react'
import { FileText, Download, Eye, Printer, CheckCircle } from 'lucide-react'
import { BugReportExtended } from './types'
import toast from 'react-hot-toast'

interface HTMLBugReportProps {
  bugs: BugReportExtended[]
  className?: string
}

export function HTMLBugReport({ bugs, className = '' }: HTMLBugReportProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const getReportStats = () => {
    const total = bugs.length
    const open = bugs.filter(bug => bug.status === 'open').length
    const inProgress = bugs.filter(bug => bug.status === 'in_progress').length
    const resolved = bugs.filter(bug => bug.status === 'resolved').length
    const closed = bugs.filter(bug => bug.status === 'closed').length

    const severityBreakdown = {
      critical: bugs.filter(bug => bug.severity === 'critical').length,
      high: bugs.filter(bug => bug.severity === 'high').length,
      medium: bugs.filter(bug => bug.severity === 'medium').length,
      low: bugs.filter(bug => bug.severity === 'low').length
    }

    const environments = bugs.reduce((acc, bug) => {
      if (bug.environment) {
        acc[bug.environment] = (acc[bug.environment] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    const browsers = bugs.reduce((acc, bug) => {
      if (bug.browser) {
        acc[bug.browser] = (acc[bug.browser] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    return { total, open, inProgress, resolved, closed, severityBreakdown, environments, browsers }
  }

  const generateHTMLReport = () => {
    const stats = getReportStats()
    const reportDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit'
    })

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bug Report Dashboard - ${reportDate}</title>
    <style>
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
        }
        body { 
            font-family: system-ui, -apple-system, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background: #f8fafc; 
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            padding: 20px; 
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 2rem; 
            border-radius: 12px; 
            margin-bottom: 2rem; 
            box-shadow: 0 10px 25px rgba(0,0,0,0.1); 
        }
        .header h1 { 
            font-size: 2.5rem; 
            margin-bottom: 0.5rem; 
        }
        .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 1.5rem; 
            margin-bottom: 2rem; 
        }
        .stat-card { 
            background: white; 
            padding: 1.5rem; 
            border-radius: 12px; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.05); 
            border-left: 4px solid; 
        }
        .stat-card.total { border-left-color: #6366f1; }
        .stat-card.open { border-left-color: #ef4444; }
        .stat-card.progress { border-left-color: #f59e0b; }
        .stat-card.resolved { border-left-color: #10b981; }
        .stat-card.closed { border-left-color: #6b7280; }
        .stat-number { 
            font-size: 2.5rem; 
            font-weight: bold; 
            margin-bottom: 0.5rem; 
        }
        .stat-label { 
            color: #6b7280; 
            font-size: 0.875rem; 
            text-transform: uppercase; 
            letter-spacing: 0.05em; 
        }
        .bug-list { 
            background: white; 
            border-radius: 12px; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.05); 
            overflow: hidden; 
        }
        .bug-list-header { 
            background: #f9fafb; 
            padding: 1.5rem; 
            border-bottom: 1px solid #e5e7eb; 
        }
        .bug-item { 
            padding: 1.5rem; 
            border-bottom: 1px solid #f3f4f6; 
            display: grid; 
            grid-template-columns: 1fr auto; 
            gap: 1rem; 
        }
        .bug-title { 
            font-weight: 600; 
            font-size: 1.1rem; 
            color: #374151; 
            margin-bottom: 0.5rem; 
        }
        .bug-description { 
            color: #6b7280; 
            font-size: 0.95rem; 
            line-height: 1.5; 
        }
        .bug-meta { 
            display: flex; 
            flex-wrap: wrap; 
            gap: 1rem; 
            margin-top: 0.75rem; 
            font-size: 0.875rem; 
            color: #6b7280; 
        }
        .badge { 
            display: inline-flex; 
            padding: 0.25rem 0.75rem; 
            border-radius: 9999px; 
            font-size: 0.75rem; 
            font-weight: 500; 
            text-transform: capitalize; 
        }
        .badge.severity-critical { background: #fef2f2; color: #dc2626; }
        .badge.severity-high { background: #fff7ed; color: #ea580c; }
        .badge.severity-medium { background: #fffbeb; color: #d97706; }
        .badge.severity-low { background: #f0fdf4; color: #059669; }
        .badge.status-open { background: #fffbeb; color: #d97706; }
        .badge.status-in_progress { background: #eff6ff; color: #2563eb; }
        .badge.status-resolved { background: #f0fdf4; color: #059669; }
        .badge.status-closed { background: #f9fafb; color: #6b7280; }
        .footer { 
            margin-top: 3rem; 
            padding: 2rem; 
            background: white; 
            border-radius: 12px; 
            text-align: center; 
            color: #6b7280; 
        }
        @media (max-width: 768px) { 
            .stats-grid { 
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            } 
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>🐛 Bug Report Dashboard</h1>
            <div>Generated: ${reportDate} | Total: ${stats.total} | Active: ${stats.open + stats.inProgress}</div>
        </header>
        <section class="stats-grid">
            <div class="stat-card total">
                <div class="stat-number">${stats.total}</div>
                <div class="stat-label">Total</div>
            </div>
            <div class="stat-card open">
                <div class="stat-number">${stats.open}</div>
                <div class="stat-label">Open</div>
            </div>
            <div class="stat-card progress">
                <div class="stat-number">${stats.inProgress}</div>
                <div class="stat-label">In Progress</div>
            </div>
            <div class="stat-card resolved">
                <div class="stat-number">${stats.resolved}</div>
                <div class="stat-label">Resolved</div>
            </div>
            <div class="stat-card closed">
                <div class="stat-number">${stats.closed}</div>
                <div class="stat-label">Closed</div>
            </div>
        </section>
        <section class="bug-list">
            <div class="bug-list-header">
                <h2>Bug Details (${bugs.length} items)</h2>
            </div>
            ${bugs.map(bug => `
                <div class="bug-item">
                    <div>
                        <div class="bug-title">${bug.title}</div>
                        <div class="bug-description">${bug.description || 'No description'}</div>
                        <div class="bug-meta">
                            <span>Reporter: ${bug.reporter_name || 'Anonymous'}</span>
                            <span>Date: ${new Date(bug.created_at || '').toLocaleDateString()}</span>
                            <span>Environment: ${bug.environment || 'N/A'}</span>
                            <span>Browser: ${bug.browser || 'N/A'}</span>
                            ${bug.url ? `<span>URL: <a href="${bug.url}">${bug.url}</a></span>` : ''}
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        <span class="badge severity-${bug.severity}">${bug.severity}</span>
                        <span class="badge severity-${bug.priority}">${bug.priority}</span>
                        <span class="badge status-${bug.status}">${bug.status?.replace('_', ' ')}</span>
                    </div>
                </div>
            `).join('')}
        </section>
        <footer class="footer">
            <div>Generated by QA Bug Tracking System</div>
            <div>${stats.total} bugs across ${Object.keys(stats.environments).length} environments</div>
        </footer>
    </div>
</body>
</html>`
  }

  const downloadHTMLReport = () => {
    setIsGenerating(true)
    try {
      const htmlContent = generateHTMLReport()
      const blob = new Blob([htmlContent], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `bug-report-${new Date().toISOString().split('T')[0]}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('HTML report downloaded!')
    } catch (error) {
      toast.error('Failed to generate report')
    } finally {
      setIsGenerating(false)
    }
  }

  const previewReport = () => {
    const htmlContent = generateHTMLReport()
    const newWindow = window.open('', '_blank', 'width=1200,height=800')
    if (newWindow) {
      newWindow.document.write(htmlContent)
      newWindow.document.close()
    } else {
      toast.error('Please allow popups for preview')
    }
  }

  const printReport = () => {
    const htmlContent = generateHTMLReport()
    const newWindow = window.open('', '_blank')
    if (newWindow) {
      newWindow.document.write(htmlContent)
      newWindow.document.close()
      newWindow.print()
    }
  }

  const stats = getReportStats()

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">HTML Bug Report</h3>
            <p className="text-sm text-gray-600">Generate comprehensive, printable reports</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={previewReport} 
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button 
            onClick={printReport} 
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button 
            onClick={downloadHTMLReport} 
            disabled={isGenerating} 
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isGenerating ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isGenerating ? 'Generating...' : 'Download HTML'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        <div className="bg-red-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{stats.open}</div>
          <div className="text-sm text-gray-600">Open</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
          <div className="text-sm text-gray-600">In Progress</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
          <div className="text-sm text-gray-600">Resolved</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-600">{stats.closed}</div>
          <div className="text-sm text-gray-600">Closed</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>Responsive design</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>Environment breakdown</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>Print optimized</span>
        </div>
      </div>
    </div>
  )
} 