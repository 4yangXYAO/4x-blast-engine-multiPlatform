'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import DataTable from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import { CopyButton, maskCredential } from '@/components/ui/CopyButton'
import { useState } from 'react'
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function TemplatesPage() {
  const queryClient = useQueryClient()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: templates, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => (await api.get('/v1/templates')).data,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/v1/templates/${id}`),
    onSuccess: () => {
      toast.success('Template deleted')
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      setDeleteId(null)
    },
  })

  const columns = [
    {
      key: 'name' as const,
      header: 'Name',
    },
    {
      key: 'content' as const,
      header: 'Preview',
      render: (row: any) => (
        <span className="text-sm text-slate-300 max-w-[300px] truncate block">
          {row.content}
        </span>
      ),
    },
    {
      key: 'type' as const,
      header: 'Type',
      render: (row: any) => <StatusBadge status="info" text={row.type} showIcon={false} />,
    },
    {
      key: 'variables' as const,
      header: 'Variables',
      render: (row: any) => (row.variables ?? []).join(', '),
    },
  ]

  const actions = (row: any) => (
    <div className="flex gap-1">
      <Button variant="ghost" size="icon" asChild>
        <Link href={`/templates/${row.id}`}>
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
        <h1 className="text-2xl md:text-3xl font-bold">Templates</h1>
        <Button asChild>
          <Link href="/templates/new">
            <Plus className="w-4 h-4 mr-2" /> New Template
          </Link>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={templates ?? []}
        actions={actions}
        searchable
        searchPlaceholder="Search templates..."
        emptyTitle="No templates yet"
        emptyDescription="Create your first message template."
        emptyAction={
          <Button asChild>
            <Link href="/templates/new">Create Template</Link>
          </Button>
        }
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Template"
        description="This will permanently delete the template."
        confirmText="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </div>
  )
}
