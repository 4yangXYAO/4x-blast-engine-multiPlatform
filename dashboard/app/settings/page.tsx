'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import FormField from '@/components/ui/FormField'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { toast } from 'sonner'
import { Save, Trash2 } from 'lucide-react'
import { INTEGRATION_FIELDS, CONFIG_FIELDS } from '@/lib/constants'
import type { ErrorResponse } from '@/lib/types'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'

export default function SettingsPage() {
  const [clearConfirm, setClearConfirm] = useState(false)

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get('/v1/settings/integrations')).data,
  })

  const saveMutation = useMutation({
    mutationFn: async (payload: Record<string, string>) => api.put('/v1/settings/integrations', payload),
    onSuccess: () => toast.success('Settings saved!'),
    onError: (e: ErrorResponse | Error) => {
      const message = e instanceof Error ? e.message : (e?.message ?? e?.error ?? 'Failed')
      toast.error(message)
    },
  })

  if (isLoading) return <LoadingSkeleton count={4} variant="card" />

  const configuredCount = INTEGRATION_FIELDS.filter((f) => settings?.configured?.[f.key])?.length ?? 0

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-slate-100">Settings</h1>
      
      <Tabs defaultValue="integrations" className="space-y-6">
        <TabsList className="bg-slate-900 border-slate-800 p-1">
          <TabsTrigger value="integrations" className="data-[state=active]:bg-slate-800">Integrations</TabsTrigger>
          <TabsTrigger value="webhooks" className="data-[state=active]:bg-slate-800">Webhooks</TabsTrigger>
          <TabsTrigger value="advanced" className="data-[state=active]:bg-slate-800 text-red-400">System</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations">
          <Card className="bg-slate-950/50 border-slate-800/50">
            <CardHeader>
              <CardTitle>Integration Tokens</CardTitle>
              <CardDescription>Configure your platform API keys and access tokens.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-6">
                Connected: {configuredCount}/{INTEGRATION_FIELDS.filter(f => f.key !== 'WEBHOOK_URL').length}
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const form = new FormData(e.target as HTMLFormElement)
                  const payload: Record<string, string> = {}
                  INTEGRATION_FIELDS.filter(f => f.key !== 'WEBHOOK_URL').forEach((f) => {
                    const val = form.get(f.key) as string
                    if (val) payload[f.key] = val
                  })
                  saveMutation.mutate(payload)
                }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {INTEGRATION_FIELDS.filter(f => f.key !== 'WEBHOOK_URL').map((f) => (
                    <FormField
                      key={f.key}
                      label={f.label}
                      name={f.key}
                      type="password"
                      placeholder="••••••••••••••••"
                      helperText={settings?.configured?.[f.key] ? 'Successfully configured' : 'Not configured'}
                    />
                  ))}
                </div>
                <div className="pt-4 border-t border-slate-800/50 flex justify-end">
                  <Button type="submit" disabled={saveMutation.isPending} className="bg-indigo-600 hover:bg-indigo-500">
                    <Save className="w-4 h-4 mr-2" /> Save Tokens
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks">
          <Card className="bg-slate-950/50 border-slate-800/50">
            <CardHeader>
              <CardTitle>Webhook Configuration</CardTitle>
              <CardDescription>Automate your workflow by sending events to external URLs.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const form = new FormData(e.target as HTMLFormElement)
                  const url = form.get('WEBHOOK_URL') as string
                  saveMutation.mutate({ WEBHOOK_URL: url })
                }}
                className="space-y-6"
              >
                <FormField
                  label="Global Webhook URL"
                  name="WEBHOOK_URL"
                  type="url"
                  placeholder="https://your-server.com/webhook"
                  defaultValue={settings?.configured?.WEBHOOK_URL || ''}
                  helperText="Events like campaign status changes and blast results will be sent here."
                />
                <div className="pt-4 border-t border-slate-800/50 flex justify-end">
                  <Button type="submit" disabled={saveMutation.isPending} className="bg-indigo-600 hover:bg-indigo-500">
                    <Save className="w-4 h-4 mr-2" /> Save Webhook
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced">
          <Card className="bg-slate-950/30 border-red-900/20">
            <CardHeader>
              <CardTitle className="text-red-400">System Danger Zone</CardTitle>
              <CardDescription>High-risk actions that cannot be undone.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-red-950/20 border border-red-900/30 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-red-200">Reset System Database</p>
                  <p className="text-xs text-red-400/70 mt-1">This will wipe all accounts, campaigns, and blast history.</p>
                </div>
                <Button variant="destructive" onClick={() => setClearConfirm(true)} size="sm">
                  <Trash2 className="w-4 h-4 mr-2" /> Wipe Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={clearConfirm}
        onOpenChange={setClearConfirm}
        title="Wipe Entire Database?"
        description="This action is CRITICAL and cannot be reversed. You will lose all configured accounts and campaigns."
        confirmText="Yes, Wipe Everything"
        variant="danger"
        onConfirm={() => {
          toast.success('System reset requested (implementation pending)')
          setClearConfirm(false)
        }}
      />
    </div>
  )
}
