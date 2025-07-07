'use client'

import React, { useState } from 'react'
import { X, Eye, EyeOff, Info } from 'lucide-react'

interface SutAnalysisFormProps {
  onSubmit: (data: any) => void
  onCancel: () => void
  initialData?: any
}

export function SutAnalysisForm({ onSubmit, onCancel, initialData }: SutAnalysisFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    target_url: initialData?.target_url || '',
    login_url: initialData?.login_url || '',
    username: initialData?.username || '',
    password: '',
    crawl_settings: {
      maxPages: initialData?.crawl_settings?.maxPages || 10,
      maxDepth: initialData?.crawl_settings?.maxDepth || 3,
      waitForNetworkIdle: initialData?.crawl_settings?.waitForNetworkIdle !== false,
      screenshotQuality: initialData?.crawl_settings?.screenshotQuality || 80,
      timeout: initialData?.crawl_settings?.timeout || 30000,
    }
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.name.trim() || !formData.target_url.trim()) {
      alert('Name and Target URL are required')
      return
    }
    
    // URL validation
    try {
      new URL(formData.target_url)
    } catch {
      alert('Please enter a valid target URL')
      return
    }
    
    if (formData.login_url) {
      try {
        new URL(formData.login_url)
      } catch {
        alert('Please enter a valid login URL')
        return
      }
    }

    setSubmitting(true)
    
    try {
      const submitData = {
        ...formData,
        // Don't send empty fields
        login_url: formData.login_url.trim() || undefined,
        username: formData.username.trim() || undefined,
        password: formData.password.trim() || undefined,
      }
      
      await onSubmit(submitData)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCrawlSettingChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      crawl_settings: {
        ...prev.crawl_settings,
        [field]: value
      }
    }))
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {initialData ? 'Edit SUT Analysis' : 'New SUT Analysis'}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Analysis Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., E-commerce Site Analysis"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target URL *
            </label>
            <input
              type="url"
              value={formData.target_url}
              onChange={(e) => handleInputChange('target_url', e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              The main URL of the application to analyze
            </p>
          </div>
        </div>

        {/* Authentication (Optional) */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Authentication (Optional)</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5" />
              <p className="text-sm text-blue-700">
                Provide login credentials to access authenticated areas of the application. 
                Passwords are encrypted and stored securely.
              </p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Login URL
            </label>
            <input
              type="url"
              value={formData.login_url}
              onChange={(e) => handleInputChange('login_url', e.target.value)}
              placeholder="https://example.com/login (leave empty if same as target URL)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="Email or username"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Password"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Settings</span>
          </button>

          {showAdvanced && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
              <h4 className="font-medium text-gray-900">Crawl Configuration</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Pages
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.crawl_settings.maxPages}
                    onChange={(e) => handleCrawlSettingChange('maxPages', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum number of pages to crawl (1-50)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Depth
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.crawl_settings.maxDepth}
                    onChange={(e) => handleCrawlSettingChange('maxDepth', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum link depth to follow (1-5)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Screenshot Quality
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={formData.crawl_settings.screenshotQuality}
                    onChange={(e) => handleCrawlSettingChange('screenshotQuality', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Screenshot quality percentage (50-100)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Timeout (ms)
                  </label>
                  <input
                    type="number"
                    min="10000"
                    max="60000"
                    step="5000"
                    value={formData.crawl_settings.timeout}
                    onChange={(e) => handleCrawlSettingChange('timeout', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Page load timeout in milliseconds</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="waitForNetworkIdle"
                  checked={formData.crawl_settings.waitForNetworkIdle}
                  onChange={(e) => handleCrawlSettingChange('waitForNetworkIdle', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="waitForNetworkIdle" className="text-sm text-gray-700">
                  Wait for network idle before proceeding
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Starting Analysis...' : 'Start Analysis'}
          </button>
        </div>
      </form>
    </div>
  )
}