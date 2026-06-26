export {
  type ProxyConfig,
  type ProxyProtocol,
  type ProxyResolver,
  parseProxyUrl,
  proxyConfigToUrl,
  toPlaywrightProxy,
} from './proxy-config'
export { clearActiveProxy, getActiveProxy, setActiveProxy } from './proxy-context'
export { defaultProxyResolver, OneProxyResolver } from './oneproxy-resolver'

import { clearActiveProxy, setActiveProxy } from './proxy-context'
import { defaultProxyResolver } from './oneproxy-resolver'

/** Resolve and activate proxy for a blast run (HTTP + Playwright). */
export async function activateProxyForBlast(accountId: string, platform: string): Promise<boolean> {
  const proxy = await defaultProxyResolver.getProxyForAccount(accountId, platform)
  setActiveProxy(proxy)
  return !!proxy
}

export function deactivateProxy(): void {
  clearActiveProxy()
}
