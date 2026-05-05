'use client'

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export function formatDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

export function maskCredential(value: string, visibleChars = 4): string {
  if (!value) return '***'
  if (value.length <= visibleChars) return '*'.repeat(value.length)
  return value.slice(0, visibleChars) + '*'.repeat(value.length - visibleChars)
}

export function getStatusBadgeVariant(
  status: string
): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  const s = status.toLowerCase()
  if (s === 'active' || s === 'completed' || s === 'posted' || s === 'submitted')
    return 'success'
  if (s === 'running' || s === 'pending' || s === 'queued') return 'warning'
  if (s === 'failed' || s === 'error' || s === 'expired') return 'error'
  if (s === 'new' || s === 'welcome sent') return 'info'
  return 'neutral'
}

export function getPlatformHealth(
  adapters: { adapters?: { name: string; platform: string; healthy: boolean }[] },
  platform: string
): boolean | null {
  if (!adapters?.adapters) return null
  const found = adapters.adapters.find((a: any) => a.platform === platform)
  return found?.healthy ?? null
}

export const dateRanges = {
  today: () => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d.toISOString()
  },
  last7: () => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return d.toISOString()
  },
  last30: () => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString()
  },
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}
