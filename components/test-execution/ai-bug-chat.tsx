'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Bot, User, CheckCircle, Loader2, Paperclip, X, Image } from 'lucide-react'
import { toast } from 'react-hot-toast'

export interface ChatMessage {
  id: string
  type: 'user' | 'ai' | 'system'
  content: string
  timestamp: Date
  bugCreated?: boolean
  bugId?: string
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
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [attachments, setAttachments] = useState<AttachmentFile[]>([])
  
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
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('Only image files are supported')
        return
      }

      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
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
          preview: result
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

  // Send message to AI
  const handleSendMessage = async () => {
    if ((!inputMessage.trim() && attachments.length === 0) || isLoading) return

    const messageContent = inputMessage.trim() || 'Uploaded image(s) for bug report'
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: messageContent + (attachments.length > 0 ? ` (${attachments.length} image${attachments.length > 1 ? 's' : ''} attached)` : ''),
      timestamp: new Date()
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
          attachments: currentAttachments.length > 0 ? currentAttachments : undefined
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
        timestamp: new Date(),
        bugCreated: data.bugCreated,
        bugId: data.bugId
      }

      setMessages(prev => [...prev, aiMessage])

      // Handle bug creation
      if (data.bugCreated && data.bugId) {
        toast.success(`Bug report created successfully!${currentAttachments.length > 0 ? ` ${currentAttachments.length} image(s) attached.` : ''}`)
        onBugCreated?.(data.bugId)
      }

    } catch (error) {
      console.error('Failed to send message:', error)
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        type: 'system',
        content: 'Sorry, I encountered an error while processing your message. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      toast.error('Failed to send message')
    } finally {
      setIsLoading(false)
    }
  }

  // Format timestamp
  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
    <div className={`bg-white rounded-lg shadow-lg border ${className}`}>
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
                  <img
                    src={attachment.preview}
                    alt={attachment.name}
                    className="w-full h-full object-cover"
                  />
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
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="text-gray-500 hover:text-gray-700 disabled:opacity-50 transition-colors"
                  title="Attach images"
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