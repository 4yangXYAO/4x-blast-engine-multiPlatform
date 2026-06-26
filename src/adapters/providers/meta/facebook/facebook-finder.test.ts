import { describe, it, expect, vi, beforeEach } from 'vitest'

const findTargetsMock = vi.fn()

vi.mock('../../../../blast/discovery-service', () => ({
  discoveryService: {
    findTargets: (...args: unknown[]) => findTargetsMock(...args),
  },
}))

import {
  findFacebookTargets,
  FacebookDiscoveryError,
} from './facebook-finder'

describe('findFacebookTargets', () => {
  beforeEach(() => {
    findTargetsMock.mockReset()
  })

  it('throws when cookie is missing', async () => {
    await expect(findFacebookTargets('obat', '', 5)).rejects.toThrow(FacebookDiscoveryError)
    expect(findTargetsMock).not.toHaveBeenCalled()
  })

  it('returns post and user IDs from discovery', async () => {
    findTargetsMock.mockResolvedValue([
      { id: '2035782367051052', action: 'comment', score: 50 },
      { id: '61563735636155', action: 'chat', score: 30 },
    ])

    const result = await findFacebookTargets('obat', 'c_user=1; xs=abc', 5)
    expect(result.postIds).toEqual(['2035782367051052'])
    expect(result.userIds).toEqual(['61563735636155'])
    expect(findTargetsMock).toHaveBeenCalledOnce()
  })

  it('throws when discovery returns empty (no silent file fallback)', async () => {
    findTargetsMock.mockResolvedValue([])

    await expect(findFacebookTargets('obat', 'c_user=1; xs=abc', 5)).rejects.toThrow(
      /No Facebook targets found/
    )
  })

  it('wraps discovery errors in FacebookDiscoveryError', async () => {
    findTargetsMock.mockRejectedValue(new Error('browser missing'))

    await expect(findFacebookTargets('obat', 'c_user=1; xs=abc', 5)).rejects.toThrow(
      /Facebook discovery failed/
    )
  })
})
