import type { BlastAction, BlastTarget } from '../types'
import type { PlatformCapabilities, PlatformProvider, SessionValidation } from './types'
import { findFacebookTargets } from '../../adapters/providers/meta/facebook/facebook-finder'
import { facebookPostComment } from '../actions/facebook-comment'
import { facebookSendDM } from '../actions/facebook-dm'
import { FacebookAdapter } from '../../adapters/providers/meta/facebook/facebook'
import { getRequiredCookies, validatePlatformCookie } from '../../utils/cookie-validation'

const capabilities: PlatformCapabilities = {
  authType: 'cookie',
  supportsFeed: true,
  supportsKeyword: true,
  supportsManualTargets: true,
  supportsDM: true,
  supportsLike: false,
  defaultAction: 'comment',
  recommendedMaxActions: 10,
  preferDirectConnection: true,
  maturity: 'stable',
}

export const facebookProvider: PlatformProvider = {
  platform: 'facebook',
  capabilities,

  requiredCookieNames: () => getRequiredCookies('facebook'),

  validateSession(cookie: string): SessionValidation {
    const check = validatePlatformCookie('facebook', cookie)
    return {
      ok: check.ok,
      missingCookies: check.missing,
      error: check.ok ? undefined : `Cookie kurang: ${check.missing.join(', ')}`,
    }
  },

  async findTargets(cookie, searchQuery, limit): Promise<BlastTarget[]> {
    const result = await findFacebookTargets(searchQuery, cookie, limit)
    return result.postIds.map((id) => ({ id, action: 'comment' as const }))
  },

  async execute(action, targetId, message, cookie) {
    if (action === 'comment') return facebookPostComment(targetId, message, cookie)
    if (action === 'chat') return facebookSendDM(targetId, message, cookie)
    if (action === 'like') {
      const adapter = new FacebookAdapter(cookie)
      return adapter.reactToPost(targetId, 'LIKE')
    }
    return { success: false, error: `Action ${action} not supported on Facebook` }
  },

  resolveAction(action, opts) {
    if (!opts.manualTargets) return 'comment'
    if (opts.commentPercent >= 100) {
      return action === 'chat' ? 'chat' : 'comment'
    }
    return action
  },
}
