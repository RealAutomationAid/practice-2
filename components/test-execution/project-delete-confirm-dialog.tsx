'use client'

import React, { useState } from 'react'
import {
  AlertTriangle,
  Trash2,
  X,
  FolderOpen,
  Bug,
  Clock
} from 'lucide-react'
import { TestProjectOption } from './types'
import { toast } from 'react-hot-toast'

interface ProjectDeleteConfirmDialogProps {
  project: TestProjectOption | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (projectId: string) => Promise<void>
  bugCount?: number
}

export function ProjectDeleteConfirmDialog({
  project,
  isOpen,
  onClose,
  onConfirm,
  bugCount = 0
}: ProjectDeleteConfirmDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  if (!isOpen || !project) return null

  const expectedConfirmText = 'DELETE'
  const isConfirmValid = confirmText === expectedConfirmText

  const handleDelete = async () => {
    if (!isConfirmValid) return
    
    setIsDeleting(true)
    try {
      await onConfirm(project.id)
      onClose()
      setConfirmText('')
      toast.success('Project deleted successfully')
    } catch (error) {
      console.error('Failed to delete project:', error)
      toast.error('Failed to delete project')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClose = () => {
    if (!isDeleting) {
      setConfirmText('')
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-red-50 border-b border-red-100 p-6 rounded-t-xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-red-900">Delete Project</h2>
                <p className="text-sm text-red-700">This action cannot be undone</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isDeleting}
              className="p-1 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-red-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Project Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <FolderOpen className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">{project.name}</h3>
            </div>
            {project.description && (
              <p className="text-sm text-gray-600 mb-3">{project.description}</p>
            )}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900 mb-1">Warning</h4>
                <p className="text-sm text-yellow-800">
                  Deleting this project will:
                </p>
                <ul className="text-sm text-yellow-800 mt-2 space-y-1">
                  <li>• Permanently remove the project and all its data</li>
                  <li>• Remove project association from {bugCount} linked bug report{bugCount !== 1 ? 's' : ''}</li>
                  <li>• This action cannot be undone</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bug Count Warning */}
          {bugCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Bug className="w-5 h-5 text-red-600" />
                <div>
                  <h4 className="font-medium text-red-900">
                    {bugCount} Bug Report{bugCount !== 1 ? 's' : ''} Associated
                  </h4>
                  <p className="text-sm text-red-700 mt-1">
                    Bug reports will not be deleted, but they will lose their project association.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Confirmation Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900">
              Type <span className="font-mono bg-gray-100 px-1 rounded">DELETE</span> to confirm:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={isDeleting}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50"
              placeholder="Type DELETE to confirm"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-xl">
          <div className="flex justify-end gap-3">
            <button
              onClick={handleClose}
              disabled={isDeleting}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={!isConfirmValid || isDeleting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Project
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}