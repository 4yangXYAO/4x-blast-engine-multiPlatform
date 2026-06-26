/**
 * Blast Runner — type definitions.
 *
 * Covers platforms, action types, target shape, configuration, and result.
 */

export type BlastPlatform = 'facebook' | 'instagram' | 'twitter' | 'threads' | 'whatsapp' | 'telegram'

export type BlastAction = 'comment' | 'chat' | 'like' | 'post'

/** A single target to act on during a blast run. */
export interface BlastTarget {
  /** postId (for comment) or userId/phone (for chat) */
  id: string
  /** Which action to perform on this target */
  action: BlastAction
}

/** Configuration passed to the blast runner. */
export interface BlastConfig {
  platform: BlastPlatform
  /** Account row ID — used to decrypt credentials */
  accountId: string
  /** Text content to send as comment or DM */
  message: string
  /** Maximum total actions per run (default 30, hard cap 30) */
  maxActions?: number
  /** Optional override targets (e.g. WhatsApp phone list). If omitted, finder fetches them. */
  targets?: string[]
  /** Optional search query for platform finders */
  searchQuery?: string
  /** Comment share 0–100 when picking actions for auto-discovered targets (default 60) */
  commentPercent?: number
  /** Custom delay range in seconds (overrides per-action defaults when both set) */
  delayMinSec?: number
  delayMaxSec?: number
  /** Action for user-supplied target IDs (default: comment) */
  targetAction?: BlastAction
  /** Hunter / sniper targets with per-target action (comment vs DM) */
  targetEntries?: BlastTarget[]
  /** Discovery strategy when auto-fetching targets */
  strategy?: 'AD_ENGAGEMENT' | 'BUSINESS_PROSPECT' | 'INTENT_DETECTION'
  /** feed | keyword | hashtag — default dari searchQuery */
  searchMode?: 'feed' | 'keyword' | 'hashtag'
}

/** Live progress while a blast is running */
export interface BlastProgress {
  running: boolean
  current: number
  total: number
  platform?: BlastPlatform
  success: number
  failed: number
  lastEntry?: BlastLogEntry
}

/** Single action log entry. */
export interface BlastLogEntry {
  index: number
  targetId: string
  action: BlastAction
  ok: boolean
  error?: string
}

/** Result returned after a blast run completes. */
export interface BlastResult {
  platform: BlastPlatform
  total: number
  success: number
  failed: number
  log: BlastLogEntry[]
}
