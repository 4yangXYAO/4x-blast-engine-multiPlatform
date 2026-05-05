'use client'

import { Bell, Activity, ChevronRight } from 'lucide-react'
import type { PlatformName } from '../ui/PlatformIcon'
import { PlatformIcon } from '../ui/PlatformIcon'

interface HeaderProps {
  onMenuToggle?: () => void
  platformHealth?: Record<string, { healthy: boolean }>
  breadcrumb?: string
}

const platformKeys: PlatformName[] = ['twitter', 'facebook', 'instagram', 'threads', 'whatsapp', 'telegram']

export function Header({ onMenuToggle, platformHealth, breadcrumb }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 h-16 border-b border-slate-700 bg-slate-900/95 backdrop-blur flex items-center px-4 gap-3">
      {onMenuToggle && (
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 rounded-lg hover:bg-slate-800 min-h-[44px] min-w-[44px]"
          aria-label="Open menu"
        >
          <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {breadcrumb && (
        <div className="hidden md:flex items-center text-sm text-slate-400">
          <span>Dashboard</span>
          <ChevronRight className="w-3 h-3 mx-1" />
          <span className="text-slate-100">{breadcrumb}</span>
        </div>
      )}

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        {platformHealth && (
          <div className="hidden md:flex items-center gap-2">
            {platformKeys.map((platform) => {
              const health = platformHealth[platform]
              return (
                <div
                  key={platform}
                  className={`w-2 h-2 rounded-full ${health?.healthy ? 'bg-emerald-500' : 'bg-red-500'} tooltip`}
                  data-tip={platform}
                />
              )
            })}
          </div>
        )}

        <button className="relative p-2 rounded-lg hover:bg-slate-800 min-h-[44px] min-w-[44px]" aria-label="Notifications">
          <Bell className="w-5 h-5 text-slate-300" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>
      </div>
    </header>
  )
}

export default Header
