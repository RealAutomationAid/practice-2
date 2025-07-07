'use client'

import { Navbar } from '@/components/ui/navbar'
import { SutAnalysisInterface } from '@/components/sut/sut-analysis-interface'

export default function SutAnalysisPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <Navbar currentPath="/sut-analysis" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SutAnalysisInterface />
      </div>
    </div>
  )
}