import { TestExecutionModule } from '@/components/test-execution/test-execution-module'
import Link from 'next/link'
import { Bug, Home as HomeIcon, FileText } from 'lucide-react'

export default function TestExecutionPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-2">
                <HomeIcon className="w-6 h-6 text-blue-600" />
                <span className="text-xl font-semibold text-gray-900">QA Testing Suite</span>
              </Link>
              
              <div className="hidden md:flex items-center space-x-6">
                <Link 
                  href="/" 
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>Test Planning</span>
                </Link>
                
                <Link 
                  href="/test-execution" 
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  <Bug className="w-4 h-4" />
                  <span>Test Execution & Bug Reporting</span>
                </Link>
              </div>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <Link 
                href="/" 
                className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>Planning</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <TestExecutionModule />
    </div>
  )
} 