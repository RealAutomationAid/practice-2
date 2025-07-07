'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, Download, Eye, Trash2, Play, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { WinnersSutAnalysis, SutAnalysisStatus } from '@/lib/supabase-types'
import { SutAnalysisForm } from './sut-analysis-form'
import { SutAnalysisDetail } from './sut-analysis-detail'
import toast from 'react-hot-toast'

interface SutAnalysisInterfaceProps {
  className?: string
}

export function SutAnalysisInterface({ className = '' }: SutAnalysisInterfaceProps) {
  const [analyses, setAnalyses] = useState<WinnersSutAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedAnalysis, setSelectedAnalysis] = useState<WinnersSutAnalysis | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<SutAnalysisStatus | 'all'>('all')

  useEffect(() => {
    fetchAnalyses()
    // Set up polling for status updates
    const interval = setInterval(fetchAnalyses, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchAnalyses = async () => {
    try {
      const queryParams = new URLSearchParams()
      if (statusFilter !== 'all') {
        queryParams.append('status', statusFilter)
      }
      
      const response = await fetch(`/api/sut-analysis?${queryParams}`)
      const result = await response.json()
      
      if (response.ok) {
        setAnalyses(result.data || [])
      } else {
        console.error('Failed to fetch analyses:', result.error)
      }
    } catch (error) {
      console.error('Error fetching analyses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAnalysis = async (formData: any) => {
    try {
      const response = await fetch('/api/sut-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const result = await response.json()
      
      if (response.ok) {
        setAnalyses(prev => [result.data, ...prev])
        setShowForm(false)
        toast.success('SUT analysis started! Check status for updates.')
      } else {
        toast.error(result.error || 'Failed to create analysis')
      }
    } catch (error) {
      console.error('Error creating analysis:', error)
      toast.error('Failed to create analysis')
    }
  }

  const handleDeleteAnalysis = async (id: string) => {
    if (!confirm('Are you sure you want to delete this SUT analysis?')) return
    
    try {
      const response = await fetch(`/api/sut-analysis/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setAnalyses(prev => prev.filter(analysis => analysis.id !== id))
        toast.success('Analysis deleted successfully')
      } else {
        const result = await response.json()
        toast.error(result.error || 'Failed to delete analysis')
      }
    } catch (error) {
      console.error('Error deleting analysis:', error)
      toast.error('Failed to delete analysis')
    }
  }

  const handleViewDetails = (analysis: WinnersSutAnalysis) => {
    setSelectedAnalysis(analysis)
    setShowDetail(true)
  }

  const getStatusIcon = (status: SutAnalysisStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-500" />
      case 'crawling':
        return <Play className="w-4 h-4 text-blue-500 animate-pulse" />
      case 'analyzing':
        return <AlertCircle className="w-4 h-4 text-yellow-500 animate-pulse" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: SutAnalysisStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-800'
      case 'crawling':
        return 'bg-blue-100 text-blue-800'
      case 'analyzing':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredAnalyses = analyses.filter(analysis => {
    const matchesSearch = analysis.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         analysis.target_url.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || analysis.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (showDetail && selectedAnalysis) {
    return (
      <SutAnalysisDetail
        analysis={selectedAnalysis}
        onBack={() => {
          setShowDetail(false)
          setSelectedAnalysis(null)
          fetchAnalyses() // Refresh in case of updates
        }}
      />
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SUT Analysis</h1>
          <p className="text-gray-600 mt-2">
            Automated System Under Test analysis using Playwright crawling and AI insights
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Analysis</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex space-x-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name or URL..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as SutAnalysisStatus | 'all')}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="crawling">Crawling</option>
            <option value="analyzing">Analyzing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Analysis List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading analyses...</p>
        </div>
      ) : filteredAnalyses.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No analyses found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || statusFilter !== 'all' 
              ? 'No analyses match your current filters.' 
              : 'Get started by creating your first SUT analysis.'}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Analysis
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAnalyses.map((analysis) => (
            <div
              key={analysis.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{analysis.name}</h3>
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(analysis.status || 'pending')}`}>
                      {getStatusIcon(analysis.status || 'pending')}
                      <span className="capitalize">{analysis.status || 'pending'}</span>
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Target URL:</span> {analysis.target_url}
                  </p>
                  
                  {analysis.username && (
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Username:</span> {analysis.username}
                    </p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>Created: {new Date(analysis.created_at || '').toLocaleDateString()}</span>
                    {analysis.updated_at && analysis.updated_at !== analysis.created_at && (
                      <span>Updated: {new Date(analysis.updated_at).toLocaleDateString()}</span>
                    )}
                  </div>
                  
                  {analysis.error_message && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      <span className="font-medium">Error:</span> {analysis.error_message}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleViewDetails(analysis)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDeleteAnalysis(analysis.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Analysis"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Analysis Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <SutAnalysisForm
              onSubmit={handleCreateAnalysis}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}