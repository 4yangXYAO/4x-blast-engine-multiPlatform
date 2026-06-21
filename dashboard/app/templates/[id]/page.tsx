'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import { CopyButton } from '@/components/ui/CopyButton'
import { formatDate } from '@/lib/utils'
import { useUpdateTemplate, useTriggerJob, useAccounts, type Template } from '@/lib/hooks'
import { Pencil, Save, X, Zap, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function TemplateDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<Template>>({})
  const [selectedAccountId, setSelectedAccountId] = useState('')

  const { data: template, isLoading } = useQuery<Template>({
    queryKey: ['template', id],
    queryFn: async () => (await api.get(`/v1/templates/${id}`)).data,
    enabled: !!id,
  })

  const { data: accounts } = useAccounts()
  const updateMutation = useUpdateTemplate()
  const triggerMutation = useTriggerJob()

  useEffect(() => {
    if (template) {
      setEditData(template)
    }
  }, [template])

  const handleSave = () => {
    if (!id || typeof id !== 'string') return
    updateMutation.mutate({
      id,
      ...editData,
    }, {
      onSuccess: () => setIsEditing(false)
    })
  }

  const handleTrigger = () => {
    if (!id || typeof id !== 'string' || !selectedAccountId) return
    triggerMutation.mutate({
      template_id: id,
      account_id: selectedAccountId,
      platform: accounts?.find((a: any) => a.id === selectedAccountId)?.platform
    })
  }

  if (isLoading) return <LoadingSkeleton count={3} />
  if (!template) return <p className="text-slate-400">Template not found</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/templates">
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-100">{template.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status="info" text={template.type} />
              <span className="text-xs text-slate-500">ID: {template.id}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="ghost" onClick={() => {
                setIsEditing(false)
                setEditData(template)
              }}>
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending} className="bg-emerald-600 hover:bg-emerald-500">
                <Save className="w-4 h-4 mr-2" /> Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} variant="outline" className="border-slate-700 bg-slate-900/50 hover:bg-slate-800">
              <Pencil className="w-4 h-4 mr-2" /> Edit Template
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-800/50 bg-slate-950/50">
            <CardHeader>
              <CardTitle>Content</CardTitle>
              <CardDescription>The message body that will be sent.</CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <FormField
                  label="Message Content"
                  name="content"
                  type="textarea"
                  value={editData.content}
                  onChange={(e: any) => setEditData({...editData, content: e.target.value})}
                  className="min-h-[200px]"
                />
              ) : (
                <div className="text-sm text-slate-300 bg-slate-900/50 p-4 rounded-xl border border-slate-800/50 whitespace-pre-wrap min-h-[200px]">
                  {template.content}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-800/50 bg-slate-950/50">
            <CardHeader>
              <CardTitle>Trigger On-Demand</CardTitle>
              <CardDescription>Manually send this message to a specific target.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-slate-400 mb-1.5 block">Select Execute Account</label>
                  <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
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
                <div className="flex items-end">
                  <Button 
                    onClick={handleTrigger} 
                    disabled={!selectedAccountId || triggerMutation.isPending}
                    className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                  >
                    <Zap className="w-4 h-4 mr-2" /> Trigger Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-slate-800/50 bg-slate-950/50">
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <FormField
                    label="Template Name"
                    name="name"
                    value={editData.name}
                    onChange={(e: any) => setEditData({...editData, name: e.target.value})}
                  />
                  <FormField
                    label="Type"
                    name="type"
                    value={editData.type}
                    onChange={(e: any) => setEditData({...editData, type: e.target.value})}
                  />
                </>
              ) : (
                <div className="space-y-4">
                  <DetailItem label="Type" value={template.type} />
                  <DetailItem label="Variables" value={template.variables?.join(', ') || '-'} />
                  <DetailItem label="Created" value={template.created_at ? formatDate(template.created_at) : '-'} />
                  <DetailItem label="Updated" value={template.updated_at ? formatDate(template.updated_at) : '-'} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function DetailItem({ label, value }: { label: string, value: string }) {
  return (
    <div>
      <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{label}</span>
      <p className="text-sm text-slate-200 mt-0.5">{value}</p>
    </div>
  )
}
