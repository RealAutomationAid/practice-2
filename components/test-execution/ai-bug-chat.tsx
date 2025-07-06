'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Bot, User, CheckCircle, Loader2, Paperclip, X, Image } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { TestProjectOption } from './types'
import { UnifiedProjectSelector } from './unified-project-selector'
import { ProjectInfoChip } from './project-info-chip'
import { ProjectDetailDialog } from './project-detail-dialog'
import { ProjectDeleteConfirmDialog } from './project-delete-confirm-dialog'
import { ProjectModal } from './project-modal'

export interface ChatMessage {
  id: string
  type: 'user' | 'ai' | 'system'
  content: string
  timestamp: string // ISO string
  bugCreated?: boolean
  bugId?: string
  attachments?: AttachmentFile[] // Add attachments to messages
}

interface AttachmentFile {
  name: string
  type: string
  size: number
  data: string // base64 encoded
  preview?: string
}

interface AIBugChatProps {
  onBugCreated?: (bugId: string) => void
  className?: string
}

export function AIBugChat({ onBugCreated, className = '' }: AIBugChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      type: 'system',
      content: 'Welcome to the AI Bug Chat! Describe any bugs or issues you\'ve encountered, and I\'ll help you create structured bug reports automatically.',
      timestamp: new Date().toISOString()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [attachments, setAttachments] = useState<AttachmentFile[]>([])
  const [testProjects, setTestProjects] = useState<TestProjectOption[]>([])
  const [testProjectsLoading, setTestProjectsLoading] = useState(false)
  const [testProjectError, setTestProjectError] = useState<string | null>(null)
  const [selectedTestProjectId, setSelectedTestProjectId] = useState<string>('')
  const [selectedProjectContext, setSelectedProjectContext] = useState<string>('')
  const [projectModalOpen, setProjectModalOpen] = useState(false)
  const [projectModalEditData, setProjectModalEditData] = useState<any | null>(null)
  const [projectDetailOpen, setProjectDetailOpen] = useState(false)
  const [projectDeleteOpen, setProjectDeleteOpen] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
    }
  }, [])

  useEffect(() => {
    adjustTextareaHeight()
  }, [inputMessage, adjustTextareaHeight])

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      // Check file type - support images and videos
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')
      
      if (!isImage && !isVideo) {
        toast.error('Only image and video files are supported')
        return
      }

      // Check file size (50MB limit for videos, 5MB for images)
      const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024
      if (file.size > maxSize) {
        toast.error(`File size must be less than ${isVideo ? '50MB' : '5MB'}`)
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        const newAttachment: AttachmentFile = {
          name: file.name,
          type: file.type,
          size: file.size,
          data: result,
          preview: isImage ? result : undefined // Only set preview for images
        }
        setAttachments(prev => [...prev, newAttachment])
      }
      reader.readAsDataURL(file)
    })

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  // Handle paste event
  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = event.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const isImage = item.type.startsWith('image/')
      const isVideo = item.type.startsWith('video/')
      
      if (item.kind === 'file' && (isImage || isVideo)) {
        const file = item.getAsFile();
        if (file) {
          const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024
          if (file.size > maxSize) {
            toast.error(`File size must be less than ${isVideo ? '50MB' : '5MB'}`);
            continue;
          }
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            const newAttachment: AttachmentFile = {
              name: file.name || `pasted-${isVideo ? 'video' : 'image'}-${Date.now()}`,
              type: file.type,
              size: file.size,
              data: result,
              preview: isImage ? result : undefined
            };
            setAttachments(prev => [...prev, newAttachment]);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

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

  // Fetch project context when selection changes
  useEffect(() => {
    if (!selectedTestProjectId) {
      setSelectedProjectContext('')
      return
    }
    setSelectedProjectContext('')
    fetch(`/api/test-projects?id=${selectedTestProjectId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data && data.data.length > 0) {
          const p = data.data[0]
          let context = ''
          if (p.sut_analysis) context += `SUT Analysis: ${p.sut_analysis}\n`
          if (p.test_plan) context += `Test Plan: ${p.test_plan}\n`
          if (p.requirements) context += `Requirements: ${p.requirements}\n`
          if (p.testing_types) context += `Testing Types: ${JSON.stringify(p.testing_types)}\n`
          if (p.tools_frameworks) context += `Tools/Frameworks: ${p.tools_frameworks}\n`
          if (p.more_context) context += `More Context: ${p.more_context}\n`
          if (p.allocated_hours) context += `Allocated Hours: ${p.allocated_hours}\n`
          if (p.number_of_test_cases) context += `Number of Test Cases: ${p.number_of_test_cases}\n`
          if (p.risk_matrix_generation) context += `Risk Matrix Generation: true\n`
          setSelectedProjectContext(context)
        }
      })
  }, [selectedTestProjectId])

  // Helper to get selected project object
  const selectedProject = testProjects.find((p) => p.id === selectedTestProjectId) || null;

  // Handlers for project modal
  const handleOpenCreateProject = () => {
    setProjectModalEditData(null);
    setProjectModalOpen(true);
  };
  const handleOpenEditProject = (id: string) => {
    const project = testProjects.find((p) => p.id === id);
    if (project) {
      setProjectModalEditData(project);
      setProjectModalOpen(true);
    }
  };
  const handleProjectModalSuccess = (project: any) => {
    // Refresh project list after create/edit
    setTestProjectsLoading(true);
    fetch('/api/test-projects')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTestProjects(data.data);
          // Auto-select new project if created
          if (!projectModalEditData) {
            setSelectedTestProjectId(project.id);
          }
        }
      })
      .finally(() => setTestProjectsLoading(false));
  };

  const handleProjectDelete = async (projectId: string) => {
    const response = await fetch(`/api/test-projects/${projectId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete project');
    }
    
    // Refresh project list and clear selection if deleted project was selected
    setTestProjectsLoading(true);
    if (selectedTestProjectId === projectId) {
      setSelectedTestProjectId('');
    }
    
    fetch('/api/test-projects')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTestProjects(data.data);
        }
      })
      .finally(() => setTestProjectsLoading(false));
  };

  const handleProjectDuplicate = async (project: TestProjectOption) => {
    const duplicateData = {
      name: `${project.name} (Copy)`,
      description: project.description,
      sut_analysis: project.sut_analysis,
      test_plan: project.test_plan,
      requirements: project.requirements,
      more_context: project.more_context
    };
    
    try {
      const response = await fetch('/api/test-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicateData)
      });
      
      const data = await response.json();
      if (data.success) {
        handleProjectModalSuccess(data.data);
      }
    } catch (error) {
      console.error('Failed to duplicate project:', error);
      throw error;
    }
  };

  // Helper to build system prompt for AI
  const buildSystemPrompt = () => {
    if (!selectedProject) {
      return `You are an expert QA assistant. The user is reporting bugs for a software system. If no project is selected, ask the user to select or create a Test Project for better context. Always ask clarifying questions if the bug report is unclear.`;
    }
    return `You are an expert QA assistant helping users report software bugs for the following Test Project. Use the provided context to generate highly relevant, structured bug reports. Always ask clarifying questions if the bug report is unclear.\n\n---\nTest Project Name: ${selectedProject.name || ''}\nDescription: ${selectedProject.description || ''}\nSUT Analysis: ${selectedProject.sut_analysis || ''}\nTest Plan: ${selectedProject.test_plan || ''}\nRequirements: ${selectedProject.requirements || ''}\nMore Context: ${selectedProject.more_context || ''}\n---\nWhen the user describes a bug, extract all relevant details and generate a clear, actionable bug report. If information is missing, ask the user for it. Link every bug to the current Test Project.`;
  };

  // Send message to AI
  const handleSendMessage = async () => {
    if ((!inputMessage.trim() && attachments.length === 0) || isLoading) return

    const messageContent = inputMessage.trim() || 'Uploaded file(s) for bug report'
    const imageCount = attachments.filter(a => a.type.startsWith('image/')).length
    const videoCount = attachments.filter(a => a.type.startsWith('video/')).length
    const attachmentSummary = attachments.length > 0 ? 
      ` (${imageCount > 0 ? `${imageCount} image${imageCount > 1 ? 's' : ''}` : ''}${imageCount > 0 && videoCount > 0 ? ', ' : ''}${videoCount > 0 ? `${videoCount} video${videoCount > 1 ? 's' : ''}` : ''} attached)` 
      : ''
    
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: messageContent + attachmentSummary,
      timestamp: new Date().toISOString(),
      attachments: attachments.length > 0 ? [...attachments] : undefined
    }

    setMessages(prev => [...prev, userMessage])
    const currentAttachments = [...attachments]
    setInputMessage('')
    setAttachments([])
    setIsLoading(true)

    try {
      const response = await fetch('/api/test-execution/ai-bug-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: messageContent,
          conversationHistory: messages,
          attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
          test_project_id: selectedTestProjectId || undefined,
          systemPrompt: buildSystemPrompt(),
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const data = await response.json()
      
      const aiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        type: 'ai',
        content: data.response,
        timestamp: new Date().toISOString(),
        bugCreated: data.bugCreated,
        bugId: data.bugId
      }

      setMessages(prev => [...prev, aiMessage])

      // Handle bug creation
      if (data.bugCreated && data.bugId) {
        const currentImageCount = currentAttachments.filter(a => a.type.startsWith('image/')).length
        const currentVideoCount = currentAttachments.filter(a => a.type.startsWith('video/')).length
        const attachmentMsg = currentAttachments.length > 0 ? 
          ` ${currentImageCount > 0 ? `${currentImageCount} image${currentImageCount > 1 ? 's' : ''}` : ''}${currentImageCount > 0 && currentVideoCount > 0 ? ' and ' : ''}${currentVideoCount > 0 ? `${currentVideoCount} video${currentVideoCount > 1 ? 's' : ''}` : ''} attached.` 
          : ''
        toast.success(`Bug report created successfully!${attachmentMsg}`)
        onBugCreated?.(data.bugId)
      }

    } catch (error) {
      console.error('Failed to send message:', error)
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        type: 'system',
        content: 'Sorry, I encountered an error while processing your message. Please try again.',
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
      toast.error('Failed to send message')
    } finally {
      setIsLoading(false)
    }
  }

  // Format timestamp
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);
  const formatTimestamp = (timestamp: string) => {
    if (!hydrated) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Get message icon
  const getMessageIcon = (message: ChatMessage) => {
    switch (message.type) {
      case 'user':
        return <User className="w-4 h-4" />
      case 'ai':
        return <Bot className="w-4 h-4" />
      case 'system':
        return <CheckCircle className="w-4 h-4" />
      default:
        return null
    }
  }

  // Get message styling
  const getMessageStyling = (message: ChatMessage) => {
    switch (message.type) {
      case 'user':
        return 'bg-blue-500 text-white ml-12'
      case 'ai':
        return 'bg-gray-100 text-gray-900 mr-12'
      case 'system':
        return 'bg-green-50 text-green-800 border border-green-200 mx-4'
      default:
        return ''
    }
  }

  return (
    <div className={`relative flex flex-col h-full ${className}`}>
      {/* Project Management UI */}
      <UnifiedProjectSelector
        projects={testProjects}
        selectedProjectId={selectedTestProjectId}
        onSelect={setSelectedTestProjectId}
        onCreate={handleOpenCreateProject}
        onEdit={handleOpenEditProject}
        onView={() => setProjectDetailOpen(true)}
        loading={testProjectsLoading}
        showProjectInfo={false}
        className="mb-4"
      />
      
      {/* Project Info Chip */}
      {selectedProject && (
        <div className="mb-4">
          <ProjectInfoChip
            project={selectedProject}
            onClick={() => setProjectDetailOpen(true)}
          />
        </div>
      )}

      {/* Project Modals */}
      <ProjectModal
        open={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onSuccess={handleProjectModalSuccess}
        initialData={projectModalEditData}
      />
      
      <ProjectDetailDialog
        project={selectedProject}
        isOpen={projectDetailOpen}
        onClose={() => setProjectDetailOpen(false)}
        onEdit={() => {
          setProjectDetailOpen(false)
          handleOpenEditProject(selectedTestProjectId)
        }}
        onDelete={() => {
          setProjectDetailOpen(false)
          setProjectDeleteOpen(true)
        }}
        onDuplicate={handleProjectDuplicate}
      />
      
      <ProjectDeleteConfirmDialog
        project={selectedProject}
        isOpen={projectDeleteOpen}
        onClose={() => setProjectDeleteOpen(false)}
        onConfirm={handleProjectDelete}
      />
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Bug Reporter</h3>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Describe bugs naturally and I'll create structured reports for you
        </p>
      </div>


      {/* Messages */}
      <div className="h-96 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="flex flex-col">
            <div className={`rounded-lg p-3 max-w-full ${getMessageStyling(message)}`}>
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0 mt-0.5">
                  {getMessageIcon(message)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="whitespace-pre-wrap break-words">
                    {message.content}
                  </div>
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {message.attachments.map((attachment, idx) => 
                        attachment.type.startsWith('image/') ? (
                          <img
                            key={idx}
                            src={attachment.preview || attachment.data}
                            alt={attachment.name}
                            className="w-20 h-20 object-cover rounded border cursor-pointer"
                            onClick={() => window.open(attachment.data, '_blank')}
                          />
                        ) : (
                          <div 
                            key={idx}
                            className="w-20 h-20 bg-gray-100 rounded border flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200"
                            onClick={() => {
                              const link = document.createElement('a')
                              link.href = attachment.data
                              link.download = attachment.name
                              link.click()
                            }}
                          >
                            <div className="text-lg">🎬</div>
                            <div className="text-xs text-gray-600">Video</div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                  {message.bugCreated && (
                    <div className="flex items-center space-x-1 mt-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">Bug report created</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className={`text-xs text-gray-500 mt-1 ${
              message.type === 'user' ? 'text-right' : 'text-left'
            }`}>
              {formatTimestamp(message.timestamp)}
            </div>
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center space-x-2 text-gray-500">
            <Bot className="w-4 h-4" />
            <div className="flex items-center space-x-1">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">AI is thinking...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t p-4">
        {/* Attachment previews */}
        {attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((attachment, index) => (
              <div key={index} className="relative">
                <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200">
                  {attachment.type.startsWith('image/') ? (
                    <img
                      src={attachment.preview}
                      alt={attachment.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl mb-1">🎬</div>
                        <div className="text-xs text-gray-600">Video</div>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => removeAttachment(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-xs text-gray-500 mt-1 max-w-20 truncate">
                  {attachment.name}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="Describe the bug you encountered..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={1}
              disabled={isLoading}
            />
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-4">
                <span className="text-xs text-gray-500">
                  Press Enter to send, Shift+Enter for new line
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="text-gray-500 hover:text-gray-700 disabled:opacity-50 transition-colors"
                  title="Attach images or videos"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
              </div>
              <span className="text-xs text-gray-400">
                {inputMessage.length}/1000
              </span>
            </div>
          </div>
          <button
            onClick={handleSendMessage}
            disabled={(!inputMessage.trim() && attachments.length === 0) || isLoading}
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
} 