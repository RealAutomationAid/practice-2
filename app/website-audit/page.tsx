'use client'

import { Navbar } from '@/components/ui/navbar'
import { WebsiteAuditInterface } from '@/components/audit/website-audit-interface'

export default function WebsiteAuditPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar currentPath="/website-audit" />
      <WebsiteAuditInterface />
    </div>
  )
}