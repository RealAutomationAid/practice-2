import { TestExecutionModule } from '@/components/test-execution/test-execution-module'
import { Navbar } from '@/components/ui/navbar'

export default function TestExecutionPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <Navbar currentPath="/test-execution" />

      <TestExecutionModule />
    </div>
  )
} 