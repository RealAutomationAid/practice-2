import { chromium, Browser, Page } from 'playwright'

export interface CrawlSettings {
  maxPages?: number
  waitForNetworkIdle?: boolean
  screenshotQuality?: number
  includePDF?: boolean
  maxDepth?: number
  timeout?: number
  userAgent?: string
  viewport?: { width: number; height: number }
}

export interface LoginCredentials {
  username: string
  password: string
  loginUrl?: string
  usernameSelector?: string
  passwordSelector?: string
  submitSelector?: string
}

export interface PageData {
  url: string
  title: string
  screenshot?: string
  content?: string
  forms?: FormData[]
  links?: LinkData[]
  images?: ImageData[]
  headings?: HeadingData[]
  buttons?: ButtonData[]
  inputs?: InputData[]
  errors?: string[]
  metadata?: Record<string, any>
}

export interface FormData {
  id?: string
  name?: string
  action?: string
  method?: string
  fields: FormFieldData[]
}

export interface FormFieldData {
  name?: string
  type?: string
  required?: boolean
  placeholder?: string
  value?: string
  label?: string
  options?: string[]
}

export interface LinkData {
  href: string
  text: string
  internal: boolean
}

export interface ImageData {
  src: string
  alt?: string
  width?: number
  height?: number
}

export interface HeadingData {
  level: number
  text: string
}

export interface ButtonData {
  text: string
  type?: string
  id?: string
  className?: string
}

export interface InputData {
  type: string
  name?: string
  id?: string
  placeholder?: string
  required?: boolean
  value?: string
}

export interface CrawlResult {
  pages: PageData[]
  sitemap: string[]
  summary: {
    totalPages: number
    totalForms: number
    totalLinks: number
    totalImages: number
    errors: string[]
  }
  navigation: {
    mainNavigation: LinkData[]
    footerNavigation: LinkData[]
    breadcrumbs: LinkData[]
  }
  features: {
    hasLogin: boolean
    hasSearch: boolean
    hasCart: boolean
    hasUserProfile: boolean
    hasComments: boolean
    hasRatings: boolean
  }
}

export class PlaywrightMCPService {
  private browser: Browser | null = null
  private page: Page | null = null
  private visitedUrls: Set<string> = new Set()
  private crawlSettings: CrawlSettings = {
    maxPages: 10,
    waitForNetworkIdle: true,
    screenshotQuality: 80,
    maxDepth: 3,
    timeout: 30000,
    viewport: { width: 1920, height: 1080 }
  }

  constructor(settings?: CrawlSettings) {
    if (settings) {
      this.crawlSettings = { ...this.crawlSettings, ...settings }
    }
  }

  async initialize(): Promise<void> {
    try {
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })
      
      // Set user agent via context if provided
      if (this.crawlSettings.userAgent) {
        const context = await this.browser.newContext({ userAgent: this.crawlSettings.userAgent })
        this.page = await context.newPage()
      } else {
        this.page = await this.browser.newPage()
      }
      
      // Set viewport
      await this.page.setViewportSize(this.crawlSettings.viewport!)
      
      // Set timeout
      this.page.setDefaultTimeout(this.crawlSettings.timeout!)
      
      console.log('Playwright MCP Service initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Playwright MCP Service:', error instanceof Error ? error.message : String(error))
      throw error
    }
  }

  async crawlSite(
    targetUrl: string, 
    credentials?: LoginCredentials
  ): Promise<CrawlResult> {
    if (!this.page) {
      throw new Error('Service not initialized. Call initialize() first.')
    }

    const results: CrawlResult = {
      pages: [],
      sitemap: [],
      summary: {
        totalPages: 0,
        totalForms: 0,
        totalLinks: 0,
        totalImages: 0,
        errors: []
      },
      navigation: {
        mainNavigation: [],
        footerNavigation: [],
        breadcrumbs: []
      },
      features: {
        hasLogin: false,
        hasSearch: false,
        hasCart: false,
        hasUserProfile: false,
        hasComments: false,
        hasRatings: false
      }
    }

    try {
      // Navigate to target URL
      await this.navigateToUrl(targetUrl)
      
      // Handle consent popups
      await this.handleConsentPopups()
      
      // Login if credentials provided
      if (credentials) {
        await this.performLogin(credentials)
      }
      
      // Start crawling
      await this.crawlRecursively(targetUrl, 0, results)
      
      // Analyze features
      await this.analyzeFeatures(results)
      
      // Generate summary
      this.generateSummary(results)
      
      return results
      
    } catch (error) {
      console.error('Crawling failed:', error)
      results.summary.errors.push(
        `Crawling failed: ${error instanceof Error ? error.message : String(error)}`
      )
      throw error
    }
  }

  private async navigateToUrl(url: string): Promise<void> {
    if (!this.page) return
    
    try {
      await this.page.goto(url, { 
        waitUntil: this.crawlSettings.waitForNetworkIdle ? 'networkidle' : 'load' 
      })
      console.log(`Navigated to: ${url}`)
    } catch (error) {
      console.error(`Failed to navigate to ${url}:`, error instanceof Error ? error.message : String(error))
      throw error
    }
  }

  private async handleConsentPopups(): Promise<void> {
    if (!this.page) return
    
    try {
      // Common consent popup selectors
      const consentSelectors = [
        'button[id*="accept"]',
        'button[class*="accept"]',
        'button:has-text("Accept")',
        'button:has-text("Accept All")',
        'button:has-text("I Accept")',
        'button:has-text("Agree")',
        'button:has-text("OK")',
        '.cookie-consent button',
        '#cookie-consent button',
        '[data-testid*="accept"]'
      ]
      
      for (const selector of consentSelectors) {
        try {
          const button = await this.page.locator(selector).first()
          if (await button.isVisible({ timeout: 2000 })) {
            await button.click()
            console.log(`Clicked consent button: ${selector}`)
            await this.page.waitForTimeout(1000)
            break
          }
        } catch (error) {
          // Continue to next selector
        }
      }
    } catch (error) {
      console.log('No consent popups found or failed to handle:', error instanceof Error ? error.message : String(error))
    }
  }

  private async performLogin(credentials: LoginCredentials): Promise<void> {
    if (!this.page) return
    
    try {
      // Navigate to login URL if different from current
      if (credentials.loginUrl) {
        await this.navigateToUrl(credentials.loginUrl)
      }
      
      // Default selectors
      const usernameSelector = credentials.usernameSelector || 'input[type="email"], input[name="username"], input[name="email"], input[id*="username"], input[id*="email"]'
      const passwordSelector = credentials.passwordSelector || 'input[type="password"], input[name="password"], input[id*="password"]'
      const submitSelector = credentials.submitSelector || 'button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Sign In")'
      
      // Fill username
      await this.page.locator(usernameSelector).first().fill(credentials.username)
      console.log('Filled username field')
      
      // Fill password
      await this.page.locator(passwordSelector).first().fill(credentials.password)
      console.log('Filled password field')
      
      // Submit form
      await this.page.locator(submitSelector).first().click()
      console.log('Clicked submit button')
      
      // Wait for navigation or success indicator
      await this.page.waitForTimeout(3000)
      
      // Check if login was successful (look for common success indicators)
      const currentUrl = this.page.url()
      const hasLogoutButton = await this.page.locator('button:has-text("Logout"), a:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Sign Out")').count() > 0
      
      if (hasLogoutButton || currentUrl.includes('dashboard') || currentUrl.includes('profile')) {
        console.log('Login appears successful')
      } else {
        console.warn('Login success uncertain - continuing with crawl')
      }
      
    } catch (error) {
      console.error('Login failed:', error instanceof Error ? error.message : String(error))
      throw new Error(`Login failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  private async crawlRecursively(
    url: string, 
    depth: number, 
    results: CrawlResult
  ): Promise<void> {
    if (!this.page) return
    
    // Check limits
    if (depth > this.crawlSettings.maxDepth! || 
        results.pages.length >= this.crawlSettings.maxPages! ||
        this.visitedUrls.has(url)) {
      return
    }
    
    try {
      this.visitedUrls.add(url)
      
      // Navigate to page
      await this.navigateToUrl(url)
      
      // Extract page data
      const pageData = await this.extractPageData(url)
      results.pages.push(pageData)
      results.sitemap.push(url)
      
      // Extract navigation
      if (depth === 0) {
        results.navigation = await this.extractNavigation()
      }
      
      // Find internal links to crawl
      const internalLinks = pageData.links?.filter(link => 
        link.internal && !this.visitedUrls.has(link.href)
      ) || []
      
      // Crawl internal links
      for (const link of internalLinks.slice(0, 5)) { // Limit to 5 links per page
        await this.crawlRecursively(link.href, depth + 1, results)
      }
      
    } catch (error) {
      console.error(`Failed to crawl ${url}:`, error instanceof Error ? error.message : String(error))
      results.summary.errors.push(`Failed to crawl ${url}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  private async extractPageData(url: string): Promise<PageData> {
    if (!this.page) throw new Error('Page not initialized')
    
    const pageData: PageData = {
      url,
      title: await this.page.title(),
      errors: []
    }
    
    try {
      // Take screenshot with error handling
      try {
        const screenshotOptions: any = {
          type: 'jpeg',
          quality: this.crawlSettings.screenshotQuality
        }
        
        const screenshot = await this.page.screenshot(screenshotOptions)
        pageData.screenshot = screenshot.toString('base64')
      } catch (screenshotError) {
        console.error(`Screenshot failed for ${url}:`, screenshotError instanceof Error ? screenshotError.message : String(screenshotError))
        pageData.errors?.push(`Screenshot capture failed: ${screenshotError instanceof Error ? screenshotError.message : String(screenshotError)}`)
        // Continue without screenshot
      }
      
      // Extract content
      pageData.content = await this.page.textContent('body') || ''
      
      // Extract forms
      pageData.forms = await this.extractForms()
      
      // Extract links
      pageData.links = await this.extractLinks()
      
      // Extract images
      pageData.images = await this.extractImages()
      
      // Extract headings
      pageData.headings = await this.extractHeadings()
      
      // Extract buttons
      pageData.buttons = await this.extractButtons()
      
      // Extract inputs
      pageData.inputs = await this.extractInputs()
      
      // Extract metadata
      pageData.metadata = await this.extractMetadata()
      
    } catch (error) {
      pageData.errors?.push(`Data extraction failed: ${error instanceof Error ? error.message : String(error)}`)
    }
    
    return pageData
  }

  private async extractForms(): Promise<FormData[]> {
    if (!this.page) return []
    
    return await this.page.evaluate(() => {
      const forms = Array.from(document.querySelectorAll('form'))
      return forms.map(form => {
        const fields = Array.from(form.querySelectorAll('input, select, textarea')).map(field => {
          const element = field as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
          return {
            name: element.name,
            type: element.type || 'text',
            required: element.required,
            placeholder: 'placeholder' in element ? (element as HTMLInputElement | HTMLTextAreaElement).placeholder : undefined,
            value: element.value,
            label: element.labels?.[0]?.textContent || '',
            options: element.tagName === 'SELECT' ? 
              Array.from((element as HTMLSelectElement).options).map(opt => opt.text) : 
              undefined
          }
        })
        
        return {
          id: form.id,
          name: form.name,
          action: form.action,
          method: form.method,
          fields
        }
      })
    })
  }

  private async extractLinks(): Promise<LinkData[]> {
    if (!this.page) return []
    
    return await this.page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]'))
      return links.map(link => {
        const href = link.getAttribute('href') || ''
        const text = link.textContent?.trim() || ''
        const isInternal = href.startsWith('/') || href.includes(window.location.hostname)
        
        return {
          href: isInternal && href.startsWith('/') ? window.location.origin + href : href,
          text,
          internal: isInternal
        }
      })
    })
  }

  private async extractImages(): Promise<ImageData[]> {
    if (!this.page) return []
    
    return await this.page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'))
      return images.map(img => ({
        src: img.src,
        alt: img.alt,
        width: img.width,
        height: img.height
      }))
    })
  }

  private async extractHeadings(): Promise<HeadingData[]> {
    if (!this.page) return []
    
    return await this.page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      return headings.map(heading => ({
        level: parseInt(heading.tagName.charAt(1)),
        text: heading.textContent?.trim() || ''
      }))
    })
  }

  private async extractButtons(): Promise<ButtonData[]> {
    if (!this.page) return []
    
    return await this.page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"]'))
      return buttons.map(button => ({
        text: button.textContent?.trim() || (button as HTMLInputElement).value || '',
        type: (button as HTMLInputElement).type,
        id: button.id,
        className: button.className
      }))
    })
  }

  private async extractInputs(): Promise<InputData[]> {
    if (!this.page) return []
    
    return await this.page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, select, textarea'))
      return inputs.map(input => {
        const element = input as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        return {
          type: element.type || element.tagName.toLowerCase(),
          name: element.name,
          id: element.id,
          placeholder: 'placeholder' in element ? (element as HTMLInputElement | HTMLTextAreaElement).placeholder : undefined,
          required: element.required,
          value: element.value
        }
      })
    })
  }

  private async extractMetadata(): Promise<Record<string, any>> {
    if (!this.page) return {}
    
    return await this.page.evaluate(() => {
      // @ts-nocheck
      const meta: Record<string, any> = {}
      
      // Meta tags
      const metaTags = Array.from(document.querySelectorAll('meta'))
      metaTags.forEach(tag => {
        const name: string | null = tag.getAttribute('name') || tag.getAttribute('property')
        const content = tag.getAttribute('content')
        if (name && content) {
          (meta as any)[name] = content
        }
      })
      
      // Title
      meta['title'] = document.title
      
      // URL
      meta['url'] = window.location.href
      
      // Technology indicators
      meta['hasJQuery'] = typeof (window as any)['jQuery'] !== 'undefined'
      meta['hasReact'] = document.querySelector('[data-reactroot]') !== null
      meta['hasVue'] = document.querySelector('[data-v-]') !== null
      meta['hasAngular'] = document.querySelector('[ng-app], [data-ng-app]') !== null
      
      return meta
    })
  }

  private async extractNavigation(): Promise<any> {
    if (!this.page) return { mainNavigation: [], footerNavigation: [], breadcrumbs: [] }
    
    return await this.page.evaluate(() => {
      // Main navigation
      const mainNavSelectors = ['nav', '.navigation', '.nav', '.menu', 'header nav', '.header nav']
      let mainNavigation: any[] = []
      
      for (const selector of mainNavSelectors) {
        const navElement = document.querySelector(selector)
        if (navElement) {
          const links = Array.from(navElement.querySelectorAll('a'))
          mainNavigation = links.map(link => ({
            href: link.href,
            text: link.textContent?.trim() || '',
            internal: link.href.includes(window.location.hostname)
          }))
          break
        }
      }
      
      // Footer navigation
      const footerNavSelectors = ['footer nav', '.footer nav', 'footer .nav', '.footer .menu']
      let footerNavigation: any[] = []
      
      for (const selector of footerNavSelectors) {
        const navElement = document.querySelector(selector)
        if (navElement) {
          const links = Array.from(navElement.querySelectorAll('a'))
          footerNavigation = links.map(link => ({
            href: link.href,
            text: link.textContent?.trim() || '',
            internal: link.href.includes(window.location.hostname)
          }))
          break
        }
      }
      
      // Breadcrumbs
      const breadcrumbSelectors = ['.breadcrumb', '.breadcrumbs', '[aria-label="breadcrumb"]', '.crumb']
      let breadcrumbs: any[] = []
      
      for (const selector of breadcrumbSelectors) {
        const breadcrumbElement = document.querySelector(selector)
        if (breadcrumbElement) {
          const links = Array.from(breadcrumbElement.querySelectorAll('a'))
          breadcrumbs = links.map(link => ({
            href: link.href,
            text: link.textContent?.trim() || '',
            internal: link.href.includes(window.location.hostname)
          }))
          break
        }
      }
      
      return {
        mainNavigation,
        footerNavigation,
        breadcrumbs
      }
    })
  }

  private async analyzeFeatures(results: CrawlResult): Promise<void> {
    if (!this.page) return
    
    // Analyze all pages for features
    for (const page of results.pages) {
      const content = page.content?.toLowerCase() || ''
      const forms = page.forms || []
      const links = page.links || []
      const buttons = page.buttons || []
      
      // Check for login
      if (forms.some(form => form.fields.some(field => field.type === 'password')) ||
          content.includes('login') || content.includes('sign in')) {
        results.features.hasLogin = true
      }
      
      // Check for search
      if (forms.some(form => form.fields.some(field => field.name?.includes('search'))) ||
          content.includes('search')) {
        results.features.hasSearch = true
      }
      
      // Check for cart
      if (content.includes('cart') || content.includes('shopping') ||
          links.some(link => link.href.includes('cart'))) {
        results.features.hasCart = true
      }
      
      // Check for user profile
      if (content.includes('profile') || content.includes('account') ||
          links.some(link => link.href.includes('profile'))) {
        results.features.hasUserProfile = true
      }
      
      // Check for comments
      if (content.includes('comment') || content.includes('review') ||
          forms.some(form => form.fields.some(field => field.name?.includes('comment')))) {
        results.features.hasComments = true
      }
      
      // Check for ratings
      if (content.includes('rating') || content.includes('star') ||
          content.includes('review')) {
        results.features.hasRatings = true
      }
    }
  }

  private generateSummary(results: CrawlResult): void {
    results.summary.totalPages = results.pages.length
    results.summary.totalForms = results.pages.reduce((sum, page) => sum + (page.forms?.length || 0), 0)
    results.summary.totalLinks = results.pages.reduce((sum, page) => sum + (page.links?.length || 0), 0)
    results.summary.totalImages = results.pages.reduce((sum, page) => sum + (page.images?.length || 0), 0)
  }

  async close(): Promise<void> {
    if (this.page) {
      await this.page.close()
    }
    if (this.browser) {
      await this.browser.close()
    }
    this.visitedUrls.clear()
    console.log('Playwright MCP Service closed')
  }
}

export default PlaywrightMCPService