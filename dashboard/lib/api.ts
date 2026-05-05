import axios, { AxiosError } from 'axios'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:3456'

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

export function getApiUrl(): string {
  return API_BASE
}

export async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: `Request failed: ${res.status}` }))
    throw new Error(error?.error ?? `Request failed: ${res.status}`)
  }
  return res.json()
}

export function maskCredential(value: string, visibleChars = 4): string {
  if (!value) return '***'
  if (value.length <= visibleChars) return '*'.repeat(value.length)
  return value.slice(0, visibleChars) + '*'.repeat(value.length - visibleChars)
}
