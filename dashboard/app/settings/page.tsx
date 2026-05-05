'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import FormField from '@/components/ui/FormField'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { toast } from 'sonner'
import { Save, Trash2 } from 'lucide-react'
import { INTEGRATION_FIELDS, CONFIG_FIELDS } from '@/lib/constants'

export default function SettingsPage() {
  const [clearConfirm, setClearConfirm] = useState(false)

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get('/v1/settings/integrations')).data,
  })

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => api.put('/v1/settings/integrations', payload),
    onSuccess: () => toast.success('Settings saved!'),
    onError: (e: any) => toast.error(e?.message ?? 'Failed'),
  })

  if (isLoading) return <LoadingSkeleton count={4} variant="card" />

  const configuredCount = INTEGRATION_FIELDS.filter((f) => settings?.configured?.[f.key])?.length ?? 0

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Settings</h1>
      <Card className="bg-slate-800 border-slate-700 mb-4">
        <CardHeader><CardTitle>Integration Tokens</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400 mb-4">
            Configured: {configuredCount}/{INTEGRATION_FIELDS.length}
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const form = new FormData(e.target as HTMLFormElement)
              const payload: any = {}
              INTEGRATION_FIELDS.forEach((f) => {
                const val = form.get(f.key) as string
                if (val) payload[f.key] = val
              })
              saveMutation.mutate(payload)
            }}
            className="space-y-4"
          >
            {INTEGRATION_FIELDS.map((f) => (
              <FormField
                key={f.key}
                label={f.label}
                name={f.key}
                type="password"
                placeholder=""
                helperText={settings?.configured?.[f.key] ? 'Saved' : 'Not set'}
              />
            ))}
            <Button type="submit" disabled={saveMutation.isPending}>
              <Save className="w-4 h-4 mr-2" /> Save Tokens
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card className="bg-slate-800 border-slate-700 border-red-500/30">
        <CardHeader><CardTitle className="text-red-400">Danger Zone</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400 mb-4">Clear all data. This action cannot be undone.</p>
          <Button variant="destructive" onClick={() => setClearConfirm(true)}>
            <Trash2 className="w-4 h-4 mr-2" /> Clear All Data
          </Button>
        </CardContent>
      </Card>
      <ConfirmDialog
        open={clearConfirm}
        onOpenChange={setClearConfirm}
        title="Clear All Data"
        description="This will permanently delete all data."
        confirmText="Clear All"
        variant="danger"
        onConfirm={() => {
          toast.success('Data cleared (stub)')
          setClearConfirm(false)
        }}
      />
    </div>
  )
}
