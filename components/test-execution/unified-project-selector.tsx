'use client'

import React, { useState } from 'react'
import { 
  FolderOpen, 
  Plus, 
  Settings, 
  ChevronDown, 
  Search,
  Folder,
  Info,
  Calendar,
  User
} from 'lucide-react'
import { TestProjectOption } from './types'

interface UnifiedProjectSelectorProps {
  projects: TestProjectOption[]
  selectedProjectId: string
  onSelect: (id: string) => void
  onCreate: () => void
  onEdit: (id: string) => void
  onView?: (id: string) => void
  loading?: boolean
  showProjectInfo?: boolean
  className?: string
}

export function UnifiedProjectSelector({
  projects,
  selectedProjectId,
  onSelect,
  onCreate,
  onEdit,
  onView,
  loading = false,
  showProjectInfo = false,
  className = ''
}: UnifiedProjectSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const selectedProject = projects.find(p => p.id === selectedProjectId)
  
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const ProjectCard = ({ project }: { project: TestProjectOption }) => (
    <div
      onClick={() => {
        onSelect(project.id)
        setIsOpen(false)
        setSearchTerm('')
      }}
      className="group px-4 py-3 hover:bg-blue-50 cursor-pointer border-l-4 border-transparent hover:border-blue-500 transition-all duration-200"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Folder className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-700">
              {project.name}
            </h3>
          </div>
          {project.description && (
            <p className="text-sm text-gray-600 mb-2 overflow-hidden" style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>
              {project.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(project.created_at)}</span>
            </div>
            {project.created_by_email && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span className="truncate max-w-[120px]">{project.created_by_email}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {onView && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onView(project.id)
                setIsOpen(false)
              }}
              className="p-1 hover:bg-blue-100 rounded text-blue-600"
              title="View project details"
            >
              <Info className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(project.id)
              setIsOpen(false)
            }}
            className="p-1 hover:bg-blue-100 rounded text-blue-600"
            title="Edit project"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className={`relative ${className}`}>
      {/* Current Selection Display */}
      <div className="bg-white border border-gray-300 rounded-lg shadow-sm">
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={loading}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              {selectedProject ? (
                <FolderOpen className="w-5 h-5 text-white" />
              ) : (
                <Folder className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="text-left flex-1 min-w-0">
              <div className="font-semibold text-gray-900 truncate">
                {selectedProject ? selectedProject.name : 'Select Project'}
              </div>
              <div className="text-sm text-gray-500 truncate">
                {selectedProject ? (
                  selectedProject.description || 'No description'
                ) : (
                  'Choose a project to filter bugs and provide AI context'
                )}
              </div>
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-[400px] overflow-hidden">
          {/* Search and Actions Header */}
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <button
                onClick={() => {
                  onCreate()
                  setIsOpen(false)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New
              </button>
            </div>
          </div>

          {/* Project List */}
          <div className="max-h-[300px] overflow-y-auto">
            {/* No Project Option */}
            <div
              onClick={() => {
                onSelect('')
                setIsOpen(false)
                setSearchTerm('')
              }}
              className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-l-4 transition-all duration-200 ${
                !selectedProjectId ? 'border-blue-500 bg-blue-50' : 'border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-300 rounded flex-shrink-0" />
                <span className="font-medium text-gray-700">No Project Selected</span>
              </div>
              <p className="text-sm text-gray-500 mt-1 ml-6">
                View all bugs regardless of project
              </p>
            </div>

            {/* Project Options */}
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))
            ) : searchTerm ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <Folder className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No projects found matching "{searchTerm}"</p>
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-gray-500">
                <Folder className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No projects available</p>
                <button
                  onClick={() => {
                    onCreate()
                    setIsOpen(false)
                  }}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Create your first project
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          onClick={() => {
            setIsOpen(false)
            setSearchTerm('')
          }}
          className="fixed inset-0 z-40"
        />
      )}
    </div>
  )
}