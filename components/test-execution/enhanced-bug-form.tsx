'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { 
  Bug, 
  Upload, 
  X, 
  FileImage, 
  FileVideo, 
  File, 
  Clipboard,
  Send,
  AlertCircle,
  CheckCircle,
  Edit,
  Loader2
} from 'lucide-react'
import { CreateBugFormData, FileUploadProgress, BugReportExtended, TestProjectOption } from './types'
import { BugSeverity, BugPriority, BugStatus } from '@/lib/supabase-types'
import { clipboardUtils, fileUtils } from '@/lib/test-execution-utils'

interface EnhancedBugFormProps {
  onSubmit: (data: CreateBugFormData, files: File[]) => Promise<void>
  isLoading?: boolean
  onCancel?: () => void
  editingBug?: BugReportExtended | null
  mode?: 'create' | 'edit'
}

const SEVERITY_OPTIONS: { value: BugSeverity; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' }
]

const PRIORITY_OPTIONS: { value: BugPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'bg-blue-100 text-blue-800' },
  { value: 'medium', label: 'Medium', color: 'bg-purple-100 text-purple-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
]

const STATUS_OPTIONS: { value: BugStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
  { value: 'duplicate', label: 'Duplicate' },
]

export function EnhancedBugForm({ 
  onSubmit, 
  isLoading = false, 
  onCancel, 
  editingBug = null,
  mode = 'create' 
}: EnhancedBugFormProps) {
  const [uploadedFiles, setUploadedFiles] = useState<FileUploadProgress[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const isEditMode = mode === 'edit' && editingBug
  const [testProjects, setTestProjects] = useState<TestProjectOption[]>([])
  const [testProjectsLoading, setTestProjectsLoading] = useState(false)
  const [testProjectError, setTestProjectError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<CreateBugFormData>({
    defaultValues: {
      severity: 'medium',
      priority: 'medium',
      environment: 'production',
      tags: [],
      status: 'open',
    }
  })

  // Parse tags utility function
  const parseTags = (tags: string[] | string | null): string[] => {
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

  // Populate form when editing
  useEffect(() => {
    if (isEditMode) {
      const bug = editingBug!
      
      // Set form values
      setValue('title', bug.title || '')
      setValue('description', bug.description || '')
      setValue('severity', bug.severity || 'medium')
      setValue('priority', bug.priority || 'medium')
      setValue('reporter_name', bug.reporter_name || '')
      setValue('reporter_email', bug.reporter_email || '')
      setValue('environment', bug.environment || 'production')
      setValue('browser', bug.browser || '')
      setValue('device', bug.device || '')
      setValue('os', bug.os || '')
      setValue('url', bug.url || '')
      setValue('steps_to_reproduce', bug.steps_to_reproduce?.join('\n') || '')
      setValue('expected_result', bug.expected_result || '')
      setValue('actual_result', bug.actual_result || '')
      setValue('status', bug.status || 'open')
      
      // Set tags
      const bugTags = parseTags(bug.tags || null)
      setTags(bugTags)
    } else {
      // Auto-detect browser and OS for create mode
      const userAgent = navigator.userAgent
      let browser = 'Unknown'
      let os = 'Unknown'

      // Detect browser
      if (userAgent.includes('Chrome')) browser = 'Chrome'
      else if (userAgent.includes('Firefox')) browser = 'Firefox'
      else if (userAgent.includes('Safari')) browser = 'Safari'
      else if (userAgent.includes('Edge')) browser = 'Edge'

      // Detect OS
      if (userAgent.includes('Windows')) os = 'Windows'
      else if (userAgent.includes('Mac')) os = 'macOS'
      else if (userAgent.includes('Linux')) os = 'Linux'
      else if (userAgent.includes('Android')) os = 'Android'
      else if (userAgent.includes('iOS')) os = 'iOS'

      setValue('browser', browser)
      setValue('os', os)
    }
  }, [isEditMode, editingBug, setValue])

  // Setup clipboard paste listener (only for create mode)
  useEffect(() => {
    if (!isEditMode) {
      const cleanup = clipboardUtils.setupPasteListener(handlePastedFile)
      return cleanup
    }
  }, [isEditMode])

  // Handle pasted files (screenshots)
  const handlePastedFile = (file: File) => {
    const validation = fileUtils.validateFile(file)
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid file')
      return
    }

    const newFile: FileUploadProgress = {
      file,
      progress: 0,
      status: 'pending'
    }

    setUploadedFiles(prev => [...prev, newFile])
    toast.success('Screenshot pasted! 📸')
  }

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      const validFiles = acceptedFiles.filter(file => {
        const validation = fileUtils.validateFile(file)
        if (!validation.valid) {
          toast.error(`${file.name}: ${validation.error}`)
          return false
        }
        return true
      })

      const newFiles: FileUploadProgress[] = validFiles.map(file => ({
        file,
        progress: 0,
        status: 'pending'
      }))

      setUploadedFiles(prev => [...prev, ...newFiles])
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true
  })

  // Remove uploaded file
  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Handle tag input
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    }
  }

  const addTag = () => {
    const trimmedTag = tagInput.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags(prev => [...prev, trimmedTag])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove))
  }

  // Handle form submission
  const onFormSubmit = async (data: CreateBugFormData) => {
    try {
      const formData = { ...data, tags, status: data.status }
      const files = uploadedFiles.map(f => f.file)
      await onSubmit(formData, files)
      
      // Reset form on success (only for create mode)
      if (!isEditMode) {
        reset()
        setUploadedFiles([])
        setTags([])
        setTagInput('')
      }
      
      const message = isEditMode ? 'Bug report updated successfully! 🔄' : 'Bug report created successfully! 🐛'
      toast.success(message)
    } catch (error) {
      const errorMessage = isEditMode ? 'Failed to update bug report' : 'Failed to create bug report'
      toast.error(errorMessage)
      console.error('Form submission error:', error)
    }
  }

  // Get file icon
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <FileImage className="w-4 h-4" />
    if (fileType.startsWith('video/')) return <FileVideo className="w-4 h-4" />
    return <File className="w-4 h-4" />
  }

  const formTitle = isEditMode ? 'Edit Bug Report' : 'Quick Bug Report'
  const submitButtonText = isEditMode ? 'Update Bug Report' : 'Create Bug Report'
  const submitIcon = isEditMode ? <Edit className="w-4 h-4" /> : <Send className="w-4 h-4" />
  const loadingText = isEditMode ? 'Updating...' : 'Creating...'

  // Fetch test projects on mount
  useEffect(() => {
    setTestProjectsLoading(true)
    fetch('/api/test-projects')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTestProjects(data.data)
        } else {
          setTestProjectError('Failed to load test projects')
        }
      })
      .catch(() => setTestProjectError('Failed to load test projects'))
      .finally(() => setTestProjectsLoading(false))
  }, [])

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Bug className="w-6 h-6 text-red-600" />
        <h2 className="text-xl font-semibold">{formTitle}</h2>
        {isEditMode && (
          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
            ID: {editingBug!.id}
          </span>
        )}
        {!isEditMode && (
          <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
            <Clipboard className="w-4 h-4" />
            <span>Ctrl+V to paste screenshots</span>
          </div>
        )}
      </div>

      <form ref={formRef} onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Test Project Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Test Project
          </label>
          {testProjectsLoading ? (
            <div className="flex items-center gap-2 text-gray-500"><Loader2 className="animate-spin w-4 h-4" /> Loading projects...</div>
          ) : (
            <select
              {...register('test_project_id')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue=""
            >
              <option value="">No Test Project</option>
              {testProjects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name} ({new Date(project.created_at).toLocaleDateString()})
                </option>
              ))}
            </select>
          )}
          {testProjectError && <p className="text-sm text-red-600 mt-1">{testProjectError}</p>}
        </div>

        {/* Title and Description */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              {...register('title', { required: 'Title is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of the bug"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              {...register('description', { required: 'Description is required' })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Detailed description of the issue"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>
        </div>

        {/* Severity and Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Severity
            </label>
            <select
              {...register('severity')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SEVERITY_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              {...register('priority')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PRIORITY_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status */}
        {isEditMode && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              {...register('status')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Reporter Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reporter Name
            </label>
            <input
              {...register('reporter_name')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your name (optional)"
            />
            {errors.reporter_name && (
              <p className="mt-1 text-sm text-red-600">{errors.reporter_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reporter Email
            </label>
            <input
              {...register('reporter_email', { 
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="your.email@company.com (optional)"
            />
            {errors.reporter_email && (
              <p className="mt-1 text-sm text-red-600">{errors.reporter_email.message}</p>
            )}
          </div>
        </div>

        {/* Environment Details */}
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Environment
            </label>
            <select
              {...register('environment')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="production">Production</option>
              <option value="staging">Staging</option>
              <option value="development">Development</option>
              <option value="testing">Testing</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Browser
            </label>
            <input
              {...register('browser')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Auto-detected"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Device
            </label>
            <input
              {...register('device')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Desktop, Mobile, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              OS
            </label>
            <input
              {...register('os')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Auto-detected"
            />
          </div>
        </div>

        {/* URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL
          </label>
          <input
            {...register('url')}
            type="url"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/page-with-bug"
          />
        </div>

        {/* Steps to Reproduce */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Steps to Reproduce
          </label>
          <textarea
            {...register('steps_to_reproduce')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="1. Go to...&#10;2. Click on...&#10;3. Notice that..."
          />
        </div>

        {/* Expected vs Actual Results */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expected Result
            </label>
            <textarea
              {...register('expected_result')}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="What should happen"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Actual Result
            </label>
            <textarea
              {...register('actual_result')}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="What actually happens"
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={addTag}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Add tags (press Enter or comma to add)"
          />
        </div>

        {/* File Upload Area - Show existing attachments in edit mode */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Attachments
          </label>
          
          {/* Show existing attachments in edit mode */}
          {isEditMode && editingBug!.attachment_urls && editingBug!.attachment_urls.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Existing Attachments</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {editingBug!.attachment_urls.map((url, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-2">
                    <div className="aspect-square bg-gray-100 rounded-md mb-2 overflow-hidden">
                      {url.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <img 
                          src={url} 
                          alt={`Attachment ${index + 1}`}
                          className="w-full h-full object-cover cursor-pointer hover:opacity-80"
                          onClick={() => window.open(url, '_blank')}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <File className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => window.open(url, '_blank')}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      View File
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600">
              {isDragActive
                ? 'Drop the files here...'
                : isEditMode 
                  ? 'Drag & drop files to add more attachments'
                  : 'Drag & drop files here, or click to select'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Images, videos, and documents (max 50MB each)
            </p>
          </div>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-medium text-gray-700">New Attachments</h4>
              {uploadedFiles.map((fileUpload, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center gap-2">
                    {getFileIcon(fileUpload.file.type)}
                    <span className="text-sm font-medium">{fileUpload.file.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(fileUpload.file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {loadingText}
              </>
            ) : (
              <>
                {submitIcon}
                {submitButtonText}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
} 