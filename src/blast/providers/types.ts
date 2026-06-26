import type { BlastAction, BlastPlatform, BlastTarget } from '../types'

export interface PlatformCapabilities {
  /** Cookie-based session (no paid API) */
  authType: 'cookie'
  supportsFeed: boolean
  supportsKeyword: boolean
  supportsManualTargets: boolean
  supportsDM: boolean
  supportsLike: boolean
  /** Default blast action for promo campaigns */
  defaultAction: BlastAction
  /** Recommended max actions per run */
  recommendedMaxActions: number
  /** Use direct connection — disable datacenter proxy */
  preferDirectConnection: boolean
  maturity: 'stable' | 'beta' | 'experimental'
}

export interface ActionResult {
  success: boolean
  error?: string
}

export interface SessionValidation {
  ok: boolean
  error?: string
  missingCookies?: string[]
}

/**
 * One plugin per social platform. Blast runner stays universal;
 * each provider owns discovery, credentials shape, and execution.
 */
export interface PlatformProvider {
  readonly platform: BlastPlatform
  readonly capabilities: PlatformCapabilities

  /** Required cookie names for UI hints and server-side validation */
  requiredCookieNames(): string[]

  validateSession(cookie: string): SessionValidation

  findTargets(cookie: string, searchQuery: string, limit: number): Promise<BlastTarget[]>

  execute(
    action: BlastAction,
    targetId: string,
    message: string,
    cookie: string
  ): Promise<ActionResult>

  /** Normalize action for this platform (e.g. force comment on auto targets) */
  resolveAction(action: BlastAction, opts: { manualTargets: boolean; commentPercent: number }): BlastAction
}
