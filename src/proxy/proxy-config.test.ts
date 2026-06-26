import { describe, test, expect } from 'vitest'
import { parseProxyUrl, proxyConfigToUrl } from './proxy-config'

describe('parseProxyUrl', () => {
  test('parses http proxy without auth', () => {
    const p = parseProxyUrl('http://104.154.186.48:80')
    expect(p).toEqual({
      protocol: 'http',
      host: '104.154.186.48',
      port: 80,
      username: undefined,
      password: undefined,
    })
  })

  test('parses proxy with auth', () => {
    const p = parseProxyUrl('http://user:secret@10.0.0.1:8080')
    expect(p?.username).toBe('user')
    expect(p?.password).toBe('secret')
    expect(p?.host).toBe('10.0.0.1')
    expect(p?.port).toBe(8080)
  })

  test('returns undefined for empty input', () => {
    expect(parseProxyUrl('')).toBeUndefined()
    expect(parseProxyUrl('   ')).toBeUndefined()
  })
})

describe('proxyConfigToUrl', () => {
  test('round-trips simple proxy', () => {
    const url = proxyConfigToUrl({
      protocol: 'http',
      host: '1.2.3.4',
      port: 3128,
    })
    expect(url).toBe('http://1.2.3.4:3128')
  })
})
