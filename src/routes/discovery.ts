import { Router, Request, Response } from 'express'
import { discoveryService } from '../blast/discovery-service'
import { AccountsRepo } from '../repos/accountsRepo'
import { decrypt } from '../utils/crypto'
import { appendTargets } from '../utils/randomTargets'

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
   * Body: { platform, accountId, keyword, strategy, limit }
   */
  router.post('/search', async (req: Request, res: Response) => {
    const { platform, accountId, keyword, strategy, limit } = req.body || {}

    if (!platform || !accountId || !keyword) {
      return res.status(400).json({ error: 'platform, accountId, and keyword are required' })
    }

    try {
      const account = accountsRepo.findById(accountId)
      if (!account) return res.status(404).json({ error: 'Account not found' })

      const cookie = readDecryptedCredentials(account.credentials_encrypted)
      const targets = await discoveryService.findTargets(cookie, {
        platform,
        keyword,
        strategy: strategy || 'AD_ENGAGEMENT',
        limit: limit ? Number(limit) : 30
      })

      res.json({ targets })
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Search failed' })
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
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Failed to save targets' })
    }
  })

  return router
}

export const discoveryRouter = createDiscoveryRouter()
export default discoveryRouter
