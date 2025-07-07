import { NextRequest, NextResponse } from 'next/server'
import fetch from 'node-fetch'
import { JSDOM } from 'jsdom'
import { promises as dns } from 'dns'
import * as tls from 'tls'
import * as crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { AuditFormData, AuditReport } from '@/types/audit'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const data: AuditFormData = await request.json()
    
    if (!data.url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const reportId = crypto.randomUUID()
    const startTime = Date.now()

    // Initialize report
    const report: AuditReport = {
      id: reportId,
      url: data.url,
      timestamp: new Date(),
      status: { code: 0, message: '' },
      performance: { ttfb: 0, contentSize: 0, assetsCount: 0 },
      security: {
        score: 0,
        headers: {},
        ssl: { valid: false, expiry: new Date(), issuer: '' }
      },
      seo: {
        title: '',
        description: '',
        headings: { h1: 0, h2: 0, h3: 0 },
        altTags: 0,
        totalImages: 0
      },
      server: { ip: '', location: '', reverseDns: '', techStack: [] }
    }

    // Configure fetch with auth if provided
    const fetchOptions: any = {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WebsiteAuditBot/1.0)'
      }
    }

    if (data.username && data.password) {
      const auth = Buffer.from(`${data.username}:${data.password}`).toString('base64')
      fetchOptions.headers = {
        ...fetchOptions.headers,
        'Authorization': `Basic ${auth}`
      }
    }

    // 1. Basic HTTP Request and Performance Check
    let response
    let responseText = ''
    try {
      console.log('Starting audit for:', data.url)
      
      // Add timeout to the main request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)
      
      const requestStart = Date.now()
      response = await fetch(data.url, { 
        ...fetchOptions,
        signal: controller.signal 
      })
      const requestEnd = Date.now()
      clearTimeout(timeoutId)
      
      console.log('HTTP response status:', response.status)
      
      responseText = await response.text()
      
      report.performance.ttfb = requestEnd - requestStart
      report.status.code = response.status
      report.status.message = response.statusText
      
      const contentLength = response.headers.get('content-length')
      report.performance.contentSize = contentLength ? parseInt(contentLength) : responseText.length || 0
      
      console.log('TTFB:', report.performance.ttfb, 'Content size:', report.performance.contentSize)
    } catch (error: any) {
      console.error('HTTP request failed:', error.message)
      report.status.code = 0
      report.status.message = error.message || 'Request failed'
      
      return NextResponse.json({ 
        error: `Failed to connect to website: ${error.message}` 
      }, { status: 400 })
    }

    // 2. Security Headers Check
    if (data.checks.security && response) {
      const securityHeaders = {
        'Strict-Transport-Security': !!response.headers.get('strict-transport-security'),
        'Content-Security-Policy': !!response.headers.get('content-security-policy'),
        'X-Frame-Options': !!response.headers.get('x-frame-options'),
        'X-Content-Type-Options': !!response.headers.get('x-content-type-options'),
        'Referrer-Policy': !!response.headers.get('referrer-policy')
      }
      
      report.security.headers = securityHeaders
      
      // SSL Check
      try {
        const urlObj = new URL(data.url)
        if (urlObj.protocol === 'https:') {
          const options = {
            host: urlObj.hostname,
            port: 443,
            rejectUnauthorized: false
          }
          
          const socket = tls.connect(options, () => {
            const cert = socket.getPeerCertificate()
            if (cert) {
              report.security.ssl.valid = !socket.authorized ? false : true
              report.security.ssl.expiry = new Date(cert.valid_to)
              report.security.ssl.issuer = cert.issuer?.CN || 'Unknown'
            }
            socket.end()
          })
          
          socket.on('error', () => {
            report.security.ssl.valid = false
          })
          
          // Wait a bit for SSL check
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } catch (error) {
        report.security.ssl.valid = false
      }
    }

    // 3. SEO and Accessibility Check
    if ((data.checks.seo || data.checks.accessibility) && responseText) {
      try {
        const dom = new JSDOM(responseText)
        const document = dom.window.document
        
        // SEO checks
        const titleElement = document.querySelector('title')
        report.seo.title = titleElement?.textContent || ''
        
        const descriptionElement = document.querySelector('meta[name="description"]')
        report.seo.description = descriptionElement?.getAttribute('content') || ''
        
        // Heading structure
        report.seo.headings.h1 = document.querySelectorAll('h1').length
        report.seo.headings.h2 = document.querySelectorAll('h2').length
        report.seo.headings.h3 = document.querySelectorAll('h3').length
        
        // Image alt tags
        const images = document.querySelectorAll('img')
        report.seo.totalImages = images.length
        let altTagCount = 0
        images.forEach(img => {
          if (img.getAttribute('alt')) {
            altTagCount++
          }
        })
        report.seo.altTags = altTagCount
        
        // Asset count
        const scripts = document.querySelectorAll('script[src]').length
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"]').length
        const totalImages = document.querySelectorAll('img[src]').length
        report.performance.assetsCount = scripts + stylesheets + totalImages
        
      } catch (error) {
        console.error('HTML parsing error:', error)
      }
    }

    // 4. Server Information
    if (data.checks.serverInfo) {
      try {
        const urlObj = new URL(data.url)
        
        // DNS lookup
        const addresses = await dns.resolve4(urlObj.hostname)
        if (addresses.length > 0) {
          report.server.ip = addresses[0]
          
          // Reverse DNS
          try {
            const hostnames = await dns.reverse(addresses[0])
            report.server.reverseDns = hostnames[0] || 'N/A'
          } catch {
            report.server.reverseDns = 'N/A'
          }
          
          // Geolocation (using a free IP API)
          try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 5000)
            
            const geoResponse = await fetch(`http://ip-api.com/json/${addresses[0]}`, { 
              signal: controller.signal 
            })
            clearTimeout(timeoutId)
            
            const geoData = await geoResponse.json() as any
            if (geoData.status === 'success') {
              report.server.location = `${geoData.city}, ${geoData.country}`
            } else {
              report.server.location = 'Unknown'
            }
          } catch {
            report.server.location = 'Unknown'
          }
        }
        
        // Basic tech stack detection from headers and HTML
        const techStack: string[] = []
        
        if (response) {
          const server = response.headers.get('server')
          const xPoweredBy = response.headers.get('x-powered-by')
          
          if (server) {
            if (server.toLowerCase().includes('nginx')) techStack.push('Nginx')
            if (server.toLowerCase().includes('apache')) techStack.push('Apache')
            if (server.toLowerCase().includes('cloudflare')) techStack.push('Cloudflare')
          }
          
          if (xPoweredBy) {
            if (xPoweredBy.toLowerCase().includes('express')) techStack.push('Express.js')
            if (xPoweredBy.toLowerCase().includes('php')) techStack.push('PHP')
            if (xPoweredBy.toLowerCase().includes('asp.net')) techStack.push('ASP.NET')
          }
          
          // Detect from HTML content
          if (responseText) {
            const htmlContent = responseText.toLowerCase()
            if (htmlContent.includes('react')) techStack.push('React')
            if (htmlContent.includes('vue')) techStack.push('Vue.js')
            if (htmlContent.includes('angular')) techStack.push('Angular')
            if (htmlContent.includes('next')) techStack.push('Next.js')
            if (htmlContent.includes('wordpress')) techStack.push('WordPress')
            if (htmlContent.includes('jquery')) techStack.push('jQuery')
          }
        }
        
        report.server.techStack = Array.from(new Set(techStack)) // Remove duplicates
        
      } catch (error) {
        console.error('Server info error:', error)
        report.server.ip = 'Unknown'
        report.server.location = 'Unknown'
        report.server.reverseDns = 'Unknown'
      }
    }

    // 5. Check for robots.txt and sitemap.xml
    if (data.checks.seo) {
      try {
        const urlObj = new URL(data.url)
        const baseUrl = `${urlObj.protocol}//${urlObj.host}`
        
        // Check robots.txt
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000)
          await fetch(`${baseUrl}/robots.txt`, { method: 'HEAD', signal: controller.signal })
          clearTimeout(timeoutId)
          // If successful, robots.txt exists
        } catch {
          // robots.txt not found
        }
        
        // Check sitemap.xml
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000)
          await fetch(`${baseUrl}/sitemap.xml`, { method: 'HEAD', signal: controller.signal })
          clearTimeout(timeoutId)
          // If successful, sitemap.xml exists
        } catch {
          // sitemap.xml not found
        }
      } catch (error) {
        console.error('Robots/sitemap check error:', error)
      }
    }

    // Save audit report to database
    try {
      // Get user identifier from headers or create one
      const userAgent = request.headers.get('user-agent') || 'unknown'
      const clientIP = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown'
      const userIdentifier = `ip-${clientIP.split(',')[0]}-${userAgent.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '')}`
      
      const { data: savedReport, error: saveError } = await supabase
        .from('winners_audit_reports')
        .insert({
          url: report.url,
          user_identifier: userIdentifier,
          report_data: report,
          ai_analysis: null,
          test_project_id: null,
        })
        .select('id')
        .single()

      if (!saveError && savedReport) {
        console.log('Audit report saved with ID:', savedReport.id)
        // Add the database ID to the response
        report.id = savedReport.id
      } else {
        console.error('Failed to save audit report:', saveError)
        // Don't fail the entire request if database save fails
      }
    } catch (dbError) {
      console.error('Database save error:', dbError)
      // Continue anyway - the audit data is still valid
    }

    return NextResponse.json(report)
    
  } catch (error) {
    console.error('Audit error:', error)
    return NextResponse.json(
      { error: 'Internal server error during audit' },
      { status: 500 }
    )
  }
}