import type { Browser, BrowserContext, Page } from 'playwright';
import { IAdapter, RateLimitStatus } from '../../../IAdapter';
import { findFacebookTargets, FacebookFinderResult } from './facebook-finder';
import { getNotifications, FacebookNotification } from './facebook-notif';
import { getActiveProxy, toPlaywrightProxy } from '../../../../proxy';

export interface FacebookAdapterOptions {
    logger?: (message: string) => void;
    headless?: boolean;
}

export class FacebookPlaywrightAdapter implements IAdapter {
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;
    private _page: Page | null = null;
    private rawCookieString: string;
    private opts: FacebookAdapterOptions;
    private _connected = false;

    get page(): Page | null {
        return this._page;
    }

    constructor(cookieJsonString: string, opts?: FacebookAdapterOptions) {
        this.rawCookieString = cookieJsonString;
        this.opts = opts ?? {};
    }

    private log(message: string) {
        this.opts?.logger?.(`[FB-ROBUST] ${message}`);
    }

    async connect() {
        if (this._connected) return
        try {
            const { chromium: chr } = await import('playwright-extra')
            const stealthPlugin = (await import('puppeteer-extra-plugin-stealth')).default
            const browserWithStealth = chr.use(stealthPlugin())
            const activeProxy = getActiveProxy()
            this.browser = await browserWithStealth.launch({
                headless: this.opts.headless ?? true,
                proxy: activeProxy ? toPlaywrightProxy(activeProxy) : undefined,
            });
            this.context = await this.browser.newContext();
            this._page = await this.context.newPage();

            interface CookieData {
                domain: string;
                sameSite?: string;
                name?: string;
                value?: string;
                path?: string;
                secure?: boolean;
                httpOnly?: boolean;
                expirationDate?: number;
                url?: string;
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
                        domain: '.facebook.com',
                        path: '/',
                    } as CookieData
                }).filter((c): c is CookieData => c !== null)
            }

            const cookies = parsedCookies.map(c => ({
                name: c.name!,
                value: c.value!,
                domain: c.domain ?? '.facebook.com',
                path: c.path ?? '/',
                secure: !!c.secure,
                httpOnly: !!c.httpOnly,
                sameSite: (c.sameSite === 'strict' ? 'Strict' : c.sameSite === 'no_restriction' ? 'None' : 'Lax') as 'Strict' | 'None' | 'Lax',
            }));

            await this.context.addCookies(cookies);
            await this.context.setExtraHTTPHeaders({
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
            });
            this.log('Browser connected with stealth and cookies injected.');
            this._connected = true;
        } catch (error) {
            this.log(`Error during connect: ${error}`);
            throw error;
        }
    }

    async disconnect() {
        try {
            await this.browser?.close();
            this.log('Browser disconnected successfully.');
        } catch (error) {
            this.log(`Error during disconnect: ${error}`);
            throw error;
        } finally {
            this.browser = null;
            this.context = null;
            this._page = null;
            this._connected = false;
        }
    }

    async getRateLimitStatus(): Promise<RateLimitStatus | null> {
        return { limit: 1000, remaining: 999, reset: Date.now() + 3600000 };
    }

    async sendMessage(to: string, message: string): Promise<{ success: boolean; error?: string; code?: string }> {
        if (!this._page) throw new Error('Browser not connected');
        try {
            await this._page.goto(`https://www.facebook.com/messages/t/${to}`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
            await this._page.waitForTimeout(2000);
            const selectors = [
                'div[role="textbox"][contenteditable="true"]',
                '[aria-label*="Message"]',
                '[aria-label*="Pesan"]',
                '[placeholder*="Aa"]',
                '[placeholder*="Ketik"]',
            ];
            let textBox = null;
            for (const sel of selectors) {
                const loc = this._page.locator(sel).first();
                if (await loc.count()) {
                    textBox = loc;
                    break;
                }
            }
            if (!textBox) {
                throw new Error('DM text box not found — user ID may be invalid or messaging blocked');
            }
            await textBox.waitFor({ state: 'visible', timeout: 30_000 });
            await textBox.click();
            await textBox.fill(message);
            await this._page.waitForTimeout(300);
            await textBox.press('Enter');

            this.log(`Message sent to ${to}`);
            return { success: true };
        } catch (error) {
            this.log(`Error sending message: ${error}`);
            return { success: false, error: String(error) };
        }
    }

    async searchPosts(query: string, limit?: number): Promise<FacebookFinderResult> {
        return findFacebookTargets(query, this.rawCookieString, limit);
    }

    async commentOnPost(postUrlOrId: string, commentText: string): Promise<boolean> {
        if (!this._page) throw new Error('Browser not connected');
        const urls = this.buildPostUrls(postUrlOrId);
        let lastError: unknown = null;

        for (const url of urls) {
            try {
                const ok = await this.tryCommentOnUrl(url, commentText);
                if (ok) return true;
            } catch (error) {
                lastError = error;
                this.log(`Comment attempt failed for ${url}: ${error}`);
            }
        }

        throw lastError ?? new Error('Comment failed on all URL variants');
    }

    private buildPostUrls(postUrlOrId: string): string[] {
        if (postUrlOrId.startsWith('http')) return [postUrlOrId];
        const id = postUrlOrId.replace(/\D/g, '');
        return [
            `https://www.facebook.com/permalink.php?story_fbid=${id}`,
            `https://www.facebook.com/${id}`,
            `https://m.facebook.com/story.php?story_fbid=${id}`,
        ];
    }

    private async tryCommentOnUrl(url: string, commentText: string): Promise<boolean> {
        if (!this._page) throw new Error('Browser not connected');
        try {
            await this._page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
            await this._page.waitForTimeout(4000);

            await this._page.mouse.wheel(0, 800);
            await this._page.waitForTimeout(1500);

            const selectors = [
                'div[role="textbox"][contenteditable="true"]',
                '[aria-label*="Write a comment"]',
                '[aria-label*="Tulis komentar"]',
                '[aria-label*="Write a comment as"]',
                '[aria-label*="Tulis komentar sebagai"]',
                '[placeholder*="comment"]',
                '[placeholder*="komentar"]',
                '[placeholder*="Comment"]',
                '[placeholder*="Komentar"]',
            ];

            let commentBox = null;
            for (const sel of selectors) {
                const loc = this._page.locator(sel).first();
                if (await loc.count()) {
                    commentBox = loc;
                    break;
                }
            }

            if (!commentBox) {
                const commentBtn = this._page
                    .locator(
                        '[aria-label*="Comment"], [aria-label*="Komentar"], [role="button"]:has-text("Comment"), [role="button"]:has-text("Komentar")'
                    )
                    .first();
                if (await commentBtn.count()) {
                    await commentBtn.click();
                    await this._page.waitForTimeout(2000);
                    commentBox = this._page.locator('div[role="textbox"][contenteditable="true"]').first();
                }
            }

            if (!commentBox || (await commentBox.count()) === 0) {
                throw new Error('Comment box not found — post may not allow comments or layout changed');
            }

            await commentBox.scrollIntoViewIfNeeded();
            await commentBox.waitFor({ state: 'visible', timeout: 30_000 });
            await commentBox.click();
            await commentBox.fill(commentText);
            await this._page.waitForTimeout(500);
            await commentBox.press('Enter');
            await this._page.waitForTimeout(2000);
            this.log('Successfully commented on the post.');
            return true;
        } catch (error) {
            this.log(`Error commenting on post: ${error}`);
            throw error;
        }
    }

    async getNotifications(limit?: number, unreadOnly?: boolean): Promise<FacebookNotification[]> {
        return getNotifications(this.rawCookieString, limit, unreadOnly);
    }

    async checkUnreadDMsAndReply(replyMsg: string): Promise<number> {
        if (!this._page) throw new Error('Browser not connected');
        try {
            const { LeadsRepo } = await import('../../../../repos/leadsRepo');
            const leadsRepo = new LeadsRepo();

            await this._page.goto('https://www.facebook.com/messages/t/', { waitUntil: 'domcontentloaded' });
            const unreadThreads = await this._page.$$('div[aria-label*="Unread"]');

            let replyCount = 0;
            for (const thread of unreadThreads) {
                // Try to extract userId from the thread element or URL
                const threadId = await thread.getAttribute('data-testid') || '';
                
                await thread.click();
                await this._page.waitForTimeout(2000);

                const currentUrl = this._page.url();
                const userIdMatch = currentUrl.match(/\/t\/(\d+)/);
                const userId = userIdMatch ? userIdMatch[1] : threadId;

                const textBox = await this._page.waitForSelector('div[role="textbox"][contenteditable="true"]');
                if (textBox) {
                    await textBox.fill(replyMsg);
                    await textBox.press('Enter');
                    replyCount++;

                    // Record as lead
                    if (userId) {
                        try {
                            leadsRepo.findOrCreate('facebook', userId);
                            this.log(`Recorded lead for user ${userId}`);
                        } catch (leadErr) {
                            this.log(`Failed to record lead: ${leadErr}`);
                        }
                    }

                    await this._page.waitForTimeout(1000);
                }
            }
            this.log(`Replied to ${replyCount} unread threads.`);
            return replyCount;
        } catch (error) {
            this.log(`Error checking/replying to DMs: ${error}`);
            throw error;
        }
    }
}