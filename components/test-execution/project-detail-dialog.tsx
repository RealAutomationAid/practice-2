'use client'

import React, { useState } from 'react'
import {
  X,
  FolderOpen,
  Edit3,
  Trash2,
  Copy,
  Download,
  Calendar,
  User,
  FileText,
  Target,
  Settings,
  Lightbulb,
  CheckCircle,
  Clock,
  Hash
} from 'lucide-react'
import { TestProjectOption } from './types'
import { toast } from 'react-hot-toast'

interface ProjectDetailDialogProps {
  project: TestProjectOption | null
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onDuplicate?: (project: TestProjectOption) => void
}

type TabType = 'overview' | 'analysis' | 'plan' | 'requirements' | 'context'

export function ProjectDetailDialog({
  project,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onDuplicate
}: ProjectDetailDialogProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  if (!isOpen || !project) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const handleDuplicate = () => {
    if (onDuplicate) {
      onDuplicate(project)
      toast.success('Project duplicated successfully')
    }
  }

  const handleExport = () => {
    const exportData = {
      name: project.name,
      description: project.description,
      sut_analysis: project.sut_analysis,
      test_plan: project.test_plan,
      requirements: project.requirements,
      more_context: project.more_context,
      created_at: project.created_at
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.name.replace(/\s+/g, '_')}_project.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Project exported successfully')
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FolderOpen },
    { id: 'analysis', label: 'SUT Analysis', icon: Target },
    { id: 'plan', label: 'Test Plan', icon: CheckCircle },
    { id: 'requirements', label: 'Requirements', icon: FileText },
    { id: 'context', label: 'Context', icon: Lightbulb }
  ] as const

  const ExpandableSection = ({ title, content, icon: Icon }: { title: string, content?: string, icon: React.ElementType }) => {
    const [expanded, setExpanded] = useState(false)
    
    if (!content || content.trim() === '') {
      return (
        <div className="text-center py-8 text-gray-500">
          <Icon className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No {title.toLowerCase()} provided</p>
        </div>
      )
    }

    const shouldTruncate = content.length > 300
    const displayContent = expanded || !shouldTruncate ? content : `${content.substring(0, 300)}...`

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
            {displayContent}
          </p>
          {shouldTruncate && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {expanded ? 'Show Less' : 'Show More'}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{project.name}</h2>
                  <div className="flex items-center gap-2 text-blue-100 mt-1">
                    <Hash className="w-4 h-4" />
                    <span className="font-mono text-sm">#{project.id.slice(0, 8)}</span>
                    <button
                      onClick={() => copyToClipboard(project.id, 'Project ID')}
                      className="hover:text-white transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              {project.description && (
                <p className="text-blue-100 mt-2 leading-relaxed">
                  {project.description}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={handleExport}
                className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                title="Export Project"
              >
                <Download className="w-5 h-5" />
              </button>
              {onDuplicate && (
                <button
                  onClick={handleDuplicate}
                  className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                  title="Duplicate Project"
                >
                  <Copy className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={onEdit}
                className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                title="Edit Project"
              >
                <Edit3 className="w-5 h-5" />
              </button>
              <button
                onClick={onDelete}
                className="p-2 bg-red-500 bg-opacity-80 hover:bg-opacity-100 rounded-lg transition-colors"
                title="Delete Project"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh] p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Created</h3>
                  </div>
                  <p className="text-gray-700">{formatDate(project.created_at)}</p>
                </div>
                
                {project.created_by_email && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-900">Created By</h3>
                    </div>
                    <p className="text-gray-700">{project.created_by_email}</p>
                  </div>
                )}
              </div>
              
              {project.description && (
                <ExpandableSection
                  title="Description"
                  content={project.description}
                  icon={FileText}
                />
              )}
            </div>
          )}

          {activeTab === 'analysis' && (
            <ExpandableSection
              title="System Under Test Analysis"
              content={project.sut_analysis}
              icon={Target}
            />
          )}

          {activeTab === 'plan' && (
            <ExpandableSection
              title="Test Plan"
              content={project.test_plan}
              icon={CheckCircle}
            />
          )}

          {activeTab === 'requirements' && (
            <ExpandableSection
              title="Requirements"
              content={project.requirements}
              icon={FileText}
            />
          )}

          {activeTab === 'context' && (
            <ExpandableSection
              title="Additional Context"
              content={project.more_context}
              icon={Lightbulb}
            />
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              <span>Project ID: {project.id}</span>
              <span className="mx-2">•</span>
              <span>Created {formatDate(project.created_at)}</span>
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