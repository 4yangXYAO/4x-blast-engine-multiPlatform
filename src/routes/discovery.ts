import { Router, Request, Response } from 'express'
import { discoveryService } from '../blast/discovery-service'
import type { DiscoveryMode } from '../blast/platform-search'
import { AccountsRepo } from '../repos/accountsRepo'
import { decrypt } from '../utils/crypto'
import { appendTargets } from '../utils/randomTargets'

const VALID_MODES: DiscoveryMode[] = ['feed', 'keyword', 'hashtag']

export function createDiscoveryRouter() {
  const router = Router()
  const accountsRepo = new AccountsRepo()

  function readDecryptedCredentials(value: unknown): string {
    if (value == null) return ''
    const raw = Buffer.isBuffer(value) ? value.toString('utf8') : String(value)
    try {
      return decrypt(raw)
    } catch {
      return raw
    }
  }

  /**
   * POST /v1/discovery/search
   * Body: { platform, accountId, keyword?, strategy, limit, mode }
   */
  router.post('/search', async (req: Request, res: Response) => {
    const { platform, accountId, keyword, strategy, limit, mode } = req.body || {}

    if (!platform || !accountId) {
      return res.status(400).json({ error: 'platform and accountId are required' })
    }

    const searchMode = (mode as DiscoveryMode) || (keyword?.trim() ? 'keyword' : 'feed')
    if (!VALID_MODES.includes(searchMode)) {
      return res.status(400).json({ error: `mode must be one of: ${VALID_MODES.join(', ')}` })
    }
    if (searchMode !== 'feed' && !String(keyword ?? '').trim()) {
      return res.status(400).json({ error: 'keyword is required for keyword/hashtag mode' })
    }

    const targetLimit = Math.min(Math.max(Number(limit) || 30, 1), 100)

    try {
      const account = accountsRepo.findById(accountId)
      if (!account) return res.status(404).json({ error: 'Account not found' })

      const cookie = readDecryptedCredentials(account.credentials_encrypted)
      const targets = await discoveryService.findTargets(cookie, {
        platform,
        keyword: String(keyword ?? '').trim(),
        strategy: strategy || 'AD_ENGAGEMENT',
        limit: targetLimit,
        mode: searchMode,
      })

      res.json({
        targets,
        meta: {
          requested: targetLimit,
          found: targets.length,
          mode: searchMode,
        },
      })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Search failed'
      res.status(500).json({ error: msg })
    }
  })

  /**
   * POST /v1/discovery/save
   * Body: { targets: string[] }
   */
  router.post('/save', (req: Request, res: Response) => {
    const { targets } = req.body || {}
    if (!targets || !Array.isArray(targets)) {
      return res.status(400).json({ error: 'targets must be an array of strings' })
    }

    try {
      const result = appendTargets(targets)
      res.json({ message: 'Targets saved successfully', ...result })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to save targets'
      res.status(500).json({ error: msg })
    }
  })

  return router
}

export const discoveryRouter = createDiscoveryRouter()
export default discoveryRouter
