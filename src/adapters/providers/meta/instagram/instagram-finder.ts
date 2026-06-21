import { discoveryService } from '../../../../blast/discovery-service'

export interface InstagramFinderResult {
  postIds: string[]
  userIds: string[]
}

export async function findInstagramTargets(
  query: string,
  cookie: string,
  limit: number = 30
): Promise<InstagramFinderResult> {
  if (!cookie) return { postIds: [], userIds: [] }

  try {
    console.log(`[InstagramFinder] Using Stealth DiscoveryService for query: ${query}`)
    const discoveryTargets = await discoveryService.findTargets(cookie, {
      platform: 'instagram',
      keyword: query,
      limit,
      strategy: 'AD_ENGAGEMENT'
    })

    const postIds = discoveryTargets.filter(t => t.action === 'comment').map(t => t.id)
    const userIds = discoveryTargets.filter(t => t.action === 'chat').map(t => t.id)

    return { postIds, userIds }
  } catch (e: any) {
    console.error('[InstagramFinder] Stealth search failed:', e?.message)
    return { postIds: [], userIds: [] }
  }
}
