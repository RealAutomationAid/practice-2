import Component from '@/components/ui/testing-chat-interface'
import { Navbar } from '@/components/ui/navbar'
import Link from 'next/link'
import { Target, Zap, CheckCircle } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation Header */}
      <Navbar currentPath="/" />

      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Testing Strategy Interface
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Comprehensive testing solution with AI-powered analysis and automated crawling. 
          Create test plans, execute tests, and analyze your System Under Test automatically.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="max-w-7xl mx-auto px-6 mb-8">
        <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Automated SUT Analysis */}
            <Link 
              href="/sut-analysis" 
              className="group bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:scale-105"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                  <Target className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-medium text-gray-900">Automated SUT Analysis</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Use Playwright to automatically crawl and analyze your web application, generating comprehensive SUT reports with AI insights.
              </p>
              <div className="flex items-center space-x-2 text-xs text-green-700">
                <Zap className="w-3 h-3" />
                <span>AI-Powered • Automated Crawling</span>
              </div>
            </Link>

            {/* Manual Test Planning */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-medium text-gray-900">Manual Test Planning</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Create detailed test plans manually by providing your own SUT analysis and requirements below.
              </p>
              <div className="flex items-center space-x-2 text-xs text-blue-700">
                <CheckCircle className="w-3 h-3" />
                <span>Manual Input • Detailed Control</span>
              </div>
            </div>

            {/* Test Execution */}
            <Link 
              href="/test-execution" 
              className="group bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:scale-105"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="font-medium text-gray-900">Test Execution & Bug Tracking</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Execute tests and track bugs with comprehensive reporting, file uploads, and real-time collaboration.
              </p>
              <div className="flex items-center space-x-2 text-xs text-purple-700">
                <CheckCircle className="w-3 h-3" />
                <span>Bug Tracking • Team Collaboration</span>
              </div>
            </Link>

          </div>
        </div>
      </div>
      
      <div className="mx-6">
        <Component />
      </div>
    </main>
  )
}
