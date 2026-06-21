'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import DataTable from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Plus, Trash2, Calendar, Clock, Terminal } from 'lucide-react'
import { useSchedules, useDeleteSchedule, useTemplates, useAccounts, type Schedule } from '@/lib/hooks'
import { CreateScheduleModal } from '@/components/modals/CreateScheduleModal'
import { formatDate } from '@/lib/utils'

export default function SchedulesPage() {
  const { data: schedules, isLoading } = useSchedules()
  const { data: templates } = useTemplates()
  const { data: accounts } = useAccounts()
  const deleteMutation = useDeleteSchedule()
  
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const columns = [
    {
      key: 'cron' as const,
      header: 'Frequency',
      render: (row: Schedule) => (
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-mono text-xs bg-slate-800 px-1.5 py-0.5 rounded text-indigo-300">
            {row.cron}
          </span>
        </div>
      ),
    },
    {
      key: 'template_id' as const,
      header: 'Template',
      render: (row: Schedule) => (
        <span className="text-sm font-medium text-slate-300">
          {templates?.find((t: any) => t.id === row.template_id)?.name || row.template_id}
        </span>
      ),
    },
    {
      key: 'account_id' as const,
      header: 'Account',
      render: (row: Schedule) => (
        <span className="text-xs text-slate-400">
          {accounts?.find((a: any) => a.id === row.account_id)?.username || row.account_id}
        </span>
      ),
    },
    {
      key: 'platform' as const,
      header: 'Platform',
      render: (row: Schedule) => <StatusBadge status="info" text={row.platform || 'default'} showIcon={false} />,
    },
    {
      key: 'last_run' as const,
      header: 'Last Run',
      render: (row: Schedule) => (
        <span className="text-xs text-slate-500 italic">
          {row.last_run ? formatDate(row.last_run) : 'Never'}
        </span>
      ),
    },
  ]

  const actions = (row: Schedule) => (
    <Button variant="ghost" size="icon" onClick={() => setDeleteId(row.id)}>
      <Trash2 className="w-4 h-4 text-red-400" />
    </Button>
  )

  if (isLoading) return <LoadingSkeleton count={5} variant="table" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-indigo-500" />
            Schedules
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage automated blast sessions and cron jobs.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="bg-indigo-600 hover:bg-indigo-500">
          <Plus className="w-4 h-4 mr-2" /> New Schedule
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={schedules ?? []}
        actions={actions}
        searchable
        searchPlaceholder="Filter schedules..."
        emptyTitle="No schedules active"
        emptyDescription="Create a schedule to automate your recurring blasts."
        emptyAction={
          <Button onClick={() => setIsCreateOpen(true)}>Create First Schedule</Button>
        }
      />

      <CreateScheduleModal 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen} 
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Stop Schedule?"
        description="This will permanently delete this automated schedule. Recurring blasts will stop."
        confirmText="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteId) {
            deleteMutation.mutate(deleteId, {
              onSuccess: () => setDeleteId(null)
            })
          }
        }}
      />
    </div>
  )
}
