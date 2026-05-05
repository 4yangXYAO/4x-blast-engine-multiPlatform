import { Router } from 'express'
import { RuntimeSettingsRepo } from '../repos/runtimeSettingsRepo'
import type { DB } from '../db/sqlite'

const router = Router()

let runtimeSettingsRepo: RuntimeSettingsRepo | null = null

export function getRuntimeSettingsRepo(db?: DB) {
  if (runtimeSettingsRepo) return runtimeSettingsRepo
  runtimeSettingsRepo = new RuntimeSettingsRepo(db)
  return runtimeSettingsRepo
}

router.get('/integrations', (_req, res) => {
  const repo = getRuntimeSettingsRepo()
  res.json({ configured: repo.getStatuses() })
})

router.put('/integrations', (req, res) => {
  const repo = getRuntimeSettingsRepo()
  const payload = req.body && typeof req.body === 'object' ? req.body : {}
  const configured = repo.upsertMany(payload)
  res.json({ message: 'Integration settings saved', configured })
})

export const settingsRouter = router
export default router
