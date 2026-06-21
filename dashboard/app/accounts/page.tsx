'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, maskCredential } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import DataTable, { type Column } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { CopyButton } from '@/components/ui/CopyButton'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import { PlatformIcon } from '@/components/ui/PlatformIcon'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useState } from 'react'
import { Plus, Eye, Trash2, Key, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import type { Account } from '@/lib/types'
import { EditAccountModal } from '@/components/modals/EditAccountModal'

export default function AccountsPage() {
  const queryClient = useQueryClient()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [revealId, setRevealId] = useState<string | null>(null)
  const [editAccount, setEditAccount] = useState<Account | null>(null)

  const { data: accounts, isLoading } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: async () => (await api.get('/v1/accounts')).data,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/v1/accounts/${id}`),
    onSuccess: () => {
      toast.success('Account deleted')
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      setDeleteId(null)
    },
  })

  const columns = [
    {
      key: 'platform' as const,
      header: 'Platform',
      render: (row: Account) => (
        <div className="flex items-center gap-2">
          <PlatformIcon platform={row.platform} />
          <span className="capitalize">{row.platform}</span>
        </div>
      ),
    },
    {
      key: 'username' as const,
      header: 'Username',
      render: (row: Account) => row.username ?? '-',
    },
    {
      key: 'credentials_encrypted' as const,
      header: 'Credentials',
      render: (row: Account) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs">
            {revealId === row.id ? row.username : maskCredential(row.username ?? '')}
          </span>
          <CopyButton text={row.username ?? ''} displayText="copy" />
          <Button variant="ghost" size="sm" onClick={() => setRevealId(revealId === row.id ? null : row.id)}>
            {revealId === row.id ? 'Hide' : 'Reveal'}
          </Button>
        </div>
      ),
    },
    {
      key: 'status' as const,
      header: 'Status',
      render: (row: Account) => <StatusBadge status={row.status === 'active' ? 'success' : row.status === 'auth_expired' ? 'error' : 'warning'} text={row.status} />,
    },
    {
      key: 'last_used' as const,
      header: 'Last Used',
      render: (row: Account) => row.last_used ?? '-',
    },
   ] as Column<Account>[]

  const actions = (row: Account) => (
    <div className="flex gap-1">
      <Button variant="ghost" size="icon" onClick={() => setEditAccount(row)}>
        <Pencil className="w-4 h-4 text-emerald-400" />
      </Button>
      <Button variant="ghost" size="icon" asChild>
        <Link href={`/accounts/${row.id}`}>
          <Eye className="w-4 h-4" />
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
        <h1 className="text-2xl md:text-3xl font-bold">Accounts</h1>
        <Button asChild>
          <Link href="/accounts/new">
            <Plus className="w-4 h-4 mr-2" /> Add Account
          </Link>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={accounts ?? []}
        actions={actions}
        searchable
        searchPlaceholder="Search accounts..."
        emptyTitle="No accounts yet"
        emptyDescription="Add your first social media account to get started."
        emptyAction={
          <Button asChild>
            <Link href="/accounts/new">Add Account</Link>
          </Button>
        }
      />

      <EditAccountModal 
        account={editAccount}
        open={!!editAccount}
        onOpenChange={(open) => !open && setEditAccount(null)}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Account"
        description="This will permanently delete the account and all associated data."
        confirmText="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteId) deleteMutation.mutate(deleteId)
        }}
      />
    </div>
  )
}
