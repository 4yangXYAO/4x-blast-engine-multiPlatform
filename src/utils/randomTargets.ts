import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const DATA_DIR = join(process.cwd(), 'data')
const TARGETS_FILE = join(DATA_DIR, 'targets.txt')

const EXAMPLE_CONTENT = `# Facebook Blast Targets (manual list — NOT auto-used by discovery)
# ---------------------
# One Facebook user ID or post ID per line.
# Lines starting with # are comments and are ignored.
# Blank lines are ignored.
#
# Discovery (automatic) does NOT read this file anymore.
# This file is only used when you explicitly run comment-random jobs
# or pass targets manually via API.
#
# For comment blast: use post IDs (e.g. "123456789_987654321" or numeric post ID)
# For chat blast: use numeric Facebook user IDs
#
# Add REAL target IDs below (remove these instructions when filling):
`

/**
 * Read targets.txt, filter comments and blank lines, return shuffled slice.
 *
 * @param count  Number of unique random targets to return.
 *               If file has fewer entries than count, returns all.
 * @returns Array of target ID strings.
 */
export function getRandomTargets(count: number): string[] {
  if (!existsSync(TARGETS_FILE)) {
    // Create example file so user knows what to do
    try {
      if (!existsSync(DATA_DIR)) {
        mkdirSync(DATA_DIR, { recursive: true })
      }
      writeFileSync(TARGETS_FILE, EXAMPLE_CONTENT, 'utf8')
    } catch {
      // Non-fatal: can't write example, just continue
    }
    console.warn(
      `[randomTargets] targets.txt not found — created example at ${TARGETS_FILE}. ` +
      'Fill it with one target ID per line and try again.'
    )
    return []
  }

  const raw = readFileSync(TARGETS_FILE, 'utf8')
  const entries = raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))

  if (entries.length === 0) {
    console.warn('[randomTargets] targets.txt is empty or contains only comments.')
    return []
  }

  const unique = Array.from(new Set(entries)).filter((id) => !isPlaceholderTarget(id))

  if (unique.length === 0) {
    console.warn(
      '[randomTargets] targets.txt has no valid entries (placeholders filtered out).'
    )
    return []
  }

  // Fisher-Yates shuffle
  for (let i = unique.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[unique[i], unique[j]] = [unique[j], unique[i]]
  }

  return unique.slice(0, count)
}

/**
 * Return total number of targets in the file (excluding comments/blanks).
 */
export function countTargets(): number {
  if (!existsSync(TARGETS_FILE)) return 0
  const raw = readFileSync(TARGETS_FILE, 'utf8')
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#') && !isPlaceholderTarget(line))
    .length
}

export function appendTargets(newTargets: string[]): { added: number; total: number } {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }

  let existing: string[] = []
  if (existsSync(TARGETS_FILE)) {
    const raw = readFileSync(TARGETS_FILE, 'utf8')
    existing = raw
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'))
  }

  const existingSet = new Set(existing)
  const toAdd = newTargets.filter((t) => !existingSet.has(t))

  if (toAdd.length > 0) {
    const contentToAppend = '\n' + toAdd.join('\n') + '\n'
    writeFileSync(TARGETS_FILE, contentToAppend, { flag: 'a', encoding: 'utf8' })
  }

  return {
    added: toAdd.length,
    total: existing.length + toAdd.length,
  }
}

export { TARGETS_FILE }

/** Known placeholder / sample IDs that must never be used in production blasts. */
const PLACEHOLDER_PATTERNS = [
  /^fb_post_/i,
  /^ig_shortcode_/i,
  /^tw_tweet_/i,
  /^th_post_/i,
  /^test_id_/i,
  /^sample_/i,
]

export function isPlaceholderTarget(id: string): boolean {
  const trimmed = id.trim()
  if (!trimmed) return true
  if (PLACEHOLDER_PATTERNS.some((p) => p.test(trimmed))) return true
  // Valid FB post: digits or userId_postId; valid user: long numeric
  if (/^\d+(_\d+)?$/.test(trimmed)) return false
  if (/^\d{10,}$/.test(trimmed)) return false
  return true
}
