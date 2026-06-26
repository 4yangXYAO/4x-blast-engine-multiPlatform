import type { Browser, BrowserContext, Page } from 'playwright'
import { IAdapter, RateLimitStatus } from '../../../IAdapter'
import { getActiveProxy, toPlaywrightProxy } from '../../../../proxy'

export interface InstagramPlaywrightOptions {
  logger?: (message: string) => void
  headless?: boolean
}

/**
 * InstagramPlaywrightAdapter
 *
 * Automates Instagram actions via a real browser using Playwright + stealth.
 * Uses the same pattern as FacebookPlaywrightAdapter: inject cookies, navigate,
 * interact with DOM elements. This bypasses Instagram's anti-automation checks
 * that block direct API calls (error 4415001, login_required, etc.).
 */
export class InstagramPlaywrightAdapter implements IAdapter {
  private browser: Browser | null = null
  private context: BrowserContext | null = null
  private _page: Page | null = null
  private rawCookieString: string
  private opts: InstagramPlaywrightOptions
  private _connected = false

  get page(): Page | null {
    return this._page
  }

  constructor(cookieJsonString: string, opts?: InstagramPlaywrightOptions) {
    this.rawCookieString = cookieJsonString
    this.opts = opts ?? {}
  }

  private log(message: string) {
    this.opts?.logger?.(`[IG-ROBUST] ${message}`)
  }

  async connect(): Promise<void> {
    if (this._connected) return
    try {
      const { chromium: chr } = await import('playwright-extra')
      const stealthPlugin = (await import('puppeteer-extra-plugin-stealth')).default
      const browserWithStealth = chr.use(stealthPlugin())
      const activeProxy = getActiveProxy()
      this.browser = await browserWithStealth.launch({
        headless: this.opts.headless ?? true,
        proxy: activeProxy ? toPlaywrightProxy(activeProxy) : undefined,
      })
      this.context = await this.browser.newContext()
      this._page = await this.context.newPage()

      interface CookieData {
        domain?: string
        sameSite?: string
        name?: string
        value?: string
        path?: string
        secure?: boolean
        httpOnly?: boolean
        expirationDate?: number
      }

      let parsedCookies: CookieData[]
      try {
        parsedCookies = JSON.parse(this.rawCookieString)
      } catch {
        parsedCookies = this.rawCookieString.split(';').map(pair => {
          const eq = pair.indexOf('=')
          if (eq < 0) return null
          return {
            name: pair.slice(0, eq).trim(),
            value: pair.slice(eq + 1).trim(),
            domain: '.instagram.com',
            path: '/',
          } as CookieData
        }).filter((c): c is CookieData => c !== null)
      }

      const cookies = parsedCookies.map(c => ({
        name: c.name!,
        value: decodeURIComponent(c.value ?? ''),
        domain: c.domain ?? '.instagram.com',
        path: c.path ?? '/',
        secure: !!c.secure,
        httpOnly: !!c.httpOnly,
        sameSite: (c.sameSite === 'strict' ? 'Strict' : c.sameSite === 'no_restriction' ? 'None' : 'Lax') as 'Strict' | 'None' | 'Lax',
      }))

      await this.context.addCookies(cookies)
      await this.context.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      })
      this.log('Browser connected with stealth and cookies injected.')
      this._connected = true
    } catch (error) {
      this.log(`Error during connect: ${error}`)
      throw error
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.browser?.close()
      this.log('Browser disconnected successfully.')
    } catch (error) {
      this.log(`Error during disconnect: ${error}`)
      throw error
    } finally {
      this.browser = null
      this.context = null
      this._page = null
      this._connected = false
    }
  }

  async getRateLimitStatus(): Promise<RateLimitStatus | null> {
    return { limit: 200, remaining: 199, reset: Date.now() + 3600000 }
  }

  /**
   * Post a comment on an Instagram media item by navigating to the post page
   * and interacting with the comment input.
   */
  async commentOnPost(postUrlOrId: string, commentText: string): Promise<{ success: boolean; error?: string }> {
    if (!this._page) throw new Error('Browser not connected')
    const urls = buildInstagramPostUrls(postUrlOrId)
    let lastError = 'Comment failed'

    for (const url of urls) {
      try {
        const ok = await this.tryCommentOnUrl(url, commentText)
        if (ok.success) return ok
        lastError = ok.error ?? lastError
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e)
      }
    }
    return { success: false, error: lastError }
  }

  private async tryCommentOnUrl(
    postUrl: string,
    commentText: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this._page) throw new Error('Browser not connected')
    try {
      await this._page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 })
      await this._page.waitForTimeout(3500)
      await this._page.mouse.wheel(0, 400)
      await this._page.waitForTimeout(1000)

      const selectors = [
        'textarea[aria-label*="Add a comment"]',
        'textarea[aria-label*="Tambahkan komentar"]',
        'textarea[placeholder*="Add a comment"]',
        'textarea[placeholder*="Tambahkan komentar"]',
        'form textarea',
        'div[role="textbox"][contenteditable="true"]',
      ]

      let input = null
      for (const sel of selectors) {
        const loc = this._page.locator(sel).first()
        if (await loc.count()) {
          input = loc
          break
        }
      }

      if (!input) {
        const commentIcon = this._page.locator('svg[aria-label="Comment"], svg[aria-label="Komentar"]').first()
        if (await commentIcon.count()) {
          await commentIcon.click()
          await this._page.waitForTimeout(1500)
          input = this._page.locator('form textarea, div[role="textbox"][contenteditable="true"]').first()
        }
      }

      if (!input || (await input.count()) === 0) {
        return { success: false, error: 'Kotak komentar tidak ditemukan' }
      }

      await input.waitFor({ state: 'visible', timeout: 25_000 })
      await input.click()
      await input.fill(commentText)
      await this._page.waitForTimeout(400)
      await input.press('Enter')
      await this._page.waitForTimeout(2000)

      this.log(`Comment posted on ${postUrl}`)
      return { success: true }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      return { success: false, error: msg }
    }
  }

  /**
   * Send a direct message by navigating to the DM inbox and composing a message.
   */
  async sendMessage(userId: string, message: string): Promise<{ success: boolean; error?: string; code?: string }> {
    if (!this._page) throw new Error('Browser not connected')
    try {
      // Navigate to DM thread with the user
      await this._page.goto(`https://www.instagram.com/direct/t/${userId}/`, { waitUntil: 'domcontentloaded' })
      await this._page.waitForTimeout(3000)

      // Find the message input
      const textBox = await this._page.waitForSelector('textarea[placeholder="Message…"], textarea[aria-label="Message"], div[role="textbox"][contenteditable="true"]', { timeout: 5000 }).catch(() => null)

      if (!textBox) {
        return { success: false, error: 'Message input not found - may need to start a new conversation', code: 'NO_INPUT' }
      }

      await textBox.fill(message)
      await this._page.waitForTimeout(500)
      await textBox.press('Enter')
      await this._page.waitForTimeout(2000)

      this.log(`DM sent to ${userId}`)
      return { success: true }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      this.log(`Error sending DM: ${msg}`)
      return { success: false, error: msg }
    }
  }

  async replyToMessage(to: string, message: string): Promise<{ success: boolean; error?: string; code?: string }> {
    // replyToMessage for Instagram is the same as commentOnPost
    const result = await this.commentOnPost(to, message)
    return { ...result, code: result.success ? undefined : 'IG_PLAYWRIGHT_REPLY_ERROR' }
  }
}

export default InstagramPlaywrightAdapter

function buildInstagramPostUrls(postUrlOrId: string): string[] {
  if (postUrlOrId.startsWith('http')) return [postUrlOrId]
  const id = postUrlOrId.trim()
  if (/^[A-Za-z0-9_-]{5,12}$/.test(id)) {
    return [`https://www.instagram.com/p/${id}/`, `https://www.instagram.com/reel/${id}/`]
  }
  return [`https://www.instagram.com/p/${id}/`]
}