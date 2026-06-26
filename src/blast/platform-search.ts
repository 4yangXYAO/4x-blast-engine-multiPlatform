/**
 * Platform Search — API-first target discovery using each platform's internal search/feed.
 * Playwright HTML scraping is only a fallback (see discovery-service).
 */

import { createHttpClient, parseCookies } from '../utils/http-client'

export interface DiscoveryTarget {
  id: string
  action: 'comment' | 'chat'
  score: number
  context?: string
}

export type DiscoveryMode = 'feed' | 'keyword' | 'hashtag'

export interface PlatformSearchOptions {
  mode: DiscoveryMode
  query?: string
  limit?: number
  strategy?: 'AD_ENGAGEMENT' | 'BUSINESS_PROSPECT' | 'INTENT_DETECTION'
}

const IG_APP_ID = '936619743392459'
const THREADS_APP_ID = '238260118697367'

const IG_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const MOBILE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 303.0.0.11.109'

function isValidIgShortcode(id: string): boolean {
  if (!id || id.length < 6 || id.length > 15) return false
  if (!/^[A-Za-z0-9_-]+$/.test(id)) return false
  if (/^[a-z]{2}_[A-Z]{2}$/.test(id)) return false
  if (/^\d+$/.test(id)) return false
  return true
}

function scoreFromCaption(
  caption: string | undefined,
  strategy: PlatformSearchOptions['strategy'],
  base: number
): number {
  let score = base
  if (!caption) return score
  if (strategy === 'INTENT_DETECTION') {
    const buying = [/harga/i, /berapa/i, /beli/i, /jasa/i, /butuh/i, /rekomendasi/i]
    const inquiry = [/apa/i, /bagaimana/i, /gimana/i, /info/i, /dm/i]
    for (const kw of buying) if (kw.test(caption)) score += 25
    for (const kw of inquiry) if (kw.test(caption)) score += 10
    if (caption.includes('?')) score += 8
  }
  return Math.min(100, score)
}

function createIgClient(cookie: string) {
  const cookieHeader = parseCookies(cookie)
  const csrf = cookieHeader.match(/csrftoken=([^;]+)/)?.[1] ?? ''
  return {
    client: createHttpClient({
      baseURL: 'https://www.instagram.com',
      timeout: 25_000,
      headers: {
        Cookie: cookieHeader,
        'X-CSRFToken': csrf,
        'X-IG-App-ID': IG_APP_ID,
        'X-ASBD-ID': '129477',
        'X-Instagram-AJAX': '1',
        'X-Requested-With': 'XMLHttpRequest',
        Accept: '*/*',
        'User-Agent': IG_UA,
      },
    }),
    csrf,
  }
}

function createThreadsClient(cookie: string) {
  const cookieHeader = parseCookies(cookie)
  const csrf = cookieHeader.match(/csrftoken=([^;]+)/)?.[1] ?? ''
  return createHttpClient({
    baseURL: 'https://www.threads.net',
    timeout: 25_000,
    headers: {
      Cookie: cookieHeader,
      'X-CSRFToken': csrf,
      'X-IG-App-ID': THREADS_APP_ID,
      Accept: '*/*',
      'User-Agent': MOBILE_UA,
    },
  })
}

function extractIgMedia(
  media: Record<string, unknown> | undefined,
  label: string,
  strategy: PlatformSearchOptions['strategy'],
  seen: Set<string>
): DiscoveryTarget | null {
  if (!media) return null
  const code = media.code ? String(media.code) : ''
  const pk = media.pk ? String(media.pk) : ''
  const id = isValidIgShortcode(code) ? code : /^\d+$/.test(pk) ? pk : ''
  if (!id || seen.has(id)) return null
  seen.add(id)
  const caption =
    typeof (media as { caption?: { text?: string } }).caption?.text === 'string'
      ? (media as { caption: { text: string } }).caption.text
      : ''
  return {
    id,
    action: 'comment',
    score: scoreFromCaption(caption, strategy, 65),
    context: label,
  }
}

function extractThreadsPost(
  post: Record<string, unknown> | undefined,
  label: string,
  strategy: PlatformSearchOptions['strategy'],
  seen: Set<string>
): DiscoveryTarget | null {
  if (!post) return null
  const pk = post.pk ? String(post.pk) : ''
  const code = post.code ? String(post.code) : ''
  const id = pk || code
  if (!id || id.length < 6 || seen.has(id)) return null
  seen.add(id)
  const text =
    typeof (post as { caption?: { text?: string } }).caption?.text === 'string'
      ? (post as { caption: { text: string } }).caption.text
      : typeof post.text_post_app_info === 'object' &&
          post.text_post_app_info &&
          typeof (post.text_post_app_info as { post_preview_caption?: string }).post_preview_caption ===
            'string'
        ? (post.text_post_app_info as { post_preview_caption: string }).post_preview_caption
        : ''
  return {
    id,
    action: 'comment',
    score: scoreFromCaption(text, strategy, 62),
    context: label,
  }
}

async function searchInstagramFeed(
  cookie: string,
  limit: number,
  strategy: PlatformSearchOptions['strategy']
): Promise<DiscoveryTarget[]> {
  const { client } = createIgClient(cookie)
  const targets: DiscoveryTarget[] = []
  const seen = new Set<string>()
  let maxId = ''

  for (let page = 0; page < 8 && targets.length < limit; page++) {
    const params = new URLSearchParams({
      max_id: maxId,
      rank_token: '',
      seen_posts: '',
      reason: page === 0 ? 'cold_start_fetch' : 'pagination',
    })
    const res = await client.post('/api/v1/feed/timeline/', params.toString())
    if (res?.data?.status === 'fail') {
      console.warn('[platform-search] IG feed API:', res.data?.message)
      break
    }
    const items: unknown[] = res?.data?.feed_items ?? []
    if (!items.length) break

    for (const raw of items) {
      const item = raw as Record<string, unknown>
      const media =
        (item.media_or_ad as Record<string, unknown>) ??
        (item.explore_story as { media?: Record<string, unknown> })?.media ??
        (item.media as Record<string, unknown>)
      const t = extractIgMedia(media, 'Beranda (API)', strategy, seen)
      if (t) targets.push(t)
      if (targets.length >= limit) break
    }

    const next = res?.data?.next_max_id
    if (!next || next === maxId) break
    maxId = String(next)
  }

  return targets.slice(0, limit)
}

async function searchInstagramHashtag(
  cookie: string,
  tag: string,
  limit: number,
  strategy: PlatformSearchOptions['strategy']
): Promise<DiscoveryTarget[]> {
  const { client } = createIgClient(cookie)
  const targets: DiscoveryTarget[] = []
  const seen = new Set<string>()
  let maxId = ''
  const cleanTag = tag.replace(/^#/, '').trim()

  for (let page = 0; page < 10 && targets.length < limit; page++) {
    const res = await client.get(`/api/v1/tags/${encodeURIComponent(cleanTag)}/sections/`, {
      params: { tab: 'recent', max_id: maxId, page: page + 1 },
    })
    if (res?.data?.status === 'fail') break

    const sections: unknown[] = res?.data?.sections ?? []
    for (const raw of sections) {
      const section = raw as { layout_content?: { medias?: unknown[] } }
      for (const m of section?.layout_content?.medias ?? []) {
        const media = (m as { media?: Record<string, unknown> })?.media
        const t = extractIgMedia(media, `Hashtag #${cleanTag} (API)`, strategy, seen)
        if (t) targets.push(t)
        if (targets.length >= limit) break
      }
    }

    const next = res?.data?.next_max_id ?? res?.data?.next_page
    if (!next || next === maxId) break
    maxId = String(next)
    if (!sections.length) break
  }

  return targets.slice(0, limit)
}

async function searchInstagramKeyword(
  cookie: string,
  query: string,
  limit: number,
  strategy: PlatformSearchOptions['strategy']
): Promise<DiscoveryTarget[]> {
  const { client } = createIgClient(cookie)
  const targets: DiscoveryTarget[] = []
  const seen = new Set<string>()

  const res = await client.get('/api/v1/fbsearch/web/top_serp/', {
    params: { query },
  })
  if (res?.data?.status !== 'fail') {
    const grid = res?.data?.media_grid
    const sections: unknown[] = grid?.sections ?? res?.data?.sections ?? []
    for (const raw of sections) {
      const section = raw as { layout_content?: { medias?: unknown[] } }
      for (const m of section?.layout_content?.medias ?? []) {
        const media = (m as { media?: Record<string, unknown> })?.media
        const t = extractIgMedia(media, `Search: ${query} (API)`, strategy, seen)
        if (t) targets.push(t)
        if (targets.length >= limit) return targets
      }
    }
  }

  if (targets.length < limit) {
    const top = await client.get('/api/v1/web/search/topsearch/', {
      params: { query, context: 'blended' },
    })
    const hashtags: unknown[] = top?.data?.hashtags ?? []
    for (const h of hashtags) {
      const name = (h as { hashtag?: { name?: string } })?.hashtag?.name
      if (!name) continue
      const tagTargets = await searchInstagramHashtag(
        cookie,
        name,
        limit - targets.length,
        strategy
      )
      for (const t of tagTargets) {
        if (!seen.has(t.id)) {
          seen.add(t.id)
          targets.push(t)
        }
        if (targets.length >= limit) break
      }
      if (targets.length >= limit) break
    }
  }

  return targets.slice(0, limit)
}

async function searchThreadsFeed(
  cookie: string,
  limit: number,
  strategy: PlatformSearchOptions['strategy']
): Promise<DiscoveryTarget[]> {
  const client = createThreadsClient(cookie)
  const targets: DiscoveryTarget[] = []
  const seen = new Set<string>()
  let maxId = ''

  for (let page = 0; page < 8 && targets.length < limit; page++) {
    const res = await client.get('/api/v1/feed/text_post_app_timeline/', {
      params: {
        pagination_source: 'text_post_feed_threads',
        max_id: maxId,
      },
    })
    if (res?.data?.status === 'fail') {
      console.warn('[platform-search] Threads feed API:', res.data?.message)
      break
    }

    const items: unknown[] = res?.data?.items ?? res?.data?.feed_items ?? []
    for (const raw of items) {
      const item = raw as { thread?: { thread_items?: unknown[] }; post?: Record<string, unknown> }
      const threadItems = item.thread?.thread_items ?? []
      if (threadItems.length) {
        for (const ti of threadItems) {
          const post = (ti as { post?: Record<string, unknown> })?.post
          const t = extractThreadsPost(post, 'Beranda Threads (API)', strategy, seen)
          if (t) targets.push(t)
          if (targets.length >= limit) break
        }
      } else if (item.post) {
        const t = extractThreadsPost(item.post, 'Beranda Threads (API)', strategy, seen)
        if (t) targets.push(t)
      }
      if (targets.length >= limit) break
    }

    const next = res?.data?.next_max_id ?? res?.data?.paging_info?.max_id
    if (!next || next === maxId) break
    maxId = String(next)
    if (!items.length) break
  }

  return targets.slice(0, limit)
}

async function searchThreadsKeyword(
  cookie: string,
  query: string,
  limit: number,
  strategy: PlatformSearchOptions['strategy']
): Promise<DiscoveryTarget[]> {
  const client = createThreadsClient(cookie)
  const targets: DiscoveryTarget[] = []
  const seen = new Set<string>()

  const endpoints = [
    '/api/v1/text_post_app_search/',
    '/api/v1/text_feed/text_post_app_search_profile/',
  ]

  for (const path of endpoints) {
    if (targets.length >= limit) break
    try {
      const res = await client.get(path, { params: { query, count: Math.min(limit, 50) } })
      if (res?.data?.status === 'fail') continue

      const items: unknown[] = res?.data?.items ?? res?.data?.results ?? []
      for (const raw of items) {
        const item = raw as { thread?: { thread_items?: unknown[] }; post?: Record<string, unknown> }
        const threadItems = item.thread?.thread_items ?? []
        if (threadItems.length) {
          for (const ti of threadItems) {
            const post = (ti as { post?: Record<string, unknown> })?.post
            const t = extractThreadsPost(post, `Search: ${query} (API)`, strategy, seen)
            if (t) targets.push(t)
          }
        } else if (item.post) {
          const t = extractThreadsPost(item.post, `Search: ${query} (API)`, strategy, seen)
          if (t) targets.push(t)
        }
        if (targets.length >= limit) break
      }
    } catch (e: unknown) {
      console.warn(`[platform-search] Threads search ${path}:`, e instanceof Error ? e.message : e)
    }
  }

  if (targets.length < limit) {
    const fallback = await client.get('/api/v1/text_feed/recommended_search/', {
      params: { query },
    })
    for (const raw of fallback?.data?.items ?? []) {
      const item = raw as { thread?: { thread_items?: unknown[] } }
      for (const ti of item.thread?.thread_items ?? []) {
        const post = (ti as { post?: Record<string, unknown> })?.post
        const t = extractThreadsPost(post, `Search: ${query} (API)`, strategy, seen)
        if (t) targets.push(t)
        if (targets.length >= limit) break
      }
    }
  }

  return targets.slice(0, limit)
}

export async function searchInstagram(
  cookie: string,
  opts: PlatformSearchOptions
): Promise<DiscoveryTarget[]> {
  if (!cookie?.trim()) return []
  const limit = Math.min(Math.max(opts.limit ?? 30, 1), 100)
  const strategy = opts.strategy ?? 'AD_ENGAGEMENT'

  try {
    if (opts.mode === 'feed') {
      return await searchInstagramFeed(cookie, limit, strategy)
    }
    const q = (opts.query ?? '').trim()
    if (!q) return []
    if (opts.mode === 'hashtag' || q.startsWith('#')) {
      return await searchInstagramHashtag(cookie, q, limit, strategy)
    }
    return await searchInstagramKeyword(cookie, q, limit, strategy)
  } catch (e: unknown) {
    console.warn('[platform-search] Instagram API failed:', e instanceof Error ? e.message : e)
    return []
  }
}

export async function searchThreads(
  cookie: string,
  opts: PlatformSearchOptions
): Promise<DiscoveryTarget[]> {
  if (!cookie?.trim()) return []
  const limit = Math.min(Math.max(opts.limit ?? 30, 1), 100)
  const strategy = opts.strategy ?? 'AD_ENGAGEMENT'

  try {
    if (opts.mode === 'feed') {
      return await searchThreadsFeed(cookie, limit, strategy)
    }
    const q = (opts.query ?? '').trim()
    if (!q) return []
    return await searchThreadsKeyword(cookie, q.replace(/^#/, ''), limit, strategy)
  } catch (e: unknown) {
    console.warn('[platform-search] Threads API failed:', e instanceof Error ? e.message : e)
    return []
  }
}

export function resolveDiscoveryMode(
  keyword: string | undefined,
  mode?: DiscoveryMode
): DiscoveryMode {
  if (mode) return mode
  const q = keyword?.trim() ?? ''
  if (!q) return 'feed'
  if (q.startsWith('#')) return 'hashtag'
  return 'keyword'
}

export function mergeDiscoveryTargets(
  primary: DiscoveryTarget[],
  supplemental: DiscoveryTarget[],
  limit: number
): DiscoveryTarget[] {
  const seen = new Set<string>()
  const out: DiscoveryTarget[] = []
  for (const t of [...primary, ...supplemental]) {
    const key = `${t.action}:${t.id}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(t)
    if (out.length >= limit) break
  }
  return out
}
