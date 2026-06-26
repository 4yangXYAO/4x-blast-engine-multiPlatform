import type { BlastTarget } from '../types'
import type { PlatformCapabilities, PlatformProvider, SessionValidation } from './types'
import { discoveryService } from '../discovery-service'
import { resolveDiscoveryMode } from '../platform-search'
import { threadsReply } from '../actions/threads-comment'
import { getRequiredCookies, validatePlatformCookie } from '../../utils/cookie-validation'

const capabilities: PlatformCapabilities = {
  authType: 'cookie',
  supportsFeed: true,
  supportsKeyword: true,
  supportsManualTargets: true,
  supportsDM: false,
  supportsLike: false,
  defaultAction: 'comment',
  recommendedMaxActions: 8,
  preferDirectConnection: true,
  maturity: 'beta',
}

export const threadsProvider: PlatformProvider = {
  platform: 'threads',
  capabilities,

  requiredCookieNames: () => getRequiredCookies('threads'),

  validateSession(cookie: string): SessionValidation {
    const check = validatePlatformCookie('threads', cookie)
    return {
      ok: check.ok,
      missingCookies: check.missing,
      error: check.ok ? undefined : `Cookie kurang: ${check.missing.join(', ')} (bisa pakai cookie IG)`,
    }
  },

  async findTargets(cookie, searchQuery, limit): Promise<BlastTarget[]> {
    const mode = resolveDiscoveryMode(searchQuery)
    const targets = await discoveryService.findTargets(cookie, {
      platform: 'threads',
      keyword: searchQuery.trim(),
      mode,
      limit,
      strategy: 'AD_ENGAGEMENT',
    })
    return targets
      .filter((t) => t.action === 'comment')
      .map((t) => ({ id: t.id, action: 'comment' as const }))
      .slice(0, limit)
  },

  async execute(action, targetId, message, cookie) {
    if (action === 'comment') return threadsReply(targetId, message, cookie)
    return { success: false, error: 'Threads hanya mendukung reply/comment — DM tidak tersedia' }
  },

  resolveAction(_action, _opts) {
    return 'comment'
  },
}
