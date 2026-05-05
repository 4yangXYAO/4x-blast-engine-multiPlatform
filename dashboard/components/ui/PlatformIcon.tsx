'use client'

import type { SVGProps } from 'react'

export type PlatformName = 'twitter' | 'instagram' | 'threads' | 'facebook' | 'facebook-page' | 'whatsapp' | 'telegram' | 'youtube' | 'linkedin' | 'other'

interface PlatformIconProps {
  platform: string
  className?: string
}

const iconMap: Record<string, string> = {
  twitter: '�',
  x: '�',
  instagram: '📷',
  threads: '💬',
  facebook: '📘',
  'facebook-page': '📘',
  whatsapp: '💬',
  telegram: '✈️',
  youtube: '🎥',
  linkedin: '💼',
  globe: '🌐',
}

const colorMap: Record<string, string> = {
  twitter: 'text-sky-400',
  x: 'text-sky-400',
  instagram: 'text-pink-400',
  threads: 'text-purple-400',
  facebook: 'text-blue-500',
  'facebook-page': 'text-blue-500',
  whatsapp: 'text-green-400',
  telegram: 'text-blue-400',
  youtube: 'text-red-400',
  linkedin: 'text-blue-600',
  globe: 'text-slate-400',
}

export function PlatformIcon({ platform, className = 'w-4 h-4' }: PlatformIconProps) {
  const key = platform.toLowerCase()
  const emoji = iconMap[key] ?? '🌐'
  const color = colorMap[key] ?? 'text-slate-400'
  return <span className={`${className} ${color} flex items-center justify-center`}>{emoji}</span>
}

export default PlatformIcon
