'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

export interface CopyButtonProps {
  text: string
  displayText?: string
  className?: string
}

export function CopyButton({ text, displayText, className = '' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-slate-700 transition-colors min-h-[44px] min-w-[44px] ${className}`}
      aria-label={`Copy ${displayText ?? text}`}
    >
      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
      {displayText && <span className="text-slate-300">{displayText}</span>}
    </button>
  )
}

export function maskCredential(value: string, visibleChars = 4): string {
  if (!value) return '***'
  if (value.length <= visibleChars) return '*'.repeat(value.length)
  return value.slice(0, visibleChars) + '*'.repeat(value.length - visibleChars)
}

export default CopyButton
