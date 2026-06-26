/**
 * Facebook Finder — cari groups/posts dan ekstrak target IDs.
 *
 * Menggunakan DiscoveryService (Playwright stealth).
 * TIDAK lagi fallback diam-diam ke data/targets.txt — gagal dengan error jelas.
 */

import { discoveryService } from '../../../../blast/discovery-service'
import { resolveDiscoveryMode } from '../../../../blast/platform-search'

export interface FacebookSearchFilters {
  creationTime?: 'today' | 'this_week' | 'this_month' | 'this_year'
  author?: 'friends' | 'groups' | 'public'
  group?: string
}

export interface FacebookFinderResult {
  postIds: string[]
  userIds: string[]
}

export class FacebookDiscoveryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FacebookDiscoveryError'
  }
}

/**
 * Cari Facebook untuk group posts berdasarkan query.
 * Ekstrak post IDs (untuk comment) dan user IDs (untuk DM).
 */
export async function findFacebookTargets(
  query: string,
  cookie: string,
  limit: number = 30,
  _filters?: FacebookSearchFilters
): Promise<FacebookFinderResult> {
  if (!cookie?.trim()) {
    throw new FacebookDiscoveryError(
      'Facebook cookie is required for discovery. Add account via POST /v1/accounts.'
    )
  }

  const keyword = query?.trim() || ''

  try {
    console.log(`[FacebookFinder] Discovery for query: ${keyword || '(home feed)'}`)
    const discoveryTargets = await discoveryService.findTargets(cookie, {
      platform: 'facebook',
      keyword,
      limit,
      strategy: 'AD_ENGAGEMENT',
      mode: resolveDiscoveryMode(keyword),
    })

    const postIds = discoveryTargets.filter((t) => t.action === 'comment').map((t) => t.id)
    const userIds = discoveryTargets.filter((t) => t.action === 'chat').map((t) => t.id)

    if (postIds.length === 0 && userIds.length === 0) {
      throw new FacebookDiscoveryError(
        'No Facebook targets found. Check cookie validity, try another searchQuery, ' +
          'or pass explicit post IDs via blast config.targets.'
      )
    }

    return { postIds, userIds }
  } catch (e: unknown) {
    if (e instanceof FacebookDiscoveryError) throw e
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[FacebookFinder] Discovery failed:', msg)
    throw new FacebookDiscoveryError(
      `Facebook discovery failed: ${msg}. ` +
        'Ensure Playwright is installed (npm run playwright:install) and cookie is valid.'
    )
  }
}
