import { chromium } from 'playwright-extra'
import stealth from 'puppeteer-extra-plugin-stealth'
import type { Browser, Page } from 'playwright'

chromium.use(stealth())

export interface DiscoveryTarget {
  id: string
  action: 'comment' | 'chat'
  score: number
  context?: string
}

export interface DiscoveryOptions {
  platform: 'facebook' | 'instagram' | 'twitter' | 'threads'
  keyword: string
  limit?: number
  strategy?: 'AD_ENGAGEMENT' | 'BUSINESS_PROSPECT' | 'INTENT_DETECTION'
}

export class DiscoveryService {
  private browser: Browser | null = null

  /**
   * Main discovery entry point
   */
  async findTargets(cookie: string, options: DiscoveryOptions): Promise<DiscoveryTarget[]> {
    this.browser = await chromium.launch({ headless: true })
    const context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    })

    // Load cookies into context
    const cookies = this.formatPlaywrightCookies(cookie, options.platform)
    await context.addCookies(cookies)

    const page = await context.newPage()
    let targets: DiscoveryTarget[] = []

    try {
      console.log(`[DiscoveryService] Starting ${options.strategy} on ${options.platform} for: ${options.keyword}`)
      
      switch (options.platform) {
        case 'facebook':
          targets = await this.scrapeFacebook(page, options)
          break
        case 'instagram':
          targets = await this.scrapeInstagram(page, options)
          break
        case 'twitter':
          targets = await this.scrapeTwitter(page, options)
          break
        case 'threads':
          targets = await this.scrapeThreads(page, options)
          break
        default:
          throw new Error(`Platform ${options.platform} not implemented in DiscoveryService yet`)
      }
    } finally {
      await this.browser.close()
    }

    return targets.sort((a, b) => b.score - a.score).slice(0, options.limit || 30)
  }

  private async scrapeFacebook(page: Page, options: DiscoveryOptions): Promise<DiscoveryTarget[]> {
    const targets: DiscoveryTarget[] = []
    
    // Go to search page
    const searchUrl = `https://www.facebook.com/search/posts/?q=${encodeURIComponent(options.keyword)}`
    await page.goto(searchUrl, { waitUntil: 'networkidle' })
    
    // Simulate Human Behavior: Random Scrolling to load more content
    await this.simulateHumanBehavior(page)

    // 1. Extract Post IDs & User IDs via Regex (Fast Path)
    const content = await page.content()
    
    // Match post_id
    const postIdRegex = /"post_id":"(\d+)"/g
    let match
    while ((match = postIdRegex.exec(content)) !== null) {
      if (!targets.some(t => t.id === match![1])) {
        targets.push({ id: match[1], action: 'comment', score: 50, context: 'Post Search Result' })
      }
    }

    // Match numeric IDs from URLs or scripts (User IDs for DM/Chat)
    const userIdRegex = /"id":"(\d+)"/g
    while ((match = userIdRegex.exec(content)) !== null) {
      const id = match[1]
      if (id.length > 10 && !targets.some(t => t.id === id)) {
        targets.push({ id, action: 'chat', score: 30, context: 'User Profile found' })
      }
    }

    // 2. Sniper Strategy: "Kolam" (Commenters Search)
    if (options.strategy === 'AD_ENGAGEMENT' || options.strategy === 'INTENT_DETECTION') {
      console.log('[DiscoveryService] Running Sniper Strategy: Extracting Commenters...')
      
      // Look for comment containers or snippets to run IntentScorer
      // In a real Playwright session, we'd interact with 'View more comments'
      // For now, we scan the available text for intent signals to boost scores
      for (const target of targets) {
        // Boost score if the keyword context is strong
        if (target.context?.toLowerCase().includes(options.keyword.toLowerCase())) {
          target.score += 20
        }
      }
    }

    return targets
  }

  /**
   * Scoring Engine (Rule-Based)
   */
  public scoreIntent(text: string): number {
    let score = 0
    const buyingKeywords = [/harga/i, /berapa/i, /beli/i, /jasa/i, /butuh/i, /rekomendasi/i, /bisa buat/i]
    const inquiryKeywords = [/apa/i, /bagaimana/i, /gimana/i, /info/i, /dm/i]
    const negativeKeywords = [/nipu/i, /gratis/i, /free/i, /hoax/i, /politik/i]

    for (const kw of buyingKeywords) if (kw.test(text)) score += 50
    for (const kw of inquiryKeywords) if (kw.test(text)) score += 20
    if (text.includes('?')) score += 10
    for (const kw of negativeKeywords) if (kw.test(text)) score -= 100

    return Math.max(0, Math.min(100, score))
  }

  private async simulateHumanBehavior(page: Page) {
    // Random scroll
    for (let i = 0; i < 3; i++) {
      const scrollHeight = Math.floor(Math.random() * 500) + 300
      await page.mouse.wheel(0, scrollHeight)
      await page.waitForTimeout(Math.floor(Math.random() * 2000) + 1000)
    }
  }

  private async scrapeInstagram(page: Page, options: DiscoveryOptions): Promise<DiscoveryTarget[]> {
    const targets: DiscoveryTarget[] = []
    const searchUrl = `https://www.instagram.com/explore/tags/${encodeURIComponent(options.keyword)}/`
    await page.goto(searchUrl, { waitUntil: 'networkidle' })
    await this.simulateHumanBehavior(page)

    const content = await page.content()
    // Instagram specific regex for post shortcodes or owner IDs
    const shortcodeRegex = /"shortcode":"([^"]+)"/g
    let match
    while ((match = shortcodeRegex.exec(content)) !== null) {
      if (!targets.some(t => t.id === match![1])) {
        targets.push({ id: match[1], action: 'comment', score: 60, context: 'Instagram Hashtag Post' })
      }
    }
    return targets
  }

  private async scrapeTwitter(page: Page, options: DiscoveryOptions): Promise<DiscoveryTarget[]> {
    const targets: DiscoveryTarget[] = []
    const searchUrl = `https://twitter.com/search?q=${encodeURIComponent(options.keyword)}&f=live`
    await page.goto(searchUrl, { waitUntil: 'networkidle' })
    await this.simulateHumanBehavior(page)

    const content = await page.content()
    // Twitter specific regex for tweet IDs or screen names
    const tweetIdRegex = /"tweet_id":"(\d+)"/g
    let match
    while ((match = tweetIdRegex.exec(content)) !== null) {
      if (!targets.some(t => t.id === match![1])) {
        targets.push({ id: match[1], action: 'comment', score: 50, context: 'Twitter Search Result' })
      }
    }
    return targets
  }

  private async scrapeThreads(page: Page, options: DiscoveryOptions): Promise<DiscoveryTarget[]> {
    const targets: DiscoveryTarget[] = []
    const searchUrl = `https://www.threads.net/search?q=${encodeURIComponent(options.keyword)}`
    await page.goto(searchUrl, { waitUntil: 'networkidle' })
    await this.simulateHumanBehavior(page)

    const content = await page.content()
    // Threads specific regex
    const threadIdRegex = /"post_id":"(\d+)"/g
    let match
    while ((match = threadIdRegex.exec(content)) !== null) {
      if (!targets.some(t => t.id === match![1])) {
        targets.push({ id: match[1], action: 'comment', score: 55, context: 'Threads Search Result' })
      }
    }
    return targets
  }

  private formatPlaywrightCookies(cookieStr: string, platform: string) {
    const domain = platform === 'facebook' ? '.facebook.com' : `.${platform}.com`
    
    // Check if it's JSON
    if (cookieStr.trim().startsWith('[')) {
      try {
        const arr = JSON.parse(cookieStr)
        return arr.map((c: any) => ({
          name: c.name,
          value: c.value,
          domain: c.domain || domain,
          path: '/',
          expires: Math.floor(Date.now() / 1000) + 3600 * 24 * 30, // 30 days
        }))
      } catch (e) {}
    }

    // Parse semi-colon string
    return cookieStr.split(';').map(c => {
      const [name, ...val] = c.trim().split('=')
      return {
        name,
        value: val.join('='),
        domain,
        path: '/',
        expires: Math.floor(Date.now() / 1000) + 3600 * 24 * 30,
      }
    })
  }
}

export const discoveryService = new DiscoveryService()
