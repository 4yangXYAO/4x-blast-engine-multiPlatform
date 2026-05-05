/**
 * Facebook Finder — cari groups/posts dan ekstrak target IDs.
 *
 * Menggunakan Facebook internal GraphQL search endpoint (cookie-based).
 * Fallback ke data/targets.txt jika search tidak menghasilkan hasil.
 */

import { createHttpClient, parseCookies } from '../../../../utils/http-client'
import { getRandomTargets } from '../../../../utils/randomTargets'

export interface FacebookFinderResult {
  postIds: string[]
  userIds: string[]
}

/**
 * Cari Facebook untuk group posts berdasarkan query.
 * Ekstrak post IDs (untuk comment) dan user IDs (untuk DM).
 *
 * @param query   Kata kunci pencarian
 * @param cookie  Raw browser session cookie string
 * @param limit   Max target yang di-return (default 30)
 */
export async function findFacebookTargets(
  query: string,
  cookie: string,
  limit: number = 30
): Promise<FacebookFinderResult> {
  if (!cookie) {
    return fallbackToFile(limit)
  }

  const cookieHeader = parseCookies(cookie)
  const cUserMatch = cookieHeader.match(/\bc_user=([^;\s]+)/)
  const cUser = cUserMatch?.[1] ?? ''

  try {
    // Step 1: Fetch fb_dtsg dari homepage
    const pageClient = createHttpClient({
      baseURL: 'https://www.facebook.com',
      timeout: 15_000,
      headers: {
        Cookie: cookieHeader,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
      },
    })

    const pageRes = await pageClient.get('/')
    const html = String(pageRes?.data || '')

    if (html.includes('"login_form"')) {
      console.warn('[FacebookFinder] Cookie expired, fallback ke targets.txt')
      return fallbackToFile(limit)
    }

    const dtsgMatch =
      html.match(/"DTSGInitialData"[^}]*"token":"([^"]+)"/) ||
      html.match(/name="fb_dtsg"\s+value="([^"]+)"/) ||
      html.match(/"DTSGInitData"[^}]*"token":"([^"]+)"/)
    const fbDtsg = dtsgMatch?.[1] ?? ''
    const lsdMatch =
      html.match(/"LSD",[^,]*,"token":"([^"]+)"/) ||
      html.match(/name="lsd"\s+value="([^"]+)"/) ||
      html.match(/"lsd":"([^"]+)"/)
    const lsd = lsdMatch?.[1] ?? ''

    if (!fbDtsg) {
      console.warn('[FacebookFinder] Tidak bisa ekstrak fb_dtsg, fallback ke targets.txt')
      return fallbackToFile(limit)
    }

    // Step 2: Search posts via GraphQL (Comet search)
    const gqlClient = createHttpClient({
      baseURL: 'https://www.facebook.com',
      timeout: 20_000,
      headers: {
        Cookie: cookieHeader,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: '*/*',
        Origin: 'https://www.facebook.com',
        Referer: 'https://www.facebook.com/search/posts/',
        'X-FB-LSD': lsd,
      },
    })

    const params = new URLSearchParams({
      av: cUser,
      __user: cUser,
      __a: '1',
      fb_dtsg: fbDtsg,
      lsd: lsd,
      doc_id: '6012268648876713', // SearchCometResultsInitialResultsQuery
      variables: JSON.stringify({
        count: limit,
        query: query,
        search_surface: 'GROUP_SEARCH',
      }),
      fb_api_caller_class: 'RelayModern',
      fb_api_req_friendly_name: 'SearchCometResultsInitialResultsQuery',
    })

    const res = await gqlClient.post('/api/graphql/', params.toString())
    const responseText = String(res?.data ?? '')

    const postIds: string[] = []
    const userIds: string[] = []

    // Extract story/post IDs dari response (JSON string matching)
    const postIdRegex = /"post_id":"(\d+)"/g
    const storyIdRegex = /"story_id":"(\d+)"/g
    const actorIdRegex = /"actor_id":"(\d+)"/g

    let match: RegExpExecArray | null
    while ((match = postIdRegex.exec(responseText)) !== null) {
      if (!postIds.includes(match[1])) postIds.push(match[1])
    }
    while ((match = storyIdRegex.exec(responseText)) !== null) {
      if (!postIds.includes(match[1])) postIds.push(match[1])
    }
    while ((match = actorIdRegex.exec(responseText)) !== null) {
      if (match[1] !== cUser && !userIds.includes(match[1])) userIds.push(match[1])
    }

    if (postIds.length === 0 && userIds.length === 0) {
      console.warn('[FacebookFinder] Tidak ada target dari search, fallback ke targets.txt')
      return fallbackToFile(limit)
    }

    return {
      postIds: postIds.slice(0, limit),
      userIds: userIds.slice(0, limit),
    }
  } catch (e: any) {
    console.error('[FacebookFinder] Search error:', e?.message)
    return fallbackToFile(limit)
  }
}

/**
 * Fallback: read random targets dari data/targets.txt.
 * Heuristic: IDs dengan underscore (_) = postIds, numeric-only = userIds.
 */
function fallbackToFile(limit: number): FacebookFinderResult {
  const targets = getRandomTargets(limit)
  const postIds: string[] = []
  const userIds: string[] = []
  for (const t of targets) {
    if (t.includes('_')) {
      postIds.push(t)
    } else {
      userIds.push(t)
    }
  }
  return { postIds, userIds }
}
