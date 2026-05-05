'use client'

import { type ReactNode } from 'react'

export function Card({ className = '', children, ...props }: { className?: string; children?: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-xl border bg-slate-800 border-slate-700 text-slate-100 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ className = '', children, ...props }: { className?: string; children?: ReactNode }) {
  return <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props}>{children}</div>
}

export function CardTitle({ className = '', children, ...props }: { className?: string; children?: ReactNode }) {
  return <h3 className={`font-semibold leading-none tracking-tight text-lg ${className}`} {...props}>{children}</h3>
}

export function CardContent({ className = '', children, ...props }: { className?: string; children?: ReactNode }) {
  return <div className={`p-6 pt-0 ${className}`} {...props}>{children}</div>
}

export default Card
