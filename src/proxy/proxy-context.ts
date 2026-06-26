import type { ProxyConfig } from './proxy-config'

let activeProxy: ProxyConfig | undefined

export function setActiveProxy(proxy: ProxyConfig | undefined): void {
  activeProxy = proxy
}

export function getActiveProxy(): ProxyConfig | undefined {
  return activeProxy
}

export function clearActiveProxy(): void {
  activeProxy = undefined
}
