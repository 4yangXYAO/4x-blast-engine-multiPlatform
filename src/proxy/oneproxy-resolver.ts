import { parseProxyUrl, type ProxyConfig, type ProxyResolver } from './proxy-config'

function envFlag(name: string): boolean {
  const v = (process.env[name] ?? '').toLowerCase()
  return v === '1' || v === 'true' || v === 'yes'
}

function parse1ProxyResponse(data: { url?: string }): ProxyConfig | undefined {
  if (!data?.url) return undefined
  return parseProxyUrl(data.url)
}

/**
 * Fetches rotating proxies from local 1proxy API (http://localhost:8000).
 * Enable with ONEPROXY_ENABLED=1 in blast engine .env.
 */
export class OneProxyResolver implements ProxyResolver {
  private readonly apiUrl: string
  private readonly protocol: string
  private readonly minQuality: number

  constructor(opts?: { apiUrl?: string; protocol?: string; minQuality?: number }) {
    this.apiUrl = (opts?.apiUrl ?? process.env.ONEPROXY_API_URL ?? 'http://localhost:8000').replace(/\/$/, '')
    this.protocol = opts?.protocol ?? process.env.ONEPROXY_PROTOCOL ?? 'http'
    this.minQuality = opts?.minQuality ?? Number(process.env.ONEPROXY_MIN_QUALITY ?? '50')
  }

  async getProxyForAccount(accountId: string, _platform: string): Promise<ProxyConfig | undefined> {
    const staticProxy = process.env.DEFAULT_PROXY_URL?.trim()
    if (staticProxy) {
      return parseProxyUrl(staticProxy)
    }

    if (!envFlag('ONEPROXY_ENABLED')) {
      return undefined
    }

    const params = new URLSearchParams({
      protocol: this.protocol,
      min_quality: String(this.minQuality),
      strategy: 'quality',
      session_id: `blast-${accountId}`,
    })

    let res = await fetch(`${this.apiUrl}/api/v1/proxies/rotate?${params}`, {
      signal: AbortSignal.timeout(15_000),
    })

    // Fallback when rotate fails (e.g. SQLite lock on Windows dev)
    if (!res.ok) {
      const randomParams = new URLSearchParams({
        protocol: this.protocol,
        min_quality: String(this.minQuality),
      })
      res = await fetch(`${this.apiUrl}/api/v1/proxies/random?${randomParams}`, {
        signal: AbortSignal.timeout(15_000),
      })
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`1proxy rotate failed (${res.status}): ${body || res.statusText}`)
    }

    const data = (await res.json()) as { url?: string }
    const proxy = parse1ProxyResponse(data)
    if (!proxy) {
      throw new Error('1proxy returned empty proxy URL')
    }
    return proxy
  }
}

export const defaultProxyResolver: ProxyResolver = new OneProxyResolver()
