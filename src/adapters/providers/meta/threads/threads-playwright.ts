import type { Browser, BrowserContext, Page } from 'playwright'
import { IAdapter, RateLimitStatus } from '../../../IAdapter'
import { getActiveProxy, toPlaywrightProxy } from '../../../../proxy'

export interface ThreadsPlaywrightOptions {
  logger?: (message: string) => void
  headless?: boolean
}

export class ThreadsPlaywrightAdapter implements IAdapter {
  private browser: Browser | null = null
  private context: BrowserContext | null = null
  private _page: Page | null = null
  private rawCookieString: string
  private opts: ThreadsPlaywrightOptions
  private _connected = false

  get page(): Page | null {
    return this._page
  }

  constructor(cookieJsonString: string, opts?: ThreadsPlaywrightOptions) {
    this.rawCookieString = cookieJsonString
    this.opts = opts ?? {}
  }

  private log(message: string) {
    this.opts?.logger?.(`[THREADS-ROBUST] ${message}`)
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
            domain: '.threads.net',
            path: '/',
          } as CookieData
        }).filter((c): c is CookieData => c !== null)
      }

      // Instagram cookies work on threads.net — add cookies for both domains
      const defaultDomain = '.threads.net'
      const cookies = parsedCookies.map(c => ({
        name: c.name!,
        value: decodeURIComponent(c.value ?? ''),
        domain: c.domain ?? defaultDomain,
        path: c.path ?? '/',
        secure: !!c.secure,
        httpOnly: !!c.httpOnly,
        sameSite: (c.sameSite === 'strict' ? 'Strict' : c.sameSite === 'no_restriction' ? 'None' : 'Lax') as 'Strict' | 'None' | 'Lax',
      }))

      await this.context.addCookies(cookies)
      // Also add cookies for instagram.com since Threads shares the auth
      const igCookies = parsedCookies.map(c => ({
        name: c.name!,
        value: decodeURIComponent(c.value ?? ''),
        domain: '.instagram.com',
        path: c.path ?? '/',
        secure: !!c.secure,
        httpOnly: !!c.httpOnly,
        sameSite: (c.sameSite === 'strict' ? 'Strict' : c.sameSite === 'no_restriction' ? 'None' : 'Lax') as 'Strict' | 'None' | 'Lax',
      }))
      await this.context.addCookies(igCookies)

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

  async sendMessage(_to: string, message: string): Promise<{ success: boolean; error?: string; code?: string }> {
    if (!message.trim()) return { success: false, error: 'Message not provided', code: 'INVALID_INPUT' }
    if (!this._page) throw new Error('Browser not connected')

    try {
      await this._page.goto('https://www.threads.net/', { waitUntil: 'domcontentloaded' })
      await this._page.waitForTimeout(3000)

      const postInput = await this._page.waitForSelector(
        'div[role="textbox"][contenteditable="true"], textarea[aria-label*="thread" i], div[contenteditable="true"][data-lexical-editor="true"]',
        { timeout: 8000 }
      ).catch(() => null)

      if (!postInput) {
        return { success: false, error: 'Thread composer not found — may need login', code: 'NO_COMPOSER' }
      }

      await postInput.fill(message)
      await this._page.waitForTimeout(500)

      const postBtn = await this._page.waitForSelector(
        'div[role="button"]:has-text("Post"), button:has-text("Post"), div[role="button"][aria-label*="post" i]',
        { timeout: 5000 }
      ).catch(() => null)

      if (postBtn) {
        await postBtn.click()
        await this._page.waitForTimeout(3000)
      } else {
        await postInput.press('Enter')
        await this._page.waitForTimeout(3000)
      }

      this.log(`Thread posted: ${message.slice(0, 30)}...`)
      return { success: true }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      this.log(`Error posting thread: ${msg}`)
      return { success: false, error: msg }
    }
  }

  async replyToMessage(threadUrlOrId: string, message: string): Promise<{ success: boolean; error?: string; code?: string }> {
    if (!this._page) throw new Error('Browser not connected')
    const urls = buildThreadsPostUrls(threadUrlOrId)
    let lastError = 'Reply failed'

    for (const url of urls) {
      try {
        const result = await this.tryReplyOnUrl(url, message)
        if (result.success) return { ...result, code: undefined }
        lastError = result.error ?? lastError
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e)
      }
    }
    return { success: false, error: lastError, code: 'THREADS_REPLY_ERROR' }
  }

  private async tryReplyOnUrl(
    threadUrl: string,
    message: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this._page) throw new Error('Browser not connected')
    try {
      await this._page.goto(threadUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 })
      await this._page.waitForTimeout(3500)

      const selectors = [
        'div[role="textbox"][contenteditable="true"]',
        'textarea[aria-label*="reply" i]',
        'textarea[aria-label*="Balas" i]',
        'div[contenteditable="true"][data-lexical-editor="true"]',
      ]

      let replyInput = null
      for (const sel of selectors) {
        const loc = this._page.locator(sel).first()
        if (await loc.count()) {
          replyInput = loc
          break
        }
      }

      if (!replyInput) {
        return { success: false, error: 'Kotak balasan tidak ditemukan' }
      }

      await replyInput.waitFor({ state: 'visible', timeout: 25_000 })
      await replyInput.click()
      await replyInput.fill(message)
      await this._page.waitForTimeout(400)

      const replyBtn = this._page
        .locator(
          'div[role="button"]:has-text("Reply"), div[role="button"]:has-text("Balas"), button:has-text("Reply"), button:has-text("Balas")'
        )
        .first()

      if (await replyBtn.count()) {
        await replyBtn.click()
      } else {
        await replyInput.press('Enter')
      }
      await this._page.waitForTimeout(2500)

      this.log(`Reply posted on ${threadUrl}`)
      return { success: true }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      return { success: false, error: msg }
    }
  }

  async commentOnPost(postUrl: string, commentText: string): Promise<{ success: boolean; error?: string }> {
    const result = await this.replyToMessage(postUrl, commentText)
    return { success: result.success, error: result.error }
  }
}

export default ThreadsPlaywrightAdapter

function buildThreadsPostUrls(postUrlOrId: string): string[] {
  if (postUrlOrId.startsWith('http')) return [postUrlOrId]
  const id = postUrlOrId.trim()
  return [
    `https://www.threads.net/post/${id}`,
    `https://www.threads.net/@_/post/${id}`,
  ]
}