import { discoveryService } from '../../../../blast/discovery-service'
import { resolveDiscoveryMode } from '../../../../blast/platform-search'

export interface ThreadsFinderResult {
  postIds: string[]
  userIds: string[]
}

export async function findThreadsTargets(
  query: string,
  cookie: string,
  limit: number = 30
): Promise<ThreadsFinderResult> {
  if (!cookie) return { postIds: [], userIds: [] }

  try {
    console.log(`[ThreadsFinder] Using Stealth DiscoveryService for query: ${query}`)
    const discoveryTargets = await discoveryService.findTargets(cookie, {
      platform: 'threads',
      keyword: query,
      limit,
      strategy: 'AD_ENGAGEMENT',
      mode: resolveDiscoveryMode(query),
    })

    const postIds = discoveryTargets.filter((t) => t.action === 'comment').map((t) => t.id)
    const userIds = discoveryTargets.filter((t) => t.action === 'chat').map((t) => t.id)

    return { postIds, userIds }
  } catch (e: unknown) {
    console.error('[ThreadsFinder] Stealth search failed:', e instanceof Error ? e.message : String(e))
    return { postIds: [], userIds: [] }
  }
}
