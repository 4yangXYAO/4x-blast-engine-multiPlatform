'use client'

import { type ReactNode } from 'react'
import { X } from 'lucide-react'

export function Dialog({ open, children, onOpenChange }: { open: boolean; children: ReactNode; onOpenChange: (open: boolean) => void }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80" onClick={() => onOpenChange(false)} />
      <div className="relative z-50 w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-lg">
        {children}
      </div>
    </div>
  )
}

export function DialogContent({ className = '', children }: { className?: string; children?: ReactNode }) {
  return <div className={`p-6 ${className}`}>{children}</div>
}

export function DialogHeader({ className = '', children }: { className?: string; children?: ReactNode }) {
  return <div className={`mb-4 ${className}`}>{children}</div>
}

export function DialogTitle({ className = '', children }: { className?: string; children?: ReactNode }) {
  return <h2 className={`text-lg font-semibold text-slate-100 ${className}`}>{children}</h2>
}

export function DialogDescription({ className = '', children }: { className?: string; children?: ReactNode }) {
  return <p className={`text-sm text-slate-400 ${className}`}>{children}</p>
}

export function DialogFooter({ className = '', children }: { className?: string; children?: ReactNode }) {
  return <div className={`flex justify-end gap-2 mt-6 ${className}`}>{children}</div>
}

export default Dialog
