'use client'

import { useState, useEffect } from 'react'
import { AuditForm } from './audit-form'
import { AuditResults } from './audit-results'
import { AuditHistory } from './audit-history'
import { Globe, Activity, History } from 'lucide-react'
import { AuditReport } from '@/types/audit'

export function WebsiteAuditInterface() {
  const [currentReport, setCurrentReport] = useState<AuditReport | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [auditHistory, setAuditHistory] = useState<AuditReport[]>([])
  const [activeTab, setActiveTab] = useState<'audit' | 'results' | 'history'>('audit')
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)

  // Load audit history from database
  const loadAuditHistory = async () => {
    setHistoryLoading(true)
    setHistoryError(null)
    
    try {
      const response = await fetch('/api/audit/history?limit=50')
      if (!response.ok) {
        throw new Error('Failed to load audit history')
      }
      
      const data = await response.json()
      setAuditHistory(data.reports || [])
    } catch (error) {
      console.error('Error loading audit history:', error)
      setHistoryError('Failed to load audit history')
    } finally {
      setHistoryLoading(false)
    }
  }

  // Load history on component mount
  useEffect(() => {
    loadAuditHistory()
  }, [])

  const handleAuditComplete = (report: AuditReport) => {
    setCurrentReport(report)
    // Add to local state immediately for better UX
    setAuditHistory(prev => [report, ...prev])
    setActiveTab('results')
  }

  const handleSelectHistoryItem = (report: AuditReport) => {
    setCurrentReport(report)
    setActiveTab('results')
  }

  const handleRefreshHistory = () => {
    loadAuditHistory()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Globe className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Website Audit & Diagnostics</h1>
            <p className="text-gray-600">Comprehensive website health, performance, and security analysis</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('audit')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'audit'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4" />
                <span>Run Audit</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('results')}
              disabled={!currentReport}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'results' && currentReport
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 disabled:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4" />
                <span>Results</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <History className="w-4 h-4" />
                <span>History ({auditHistory.length})</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {activeTab === 'audit' && (
          <AuditForm 
            onAuditComplete={handleAuditComplete}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        )}
        
        {activeTab === 'results' && currentReport && (
          <AuditResults report={currentReport} />
        )}
        
        {activeTab === 'history' && (
          <AuditHistory 
            history={auditHistory}
            onSelectItem={handleSelectHistoryItem}
            isLoading={historyLoading}
            error={historyError}
            onRefresh={handleRefreshHistory}
          />
        )}
      </div>
    </div>
  )
}