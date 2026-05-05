'use client'

import { type ReactNode, useState, useCallback } from 'react'

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: ReactNode
}

interface SelectContextValue {
  value: string
  onValueChange: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
}

import { createContext, useContext } from 'react'

const SelectContext = createContext<SelectContextValue | null>(null)

export function Select({ value, onValueChange, children }: SelectProps) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(value ?? '')
  const currentValue = value ?? selected
  const change = useCallback(
    (v: string) => {
      if (!value) setSelected(v)
      onValueChange?.(v)
      setOpen(false)
    },
    [value, onValueChange]
  )
  return (
    <SelectContext.Provider value={{ value: currentValue, onValueChange: change, open, setOpen }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  )
}

export function SelectTrigger({ className = '', children }: { className?: string; children?: ReactNode }) {
  const ctx = useContext(SelectContext)
  return (
    <button
      className={`flex items-center justify-between px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 min-h-[44px] ${className}`}
      onClick={() => ctx?.setOpen(!ctx.open)}
      type="button"
    >
      {children}
      <span className="ml-2">▼</span>
    </button>
  )
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const ctx = useContext(SelectContext)
  return <span>{ctx?.value || placeholder}</span>
}

export function SelectContent({ className = '', children }: { className?: string; children?: ReactNode }) {
  const ctx = useContext(SelectContext)
  if (!ctx?.open) return null
  return (
    <div className={`absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto ${className}`}>
      {children}
    </div>
  )
}

export function SelectItem({ value, children, className = '' }: { value: string; className?: string; children?: ReactNode }) {
  const ctx = useContext(SelectContext)
  const isSelected = ctx?.value === value
  return (
    <div
      className={`px-3 py-2 cursor-pointer hover:bg-slate-700 text-sm ${isSelected ? 'text-emerald-400 bg-slate-700/50' : 'text-slate-100'} ${className}`}
      onClick={() => ctx?.onValueChange(value)}
    >
      {children}
    </div>
  )
}

export default Select
