'use client'

import React from 'react'
import { X, Calendar, User, Tag, AlertCircle, FileImage, FileVideo, File, ExternalLink } from 'lucide-react'
import { BugReportExtended } from './types'

interface BugDetailModalProps {
  bug: BugReportExtended | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (bug: BugReportExtended) => void
}

const Badge = ({ value, type }: { value: string; type: 'severity' | 'priority' | 'status' }) => {
  const getColorClass = () => {
    if (type === 'severity') {
      switch (value) {
        case 'critical': return 'bg-red-100 text-red-800 border-red-200'
        case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
        case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
        case 'low': return 'bg-green-100 text-green-800 border-green-200'
        default: return 'bg-gray-100 text-gray-800 border-gray-200'
      }
    } else if (type === 'priority') {
      switch (value) {
        case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
        case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
        case 'medium': return 'bg-purple-100 text-purple-800 border-purple-200'
        case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
        default: return 'bg-gray-100 text-gray-800 border-gray-200'
      }
    } else {
      switch (value) {
        case 'closed': return 'bg-green-100 text-green-800 border-green-200'
        case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200'
        case 'resolved': return 'bg-purple-100 text-purple-800 border-purple-200'
        case 'open': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
        default: return 'bg-gray-100 text-gray-800 border-gray-200'
      }
    }
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getColorClass()}`}>
      {value.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
    </span>
  )
}

const getFileIcon = (fileType: string) => {
  if (fileType?.startsWith('image/')) return <FileImage className="w-4 h-4" />
  if (fileType?.startsWith('video/')) return <FileVideo className="w-4 h-4" />
  return <File className="w-4 h-4" />
}

export function BugDetailModal({ bug, isOpen, onClose, onEdit }: BugDetailModalProps) {
  if (!isOpen || !bug) return null

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString()
  }

  const formatTags = (tags: string[] | string | null) => {
    if (!tags) return []
    if (typeof tags === 'string') {
      try {
        return JSON.parse(tags)
      } catch {
        return tags.split(',').map(t => t.trim()).filter(Boolean)
      }
    }
    return Array.isArray(tags) ? tags : []
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">Bug Report Details</h2>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(bug)}
                className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
              >
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[80vh]">
          <div className="space-y-3">
            {/* Title and Status */}
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-1">{bug.title}</h3>
              <div className="flex items-center gap-3">
                <Badge value={bug.status || 'open'} type="status" />
                <Badge value={bug.severity || 'low'} type="severity" />
                <Badge value={bug.priority || 'low'} type="priority" />
              </div>
            </div>

            {/* Meta Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Reporter:</span>
                  <span className="text-sm text-gray-900">{bug.reporter_name || 'Unknown'}</span>
                </div>
                {bug.reporter_email && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Email:</span>
                    <span className="text-sm text-gray-900">{bug.reporter_email}</span>
                  </div>
                )}
                                 <div className="flex items-center gap-2">
                   <Calendar className="w-4 h-4 text-gray-500" />
                   <span className="text-sm font-medium text-gray-700">Created:</span>
                   <span className="text-sm text-gray-900">{formatDate(bug.created_at || null)}</span>
                 </div>
                 {bug.updated_at !== bug.created_at && (
                   <div className="flex items-center gap-2">
                     <span className="text-sm font-medium text-gray-700">Updated:</span>
                     <span className="text-sm text-gray-900">{formatDate(bug.updated_at || null)}</span>
                   </div>
                 )}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Environment:</span>
                  <span className="text-sm text-gray-900">{bug.environment || 'N/A'}</span>
                </div>
                {bug.browser && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Browser:</span>
                    <span className="text-sm text-gray-900">{bug.browser}</span>
                  </div>
                )}
                {bug.os && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">OS:</span>
                    <span className="text-sm text-gray-900">{bug.os}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">ID:</span>
                  <span className="text-sm text-gray-900 font-mono">{bug.id}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-base font-medium text-gray-900 mb-3">Description</h4>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{bug.description}</p>
              </div>
            </div>

            {/* Steps to Reproduce */}
            {bug.steps_to_reproduce && (
              <div>
                <h4 className="text-base font-medium text-gray-900 mb-3">Steps to Reproduce</h4>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{bug.steps_to_reproduce}</p>
                </div>
              </div>
            )}

            {/* Expected vs Actual Results */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {bug.expected_result && (
                <div>
                  <h4 className="text-base font-medium text-gray-900 mb-3">Expected Result</h4>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{bug.expected_result}</p>
                  </div>
                </div>
              )}
              
              {bug.actual_result && (
                <div>
                  <h4 className="text-base font-medium text-gray-900 mb-3">Actual Result</h4>
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{bug.actual_result}</p>
                  </div>
                </div>
              )}
            </div>

                         {/* Tags */}
            {formatTags(bug.tags || null).length > 0 && (
              <div>
                <h4 className="text-base font-medium text-gray-900 mb-3">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {formatTags(bug.tags || null).map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

                         {/* Attachments */}
            {bug.attachment_urls && bug.attachment_urls.length > 0 && (
              <div>
                <h4 className="text-base font-medium text-gray-900 mb-3">
                  Attachments ({bug.attachment_urls.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bug.attachment_urls.map((url, index) => {
                     const isImage = url.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i)
                     
                     return (
                       <div key={index} className="border border-gray-200 rounded-lg p-3">
                         <div className="flex items-center gap-2 mb-2">
                           {isImage ? <FileImage className="w-4 h-4" /> : <File className="w-4 h-4" />}
                           <span className="text-sm font-medium text-gray-900 truncate">
                             {`attachment-${index + 1}`}
                           </span>
                         </div>
                         
                         {isImage ? (
                           <img
                             src={url}
                             alt="Attachment"
                             className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-90 transition-opacity"
                             onClick={() => window.open(url, '_blank')}
                           />
                         ) : (
                           <div className="h-32 bg-gray-100 rounded flex items-center justify-center">
                             <File className="w-4 h-4" />
                           </div>
                         )}
                         
                         <div className="mt-2 flex items-center justify-between">
                           <span className="text-xs text-gray-500">
                             View file
                           </span>
                           <button
                             onClick={() => window.open(url, '_blank')}
                             className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                           >
                             <ExternalLink className="w-3 h-3" />
                             Open
                           </button>
                         </div>
                       </div>
                     )
                   })}
                 </div>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  )
} 