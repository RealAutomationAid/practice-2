'use client'

import React from 'react'
import { 
  FolderOpen, 
  Info, 
  ChevronRight,
  Calendar,
  Hash
} from 'lucide-react'
import { TestProjectOption } from './types'

interface ProjectInfoChipProps {
  project: TestProjectOption | null
  onClick: () => void
  className?: string
}

export function ProjectInfoChip({ project, onClick, className = '' }: ProjectInfoChipProps) {
  if (!project) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-500 rounded-lg border border-gray-200 ${className}`}>
        <FolderOpen className="w-4 h-4" />
        <span className="text-sm font-medium">No Project Selected</span>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const truncateText = (text: string, maxLength: number = 30) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
  }

  return (
    <button
      onClick={onClick}
      className={`group inline-flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-900 rounded-xl border border-blue-200 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md ${className}`}
    >
      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 group-hover:bg-blue-200 rounded-lg transition-colors">
        <FolderOpen className="w-5 h-5 text-blue-600" />
      </div>
      
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm text-blue-900 truncate">
            {truncateText(project.name)}
          </h3>
          <Info className="w-4 h-4 text-blue-500 opacity-70 group-hover:opacity-100 transition-opacity" />
        </div>
        
        <div className="flex items-center gap-3 mt-1 text-xs text-blue-600">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(project.created_at)}</span>
          </div>
          
          {project.description && (
            <div className="flex items-center gap-1">
              <Hash className="w-3 h-3" />
              <span className="truncate max-w-[100px]">
                {truncateText(project.description, 20)}
              </span>
            </div>
          )}
        </div>
      </div>
      
      <ChevronRight className="w-4 h-4 text-blue-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </button>
  )
}