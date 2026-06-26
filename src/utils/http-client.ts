import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { getActiveProxy } from '../proxy/proxy-context';
import { proxyConfigToUrl, type ProxyConfig } from '../proxy/proxy-config';

/**
 * Pabrik klien HTTP bersama.
 * Menyediakan instans axios yang telah dikonfigurasi dengan timeout dan base URL.
 * Adapter harus menggunakannya alih-alih axios mentah untuk memastikan perilaku yang konsisten.
 * Proxy: set via setActiveProxy() (1proxy integration) atau opts.proxy.
 */
export function createHttpClient(opts: {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  proxy?: ProxyConfig;
}): AxiosInstance {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const axios = require('axios') as typeof import('axios')

  const config: AxiosRequestConfig = {
    baseURL: opts.baseURL,
    timeout: opts.timeout ?? 15_000,
    headers: opts.headers ?? {},
  }

  const proxy = opts.proxy ?? getActiveProxy()
  if (proxy) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { HttpsProxyAgent } = require('https-proxy-agent') as { HttpsProxyAgent: new (url: string) => unknown }
    const proxyUrl = proxyConfigToUrl(proxy)
    const agent = new HttpsProxyAgent(proxyUrl)
    config.httpAgent = agent
    config.httpsAgent = agent
    config.proxy = false
  }

  return axios.default.create(config)
}

/**
 * Parsing string cookie atau array JSON {name, value} menjadi satu string header Cookie.
 * Menerima:
 *   - String biasa: "key=val; key2=val2"
 *   - String JSON: '[{"name":"key","value":"val"}]'
 *
 * IMPORTANT: Cookie values from JSON arrays are URL-decoded before joining,
 * because browsers store/send decoded cookie values in the Cookie header.
 * For example sessionid "277%3Aabc" is sent as "277:abc".
 */
export function parseCookies(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (trimmed.startsWith('[')) {
    try {
      const arr: Array<{ name: string; value: string }> = JSON.parse(trimmed);
      return arr
        .map((c) => `${decodeURIComponent(c.name)}=${decodeURIComponent(c.value)}`)
        .join('; ');
    } catch {
      // Fall through to plain string
    }
  }
  return trimmed;
}

export type { AxiosRequestConfig };
