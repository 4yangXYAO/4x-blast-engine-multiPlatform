'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  MessageSquareText,
  Users,
  FileText,
  Send,
  History,
  BarChart3,
  Settings,
  Menu,
  ChevronLeft,
  NotebookText,
} from 'lucide-react'
import { Button } from '../ui/Button'
import { PlatformIcon } from './PlatformIcon'
import type { PlatformName } from './PlatformIcon'

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

interface NavItem {
  label: string
  href: string
  icon: typeof LayoutDashboard
  platform?: PlatformName
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Campaigns', href: '/campaigns', icon: NotebookText },
  { label: 'Accounts', href: '/accounts', icon: Users },
  { label: 'Templates', href: '/templates', icon: FileText },
  { label: 'Blast Runner', href: '/blast-runner', icon: Send },
  { label: 'Jobs', href: '/jobs', icon: History },
  { label: 'Leads', href: '/leads', icon: MessageSquareText },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/settings', icon: Settings },
]

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-700 flex items-center gap-2">
        <Send className="w-5 h-5 text-emerald-400" />
        <span className="font-bold text-slate-100">JOKI BLAST</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors min-h-[44px]
                ${isActive
                  ? 'bg-slate-800 text-emerald-400 border-l-4 border-emerald-500 font-medium'
                  : 'text-slate-300 hover:bg-slate-800/50 border-l-4 border-transparent'}
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="sidebar-label">{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-slate-700 text-xs text-slate-500">
        v0.1.0
      </div>
    </div>
  )
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col fixed left-0 top-0 h-screen bg-slate-900 border-r border-slate-700 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile sheet */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <div className="absolute left-0 top-0 h-full w-72 bg-slate-900 border-r border-slate-700">
            <SidebarContent onClose={onClose} />
          </div>
        </div>
      )}
    </>
  )
}

export function MobileNav({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggle}
      className="md:hidden min-h-[44px] min-w-[44px]"
      aria-label="Toggle sidebar"
    >
      <Menu className="w-5 h-5" />
    </Button>
  )
}

export function CollapseButton({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggle}
      className="hidden md:flex min-h-[44px] min-w-[44px]"
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
    </Button>
  )
}

export default Sidebar
