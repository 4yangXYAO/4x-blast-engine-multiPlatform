'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import DataTable from '@/components/ui/DataTable'
import type { Column } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import { PlatformIcon } from '@/components/ui/PlatformIcon'
import type { Campaign, ErrorResponse } from '@/lib/types'
import { getStatusBadgeVariant } from '@/lib/utils'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

export default function CampaignsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [platformFilter, setPlatformFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: campaigns, isLoading, refetch } = useQuery<Campaign[]>({
    queryKey: ['campaigns'],
    queryFn: async () => (await api.get('/v1/campaigns')).data,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/v1/campaigns/${id}`)
    },
    onSuccess: () => {
      toast.success('Campaign deleted')
      refetch()
      setDeleteId(null)
    },
    onError: (e: ErrorResponse | Error) => {
      const message = e instanceof Error ? e.message : (e?.message ?? e?.error ?? 'Failed to delete')
      toast.error(message)
    },
  })

  const filtered = (campaigns ?? []).filter((c: Campaign) => {
    if (search && !c.name?.toLowerCase().includes(search.toLowerCase())) return false
    if (platformFilter && !(c.platforms?.includes(platformFilter))) return false
    if (statusFilter && c.status !== statusFilter) return false
    return true
  })

  const columns = [
    { key: 'name' as keyof Campaign, header: 'Name' },
    { key: 'content' as keyof Campaign, header: 'Content', className: 'max-w-[200px] truncate' },
    {
      key: 'platforms' as keyof Campaign,
      header: 'Platforms',
      render: (row: Campaign) => (
        <div className="flex gap-1">
          {(row.platforms ?? []).map((p: string) => (
            <span key={p} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700 rounded text-xs">
              <PlatformIcon platform={p} className="w-3 h-3" /> {p}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'cta_link' as keyof Campaign,
      header: 'CTA Link',
      render: (row: Campaign) => {
        if (!row.cta_link) return '-'
        return (
          <a href={row.cta_link} target="_blank" className="text-emerald-400 hover:underline text-sm">
            {row.cta_link.slice(0, 30)}{row.cta_link.length > 30 ? '...' : ''}
          </a>
        )
      },
    },
    { key: 'status' as keyof Campaign, header: 'Status', render: (row: Campaign) => <StatusBadge status={getStatusBadgeVariant(row.status)} text={row.status} /> },
  ]

  const actions = (row: Campaign) => (
    <div className="flex gap-1">
      <Button variant="ghost" size="icon" asChild>
        <Link href={`/campaigns/${row.id}`}>
          <Pencil className="w-4 h-4" />
        </Link>
      </Button>
      <Button variant="ghost" size="icon" onClick={() => setDeleteId(row.id)}>
        <Trash2 className="w-4 h-4 text-red-400" />
      </Button>
    </div>
  )

  if (isLoading) return <LoadingSkeleton count={5} variant="table" />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Campaigns</h1>
        <Button asChild>
          <Link href="/campaigns/new">
            <Plus className="w-4 h-4 mr-2" /> New Campaign
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          className="flex-1 min-w-[200px] px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="Search campaigns..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
        >
          <option value="">All Platforms</option>
          <option value="twitter">Twitter</option>
          <option value="facebook">Facebook</option>
          <option value="instagram">Instagram</option>
          <option value="threads">Threads</option>
          <option value="whatsapp">WhatsApp</option>
        </select>
        <select
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        onRowClick={(row) => router.push(`/campaigns/${row.id}`)}
        actions={actions}
        searchable={false}
        emptyTitle="Belum ada campaign"
        emptyDescription="Buat campaign pertama!"
        emptyAction={
          <Button asChild>
            <Link href="/campaigns/new">Create Campaign</Link>
          </Button>
        }
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Campaign"
        description="This action cannot be undone. This will permanently delete the campaign."
        confirmText="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteId) {
            deleteMutation.mutate(deleteId)
          }
        }}
      />
    </div>
  )
}
