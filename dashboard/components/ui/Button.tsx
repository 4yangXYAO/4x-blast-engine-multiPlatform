'use client'

import { type ButtonHTMLAttributes, type ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'icon'
  loading?: boolean
  asChild?: boolean
}

export function Button({
  variant = 'default',
  size = 'default',
  loading,
  asChild,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-h-[44px] min-w-[44px]'
  const variants = {
    default: 'bg-emerald-500 text-white hover:bg-emerald-600',
    destructive: 'bg-red-500 text-white hover:bg-red-600',
    outline: 'border border-slate-700 bg-transparent hover:bg-slate-800 text-slate-100',
    ghost: 'hover:bg-slate-800 text-slate-100',
    link: 'text-emerald-400 underline-offset-4 hover:underline',
  }
  const sizes = {
    default: 'px-4 py-2 text-sm',
    sm: 'px-3 py-1 text-xs',
    icon: 'h-8 w-8 p-0',
  }
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="mr-2 animate-spin">⟳</span>}
      {children}
    </button>
  )
}

export default Button
