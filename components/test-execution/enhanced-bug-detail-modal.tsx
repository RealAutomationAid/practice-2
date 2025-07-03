'use client'

import React from 'react'
import {
  X,
  Calendar,
  User,
  Monitor,
  Globe,
  Smartphone,
  Bug,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Tag,
  FileImage,
  File,
  ExternalLink,
  Copy
} from 'lucide-react'
import { BugReportExtended } from './types'
import { formatUtils } from '@/lib/test-execution-utils'
import toast from 'react-hot-toast'

interface EnhancedBugDetailModalProps {
  bug: BugReportExtended | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (bug: BugReportExtended) => void
}

const formatTags = (tags: any): string[] => {
  if (!tags) return []
  if (Array.isArray(tags)) return tags
  if (typeof tags === 'string') {
    try {
      const parsed = JSON.parse(tags)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return tags.split(',').map(tag => tag.trim()).filter(Boolean)
    }
  }
  return []
}

const StatusBadge = ({ status }: { status: string }) => {
  const config = {
    open: { color: 'bg-red-500', textColor: 'text-white', icon: AlertTriangle, label: 'Open' },
    in_progress: { color: 'bg-yellow-500', textColor: 'text-white', icon: Clock, label: 'In Progress' },
    resolved: { color: 'bg-green-500', textColor: 'text-white', icon: CheckCircle, label: 'Resolved' },
    closed: { color: 'bg-gray-500', textColor: 'text-white', icon: XCircle, label: 'Closed' },
    duplicate: { color: 'bg-purple-500', textColor: 'text-white', icon: ExternalLink, label: 'Duplicate' }
  }[status] || { color: 'bg-gray-500', textColor: 'text-white', icon: Bug, label: status }

  const IconComponent = config.icon

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.color} ${config.textColor}`}>
      <IconComponent className="w-4 h-4" />
      {config.label}
    </span>
  )
}

const SeverityBadge = ({ severity }: { severity: string }) => {
  const config = {
    critical: { color: 'bg-red-100 text-red-800 border-red-200', icon: '🔥', label: 'Critical' },
    high: { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: '⚠️', label: 'High' },
    medium: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '📋', label: 'Medium' },
    low: { color: 'bg-green-100 text-green-800 border-green-200', icon: '🟢', label: 'Low' }
  }[severity] || { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: '⚪', label: severity }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
      <span>{config.icon}</span>
      {config.label}
    </span>
  )
}

const PriorityBadge = ({ priority }: { priority: string }) => {
  const config = {
    urgent: { color: 'bg-red-100 text-red-800 border-red-200', icon: '🚨', label: 'Urgent' },
    high: { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: '⭐', label: 'High' },
    medium: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '📝', label: 'Medium' },
    low: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: '⬇️', label: 'Low' }
  }[priority] || { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: '⚪', label: priority }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
      <span>{config.icon}</span>
      {config.label}
    </span>
  )
}

const copyToClipboard = (text: string, label: string) => {
  navigator.clipboard.writeText(text)
  toast.success(`${label} copied to clipboard`)
}

export function EnhancedBugDetailModal({ bug, isOpen, onClose, onEdit }: EnhancedBugDetailModalProps) {
  if (!isOpen || !bug) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Bug className="w-6 h-6" />
                <h2 className="text-2xl font-bold">{bug.title || 'Untitled Bug'}</h2>
              </div>
              <div className="flex items-center gap-2 text-blue-100">
                <span className="font-mono text-sm">#{bug.id.slice(0, 8)}</span>
                <button
                  onClick={() => copyToClipboard(bug.id, 'Bug ID')}
                  className="hover:text-white transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onEdit && (
                <button
                  onClick={() => onEdit(bug)}
                  className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors text-sm font-medium"
                >
                  Edit Bug
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="p-6">
            {/* Status Row */}
            <div className="flex flex-wrap gap-3 mb-6">
              <StatusBadge status={bug.status || 'open'} />
              <SeverityBadge severity={bug.severity || 'medium'} />
              <PriorityBadge priority={bug.priority || 'medium'} />
            </div>

            {/* Description */}
            {bug.description && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Bug className="w-5 h-5 text-blue-600" />
                  Description
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{bug.description}</p>
                </div>
              </div>
            )}

            {/* Steps, Expected, Actual Results */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {bug.steps_to_reproduce && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">🔄 Steps to Reproduce</h4>
                  <div className="bg-gray-50 rounded-lg p-4 h-32 overflow-y-auto">
                    <p className="text-gray-700 whitespace-pre-wrap text-sm">
                      {Array.isArray(bug.steps_to_reproduce) ? bug.steps_to_reproduce.join('\n') : bug.steps_to_reproduce}
                    </p>
                  </div>
                </div>
              )}
              
              {bug.expected_result && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">✅ Expected Result</h4>
                  <div className="bg-green-50 rounded-lg p-4 h-32 overflow-y-auto">
                    <p className="text-gray-700 whitespace-pre-wrap text-sm">{bug.expected_result}</p>
                  </div>
                </div>
              )}
              
              {bug.actual_result && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">❌ Actual Result</h4>
                  <div className="bg-red-50 rounded-lg p-4 h-32 overflow-y-auto">
                    <p className="text-gray-700 whitespace-pre-wrap text-sm">{bug.actual_result}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Environment Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <Monitor className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-sm font-medium text-gray-900">Browser</div>
                <div className="text-sm text-gray-600">{bug.browser || 'Unknown'}</div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <Globe className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-sm font-medium text-gray-900">Environment</div>
                <div className="text-sm text-gray-600">{bug.environment || 'Unknown'}</div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <Smartphone className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-sm font-medium text-gray-900">Device</div>
                <div className="text-sm text-gray-600">{bug.device || 'Unknown'}</div>
              </div>
              
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <Monitor className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <div className="text-sm font-medium text-gray-900">OS</div>
                <div className="text-sm text-gray-600">{bug.os || 'Unknown'}</div>
              </div>
            </div>

            {/* Reporter & Timing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Reporter Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Name:</span> {bug.reporter_name || 'Unknown'}</div>
                  <div><span className="font-medium">Email:</span> {bug.reporter_email || 'Not provided'}</div>
                  {bug.url && (
                    <div>
                      <span className="font-medium">URL:</span> 
                      <a 
                        href={bug.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline ml-1 break-all"
                      >
                        {bug.url}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Timeline
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Created:</span> 
                    {bug.created_at ? formatUtils.formatDate(bug.created_at) : 'Unknown'}
                  </div>
                  {bug.updated_at && (
                    <div>
                      <span className="font-medium">Updated:</span> 
                      {formatUtils.formatDate(bug.updated_at)}
                    </div>
                  )}
                  {bug.assigned_to && (
                    <div><span className="font-medium">Assigned to:</span> {bug.assigned_to}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Tags */}
            {formatTags(bug.tags || null).length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-blue-600" />
                  Tags
                </h4>
                <div className="flex flex-wrap gap-2">
                  {formatTags(bug.tags || null).map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments */}
            {bug.attachment_urls && bug.attachment_urls.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileImage className="w-5 h-5 text-blue-600" />
                  Attachments ({bug.attachment_urls.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bug.attachment_urls.map((url, index) => {
                    const isImage = url.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i)
                    const isVideo = url.toLowerCase().match(/\.(mp4|webm|avi|mov|wmv|flv)$/i)
                    
                    return (
                      <div key={index} className="border border-gray-200 rounded-lg p-3 bg-white hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-2">
                          {isImage ? <FileImage className="w-4 h-4 text-blue-600" /> : <File className="w-4 h-4 text-gray-600" />}
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {isImage ? `Image ${index + 1}` : isVideo ? `Video ${index + 1}` : `File ${index + 1}`}
                          </span>
                        </div>
                        
                        {isImage ? (
                          <div className="aspect-video bg-gray-100 rounded mb-2 overflow-hidden">
                            <img
                              src={url}
                              alt={`Attachment ${index + 1}`}
                              className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(url, '_blank')}
                            />
                          </div>
                        ) : isVideo ? (
                          <div className="aspect-video bg-gray-100 rounded mb-2 overflow-hidden">
                            <video
                              src={url}
                              className="w-full h-full object-cover"
                              controls
                              preload="metadata"
                            />
                          </div>
                        ) : (
                          <div className="aspect-video bg-gray-100 rounded mb-2 flex items-center justify-center">
                            <div className="text-center">
                              <File className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                              <div className="text-xs text-gray-600">File</div>
                            </div>
                          </div>
                        )}
                        
                        <button
                          onClick={() => window.open(url, '_blank')}
                          className="w-full text-xs text-blue-600 hover:underline flex items-center justify-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {isImage ? 'View Full Size' : isVideo ? 'Open Video' : 'Download File'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Bug ID: {bug.id} • Created {bug.created_at ? formatUtils.formatDate(bug.created_at) : 'Unknown'}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}