'use client'

import * as React from 'react'
import { Check } from 'lucide-react'

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void
}

export function Checkbox({ className, checked, onCheckedChange, ...props }: CheckboxProps) {
  return (
    <div
      className={`
        peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background 
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 
        disabled:cursor-not-allowed disabled:opacity-50 
        ${checked ? 'bg-primary text-primary-foreground' : 'bg-transparent'}
        ${className}
      `}
      onClick={() => onCheckedChange?.(!checked)}
    >
      {checked && <Check className="h-4 w-4" />}
    </div>
  )
}

export default Checkbox
