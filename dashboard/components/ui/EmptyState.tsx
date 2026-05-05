'use client'

import { Search, Plus, MessageSquare, Users, BarChart3, Settings } from 'lucide-react'

export interface EmptyStateProps {
  icon?: 'search' | 'plus' | 'message' | 'users' | 'chart' | 'settings'
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

const iconMap = {
  search: Search,
  plus: Plus,
  message: MessageSquare,
  users: Users,
  chart: BarChart3,
  settings: Settings,
}

export function EmptyState({ icon = 'search', title, description, action, className = '' }: EmptyStateProps) {
  const Icon = iconMap[icon]
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="p-4 bg-slate-800 rounded-full mb-4">
        <Icon className="w-8 h-8 text-slate-500" />
      </div>
      <h3 className="text-lg font-medium text-slate-300 mb-2">{title}</h3>
      {description && <p className="text-sm text-slate-500 mb-4 max-w-sm">{description}</p>}
      {action}
    </div>
  )
}

export default EmptyState
