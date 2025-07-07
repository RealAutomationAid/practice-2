import Link from 'next/link'
import { Bug, FileText, Globe } from 'lucide-react'
import { Logo } from './logo'

interface NavbarProps {
  currentPath?: string
}

export function Navbar({ currentPath = '/' }: NavbarProps) {
  const isActive = (path: string) => currentPath === path

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-8">
            {/* Logo and Brand */}
            <Link href="/" className="flex items-center space-x-3">
              <Logo width={36} height={36} className="flex-shrink-0" />
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900">Automation Aid</span>
                <span className="text-xs text-gray-500 -mt-1">QA Testing Suite</span>
              </div>
            </Link>
            
            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-6">
              <Link 
                href="/" 
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/') 
                    ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Test Planning</span>
              </Link>
              
              <Link 
                href="/test-execution" 
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/test-execution') 
                    ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Bug className="w-4 h-4" />
                <span>Test Execution & Bug Reporting</span>
              </Link>
              
              <Link 
                href="/website-audit" 
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/website-audit') 
                    ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>Website Audit</span>
              </Link>
            </div>
          </div>
          
          {/* Mobile menu */}
          <div className="md:hidden">
            <Link 
              href={currentPath === '/' ? '/test-execution' : '/'} 
              className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              {currentPath === '/' ? (
                <>
                  <Bug className="w-4 h-4" />
                  <span>Bugs</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>Planning</span>
                </>
              )}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
} 