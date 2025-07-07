'use client'

import { AuditReport, AIRecommendation } from '@/types/audit'
import { formatDate, formatDateTime } from '@/utils/date-helpers'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Shield, 
  Zap, 
  Eye, 
  Server,
  Download,
  ExternalLink,
  FileText,
  Globe,
  Brain,
  TrendingUp,
  Users,
  Target
} from 'lucide-react'

interface AuditResultsProps {
  report: AuditReport
}

export function AuditResults({ report }: AuditResultsProps) {
  const getStatusColor = (code: number) => {
    if (code >= 200 && code < 300) return 'text-green-600 bg-green-50'
    if (code >= 300 && code < 400) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-600 bg-green-100'
      case 'B': return 'text-blue-600 bg-blue-100'
      case 'C': return 'text-yellow-600 bg-yellow-100'
      case 'D': return 'text-orange-600 bg-orange-100'
      case 'F': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const handleExportHTML = async () => {
    try {
      const response = await fetch('/api/audit/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reportId: report.id, format: 'html', report }),
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `audit-${report.url.replace(/https?:\/\//, '')}-${new Date().toISOString().split('T')[0]}.html`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const handleExportMarkdown = async () => {
    try {
      const response = await fetch('/api/audit/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reportId: report.id, format: 'markdown', report }),
      })
      
      if (response.ok) {
        const markdown = await response.text()
        const blob = new Blob([markdown], { type: 'text/markdown' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `audit-${report.url.replace(/https?:\/\//, '')}-${new Date().toISOString().split('T')[0]}.md`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <Globe className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Audit Results</h2>
          </div>
          <div className="mt-2 space-y-1">
            <p className="text-lg font-medium text-gray-700">{report.url}</p>
            <p className="text-sm text-gray-500">
              {formatDateTime(report.timestamp)}
            </p>
          </div>
        </div>
        
        {/* Export Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={handleExportMarkdown}
            className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Markdown</span>
          </button>
          <button
            onClick={handleExportHTML}
            className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>HTML</span>
          </button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${getStatusColor(report.status.code)}`}>
              {report.status.code >= 200 && report.status.code < 300 ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">HTTP Status</p>
              <p className="text-lg font-bold text-gray-900">
                {report.status.code} {report.status.message}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Zap className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">TTFB</p>
              <p className="text-lg font-bold text-gray-900">{report.performance.ttfb}ms</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <Shield className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Security Score</p>
              <p className="text-lg font-bold text-gray-900">{getSecurityScore()}/100</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Globe className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Page Size</p>
              <p className="text-lg font-bold text-gray-900">{formatBytes(report.performance.contentSize)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Analysis Section */}
      {report.aiAnalysis && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Brain className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">AI-Powered Analysis</h3>
              <p className="text-gray-600">Intelligent insights and recommendations</p>
            </div>
          </div>

          {/* Overall Score and Grades */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {report.aiAnalysis.summary.overallScore}
              </div>
              <div className="text-sm text-gray-600">Overall Score</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(report.aiAnalysis.summary.performanceGrade)}`}>
                {report.aiAnalysis.summary.performanceGrade}
              </div>
              <div className="text-sm text-gray-600 mt-2">Performance</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(report.aiAnalysis.summary.securityGrade)}`}>
                {report.aiAnalysis.summary.securityGrade}
              </div>
              <div className="text-sm text-gray-600 mt-2">Security</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(report.aiAnalysis.summary.seoGrade)}`}>
                {report.aiAnalysis.summary.seoGrade}
              </div>
              <div className="text-sm text-gray-600 mt-2">SEO</div>
            </div>
          </div>

          {/* Key Issues and Quick Wins */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h4 className="font-semibold text-gray-900">Key Issues</h4>
              </div>
              <ul className="space-y-2">
                {report.aiAnalysis.summary.keyIssues.map((issue, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                    <div className="w-1 h-1 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Target className="w-5 h-5 text-green-500" />
                <h4 className="font-semibold text-gray-900">Quick Wins</h4>
              </div>
              <ul className="space-y-2">
                {report.aiAnalysis.summary.quickWins.map((win, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                    <div className="w-1 h-1 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>{win}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Implementation Plan */}
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <h4 className="font-semibold text-gray-900">Implementation Plan</h4>
              <span className="text-sm text-gray-500">
                ({report.aiAnalysis.implementationPlan.totalEstimatedTime})
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h5 className="font-medium text-red-700 mb-2">Phase 1: Critical</h5>
                <ul className="space-y-1">
                  {report.aiAnalysis.implementationPlan.phase1.map((item, index) => (
                    <li key={index} className="text-sm text-gray-700">• {item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-yellow-700 mb-2">Phase 2: Important</h5>
                <ul className="space-y-1">
                  {report.aiAnalysis.implementationPlan.phase2.map((item, index) => (
                    <li key={index} className="text-sm text-gray-700">• {item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-green-700 mb-2">Phase 3: Enhancements</h5>
                <ul className="space-y-1">
                  {report.aiAnalysis.implementationPlan.phase3.map((item, index) => (
                    <li key={index} className="text-sm text-gray-700">• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Zap className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-gray-900">Performance</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Time to First Byte</span>
              <span className="text-sm font-medium">{report.performance.ttfb}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Content Size</span>
              <span className="text-sm font-medium">{formatBytes(report.performance.contentSize)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Assets Count</span>
              <span className="text-sm font-medium">{report.performance.assetsCount}</span>
            </div>
          </div>
          
          {/* AI Performance Analysis */}
          {report.aiAnalysis?.performance && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2 mb-2">
                <Brain className="w-4 h-4 text-blue-500" />
                <h4 className="text-sm font-semibold text-gray-900">AI Analysis</h4>
              </div>
              <p className="text-sm text-gray-700 mb-3">{report.aiAnalysis.performance.analysis}</p>
              {report.aiAnalysis.performance.recommendations.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-medium text-gray-600 uppercase tracking-wide">Recommendations</h5>
                  {report.aiAnalysis.performance.recommendations.slice(0, 2).map((rec, index) => (
                    <div key={index} className={`p-3 rounded-lg border ${getPriorityColor(rec.priority)}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h6 className="text-sm font-medium mb-1">{rec.title}</h6>
                          <p className="text-xs opacity-90">{rec.description}</p>
                        </div>
                        <div className="text-xs ml-2 flex-shrink-0">
                          <span className="font-medium">{rec.estimatedTime}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Security */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Shield className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900">Security</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">SSL Certificate</span>
              <div className="flex items-center space-x-1">
                {report.security.ssl.valid ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm font-medium">
                  {report.security.ssl.valid ? 'Valid' : 'Invalid'}
                </span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">SSL Expiry</span>
              <span className="text-sm font-medium">
                {formatDate(report.security.ssl.expiry)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">SSL Issuer</span>
              <span className="text-sm font-medium">{report.security.ssl.issuer}</span>
            </div>
            <div className="pt-2 border-t">
              <p className="text-sm font-medium text-gray-700 mb-2">Security Headers</p>
              <div className="space-y-1">
                {Object.entries(report.security.headers).map(([header, present]) => (
                  <div key={header} className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">{header}</span>
                    {present ? (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    ) : (
                      <XCircle className="w-3 h-3 text-red-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Security Analysis */}
          {report.aiAnalysis?.security && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2 mb-2">
                <Brain className="w-4 h-4 text-blue-500" />
                <h4 className="text-sm font-semibold text-gray-900">AI Security Analysis</h4>
              </div>
              <p className="text-sm text-gray-700 mb-3">{report.aiAnalysis.security.analysis}</p>
              {report.aiAnalysis.security.recommendations.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-medium text-gray-600 uppercase tracking-wide">Security Recommendations</h5>
                  {report.aiAnalysis.security.recommendations.slice(0, 2).map((rec, index) => (
                    <div key={index} className={`p-3 rounded-lg border ${getPriorityColor(rec.priority)}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h6 className="text-sm font-medium mb-1">{rec.title}</h6>
                          <p className="text-xs opacity-90">{rec.description}</p>
                        </div>
                        <div className="text-xs ml-2 flex-shrink-0">
                          <span className="font-medium">{rec.estimatedTime}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* SEO */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Eye className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">SEO & Accessibility</h3>
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-600">Title</span>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {report.seo.title || 'Not found'}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Description</span>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {report.seo.description || 'Not found'}
              </p>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">H1 Tags</span>
              <span className="text-sm font-medium">{report.seo.headings.h1}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">H2 Tags</span>
              <span className="text-sm font-medium">{report.seo.headings.h2}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">H3 Tags</span>
              <span className="text-sm font-medium">{report.seo.headings.h3}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Images with Alt Tags</span>
              <span className="text-sm font-medium">
                {report.seo.altTags}/{report.seo.totalImages}
              </span>
            </div>
          </div>
        </div>

        {/* Server Info */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Server className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Server Information</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">IP Address</span>
              <span className="text-sm font-medium">{report.server.ip}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Location</span>
              <span className="text-sm font-medium">{report.server.location}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Reverse DNS</span>
              <span className="text-sm font-medium">{report.server.reverseDns}</span>
            </div>
            {report.server.techStack.length > 0 && (
              <div>
                <span className="text-sm text-gray-600">Tech Stack</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {report.server.techStack.map((tech, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}