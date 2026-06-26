import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as fs from 'fs'

// Mock fs module
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>()
  return {
    ...actual,
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
  }
})

beforeEach(() => {
  vi.clearAllMocks()
})

// Import after mocks are hoisted
import { getRandomTargets, countTargets, isPlaceholderTarget } from './randomTargets'

describe('isPlaceholderTarget', () => {
  it('flags known sample IDs', () => {
    expect(isPlaceholderTarget('fb_post_123')).toBe(true)
    expect(isPlaceholderTarget('test_id_1782047237465')).toBe(true)
  })

  it('allows numeric Facebook IDs', () => {
    expect(isPlaceholderTarget('2035782367051052')).toBe(false)
    expect(isPlaceholderTarget('100012345678901_987654321')).toBe(false)
  })
})

describe('getRandomTargets', () => {
  it('returns empty array and creates example file when targets.txt does not exist', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false)
    const result = getRandomTargets(10)
    expect(result).toEqual([])
    expect(fs.writeFileSync).toHaveBeenCalled()
  })

  it('returns correct number of entries from populated file', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.readFileSync).mockReturnValue(
      '# comment\n100001\n100002\n100003\n100004\n100005\n' as any
    )
    const result = getRandomTargets(3)
    expect(result).toHaveLength(3)
    for (const r of result) {
      expect(['100001', '100002', '100003', '100004', '100005']).toContain(r)
    }
  })

  it('filters out comment lines and blank lines', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.readFileSync).mockReturnValue(
      '# comment\n\n  \n100001\n# another\n100002\n' as any
    )
    const result = getRandomTargets(10)
    expect(result).toHaveLength(2)
    expect(result).toContain('100001')
    expect(result).toContain('100002')
  })

  it('deduplicates entries', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.readFileSync).mockReturnValue('100001\n100001\n100002\n100002\n' as any)
    const result = getRandomTargets(10)
    expect(result).toHaveLength(2)
    expect(new Set(result).size).toBe(2)
  })

  it('returns all entries when count exceeds file size', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.readFileSync).mockReturnValue('100001\n100002\n' as any)
    const result = getRandomTargets(100)
    expect(result).toHaveLength(2)
  })

  it('returns empty array for file with only comments', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.readFileSync).mockReturnValue('# only comments\n# nothing here\n' as any)
    const result = getRandomTargets(5)
    expect(result).toEqual([])
  })

  it('filters placeholder sample IDs from file', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.readFileSync).mockReturnValue(
      '2035782367051052\nfb_post_123\ntest_id_abc\n100012345678901_987654321\n' as any
    )
    const result = getRandomTargets(10)
    expect(result).toContain('2035782367051052')
    expect(result).toContain('100012345678901_987654321')
    expect(result).not.toContain('fb_post_123')
    expect(result).not.toContain('test_id_abc')
  })
})

describe('countTargets', () => {
  it('returns 0 when file does not exist', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false)
    expect(countTargets()).toBe(0)
  })

  it('returns correct count excluding comments', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.readFileSync).mockReturnValue('# comment\n100001\n100002\n\n' as any)
    expect(countTargets()).toBe(2)
  })
})
