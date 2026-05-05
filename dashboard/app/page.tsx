'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { LayoutDashboard, Send, MessageSquare, Users, BarChart3, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import type { PlatformName } from '@/components/ui/PlatformIcon'
import { PlatformIcon } from '@/components/ui/PlatformIcon'

const platformKeys: PlatformName[] = ['twitter', 'facebook', 'instagram', 'threads', 'whatsapp', 'telegram']

export default function OverviewPage() {
  const { data: campaigns, isLoading: cLoad } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => (await api.get('/v1/campaigns')).data,
  })

  const { data: jobs, isLoading: jLoad } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => (await api.get('/v1/jobs')).data,
    refetchInterval: 3000,
  })

  const { data: adapters, isLoading: aLoad } = useQuery({
    queryKey: ['adapters'],
    queryFn: async () => (await api.get('/v1/adapters')).data,
  })

  const isLoading = cLoad || jLoad || aLoad

  if (isLoading) return <LoadingSkeleton count={5} />

  const activeCampaigns = campaigns?.filter((c: any) => c.status === 'active')?.length ?? 0
  const runningJobs = jobs?.filter((j: any) => j.status === 'running')?.length ?? 0
  const completedToday = jobs?.filter((j: any) => {
    const d = new Date(j.created_at)
    const today = new Date()
    return d.toDateString() === today.toDateString() && j.status === 'completed'
  })?.length ?? 0
  const failedJobs = jobs?.filter((j: any) => j.status === 'failed')?.length ?? 0

  const recentActivity = [...(jobs ?? [])]
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">Active Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-400">{activeCampaigns}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">Jobs Running</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-400">{runningJobs}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">Completed Today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-400">{completedToday}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">Failed Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-400">{failedJobs}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h2 className="text-lg font-medium mb-3">Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <EmptyState icon="message" title="No activity yet" description="Jobs will appear here when campaigns run" />
          ) : (
            <div className="space-y-2">
              {recentActivity.map((job: any) => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-2">
                    <PlatformIcon platform={job.platform} />
                    <span className="text-sm">{job.type || 'job'}</span>
                  </div>
                  <StatusBadge status={job.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-medium mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Button asChild>
              <Link href="/campaigns/new" className="flex items-center gap-2">
                <Plus className="w-4 h-4" /> New Campaign
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/accounts/new" className="flex items-center gap-2">
                <Users className="w-4 h-4" /> Add Account
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/blast-runner" className="flex items-center gap-2">
                <Send className="w-4 h-4" /> Run Blast
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/leads" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> View Leads
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-3">Platform Health</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {platformKeys.map((platform) => {
            const adapter = adapters?.adapters?.find((a: any) => a.platform === platform)
            return (
              <Card key={platform} className="bg-slate-800 border-slate-700 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <PlatformIcon platform={platform} />
                  <span className="text-sm capitalize">{platform}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${adapter?.healthy ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <span className="text-xs text-slate-400">
                    {adapter?.healthy ? 'Online' : 'Offline'}
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
