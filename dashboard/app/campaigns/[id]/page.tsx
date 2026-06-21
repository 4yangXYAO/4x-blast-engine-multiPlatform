'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import { CopyButton } from '@/components/ui/CopyButton'
import { PlatformIcon } from '@/components/ui/PlatformIcon'
import { FormField } from '@/components/ui/FormField'
import { useBlastCampaign, useUpdateCampaign, useAnalytics, type Campaign } from '@/lib/hooks'
import { toast } from 'sonner'
import { Send, BarChart3, Pencil, Save, X, ChevronLeft, Calendar, History } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

export default function CampaignDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<Campaign>>({})
  const [blastLoading, setBlastLoading] = useState(false)

  const { data: campaign, isLoading } = useQuery<Campaign>({
    queryKey: ['campaign', id],
    queryFn: async () => (await api.get(`/v1/campaigns/${id}`)).data,
    enabled: !!id,
  })

  const { data: stats } = useAnalytics(id as string)
  const { blastMutation } = useBlastCampaign()
  const { mutate: blast } = blastMutation
  const updateMutation = useUpdateCampaign()

  useEffect(() => {
    if (campaign) {
      setEditData(campaign)
    }
  }, [campaign])

  const handleSave = () => {
    if (!id || typeof id !== 'string') return
    updateMutation.mutate({
      id,
      ...editData,
    }, {
      onSuccess: () => setIsEditing(false)
    })
  }

  const handleBlast = () => {
    setBlastLoading(true)
    const accountIds: Record<string, string> = {}
    if (campaign?.platforms) {
      for (const p of campaign.platforms) {
        accountIds[p] = ''
      }
    }
    blast(
      { campaignId: id as string, accountIds },
      {
        onSuccess: () => toast.success('Blast started'),
        onSettled: () => setBlastLoading(false),
      }
    )
  }

  if (isLoading) return <LoadingSkeleton count={3} />
  if (!campaign) return <p className="text-slate-400">Campaign not found</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/campaigns">
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-100">{campaign.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={campaign.status as any} text={campaign.status} />
              <span className="text-xs text-slate-500 italic">Created {formatDate(campaign.created_at ?? '')}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="ghost" onClick={() => {
                setIsEditing(false)
                setEditData(campaign)
              }}>
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending} className="bg-emerald-600 hover:bg-emerald-500">
                <Save className="w-4 h-4 mr-2" /> Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setIsEditing(true)} variant="outline" className="border-slate-700 bg-slate-900/50 hover:bg-slate-800">
                <Pencil className="w-4 h-4 mr-2" /> Edit
              </Button>
              <Button onClick={handleBlast} disabled={blastLoading} className="bg-indigo-600 hover:bg-indigo-500">
                <Send className="w-4 h-4 mr-2" />
                {blastLoading ? 'Blasting...' : 'Blast Now'}
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-slate-900 border-slate-800 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-slate-800">Overview</TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-slate-800">Analytics</TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-slate-800">Blast History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-slate-800/50 bg-slate-950/50">
                <CardHeader>
                  <CardTitle>Content</CardTitle>
                  <CardDescription>Multi-platform message content.</CardDescription>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <FormField
                      label="Campaign Content"
                      name="content"
                      type="textarea"
                      value={editData.content}
                      onChange={(e: any) => setEditData({...editData, content: e.target.value})}
                      className="min-h-[150px]"
                    />
                  ) : (
                    <div className="text-sm text-slate-300 bg-slate-900/50 p-4 rounded-xl border border-slate-800/50 whitespace-pre-wrap">
                      {campaign.content || 'No content defined.'}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-800/50 bg-slate-950/50">
                <CardHeader>
                  <CardTitle>Call To Action</CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <FormField
                      label="CTA Link / URL"
                      name="cta_link"
                      value={editData.cta_link}
                      onChange={(e: any) => setEditData({...editData, cta_link: e.target.value})}
                    />
                  ) : (
                    <div className="flex items-center justify-between p-4 bg-slate-900/30 rounded-xl border border-slate-800/50">
                      <div className="overflow-hidden">
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Destination URL</p>
                        <a href={campaign.cta_link} target="_blank" className="text-sm text-emerald-400 hover:underline truncate block">
                          {campaign.cta_link || 'No link provided.'}
                        </a>
                      </div>
                      {campaign.cta_link && <CopyButton text={campaign.cta_link} />}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-slate-800/50 bg-slate-950/50">
                <CardHeader>
                  <CardTitle>Platforms</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(campaign.platforms ?? []).map((p: string) => (
                      <span key={p} className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-full text-xs font-medium text-slate-300 shadow-sm">
                        <PlatformIcon platform={p} className="w-3.5 h-3.5" /> 
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </span>
                    ))}
                    {campaign.platforms?.length === 0 && <p className="text-sm text-slate-500 italic">No platforms selected.</p>}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-800/50 bg-slate-950/50 overflow-hidden">
                <CardHeader>
                  <CardTitle>Performance Snapshot</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid grid-cols-2 border-t border-slate-800/50">
                    <div className="p-4 border-r border-slate-800/50 text-center">
                      <p className="text-2xl font-bold text-slate-100">{stats?.totalSessions || 0}</p>
                      <p className="text-[10px] uppercase text-slate-500 font-bold tracking-widest mt-1">Total Blasts</p>
                    </div>
                    <div className="p-4 text-center">
                      <p className="text-2xl font-bold text-emerald-500">{stats?.totalRequests || 0}</p>
                      <p className="text-[10px] uppercase text-slate-500 font-bold tracking-widest mt-1">Total Views</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="bg-slate-950/50 border-slate-800/50 p-12 text-center">
            <BarChart3 className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-300">Advanced Analytics</h3>
            <p className="text-slate-500 max-w-sm mx-auto mt-2">
              Deep dive analytics for {campaign.name} are being aggregated. 
              Check the global Analytics page for real-time traffic.
            </p>
            <Button variant="outline" className="mt-6 border-slate-700" asChild>
              <Link href="/analytics">Go to global analytics</Link>
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="bg-slate-950/50 border-slate-800/50 p-12 text-center">
            <History className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-300">Blast History</h3>
            <p className="text-slate-500 max-w-sm mx-auto mt-2">
              Historical logs for this campaign will appear as automation jobs complete.
            </p>
            <Button variant="outline" className="mt-6 border-slate-700" asChild>
              <Link href="/jobs">View Jobs Queue</Link>
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
