export interface CookieCheckResult {
  ok: boolean
  missing: string[]
  present: string[]
}

const COOKIE_NAMES: Record<string, string[]> = {
  facebook: ['c_user', 'xs'],
  instagram: ['sessionid', 'csrftoken', 'ds_user_id'],
  threads: ['sessionid', 'csrftoken'],
  twitter: ['auth_token', 'ct0'],
  whatsapp: [],
  telegram: [],
}

export function getRequiredCookies(platform: string): string[] {
  return COOKIE_NAMES[platform] ?? []
}

/** Parse semicolon cookie string or JSON cookie export into name set */
export function parseCookieNames(raw: string): Set<string> {
  const names = new Set<string>()
  const trimmed = raw.trim()
  if (!trimmed) return names

  if (trimmed.startsWith('[')) {
    try {
      const arr = JSON.parse(trimmed) as Array<{ name?: string }>
      for (const c of arr) {
        if (c.name) names.add(c.name)
      }
      return names
    } catch {
      // fall through
    }
  }

  for (const part of trimmed.split(';')) {
    const eq = part.indexOf('=')
    if (eq > 0) names.add(part.slice(0, eq).trim())
  }
  return names
}

export function validatePlatformCookie(platform: string, raw: string): CookieCheckResult {
  const required = getRequiredCookies(platform)
  const present = [...parseCookieNames(raw)]
  const presentSet = new Set(present)
  const missing = required.filter((n) => !presentSet.has(n))
  return {
    ok: missing.length === 0,
    missing,
    present,
  }
}
