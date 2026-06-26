import { chromium } from 'playwright-extra'
import stealth from 'puppeteer-extra-plugin-stealth'
import type { Browser, Page } from 'playwright'
import {
  assertPlaywrightChromiumInstalled,
  DISCOVERY_NAV_TIMEOUT_MS,
  DISCOVERY_PAGE_WAIT_MS,
} from '../utils/playwright-check'

chromium.use(stealth())

import {
  mergeDiscoveryTargets,
  resolveDiscoveryMode,
  searchInstagram,
  searchThreads,
  type DiscoveryMode,
  type DiscoveryTarget,
} from './platform-search'

export type { DiscoveryMode, DiscoveryTarget }

export interface DiscoveryOptions {
  platform: 'facebook' | 'instagram' | 'twitter' | 'threads'
  keyword: string
  limit?: number
  strategy?: 'AD_ENGAGEMENT' | 'BUSINESS_PROSPECT' | 'INTENT_DETECTION'
  /** feed = beranda, keyword = search platform, hashtag = tag IG */
  mode?: DiscoveryMode
}

export class DiscoveryService {
  private browser: Browser | null = null

  /**
   * Main discovery: platform internal API first, Playwright HTML scrape if kurang.
   */
  async findTargets(cookie: string, options: DiscoveryOptions): Promise<DiscoveryTarget[]> {
    const limit = Math.min(Math.max(options.limit ?? 30, 1), 100)
    const mode = resolveDiscoveryMode(options.keyword, options.mode)
    const strategy = options.strategy ?? 'AD_ENGAGEMENT'

    console.log(
      `[DiscoveryService] ${options.platform} | mode=${mode} | limit=${limit} | q=${options.keyword || '(feed)'}`
    )

    let targets: DiscoveryTarget[] = []

    if (options.platform === 'instagram') {
      targets = await searchInstagram(cookie, {
        mode,
        query: options.keyword,
        limit,
        strategy,
      })
    } else if (options.platform === 'threads') {
      targets = await searchThreads(cookie, {
        mode,
        query: options.keyword,
        limit,
        strategy,
      })
    }

    const needPlaywright =
      options.platform === 'facebook' ||
      options.platform === 'twitter' ||
      (['instagram', 'threads'].includes(options.platform) && targets.length < limit)

    if (needPlaywright) {
      const remaining = limit - targets.length
      const scraped = await this.scrapeWithPlaywright(cookie, { ...options, mode }, remaining)
      targets =
        options.platform === 'facebook' || options.platform === 'twitter'
          ? scraped
          : mergeDiscoveryTargets(targets, scraped, limit)
    }

    if (strategy === 'BUSINESS_PROSPECT') {
      for (const t of targets) {
        if (t.action === 'chat') t.score += 12
      }
    }

    return targets.sort((a, b) => b.score - a.score).slice(0, limit)
  }

  private async scrapeWithPlaywright(
    cookie: string,
    options: DiscoveryOptions & { mode: DiscoveryMode },
    maxNeeded: number
  ): Promise<DiscoveryTarget[]> {
    if (maxNeeded <= 0 && options.platform !== 'facebook' && options.platform !== 'twitter') {
      return []
    }

    assertPlaywrightChromiumInstalled()

    this.browser = await chromium.launch({ headless: true })
    const context = await this.browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      viewport: { width: 1366, height: 768 },
      locale: 'id-ID',
    })

    const cookies = this.formatPlaywrightCookies(cookie, options.platform)
    await context.addCookies(cookies)

    const page = await context.newPage()
    let targets: DiscoveryTarget[] = []

    try {
      console.log(`[DiscoveryService] Playwright supplement for ${options.platform}`)
      const pwOptions = { ...options, limit: maxNeeded || options.limit || 30 }

      switch (options.platform) {
        case 'facebook':
          targets = await this.scrapeFacebook(page, pwOptions)
          break
        case 'instagram':
          targets = await this.scrapeInstagram(page, pwOptions)
          break
        case 'twitter':
          targets = await this.scrapeTwitter(page, pwOptions)
          break
        case 'threads':
          targets = await this.scrapeThreads(page, pwOptions)
          break
      }
    } finally {
      await this.browser.close()
      this.browser = null
    }

    return targets
  }

  private async navigateForDiscovery(page: Page, url: string, scrollRounds = 4): Promise<void> {
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: DISCOVERY_NAV_TIMEOUT_MS,
    })
    await page.waitForTimeout(DISCOVERY_PAGE_WAIT_MS)
    await this.simulateHumanBehavior(page, scrollRounds)
  }

  private extractFacebookTargetsFromHtml(html: string, contextLabel: string): DiscoveryTarget[] {
    const targets: DiscoveryTarget[] = []
    const seen = new Set<string>()

    const add = (id: string, action: 'comment' | 'chat', score: number) => {
      if (!id || seen.has(id)) return
      seen.add(id)
      targets.push({ id, action, score, context: contextLabel })
    }

    for (const match of html.matchAll(/"post_id":"(\d+)"/g)) {
      add(match[1], 'comment', 55)
    }
    for (const match of html.matchAll(/"legacy_story_id":"(\d+)"/g)) {
      add(match[1], 'comment', 50)
    }
    for (const match of html.matchAll(/facebook\.com\/(\d{10,})/g)) {
      add(match[1], 'comment', 45)
    }
    for (const match of html.matchAll(/"id":"(\d{12,})"/g)) {
      add(match[1], 'chat', 30)
    }

    return targets
  }

  private async scrapeFacebook(page: Page, options: DiscoveryOptions): Promise<DiscoveryTarget[]> {
    const targets: DiscoveryTarget[] = []
    const keyword = options.keyword?.trim()
    const mode = resolveDiscoveryMode(options.keyword, options.mode)
    const limit = options.limit || 30
    const scrollRounds = Math.min(12, Math.ceil(limit / 5) + 2)
    const urls: string[] = []

    if (mode !== 'feed' && keyword) {
      urls.push(`https://www.facebook.com/search/posts/?q=${encodeURIComponent(keyword)}`)
    }
    urls.push('https://www.facebook.com/')

    for (const url of urls) {
      try {
        console.log(`[DiscoveryService] Facebook navigate: ${url}`)
        await this.navigateForDiscovery(page, url, scrollRounds)
        const content = await page.content()

        if (content.includes('"login_form"') || /action="https:\/\/www\.facebook\.com\/login/.test(content)) {
          throw new Error('Facebook cookie expired or invalid (login page detected)')
        }

        const label = url.includes('/search/') ? 'Post Search Result' : 'Home Feed'
        targets.push(...this.extractFacebookTargetsFromHtml(content, label))

        const commentCount = targets.filter((t) => t.action === 'comment').length
        if (commentCount >= limit) break
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        console.warn(`[DiscoveryService] Facebook page failed (${url}): ${msg}`)
      }
    }

    if (options.strategy === 'AD_ENGAGEMENT' || options.strategy === 'INTENT_DETECTION') {
      for (const target of targets) {
        if (keyword && target.context?.toLowerCase().includes(keyword.toLowerCase())) {
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

  private async simulateHumanBehavior(page: Page, rounds = 4) {
    for (let i = 0; i < rounds; i++) {
      const scrollHeight = Math.floor(Math.random() * 500) + 400
      await page.mouse.wheel(0, scrollHeight)
      await page.waitForTimeout(Math.floor(Math.random() * 1500) + 1000)
    }
  }

  private isValidIgShortcode(id: string): boolean {
    if (!id || id.length < 6 || id.length > 15) return false
    if (!/^[A-Za-z0-9_-]+$/.test(id)) return false
    if (/^[a-z]{2}_[A-Z]{2}$/.test(id)) return false
    if (/^\d+$/.test(id)) return false
    return true
  }

  private isInstagramLoginPage(html: string): boolean {
    return (
      html.includes('/accounts/login') ||
      html.includes('id="loginForm"') ||
      (html.includes('"login"') && html.includes('password'))
    )
  }

  private isThreadsLoginPage(html: string): boolean {
    return html.includes('/login') && (html.includes('threads.net') || html.includes('Log in'))
  }

  private extractInstagramFromHtml(
    html: string,
    options: DiscoveryOptions,
    label: string
  ): DiscoveryTarget[] {
    const targets: DiscoveryTarget[] = []
    const seen = new Set<string>()
    const strategy = options.strategy ?? 'AD_ENGAGEMENT'
    const wantsDM = strategy === 'BUSINESS_PROSPECT' || strategy === 'INTENT_DETECTION'
    const keyword = options.keyword?.trim().toLowerCase() ?? ''

    const add = (id: string, action: 'comment' | 'chat', baseScore: number, context: string) => {
      const key = `${action}:${id}`
      if (!id || seen.has(key)) return
      seen.add(key)
      let score = baseScore
      if (keyword && context.toLowerCase().includes(keyword)) score += 15
      if (strategy === 'INTENT_DETECTION' && action === 'comment') {
        const idx = html.indexOf(id)
        if (idx > 0) {
          const snippet = html.slice(Math.max(0, idx - 250), idx + 250)
          score += Math.round(this.scoreIntent(snippet) * 0.35)
        }
      }
      targets.push({ id, action, score: Math.min(100, score), context })
    }

    for (const match of html.matchAll(/"shortcode":"([A-Za-z0-9_-]{6,15})"/g)) {
      if (this.isValidIgShortcode(match[1])) add(match[1], 'comment', 62, label)
    }
    for (const match of html.matchAll(/instagram\.com\/p\/([A-Za-z0-9_-]{6,15})/g)) {
      if (this.isValidIgShortcode(match[1])) add(match[1], 'comment', 58, `${label} (URL)`)
    }
    for (const match of html.matchAll(/"code":"([A-Za-z0-9_-]{6,15})"/g)) {
      if (this.isValidIgShortcode(match[1])) add(match[1], 'comment', 55, label)
    }
    if (wantsDM) {
      for (const match of html.matchAll(/"owner":\{"id":"(\d{8,})"/g)) {
        add(match[1], 'chat', 48, 'Post owner (DM)')
      }
      for (const match of html.matchAll(/"user_id":"(\d{8,})"/g)) {
        add(match[1], 'chat', 42, 'IG user (DM)')
      }
    }
    if (strategy === 'BUSINESS_PROSPECT') {
      for (const t of targets) {
        if (t.action === 'chat') t.score += 12
      }
    }
    return targets
  }

  private extractThreadsFromHtml(
    html: string,
    options: DiscoveryOptions,
    label: string
  ): DiscoveryTarget[] {
    const targets: DiscoveryTarget[] = []
    const seen = new Set<string>()
    const strategy = options.strategy ?? 'AD_ENGAGEMENT'
    const keyword = options.keyword?.trim().toLowerCase() ?? ''

    const add = (id: string, action: 'comment' | 'chat', baseScore: number, context: string) => {
      const key = `${action}:${id}`
      if (!id || seen.has(key)) return
      seen.add(key)
      let score = baseScore
      if (keyword && context.toLowerCase().includes(keyword)) score += 15
      if (strategy === 'INTENT_DETECTION') {
        const idx = html.indexOf(id)
        if (idx > 0) {
          const snippet = html.slice(Math.max(0, idx - 250), idx + 250)
          score += Math.round(this.scoreIntent(snippet) * 0.35)
        }
      }
      targets.push({ id, action, score: Math.min(100, score), context })
    }

    for (const match of html.matchAll(/"post_id":"(\d{10,})"/g)) {
      add(match[1], 'comment', 58, label)
    }
    for (const match of html.matchAll(/"thread_items":\[\{"post":\{"pk":"(\d{10,})"/g)) {
      add(match[1], 'comment', 56, `${label} (thread)`)
    }
    for (const match of html.matchAll(/threads\.net\/@[^/]+\/post\/([A-Za-z0-9_-]+)/g)) {
      add(match[1], 'comment', 54, `${label} (URL)`)
    }
    for (const match of html.matchAll(/"pk":"(\d{10,})"/g)) {
      add(match[1], 'comment', 50, label)
    }
    return targets
  }

  private async scrapeInstagram(page: Page, options: DiscoveryOptions): Promise<DiscoveryTarget[]> {
    const targets: DiscoveryTarget[] = []
    const mode = resolveDiscoveryMode(options.keyword, options.mode)
    const tag = options.keyword?.replace(/^#/, '').trim() ?? ''
    const limit = options.limit || 30
    const urls: string[] = []

    if (mode === 'hashtag' && tag) {
      urls.push(`https://www.instagram.com/explore/tags/${encodeURIComponent(tag)}/`)
    } else if (mode === 'keyword' && tag) {
      urls.push(
        `https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(tag)}`
      )
    }
    if (mode === 'feed' || urls.length === 0) {
      urls.push('https://www.instagram.com/')
    }

    for (const url of urls) {
      try {
        console.log(`[DiscoveryService] Instagram navigate: ${url}`)
        await this.navigateForDiscovery(page, url)
        const content = await page.content()

        if (this.isInstagramLoginPage(content)) {
          throw new Error('Instagram cookie expired or invalid (login page detected)')
        }

        const label = url.includes('/tags/')
          ? `Hashtag #${tag}`
          : url.includes('/search/')
            ? `Search: ${tag}`
            : 'Home Feed'
        targets.push(...this.extractInstagramFromHtml(content, options, label))

        const commentCount = targets.filter((t) => t.action === 'comment').length
        if (commentCount >= (options.limit || 30)) break
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        console.warn(`[DiscoveryService] Instagram page failed (${url}): ${msg}`)
      }
    }

    return targets
  }

  private async scrapeTwitter(page: Page, options: DiscoveryOptions): Promise<DiscoveryTarget[]> {
    const targets: DiscoveryTarget[] = []
    const searchUrl = `https://twitter.com/search?q=${encodeURIComponent(options.keyword)}&f=live`
    await this.navigateForDiscovery(page, searchUrl)

    const content = await page.content()
    const tweetIdRegex = /"tweet_id":"(\d+)"/g
    let match
    while ((match = tweetIdRegex.exec(content)) !== null) {
      if (!targets.some((t) => t.id === match![1])) {
        targets.push({ id: match[1], action: 'comment', score: 50, context: 'Twitter Search Result' })
      }
    }
    return targets
  }

  private async scrapeThreads(page: Page, options: DiscoveryOptions): Promise<DiscoveryTarget[]> {
    const targets: DiscoveryTarget[] = []
    const mode = resolveDiscoveryMode(options.keyword, options.mode)
    const kw = options.keyword?.trim() ?? ''
    const limit = options.limit || 30
    const urls: string[] = []

    if (mode !== 'feed' && kw) {
      urls.push(
        `https://www.threads.net/search?q=${encodeURIComponent(kw)}&serp_type=default`
      )
    }
    urls.push('https://www.threads.net/')

    for (const url of urls) {
      try {
        console.log(`[DiscoveryService] Threads navigate: ${url}`)
        await this.navigateForDiscovery(page, url)
        const content = await page.content()

        if (this.isThreadsLoginPage(content)) {
          throw new Error('Threads cookie expired or invalid (login page detected)')
        }

        const label = url.includes('/search') ? `Search: ${kw}` : 'Home Feed'
        targets.push(...this.extractThreadsFromHtml(content, options, label))

        if (targets.length >= (options.limit || 30)) break
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        console.warn(`[DiscoveryService] Threads page failed (${url}): ${msg}`)
      }
    }

    return targets
  }

  private getCookieDomains(platform: DiscoveryOptions['platform']): string[] {
    switch (platform) {
      case 'instagram':
        return ['.instagram.com']
      case 'threads':
        return ['.threads.net', '.instagram.com']
      case 'twitter':
        return ['.twitter.com', '.x.com']
      default:
        return ['.facebook.com']
    }
  }

  private decodeCookieValue(value: string): string {
    try {
      return decodeURIComponent(value.replace(/^"|"$/g, ''))
    } catch {
      return value.replace(/^"|"$/g, '')
    }
  }

  private formatPlaywrightCookies(cookieStr: string, platform: DiscoveryOptions['platform']) {
    const domains = this.getCookieDomains(platform)

    if (cookieStr.trim().startsWith('[')) {
      try {
        const arr = JSON.parse(cookieStr)
        return arr.map((c: { name: string; value: string; domain?: string }) => ({
          name: c.name,
          value: this.decodeCookieValue(c.value),
          domain: c.domain || domains[0],
          path: '/',
          expires: Math.floor(Date.now() / 1000) + 3600 * 24 * 30,
        }))
      } catch {
        // fall through to semi-colon parse
      }
    }

    const pairs = cookieStr
      .split(';')
      .map((c) => {
        const eq = c.indexOf('=')
        if (eq < 0) return null
        const name = c.slice(0, eq).trim()
        const value = this.decodeCookieValue(c.slice(eq + 1).trim())
        if (!name) return null
        return { name, value }
      })
      .filter((p): p is { name: string; value: string } => p !== null)

    const out: Array<{
      name: string
      value: string
      domain: string
      path: string
      expires: number
    }> = []

    for (const domain of domains) {
      for (const pair of pairs) {
        out.push({
          name: pair.name,
          value: pair.value,
          domain,
          path: '/',
          expires: Math.floor(Date.now() / 1000) + 3600 * 24 * 30,
        })
      }
    }

    return out
  }
}

export const discoveryService = new DiscoveryService()
