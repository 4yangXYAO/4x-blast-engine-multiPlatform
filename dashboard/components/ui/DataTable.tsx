'use client'

import { useState, useMemo, useCallback } from 'react'
import { ChevronUp, ChevronDown, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { LoadingSkeleton } from './LoadingSkeleton'
import { EmptyState } from './EmptyState'

export interface Column<T> {
  key: keyof T | string
  header: string
  render?: (row: T) => React.ReactNode
  sortable?: boolean
  className?: string
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  isLoading?: boolean
  onRowClick?: (row: T) => void
  actions?: (row: T) => React.ReactNode
  searchable?: boolean
  searchPlaceholder?: string
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: React.ReactNode
  pagination?: {
    page: number
    limit: number
    total: number
    onPageChange: (page: number) => void
    onLimitChange?: (limit: number) => void
  }
}

type SortDirection = 'asc' | 'desc' | null

export function DataTable<T = Record<string, unknown>>({
  columns,
  data,
  isLoading,
  onRowClick,
  actions,
  searchable,
  searchPlaceholder = 'Search...',
  emptyTitle = 'No data',
  emptyDescription = 'No records found.',
  emptyAction,
  pagination,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDirection>(null)

   const filtered = useMemo(() => {
     if (!search) return data
     const q = search.toLowerCase()
     return data.filter((row) =>
       Object.values(row as Record<string, unknown>).some((v) => String(v ?? '').toLowerCase().includes(q))
     )
   }, [data, search])

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey as keyof T]
      const bVal = b[sortKey as keyof T]
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [filtered, sortKey, sortDir])

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc'))
      if (sortDir === 'desc') setSortKey(null)
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const renderMobileCard = useCallback(
    (row: T, idx: number) => (
      <div
        key={idx}
        className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-3 cursor-pointer active:scale-95 transition-transform"
        onClick={() => onRowClick?.(row)}
      >
        {columns.map((col) => (
          <div key={String(col.key)} className="flex justify-between py-1 border-b border-slate-700 last:border-0">
            <span className="text-slate-400 text-sm">{col.header}</span>
            <span className="text-slate-100 text-sm font-medium">
              {col.render ? col.render(row) : String(row[col.key as keyof T] ?? '')}
            </span>
          </div>
        ))}
        {actions && <div className="mt-3 pt-3 border-t border-slate-700">{actions(row)}</div>}
      </div>
    ),
    [onRowClick, actions, columns]
  )

  if (isLoading) return <LoadingSkeleton variant="table" count={5} />

  return (
    <div>
      {searchable && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-700">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`px-4 py-3 text-slate-400 text-sm font-medium ${col.sortable ? 'cursor-pointer hover:text-slate-200' : ''} ${col.className ?? ''}`}
                  onClick={() => col.sortable && handleSort(String(col.key))}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortKey === col.key && (
                      <span>{sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}</span>
                    )}
                  </span>
                </th>
              ))}
              {actions && <th className="px-4 py-3 text-slate-400 text-sm font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)}>
                  <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
                </td>
              </tr>
            ) : (
              sorted.map((row, idx) => (
                <tr
                  key={idx}
                  className="border-b border-slate-700 hover:bg-slate-800/50 transition-colors cursor-pointer"
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td key={String(col.key)} className={`px-4 py-3 text-slate-100 text-sm ${col.className ?? ''}`}>
                      {col.render ? col.render(row) : String(row[col.key as keyof T] ?? '')}
                    </td>
                  ))}
                  {actions && <td className="px-4 py-3">{actions(row)}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden">
        {sorted.length === 0 ? (
          <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
        ) : (
          sorted.map((row, idx) => renderMobileCard(row, idx))
        )}
      </div>

      {pagination && (
        <div className="flex items-center justify-between mt-4 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-100"
              value={pagination.limit}
              onChange={(e) => pagination.onLimitChange?.(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 bg-slate-800 border border-slate-700 rounded disabled:opacity-50 min-h-[44px] min-w-[44px]"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>
              Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
            </span>
            <button
              className="px-3 py-1 bg-slate-800 border border-slate-700 rounded disabled:opacity-50 min-h-[44px] min-w-[44px]"
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataTable
