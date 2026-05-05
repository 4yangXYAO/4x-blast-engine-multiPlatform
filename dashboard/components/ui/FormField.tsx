'use client'

export interface FormFieldProps {
  label: string
  name: string
  type?: 'text' | 'email' | 'url' | 'number' | 'password' | 'textarea' | 'select'
  placeholder?: string
  helperText?: string
  options?: { value: string; label: string }[]
  error?: string
  className?: string
  onChange?: (e: any) => void
}

export function FormField({
  label,
  name,
  type = 'text',
  placeholder,
  helperText,
  options,
  error,
  className = '',
}: FormFieldProps) {
  const baseClass = `w-full px-3 py-2 bg-slate-800 border rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${error ? 'border-red-500' : 'border-slate-700'} ${className}`

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-slate-300 mb-1">
        {label}
      </label>
      {type === 'textarea' ? (
        <textarea
          className={`${baseClass} min-h-[100px] resize-y`}
          placeholder={placeholder}
          aria-invalid={!!error}
          name={name}
        />
      ) : type === 'select' ? (
        <select className={baseClass} name={name} aria-invalid={!!error}>
          <option value="">Select...</option>
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          className={baseClass}
          placeholder={placeholder}
          aria-invalid={!!error}
          name={name}
        />
      )}
      {helperText && !error && <p className="mt-1 text-xs text-slate-400">{helperText}</p>}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  )
}

export default FormField
