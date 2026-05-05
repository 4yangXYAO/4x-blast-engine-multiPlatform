'use client'

interface ProgressProps {
  value: number
  className?: string
  indicatorClassName?: string
}

export function Progress({ value, className = '', indicatorClassName = '' }: ProgressProps) {
  return (
    <div className={`relative h-2 w-full overflow-hidden rounded-full bg-slate-700 ${className}`}>
      <div
        className={`h-full bg-emerald-500 transition-all ${indicatorClassName}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

export default Progress
