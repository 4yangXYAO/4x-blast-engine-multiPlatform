export type ProxyProtocol = 'http' | 'https' | 'socks5'

export interface ProxyConfig {
  host: string
  port: number
  protocol: ProxyProtocol
  username?: string
  password?: string
}

export interface ProxyResolver {
  getProxyForAccount(accountId: string, platform: string): Promise<ProxyConfig | undefined>
}

/** Parse proxy URL like http://user:pass@host:port or socks5://host:port */
export function parseProxyUrl(raw: string): ProxyConfig | undefined {
  const trimmed = raw.trim()
  if (!trimmed) return undefined

  try {
    const url = new URL(trimmed)
    const protocol = url.protocol.replace(':', '') as ProxyProtocol
    if (!['http', 'https', 'socks5'].includes(protocol)) return undefined

    return {
      protocol,
      host: url.hostname,
      port: Number(url.port) || (protocol === 'https' ? 443 : 80),
      username: url.username ? decodeURIComponent(url.username) : undefined,
      password: url.password ? decodeURIComponent(url.password) : undefined,
    }
  } catch {
    return undefined
  }
}

export function proxyConfigToUrl(proxy: ProxyConfig): string {
  const auth =
    proxy.username != null
      ? `${encodeURIComponent(proxy.username)}:${encodeURIComponent(proxy.password ?? '')}@`
      : ''
  return `${proxy.protocol}://${auth}${proxy.host}:${proxy.port}`
}

export function toPlaywrightProxy(proxy: ProxyConfig) {
  return {
    server: `${proxy.protocol}://${proxy.host}:${proxy.port}`,
    username: proxy.username,
    password: proxy.password,
  }
}
