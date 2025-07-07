'use client'

import { AuditReport } from '@/types/audit'
import { formatDateTime } from '@/utils/date-helpers'
import { Clock, Globe, CheckCircle, XCircle, ExternalLink, RefreshCw, AlertTriangle } from 'lucide-react'

interface AuditHistoryProps {
  history: AuditReport[]
  onSelectItem: (report: AuditReport) => void
  isLoading?: boolean
  error?: string | null
  onRefresh?: () => void
}

export function AuditHistory({ history, onSelectItem, isLoading, error, onRefresh }: AuditHistoryProps) {
  const getStatusColor = (code: number) => {
    if (code >= 200 && code < 300) return 'text-green-600'
    if (code >= 300 && code < 400) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getSecurityScore = (report: AuditReport) => {
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

  // Loading state
  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Audit History</h3>
            <p className="text-gray-500">
              Fetching your previous website audits...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="p-12 text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 bg-red-100 rounded-full">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading History</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry</span>
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Empty state
  if (history.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 bg-gray-100 rounded-full">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Audit History</h3>
            <p className="text-gray-500 mb-4">
              Your audit history will appear here after you run your first website audit.
            </p>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Audit History ({history.length} audits)
          </h3>
          <p className="text-sm text-gray-600">
            Click on any audit to view detailed results
          </p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        )}
      </div>

      <div className="space-y-3">
        {history.map((report) => (
          <div
            key={report.id}
            onClick={() => onSelectItem(report)}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <Globe className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {report.url}
                  </h4>
                  <div className="flex items-center space-x-1">
                    {report.status.code >= 200 && report.status.code < 300 ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${getStatusColor(report.status.code)}`}>
                      {report.status.code}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">TTFB:</span>
                    <span className="ml-1 font-medium text-gray-900">
                      {report.performance.ttfb}ms
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Size:</span>
                    <span className="ml-1 font-medium text-gray-900">
                      {formatBytes(report.performance.contentSize)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Security:</span>
                    <span className="ml-1 font-medium text-gray-900">
                      {getSecurityScore(report)}/100
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Assets:</span>
                    <span className="ml-1 font-medium text-gray-900">
                      {report.performance.assetsCount}
                    </span>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>
                      {formatDateTime(report.timestamp)}
                    </span>
                    <span>•</span>
                    <span>{report.server.location}</span>
                  </div>
                  
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </div>

                {/* Tech Stack Tags */}
                {report.server.techStack.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {report.server.techStack.slice(0, 3).map((tech, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700"
                      >
                        {tech}
                      </span>
                    ))}
                    {report.server.techStack.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                        +{report.server.techStack.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}