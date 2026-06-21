'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { useCreateSchedule, useTemplates, useAccounts } from '@/lib/hooks'

interface CreateScheduleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateScheduleModal({ open, onOpenChange }: CreateScheduleModalProps) {
  const [cron, setCron] = useState('0 9 * * *') // Default 9 AM daily
  const [templateId, setTemplateId] = useState('')
  const [accountId, setAccountId] = useState('')

  const { data: templates } = useTemplates()
  const { data: accounts } = useAccounts()
  const createMutation = useCreateSchedule()

  const handleCreate = () => {
    if (!cron || !templateId || !accountId) return

    const account = accounts?.find((a: any) => a.id === accountId)

    createMutation.mutate({
      cron,
      template_id: templateId,
      account_id: accountId,
      platform: account?.platform
    }, {
      onSuccess: () => {
        onOpenChange(false)
        setTemplateId('')
        setAccountId('')
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-950 border-slate-800 text-slate-100 max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Schedule</DialogTitle>
          <DialogDescription>
            Schedule an automated blast session using a template and account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <FormField
            label="Cron Expression"
            name="cron"
            value={cron}
            onChange={(e: any) => setCron(e.target.value)}
            helperText="Standard cron format (min hour day month dow)"
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Message Template</label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger className="bg-slate-900 border-slate-800">
                <SelectValue placeholder="Select template..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                {templates?.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Execute Account</label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger className="bg-slate-900 border-slate-800">
                <SelectValue placeholder="Select account..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                {accounts?.map((acc: any) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.platform}: {acc.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={createMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!cron || !templateId || !accountId || createMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            {createMutation.isPending ? 'Scheduling...' : 'Schedule Blast'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
