export interface AuditFormData {
  url: string
  username?: string
  password?: string
  checks: {
    performance: boolean
    security: boolean
    seo: boolean
    accessibility: boolean
    serverInfo: boolean
  }
}

export interface AIRecommendation {
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  effort: 'low' | 'medium' | 'high'
  impact: 'low' | 'medium' | 'high'
  estimatedTime: string
}

export interface AIAnalysis {
  summary: {
    overallScore: number
    performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F'
    securityGrade: 'A' | 'B' | 'C' | 'D' | 'F'
    seoGrade: 'A' | 'B' | 'C' | 'D' | 'F'
    keyIssues: string[]
    quickWins: string[]
  }
  performance: {
    analysis: string
    recommendations: AIRecommendation[]
  }
  security: {
    analysis: string
    recommendations: AIRecommendation[]
  }
  seo: {
    analysis: string
    recommendations: AIRecommendation[]
  }
  businessImpact: {
    userExperience: string
    searchRanking: string
    conversion: string
    riskAssessment: string
  }
  implementationPlan: {
    phase1: string[]
    phase2: string[]
    phase3: string[]
    totalEstimatedTime: string
  }
}

export interface AuditReport {
  id: string
  url: string
  timestamp: Date | string
  status: {
    code: number
    message: string
  }
  performance: {
    ttfb: number
    contentSize: number
    assetsCount: number
  }
  security: {
    score: number
    headers: Record<string, boolean>
    ssl: {
      valid: boolean
      expiry: Date | string
      issuer: string
    }
  }
  seo: {
    title: string
    description: string
    headings: {
      h1: number
      h2: number
      h3: number
    }
    altTags: number
    totalImages: number
  }
  server: {
    ip: string
    location: string
    reverseDns: string
    techStack: string[]
  }
  aiAnalysis?: AIAnalysis
}

export interface ExportRequest {
  reportId: string
  format: 'html' | 'markdown'
  report?: AuditReport
}