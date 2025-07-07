'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Play, Shield, Eye, Zap, Server, AlertCircle } from 'lucide-react'
import { AuditReport, AuditFormData } from '@/types/audit'

interface AuditFormProps {
  onAuditComplete: (report: AuditReport) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

export function AuditForm({ onAuditComplete, isLoading, setIsLoading }: AuditFormProps) {
  const [progress, setProgress] = useState(0)
  const [currentCheck, setCurrentCheck] = useState('')

  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    watch 
  } = useForm<AuditFormData>({
    defaultValues: {
      url: '',
      username: '',
      password: '',
      checks: {
        performance: true,
        security: true,
        seo: true,
        accessibility: true,
        serverInfo: true
      }
    }
  })

  const watchedChecks = watch('checks')
  const enabledChecks = Object.values(watchedChecks).filter(Boolean).length

  const runAudit = async (data: AuditFormData) => {
    setIsLoading(true)
    setProgress(0)
    setCurrentCheck('Initializing audit...')

    try {
      // Step 1: Run basic audit
      setCurrentCheck('Running website audit...')
      setProgress(20)
      
      const response = await fetch('/api/audit/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Audit failed')
      }

      const reportData = await response.json()
      
      // Convert string dates back to Date objects
      const report: AuditReport = {
        ...reportData,
        timestamp: new Date(reportData.timestamp),
        security: {
          ...reportData.security,
          ssl: {
            ...reportData.security.ssl,
            expiry: new Date(reportData.security.ssl.expiry)
          }
        }
      }

      setProgress(60)
      setCurrentCheck('Generating AI analysis...')

      // Step 2: Generate AI analysis
      try {
        const aiResponse = await fetch('/api/audit/ai-analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            auditReport: report,
            reportId: report.id
          }),
        })

        if (aiResponse.ok) {
          const aiData = await aiResponse.json()
          report.aiAnalysis = aiData.analysis
          setCurrentCheck('Analysis complete!')
          setProgress(100)
        } else {
          console.warn('AI analysis failed, continuing without it')
        }
      } catch (aiError) {
        console.warn('AI analysis error:', aiError)
        // Continue without AI analysis
      }
      
      onAuditComplete(report)
    } catch (error) {
      console.error('Audit error:', error)
      alert('Audit failed. Please try again.')
    } finally {
      setIsLoading(false)
      setProgress(0)
      setCurrentCheck('')
    }
  }

  return (
    <div className="p-6">
      <form onSubmit={handleSubmit(runAudit)} className="space-y-6">
        {/* URL Input */}
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
            Website URL <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              {...register('url', {
                required: 'URL is required',
                pattern: {
                  value: /^https?:\/\/.+/,
                  message: 'Please enter a valid URL starting with http:// or https://'
                }
              })}
              type="url"
              placeholder="https://example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
            {errors.url && (
              <div className="mt-2 flex items-center text-sm text-red-600">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.url.message}
              </div>
            )}
          </div>
        </div>

        {/* Optional Authentication */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            HTTP Authentication (Optional)
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            For basic HTTP authentication only. Does not support form-based login.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-600 mb-1">
                Username
              </label>
              <input
                {...register('username')}
                type="text"
                placeholder="Optional"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-600 mb-1">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                placeholder="Optional"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Checks Selection */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-4">
            Select Checks to Perform ({enabledChecks} selected)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <label className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <input
                {...register('checks.performance')}
                type="checkbox"
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium text-gray-900">Performance</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  TTFB, content size, asset analysis
                </p>
              </div>
            </label>

            <label className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <input
                {...register('checks.security')}
                type="checkbox"
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-gray-900">Security</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  SSL, security headers, TLS version
                </p>
              </div>
            </label>

            <label className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <input
                {...register('checks.seo')}
                type="checkbox"
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-900">SEO</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Meta tags, headings, robots.txt
                </p>
              </div>
            </label>

            <label className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <input
                {...register('checks.accessibility')}
                type="checkbox"
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium text-gray-900">Accessibility</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Alt tags, heading structure
                </p>
              </div>
            </label>

            <label className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <input
                {...register('checks.serverInfo')}
                type="checkbox"
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <Server className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Server Info</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  IP, location, tech stack
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Progress Bar */}
        {isLoading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm font-medium text-blue-900">Running Audit...</span>
            </div>
            <div className="w-full bg-blue-100 rounded-full h-2 mb-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-xs text-blue-700">{currentCheck}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || enabledChecks === 0}
          className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          <Play className="w-5 h-5" />
          <span>{isLoading ? 'Running Audit...' : 'Start Website Audit'}</span>
        </button>

        {enabledChecks === 0 && (
          <p className="text-sm text-red-600 text-center">
            Please select at least one check to perform
          </p>
        )}
      </form>
    </div>
  )
}