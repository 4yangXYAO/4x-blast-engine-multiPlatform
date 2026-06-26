/**
 * Blast Runner — action randomization.
 *
 * Probabilistic logic:
 *   60% comment
 *   20% chat (DM)
 *   20% like
 *
 * Avoids fixed patterns to simulate natural user behavior.
 */

import type { BlastAction, BlastPlatform } from './types'

/**
 * Pick a random action type based on configured probabilities.
 * Returns:
 *   60% comment
 *   20% chat (DM)
 *   20% like
 *
 * When platform is 'threads', 'chat' is excluded because Threads DM
 * is not supported — falls back to 'comment' instead.
 */
export function pickAction(platform?: BlastPlatform): BlastAction {
  return pickActionWithMix(platform, 60)
}

/**
 * Pick action using a configurable comment percentage.
 * Remaining share splits evenly between chat and like.
 */
export function pickActionWithMix(platform: BlastPlatform | undefined, commentPercent = 60): BlastAction {
  const pct = Math.min(100, Math.max(0, commentPercent)) / 100
  const remainder = 1 - pct
  const chatThreshold = pct + remainder * 0.5
  const r = Math.random()
  if (r < pct) return 'comment'
  if (r < chatThreshold) {
    if (platform === 'threads') return 'comment'
    return 'chat'
  }
  return 'like'
}
