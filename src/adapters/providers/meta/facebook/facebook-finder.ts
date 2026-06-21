/**
 * Facebook Finder — cari groups/posts dan ekstrak target IDs.
 *
 * Menggunakan Facebook HTML page scraping (cookie-based).
 * Fallback ke data/targets.txt jika search tidak menghasilkan hasil.
 */

import { createHttpClient, parseCookies } from '../../../../utils/http-client'
import { getRandomTargets } from '../../../../utils/randomTargets'

export interface FacebookSearchFilters {
  creationTime?: 'today' | 'this_week' | 'this_month' | 'this_year'
  author?: 'friends' | 'groups' | 'public'
  group?: string
}

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
 * @param filters Advanced search filters
 */
import { discoveryService } from '../../../../blast/discovery-service'

/**
 * Cari Facebook untuk group posts berdasarkan query.
 * Ekstrak post IDs (untuk comment) dan user IDs (untuk DM).
 */
export async function findFacebookTargets(
  query: string,
  cookie: string,
  limit: number = 30,
  filters?: FacebookSearchFilters
): Promise<FacebookFinderResult> {
  if (!cookie) {
    return fallbackToFile(limit)
  }

  try {
    console.log(`[FacebookFinder] Using Stealth DiscoveryService for query: ${query}`)
    const discoveryTargets = await discoveryService.findTargets(cookie, {
      platform: 'facebook',
      keyword: query,
      limit,
      strategy: 'AD_ENGAGEMENT' // Default to high-value discovery
    })

    const postIds = discoveryTargets
      .filter(t => t.action === 'comment')
      .map(t => t.id)
    
    const userIds = discoveryTargets
      .filter(t => t.action === 'chat')
      .map(t => t.id)

    if (postIds.length === 0 && userIds.length === 0) {
      return fallbackToFile(limit)
    }

    return { postIds, userIds }
  } catch (e: unknown) {
    console.error('[FacebookFinder] Stealth search failed:', e instanceof Error ? e.message : String(e))
    return fallbackToFile(limit)
  }
}

/**
 * Advanced search using Facebook GraphQL endpoint.
 */
async function findFacebookTargetsGraphQL(
  query: string,
  cookie: string,
  limit: number = 30,
  filters?: FacebookSearchFilters
): Promise<FacebookFinderResult> {
  const cookieHeader = parseCookies(cookie)
  
  // 1. Get tokens
  const pageClient = createHttpClient({
    baseURL: 'https://www.facebook.com',
    headers: { Cookie: cookieHeader }
  })
  const pageRes = await pageClient.get('/')
  const html = String(pageRes?.data || '')
  
  let fbDtsg = '';
  const dtsgMatch = html.match(/"DTSGInitialData",\[\],\{"token":"([^"]+)"\}/) || html.match(/"name":"fb_dtsg","value":"([^"]+)"/);
  if (dtsgMatch) fbDtsg = dtsgMatch[1];
  
  if (!fbDtsg) throw new Error('Could not extract fb_dtsg')

  // 2. Search Mutation
  const gqlClient = createHttpClient({
    baseURL: 'https://www.facebook.com',
    headers: {
      'Cookie': cookieHeader,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })

  const variables = JSON.stringify({
    count: limit,
    cursor: null,
    params: {
      bqf: "[]",
      browse_sesid: `ses_${Date.now()}`,
      query: query,
      search_surface: "POSTS_SURFACE",
      filters: buildFilters(filters)
    },
    scale: 1
  })

  const params = new URLSearchParams()
  params.append('fb_dtsg', fbDtsg)
  params.append('variables', variables)
  params.append('doc_id', '6012268648876713')

  const res = await gqlClient.post('/api/graphql/', params)
  const edges = res.data?.data?.search?.search_results?.edges || []
  
  const postIds: string[] = []
  const userIds: string[] = []

  for (const edge of edges) {
    const node = edge.node
    if (node?.__typename === 'Story') {
      postIds.push(node.legacy_story_id)
      if (node.author?.id) userIds.push(node.author.id)
    }
  }

  return { postIds, userIds }
}

function buildFilters(filters?: FacebookSearchFilters): string[] {
  if (!filters) return []
  const result: string[] = []
  if (filters.creationTime) {
    result.push(JSON.stringify({ name: "creation_time", args: filters.creationTime }))
  }
  if (filters.author) {
    result.push(JSON.stringify({ name: "author", args: filters.author }))
  }
  return result
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
