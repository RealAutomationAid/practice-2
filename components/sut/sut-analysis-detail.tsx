'use client'

import { useState, useEffect } from 'react'
import { WinnersSutAnalysis } from '@/lib/supabase-types'
import { 
  ArrowLeft, Clock, Download, Eye, FileText, AlertCircle, ImageIcon, 
  CheckCircle, XCircle, Play, MousePointer, LinkIcon as Link, 
  ExternalLink, Trash2, X 
} from 'lucide-react'
import toast from 'react-hot-toast'

interface SutAnalysisDetailProps {
  analysis: WinnersSutAnalysis
  onBack: () => void
}

export function SutAnalysisDetail({ analysis, onBack }: SutAnalysisDetailProps) {
  const [currentAnalysis, setCurrentAnalysis] = useState<WinnersSutAnalysis>(analysis)
  const [activeTab, setActiveTab] = useState<'overview' | 'crawl-data' | 'ai-analysis' | 'screenshots'>('overview')
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)
  const [loadingAiAnalysis, setLoadingAiAnalysis] = useState(false)
  const [refreshingStatus, setRefreshingStatus] = useState(false)
  const [screenshotUrls, setScreenshotUrls] = useState<Record<string, string>>({})
  const [loadingUrls, setLoadingUrls] = useState<Record<string, boolean>>({})
  const [deletingScreenshots, setDeletingScreenshots] = useState<Record<string, boolean>>({})
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  // Load AI analysis on mount
  useEffect(() => {
    if (currentAnalysis.ai_analysis) {
      setAiAnalysis(currentAnalysis.ai_analysis)
    } else if (currentAnalysis.status === 'completed') {
      fetchAiAnalysis()
    }
  }, [analysis])

  // Auto-load screenshot URLs when analysis changes
  useEffect(() => {
    const screenshots = Array.isArray(currentAnalysis.screenshots) ? currentAnalysis.screenshots : []
    if (screenshots.length > 0) {
      screenshots.forEach((screenshot: any) => {
        if (screenshot.storage_path && !screenshotUrls[screenshot.storage_path] && !loadingUrls[screenshot.storage_path]) {
          loadScreenshotUrl(screenshot.storage_path)
        }
      })
    }
  }, [currentAnalysis.screenshots])

  const fetchAiAnalysis = async () => {
    if (loadingAiAnalysis) return
    
    setLoadingAiAnalysis(true)
    try {
      const response = await fetch(`/api/sut-analysis/ai-analysis?id=${analysis.id}`)
      const result = await response.json()
      
      if (response.ok) {
        setAiAnalysis(result.analysis)
      } else if (response.status === 404) {
        // No AI analysis available yet
        console.log('No AI analysis available yet')
      } else {
        console.error('Failed to fetch AI analysis:', result.error)
      }
    } catch (error) {
      console.error('Error fetching AI analysis:', error)
    } finally {
      setLoadingAiAnalysis(false)
    }
  }

  const triggerAiAnalysis = async () => {
    setLoadingAiAnalysis(true)
    try {
      const response = await fetch('/api/sut-analysis/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sutAnalysisId: analysis.id })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        setAiAnalysis({ analysis: result.analysis, generated_at: new Date().toISOString() })
        toast.success('AI analysis completed!')
      } else {
        toast.error(result.error || 'Failed to generate AI analysis')
      }
    } catch (error) {
      console.error('Error triggering AI analysis:', error)
      toast.error('Failed to generate AI analysis')
    } finally {
      setLoadingAiAnalysis(false)
    }
  }

  const refreshStatus = async () => {
    setRefreshingStatus(true)
    try {
      const response = await fetch(`/api/sut-analysis/${analysis.id}`)
      const result = await response.json()
      
      if (response.ok) {
        setCurrentAnalysis(result.data)
        if (result.data.ai_analysis && !aiAnalysis) {
          setAiAnalysis(result.data.ai_analysis)
        }
      }
    } catch (error) {
      console.error('Error refreshing status:', error)
    } finally {
      setRefreshingStatus(false)
    }
  }

  // Screenshot-related functions
  const loadScreenshotUrl = async (storagePath: string) => {
    if (screenshotUrls[storagePath] || loadingUrls[storagePath]) return

    setLoadingUrls(prev => ({ ...prev, [storagePath]: true }))
    
    try {
      const response = await fetch(`/api/sut-analysis/screenshots?path=${encodeURIComponent(storagePath)}`)
      const result = await response.json()
      
      if (response.ok && result.url) {
        setScreenshotUrls(prev => ({ ...prev, [storagePath]: result.url }))
      }
    } catch (error) {
      console.error('Failed to load screenshot URL:', error)
    } finally {
      setLoadingUrls(prev => ({ ...prev, [storagePath]: false }))
    }
  }

  const downloadScreenshot = async (storagePath: string, pageTitle?: string) => {
    try {
      const response = await fetch(`/api/sut-analysis/screenshots?path=${encodeURIComponent(storagePath)}&download=true`)
      const result = await response.json()
      
      if (response.ok && result.url) {
        const link = document.createElement('a')
        link.href = result.url
        link.download = `${pageTitle?.replace(/[^a-z0-9]/gi, '-') || 'screenshot'}.jpg`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success('Screenshot downloaded!')
      } else {
        toast.error('Failed to download screenshot')
      }
    } catch (error) {
      console.error('Download failed:', error)
      toast.error('Download failed')
    }
  }

  const deleteScreenshot = async (storagePath: string) => {
    if (!confirm('Are you sure you want to delete this screenshot?')) return

    setDeletingScreenshots(prev => ({ ...prev, [storagePath]: true }))
    
    try {
      const response = await fetch(`/api/sut-analysis/screenshots?path=${encodeURIComponent(storagePath)}&analysisId=${currentAnalysis.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Refresh the analysis data to update the screenshots list
        await refreshStatus()
        toast.success('Screenshot deleted successfully')
      } else {
        const result = await response.json()
        toast.error(result.error || 'Failed to delete screenshot')
      }
    } catch (error) {
      console.error('Delete failed:', error)
      toast.error('Failed to delete screenshot')
    } finally {
      setDeletingScreenshots(prev => ({ ...prev, [storagePath]: false }))
    }
  }

  const downloadAllScreenshots = async () => {
    try {
      const response = await fetch('/api/sut-analysis/screenshots/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId: currentAnalysis.id })
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${currentAnalysis.name.replace(/[^a-z0-9]/gi, '-')}-screenshots.zip`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        toast.success('All screenshots downloaded!')
      } else {
        const result = await response.json()
        toast.error(result.error || 'Failed to download screenshots')
      }
    } catch (error) {
      console.error('Bulk download failed:', error)
      toast.error('Failed to download screenshots')
    }
  }

  const deleteAllScreenshots = async () => {
    if (!confirm('Are you sure you want to delete ALL screenshots? This action cannot be undone.')) return

    try {
      const response = await fetch(`/api/sut-analysis/screenshots/bulk?analysisId=${currentAnalysis.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await refreshStatus()
        toast.success('All screenshots deleted successfully')
      } else {
        const result = await response.json()
        toast.error(result.error || 'Failed to delete screenshots')
      }
    } catch (error) {
      console.error('Bulk delete failed:', error)
      toast.error('Failed to delete screenshots')
    }
  }

  const downloadReport = () => {
    // Helper function to safely get crawl data properties
    const getCrawlData = () => {
      return currentAnalysis.crawl_data && typeof currentAnalysis.crawl_data === 'object' && currentAnalysis.crawl_data !== null 
        ? currentAnalysis.crawl_data as any 
        : null
    }

    const crawlData = getCrawlData()
    
    const content = `# SUT Analysis Report
    
## Analysis Details
- **Name**: ${currentAnalysis.name}
- **Target URL**: ${currentAnalysis.target_url}
- **Status**: ${currentAnalysis.status}
- **Created**: ${currentAnalysis.created_at ? new Date(currentAnalysis.created_at).toLocaleString() : 'Unknown'}
- **Updated**: ${currentAnalysis.updated_at ? new Date(currentAnalysis.updated_at).toLocaleString() : 'Unknown'}

## Crawl Summary
${crawlData ? `
- **Pages Crawled**: ${crawlData.summary?.totalPages || 0}
- **Forms Found**: ${crawlData.summary?.totalForms || 0}
- **Links Found**: ${crawlData.summary?.totalLinks || 0}
- **Images Found**: ${crawlData.summary?.totalImages || 0}
` : 'No crawl data available'}

## Features Detected
${crawlData?.features ? Object.entries(crawlData.features)
  .map(([feature, present]) => `- **${feature}**: ${present ? 'Yes' : 'No'}`)
  .join('\n') : 'No feature data available'}

## AI Analysis
${aiAnalysis?.analysis || 'No AI analysis available'}
`

    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sut-analysis-${currentAnalysis.name.replace(/[^a-z0-9]/gi, '-')}-${new Date().toISOString().split('T')[0]}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-gray-500" />
      case 'crawling':
        return <Play className="w-5 h-5 text-blue-500 animate-pulse" />
      case 'analyzing':
        return <AlertCircle className="w-5 h-5 text-yellow-500 animate-pulse" />
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const renderOverview = () => {
    // Helper function to safely get crawl data properties
    const getCrawlData = () => {
      return currentAnalysis.crawl_data && typeof currentAnalysis.crawl_data === 'object' && currentAnalysis.crawl_data !== null 
        ? currentAnalysis.crawl_data as any 
        : null
    }

    const crawlData = getCrawlData()

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Pages</span>
            </div>
            <p className="text-2xl font-bold text-blue-900 mt-1">
              {crawlData?.summary?.totalPages || 0}
            </p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <MousePointer className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">Forms</span>
            </div>
            <p className="text-2xl font-bold text-green-900 mt-1">
              {crawlData?.summary?.totalForms || 0}
            </p>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Link className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">Links</span>
            </div>
            <p className="text-2xl font-bold text-purple-900 mt-1">
              {crawlData?.summary?.totalLinks || 0}
            </p>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <ImageIcon className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-900">Images</span>
            </div>
            <p className="text-2xl font-bold text-orange-900 mt-1">
              {crawlData?.summary?.totalImages || 0}
            </p>
          </div>
        </div>

        {/* Features Detected */}
        {crawlData?.features && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Features Detected</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(crawlData.features).map(([feature, present]) => (
                <div key={feature} className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${present ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-sm text-gray-700 capitalize">
                    {feature.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Site Map */}
        {crawlData?.sitemap && Array.isArray(crawlData.sitemap) && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Site Map</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {crawlData.sitemap.map((url: string, index: number) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <ExternalLink className="w-3 h-3 text-gray-400" />
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 truncate"
                  >
                    {url}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderCrawlData = () => (
    <div className="space-y-4">
      {currentAnalysis.crawl_data ? (
        <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm overflow-x-auto">
          {JSON.stringify(currentAnalysis.crawl_data, null, 2)}
        </pre>
      ) : (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No crawl data available</p>
        </div>
      )}
    </div>
  )

  const renderAiAnalysis = () => (
    <div className="space-y-4">
      {loadingAiAnalysis ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Generating AI analysis...</p>
        </div>
      ) : aiAnalysis ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {(() => {
                // Handle different data structures for AI analysis
                if (typeof aiAnalysis === 'string') {
                  return aiAnalysis
                }
                if (aiAnalysis && typeof aiAnalysis === 'object') {
                  if (aiAnalysis.analysis && typeof aiAnalysis.analysis === 'string') {
                    return aiAnalysis.analysis
                  }
                  // If it's an object but no analysis string, convert to JSON
                  return JSON.stringify(aiAnalysis, null, 2)
                }
                return 'No analysis content available'
              })()}
            </div>
          </div>
          {aiAnalysis && typeof aiAnalysis === 'object' && aiAnalysis.generated_at && (
            <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
              Generated: {new Date(aiAnalysis.generated_at).toLocaleString()}
            </div>
          )}
        </div>
      ) : currentAnalysis.status === 'completed' ? (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">AI analysis not available</p>
          <button
            onClick={triggerAiAnalysis}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Generate AI Analysis
          </button>
        </div>
      ) : (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">AI analysis will be available after crawling completes</p>
        </div>
      )}
    </div>
  )

  const renderScreenshots = () => {
    const screenshots = Array.isArray(currentAnalysis.screenshots) ? currentAnalysis.screenshots : []
    
    return (
      <div className="space-y-4">
        {screenshots.length > 0 ? (
          <>
            {/* Bulk Actions */}
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                {screenshots.length} screenshot{screenshots.length !== 1 ? 's' : ''}
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={downloadAllScreenshots}
                  className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>Download All</span>
                </button>
                <button
                  onClick={deleteAllScreenshots}
                  className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete All</span>
                </button>
              </div>
            </div>

            {/* Screenshots Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {screenshots.map((screenshot: any, index: number) => {
                const storagePath = screenshot.storage_path
                const isLoading = loadingUrls[storagePath]
                const imageUrl = screenshotUrls[storagePath]
                const isDeleting = deletingScreenshots[storagePath]

                return (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 relative">
                    {isDeleting && (
                      <div className="absolute inset-0 bg-red-100 bg-opacity-75 flex items-center justify-center rounded-lg z-10">
                        <div className="text-red-600 text-sm font-medium">Deleting...</div>
                      </div>
                    )}
                    
                    <h4 className="font-medium text-gray-900 mb-2 truncate" title={screenshot.page_title}>
                      {screenshot.page_title || `Page ${index + 1}`}
                    </h4>
                    
                    <div 
                      className="bg-gray-100 border border-gray-200 rounded aspect-video flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => imageUrl && setSelectedImage(imageUrl)}
                    >
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      ) : imageUrl ? (
                        <img 
                          src={imageUrl} 
                          alt={screenshot.page_title || 'Screenshot'} 
                          className="w-full h-full object-cover rounded"
                          onError={() => {
                            console.error('Failed to load image:', imageUrl)
                          }}
                        />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-2 truncate" title={screenshot.page_url}>
                      {screenshot.page_url}
                    </p>

                    {/* Action buttons */}
                    <div className="flex justify-end space-x-1 mt-2">
                      <button
                        onClick={() => downloadScreenshot(storagePath, screenshot.page_title)}
                        disabled={!imageUrl}
                        className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Download"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => deleteScreenshot(storagePath)}
                        disabled={isDeleting}
                        className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Image Modal */}
            {selectedImage && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
                onClick={() => setSelectedImage(null)}
              >
                <div className="relative max-w-4xl max-h-full">
                  <img 
                    src={selectedImage} 
                    alt="Screenshot" 
                    className="max-w-full max-h-full object-contain"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No screenshots available</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{currentAnalysis.name}</h1>
            <p className="text-gray-600">{currentAnalysis.target_url}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {getStatusIcon(currentAnalysis.status || 'pending')}
            <span className="text-sm font-medium capitalize">
              {currentAnalysis.status || 'pending'}
            </span>
          </div>
          
          <button
            onClick={refreshStatus}
            disabled={refreshingStatus}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh Status"
          >
            <Clock className={`w-4 h-4 ${refreshingStatus ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={downloadReport}
            className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            <span>Download Report</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {currentAnalysis.error_message && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-900">Analysis Failed</h3>
              <p className="text-sm text-red-700 mt-1">{currentAnalysis.error_message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: Eye },
            { id: 'crawl-data', name: 'Crawl Data', icon: FileText },
            { id: 'ai-analysis', name: 'AI Analysis', icon: AlertCircle },
            { id: 'screenshots', name: 'Screenshots', icon: ImageIcon },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'crawl-data' && renderCrawlData()}
        {activeTab === 'ai-analysis' && renderAiAnalysis()}
        {activeTab === 'screenshots' && renderScreenshots()}
      </div>
    </div>
  )
}