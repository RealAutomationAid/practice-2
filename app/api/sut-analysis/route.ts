import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database, SutAnalysisInsert } from '@/lib/supabase-types'
import PlaywrightMCPService, { LoginCredentials, CrawlSettings } from '@/lib/playwright-mcp-service'
import crypto from 'crypto'

// Initialize Supabase client with service role key
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Encryption helpers
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-char-secret-key-here!!' // Should be 32 characters
const algorithm = 'aes-256-cbc'

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipher(algorithm, ENCRYPTION_KEY)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

function decrypt(text: string): string {
  const parts = text.split(':')
  const iv = Buffer.from(parts.shift()!, 'hex')
  const encrypted = parts.join(':')
  const decipher = crypto.createDecipher(algorithm, ENCRYPTION_KEY)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

// GET - Fetch all SUT analyses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status')

    let query = supabase
      .from('winners_sut_analysis')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Supabase query error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Decrypt passwords for display (showing masked)
    const sanitizedData = data?.map(item => ({
      ...item,
      password_encrypted: item.password_encrypted ? '********' : null
    }))

    return NextResponse.json({
      data: sanitizedData || [],
      count: count || 0
    })

  } catch (error) {
    console.error('GET SUT Analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch SUT analyses' },
      { status: 500 }
    )
  }
}

// POST - Create new SUT analysis and start crawling
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      target_url,
      login_url,
      username,
      password,
      crawl_settings = {},
      created_by_email = 'admin@test.com'
    } = body

    if (!name || !target_url) {
      return NextResponse.json(
        { error: 'Name and target URL are required' },
        { status: 400 }
      )
    }

    // Encrypt password if provided
    const password_encrypted = password ? encrypt(password) : null

    // Create initial record
    const sutAnalysis: SutAnalysisInsert = {
      name,
      target_url,
      login_url,
      username,
      password_encrypted,
      crawl_settings,
      status: 'pending',
      created_by_email
    }

    const { data: insertedData, error: insertError } = await supabase
      .from('winners_sut_analysis')
      .insert(sutAnalysis)
      .select()
      .single()

    if (insertError) {
      console.error('Supabase insertion error:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    const analysisId = insertedData.id

    // Start crawling process asynchronously
    setImmediate(async () => {
      await performCrawlAnalysis(analysisId, {
        target_url,
        login_url,
        username,
        password,
        crawl_settings
      })
    })

    return NextResponse.json({
      data: {
        ...insertedData,
        password_encrypted: password_encrypted ? '********' : null
      },
      message: 'SUT analysis created and crawling started'
    })

  } catch (error) {
    console.error('POST SUT Analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to create SUT analysis' },
      { status: 500 }
    )
  }
}

// Perform the actual crawling and analysis
async function performCrawlAnalysis(
  analysisId: string,
  params: {
    target_url: string
    login_url?: string
    username?: string
    password?: string
    crawl_settings?: any
  }
) {
  const crawler = new PlaywrightMCPService(params.crawl_settings as CrawlSettings)

  try {
    // Update status to crawling
    await supabase
      .from('winners_sut_analysis')
      .update({ status: 'crawling', updated_at: new Date().toISOString() })
      .eq('id', analysisId)

    console.log(`Starting crawl for analysis ${analysisId}`)

    // Initialize crawler
    await crawler.initialize()

    // Prepare credentials if provided
    let credentials: LoginCredentials | undefined
    if (params.username && params.password) {
      credentials = {
        username: params.username,
        password: params.password,
        loginUrl: params.login_url
      }
    }

    // Perform crawling
    const crawlResult = await crawler.crawlSite(params.target_url, credentials)

    // Upload screenshots to Supabase storage
    const screenshots: any[] = []
    for (let i = 0; i < crawlResult.pages.length; i++) {
      const page = crawlResult.pages[i]
      if (page.screenshot) {
        try {
          const fileName = `sut-analysis/${analysisId}/page-${i + 1}-${Date.now()}.jpg`
          const { error: uploadError } = await supabase.storage
            .from('winners-test-assets')
            .upload(fileName, Buffer.from(page.screenshot, 'base64'), {
              contentType: 'image/jpeg',
              upsert: false
            })

          if (!uploadError) {
            screenshots.push({
              page_url: page.url,
              storage_path: fileName,
              page_title: page.title
            })
            // Remove base64 data to save space
            page.screenshot = fileName
          } else {
            console.error('Failed to upload screenshot:', uploadError)
          }
        } catch (uploadError) {
          console.error('Screenshot upload error:', uploadError)
        }
      }
    }

    // Update with crawl results
    await supabase
      .from('winners_sut_analysis')
      .update({
        status: 'analyzing',
        crawl_data: crawlResult,
        screenshots,
        updated_at: new Date().toISOString()
      })
      .eq('id', analysisId)

    console.log(`Crawl completed for analysis ${analysisId}, starting AI analysis`)

    // TODO: Trigger AI analysis here
    // For now, just mark as completed
    await supabase
      .from('winners_sut_analysis')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', analysisId)

    console.log(`Analysis ${analysisId} completed successfully`)

  } catch (error) {
    console.error(`Crawl failed for analysis ${analysisId}:`, error)

    // Update with error
    await supabase
      .from('winners_sut_analysis')
      .update({
        status: 'failed',
        error_message: error.message,
        updated_at: new Date().toISOString()
      })
      .eq('id', analysisId)

  } finally {
    await crawler.close()
  }
}

// PUT - Update SUT analysis
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Analysis ID is required' },
        { status: 400 }
      )
    }

    // Encrypt password if being updated
    if (updateData.password) {
      updateData.password_encrypted = encrypt(updateData.password)
      delete updateData.password
    }

    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('winners_sut_analysis')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Supabase update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data: {
        ...data,
        password_encrypted: data.password_encrypted ? '********' : null
      }
    })

  } catch (error) {
    console.error('PUT SUT Analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to update SUT analysis' },
      { status: 500 }
    )
  }
}

// DELETE - Delete SUT analysis
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Analysis ID is required' },
        { status: 400 }
      )
    }

    // Get analysis data to clean up storage
    const { data: analysisData } = await supabase
      .from('winners_sut_analysis')
      .select('screenshots')
      .eq('id', id)
      .single()

    // Delete screenshots from storage
    if (analysisData?.screenshots) {
      const screenshots = analysisData.screenshots as any[]
      for (const screenshot of screenshots) {
        if (screenshot.storage_path) {
          await supabase.storage
            .from('winners-test-assets')
            .remove([screenshot.storage_path])
        }
      }
    }

    // Delete analysis record
    const { error } = await supabase
      .from('winners_sut_analysis')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Supabase deletion error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'SUT analysis deleted successfully' })

  } catch (error) {
    console.error('DELETE SUT Analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to delete SUT analysis' },
      { status: 500 }
    )
  }
}