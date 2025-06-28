import Component from '@/components/ui/testing-chat-interface'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          SUT Analysis Interface
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Analyze your System Under Test (SUT) with comprehensive testing strategy. 
          Select your testing types and provide detailed information for thorough analysis.
        </p>
      </div>
      
      <div className="mx-6">
        <Component />
      </div>
    </main>
  )
}
