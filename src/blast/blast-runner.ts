/**
 * Blast Runner — sequential multi-platform blast orchestrator.
 *
 * Executes actions one at a time against a single platform:
 *  1. Load credentials for account
 *  2. Fetch targets via platform finder (or use supplied list)
 *  3. Loop up to maxActions (default 30):
 *     - Pick random action (70% comment / 30% chat)
 *     - Execute via adapter
 *     - Log result with progress (e.g. "10/30")
 *     - Apply random delay (20-40s comment, 35-60s DM)
 *     - On failure: log and skip, do NOT stop
 *  4. Return BlastResult
 *
 * Rules:
 *  - Only ONE platform per run (single provider mode)
 *  - Sequential execution only (no parallel, no multi-thread)
 *  - Max 30 actions per run (hard cap)
 */

import type {
  BlastConfig,
  BlastResult,
  BlastTarget,
  BlastAction,
  BlastLogEntry,
  BlastPlatform,
  BlastProgress,
} from './types'
import { pickAction, pickActionWithMix } from './action-picker'
import { getDelay, getDelayWithRange, sleep } from './delay'

// ── Action imports ────────────────────────────────────────────────────

import { getPlatformProvider } from './providers'
import { AccountsRepo } from '../repos/accountsRepo'
import { decrypt } from '../utils/crypto'
import { activateProxyForBlast, deactivateProxy, defaultProxyResolver, setActiveProxy } from '../proxy'

/** Global lock — only one blast can run at a time */
let isRunning = false

let blastProgress: BlastProgress = {
  running: false,
  current: 0,
  total: 0,
  success: 0,
  failed: 0,
}

let lastBlastResult: BlastResult | null = null

export function isBlastRunning(): boolean {
  return isRunning
}

export function getBlastProgress(): BlastProgress {
  return { ...blastProgress }
}

export function getLastBlastResult(): BlastResult | null {
  return lastBlastResult ? { ...lastBlastResult, log: [...lastBlastResult.log] } : null
}

function resetProgress() {
  blastProgress = { running: false, current: 0, total: 0, success: 0, failed: 0 }
}

function unwrapCredentials(value: unknown): string {
  if (value == null) return ''
  if (Buffer.isBuffer(value)) return value.toString('utf8')
  return String(value)
}

function readDecryptedCredentials(value: unknown): string {
  const raw = unwrapCredentials(value)
  if (!raw) return ''
  try {
    return decrypt(raw)
  } catch {
    return raw
  }
}

// ── Action executor per platform ────────────────────────────────────

async function executeAction(
  platform: BlastPlatform,
  action: BlastAction,
  targetId: string,
  message: string,
  cookie: string
): Promise<{ success: boolean; error?: string }> {
  const provider = getPlatformProvider(platform)
  return provider.execute(action, targetId, message, cookie)
}

// ── Target fetching ─────────────────────────────────────────────────

async function fetchTargets(
  platform: BlastPlatform,
  cookie: string,
  searchQuery: string,
  limit: number
): Promise<BlastTarget[]> {
  const provider = getPlatformProvider(platform)
  let targets = await provider.findTargets(cookie, searchQuery, limit)

  for (let i = targets.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[targets[i], targets[j]] = [targets[j], targets[i]]
  }

  return targets.slice(0, limit)
}

// ── Main blast runner ───────────────────────────────────────────────

const MAX_ACTIONS_CAP = 30

/**
 * Run a blast against a single platform.
 *
 * - Sequential only (one action at a time)
 * - Max 30 actions per run
 * - Random delay between actions
 * - On failure: log and skip (no stop)
 * - Only one blast can run at a time (global lock)
 *
 * @param config  Blast configuration
 * @param deps    Optional DI overrides (for testing)
 */
export async function runBlast(
  config: BlastConfig,
  deps?: {
    executeAction?: typeof executeAction
    fetchTargets?: typeof fetchTargets
    sleep?: typeof sleep
    getDelay?: typeof getDelay
    pickAction?: typeof pickAction
    resolveCredentials?: (accountId: string) => string
  }
): Promise<BlastResult> {
  if (isRunning) {
    return {
      platform: config.platform,
      total: 0,
      success: 0,
      failed: 0,
      log: [{ index: 0, targetId: '', action: 'comment', ok: false, error: 'Another blast is already running' }],
    }
  }

  isRunning = true
  lastBlastResult = null

  const exec = deps?.executeAction ?? executeAction
  const fetch = deps?.fetchTargets ?? fetchTargets
  const doSleep = deps?.sleep ?? sleep
  const commentPct = config.commentPercent ?? 60
  const delayMin = config.delayMinSec
  const delayMax = config.delayMaxSec
  const doGetDelay =
    deps?.getDelay ??
    ((action: BlastAction) => getDelayWithRange(action, delayMin, delayMax))
  const doPickAction =
    deps?.pickAction ??
    ((platform: BlastPlatform) => pickActionWithMix(platform, commentPct))
  const manualAction: BlastAction =
    config.targetAction && config.targetAction !== 'post' ? config.targetAction : 'comment'

  const maxActions = Math.min(config.maxActions ?? MAX_ACTIONS_CAP, MAX_ACTIONS_CAP)
  const log: BlastLogEntry[] = []
  let successCount = 0
  let failedCount = 0

  try {
    // Resolve credentials
    let cookie = ''
    if (deps?.resolveCredentials) {
      cookie = deps.resolveCredentials(config.accountId)
    } else {
      try {
        const accountsRepo = new AccountsRepo()
        const account = accountsRepo.findById(config.accountId)
        if (!account) {
          return {
            platform: config.platform,
            total: 0,
            success: 0,
            failed: 0,
            log: [{ index: 0, targetId: '', action: 'comment', ok: false, error: `Account not found: ${config.accountId}` }],
          }
        }
        cookie = readDecryptedCredentials(account.credentials_encrypted)
      } catch (e: any) {
        return {
          platform: config.platform,
          total: 0,
          success: 0,
          failed: 0,
          log: [{ index: 0, targetId: '', action: 'comment', ok: false, error: `Failed to load account: ${e?.message}` }],
        }
      }
    }

    // 1proxy: activate rotating proxy for this blast (HTTP + Playwright adapters)
    const proxyEnabled = await activateProxyForBlast(config.accountId, config.platform)
    if (proxyEnabled) {
      console.log(`[blast] proxy active via 1proxy for account ${config.accountId}`)
    }

    // Build targets
    let targets: BlastTarget[] = []

    if (config.platform === 'whatsapp') {
      // WhatsApp: use supplied phone numbers, chat-only
      const phones = config.targets ?? []
      targets = phones.map((p) => ({ id: p, action: 'chat' as BlastAction }))
    } else if (config.targetEntries && config.targetEntries.length > 0) {
      targets = config.targetEntries.map((e) => ({
        id: e.id,
        action: e.action,
      }))
    } else if (config.targets && config.targets.length > 0) {
      // User-supplied targets
      targets = config.targets.map((t) => ({
        id: t,
        action: manualAction,
      }))
    } else {
      // Fetch from platform finder
      targets = await fetch(
        config.platform,
        cookie,
        config.searchQuery ?? '',
        maxActions
      )
    }

    if (targets.length === 0) {
      return {
        platform: config.platform,
        total: 0,
        success: 0,
        failed: 0,
        log: [{ index: 0, targetId: '', action: 'comment', ok: false, error: 'No targets found' }],
      }
    }

    // Sequential execution loop
    const actionCount = Math.min(targets.length, maxActions)

    blastProgress = {
      running: true,
      current: 0,
      total: actionCount,
      platform: config.platform,
      success: 0,
      failed: 0,
    }

    for (let i = 0; i < actionCount; i++) {
      const target = targets[i]
      const provider = getPlatformProvider(config.platform)
      const manualTargets = !!(
        (config.targetEntries && config.targetEntries.length > 0) ||
        (config.targets && config.targets.length > 0)
      )
      let action: BlastAction = provider.resolveAction(
        config.platform === 'whatsapp' ? 'chat' : target.action,
        { manualTargets, commentPercent: commentPct }
      )

      // Rotate proxy per action when ONEPROXY_ROTATE_EACH_ACTION=1
      if (process.env.ONEPROXY_ROTATE_EACH_ACTION === '1') {
        try {
          const nextProxy = await defaultProxyResolver.getProxyForAccount(config.accountId, config.platform)
          setActiveProxy(nextProxy)
        } catch (e: any) {
          console.log(`[blast] proxy rotate warning: ${e?.message ?? e}`)
        }
      }

      console.log(`[blast] ${config.platform} | ${i + 1}/${actionCount} | ${action} → ${target.id}`)

      try {
        const result = await exec(config.platform, action, target.id, config.message, cookie)
        if (result.success) {
          successCount++
          const entry: BlastLogEntry = { index: i + 1, targetId: target.id, action, ok: true }
          log.push(entry)
          blastProgress = {
            ...blastProgress,
            current: i + 1,
            success: successCount,
            lastEntry: entry,
          }
          console.log(`[blast] ✓ ${i + 1}/${actionCount} success`)
        } else {
          failedCount++
          const entry: BlastLogEntry = { index: i + 1, targetId: target.id, action, ok: false, error: result.error }
          log.push(entry)
          blastProgress = {
            ...blastProgress,
            current: i + 1,
            failed: failedCount,
            lastEntry: entry,
          }
          console.log(`[blast] ✗ ${i + 1}/${actionCount} failed: ${result.error}`)
        }
      } catch (e: any) {
        // On failure: log and skip (do NOT stop)
        failedCount++
        const entry: BlastLogEntry = { index: i + 1, targetId: target.id, action, ok: false, error: e?.message ?? 'Unknown error' }
        log.push(entry)
        blastProgress = {
          ...blastProgress,
          current: i + 1,
          failed: failedCount,
          lastEntry: entry,
        }
        console.log(`[blast] ✗ ${i + 1}/${actionCount} error: ${e?.message}`)
      }

      // Apply delay (skip after last action)
      if (i < actionCount - 1) {
        const delayMs = doGetDelay(action)
        console.log(`[blast] waiting ${Math.round(delayMs / 1000)}s...`)
        await doSleep(delayMs)
      }
    }

    const finalResult: BlastResult = {
      platform: config.platform,
      total: actionCount,
      success: successCount,
      failed: failedCount,
      log,
    }
    lastBlastResult = finalResult
    return finalResult
  } finally {
    deactivateProxy()
    isRunning = false
    blastProgress = { ...blastProgress, running: false }
  }
}

/** Reset running state (for testing) */
export function resetBlastState() {
  isRunning = false
  resetProgress()
}
