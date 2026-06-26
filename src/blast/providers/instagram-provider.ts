import type { BlastAction, BlastTarget } from '../types'
import type { PlatformCapabilities, PlatformProvider, SessionValidation } from './types'
import { discoveryService } from '../discovery-service'
import { resolveDiscoveryMode } from '../platform-search'
import { instagramPostComment } from '../actions/instagram-comment'
import { sendInstagramDM } from '../actions/instagram-dm'
import { getRequiredCookies, validatePlatformCookie } from '../../utils/cookie-validation'

const capabilities: PlatformCapabilities = {
  authType: 'cookie',
  supportsFeed: true,
  supportsKeyword: true,
  supportsManualTargets: true,
  supportsDM: true,
  supportsLike: false,
  defaultAction: 'comment',
  recommendedMaxActions: 8,
  preferDirectConnection: true,
  maturity: 'beta',
}

export const instagramProvider: PlatformProvider = {
  platform: 'instagram',
  capabilities,

  requiredCookieNames: () => getRequiredCookies('instagram'),

  validateSession(cookie: string): SessionValidation {
    const check = validatePlatformCookie('instagram', cookie)
    return {
      ok: check.ok,
      missingCookies: check.missing,
      error: check.ok ? undefined : `Cookie kurang: ${check.missing.join(', ')}`,
    }
  },

  async findTargets(cookie, searchQuery, limit): Promise<BlastTarget[]> {
    const mode = resolveDiscoveryMode(searchQuery)
    const targets = await discoveryService.findTargets(cookie, {
      platform: 'instagram',
      keyword: searchQuery.trim(),
      mode,
      limit,
      strategy: 'AD_ENGAGEMENT',
    })
    const out: BlastTarget[] = []
    for (const t of targets) {
      out.push({ id: t.id, action: t.action as BlastAction })
    }
    return out.slice(0, limit)
  },

  async execute(action, targetId, message, cookie) {
    if (action === 'comment') return instagramPostComment(targetId, message, cookie)
    if (action === 'chat') return sendInstagramDM(targetId, message, cookie)
    return { success: false, error: `Action ${action} not supported on Instagram blast` }
  },

  resolveAction(action, opts) {
    if (!opts.manualTargets) {
      if (action === 'chat') return 'chat'
      return 'comment'
    }
    if (opts.commentPercent >= 100) {
      return action === 'chat' ? 'chat' : 'comment'
    }
    return action
  },
}
