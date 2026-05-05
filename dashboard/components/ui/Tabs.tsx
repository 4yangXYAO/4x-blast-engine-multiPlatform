'use client'

import { type ReactNode, useState, useCallback } from 'react'

interface TabsProps {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  className?: string
  children: ReactNode
}

interface TabsContextValue {
  value: string
  onValueChange: (value: string) => void
}

import { createContext, useContext } from 'react'

const TabsContext = createContext<TabsContextValue | null>(null)

export function Tabs({ defaultValue, value, onValueChange, className = '', children }: TabsProps) {
  const [tab, setTab] = useState(defaultValue ?? '')
  const currentValue = value ?? tab
  const change = useCallback(
    (v: string) => {
      if (!value) setTab(v)
      onValueChange?.(v)
    },
    [value, onValueChange]
  )
  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: change }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`flex border-b border-slate-700 ${className}`}>{children}</div>
}

export function TabsTrigger({ value, className = '', children }: { value: string; className?: string; children: ReactNode }) {
  const ctx = useContext(TabsContext)
  const isActive = ctx?.value === value
  return (
    <button
      className={`px-4 py-2 text-sm transition-colors min-h-[44px]
        ${isActive ? 'text-emerald-400 border-b-2 border-emerald-500 font-medium' : 'text-slate-400 hover:text-slate-200'}
        ${className}`}
      onClick={() => ctx?.onValueChange(value)}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, children }: { value: string; children: ReactNode }) {
  const ctx = useContext(TabsContext)
  if (ctx?.value !== value) return null
  return <div>{children}</div>
}

export default Tabs
