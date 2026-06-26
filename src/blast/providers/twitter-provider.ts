import type { BlastAction, BlastTarget } from '../types'
import type { PlatformCapabilities, PlatformProvider, SessionValidation } from './types'
import { findTwitterTargets } from '../finders/twitter-finder'
import { twitterReply } from '../actions/twitter-comment'
import { sendTwitterDM } from '../../adapters/providers/twitter/dm'
import { getRequiredCookies, validatePlatformCookie } from '../../utils/cookie-validation'

const capabilities: PlatformCapabilities = {
  authType: 'cookie',
  supportsFeed: false,
  supportsKeyword: true,
  supportsManualTargets: true,
  supportsDM: false,
  supportsLike: false,
  defaultAction: 'comment',
  recommendedMaxActions: 8,
  preferDirectConnection: true,
  maturity: 'experimental',
}

export const twitterProvider: PlatformProvider = {
  platform: 'twitter',
  capabilities,

  requiredCookieNames: () => getRequiredCookies('twitter'),

  validateSession(cookie: string): SessionValidation {
    const check = validatePlatformCookie('twitter', cookie)
    return {
      ok: check.ok,
      missingCookies: check.missing,
      error: check.ok ? undefined : `Cookie kurang: ${check.missing.join(', ')}`,
    }
  },

  async findTargets(cookie, searchQuery, limit): Promise<BlastTarget[]> {
    if (!searchQuery.trim()) return []
    const result = await findTwitterTargets(searchQuery, cookie, limit)
    return result.tweetIds.map((id) => ({ id, action: 'comment' as const }))
  },

  async execute(action, targetId, message, cookie) {
    if (action === 'comment') return twitterReply(targetId, message, cookie)
    if (action === 'chat') {
      const r = await sendTwitterDM(targetId, message, cookie)
      return { success: r.success, error: r.error }
    }
    return { success: false, error: `Action ${action} not supported on X` }
  },

  resolveAction(action, opts) {
    if (opts.commentPercent >= 100 || !opts.manualTargets) return 'comment'
    if (action === 'chat' || action === 'like') return 'comment'
    return action
  },
}
