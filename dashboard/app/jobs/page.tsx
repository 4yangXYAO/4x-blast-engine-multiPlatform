'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import { PlatformIcon } from '@/components/ui/PlatformIcon'
import { Plus, Play, Pause, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'

export default function JobsPage() {
  const queryClient = useQueryClient()
  const [pollCount, setPollCount] = useState(0)

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => (await api.get('/v1/jobs')).data,
    refetchInterval: 3000,
    staleTime: 0,
  })

  const retryMutation = useMutation({
    mutationFn: async (id: string) => api.post(`/v1/jobs/${id}/retry`, {}),
    onSuccess: () => {
      toast.success('Job retried')
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })

  useEffect(() => {
    const interval = setInterval(() => setPollCount((c) => c + 1), 3000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading) return <LoadingSkeleton count={5} variant="table" />

  const running = jobs?.filter((j: any) => j.status === 'running')?.length ?? 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-bold">Jobs</h1>
          <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" style={{ animationDuration: '3s' }} />
          <span className="text-xs text-slate-500">Updated {pollCount * 3}s ago</span>
        </div>
      </div>

      {jobs?.length === 0 ? (
        <Card className="bg-slate-800 border-slate-700 p-8">
          <p className="text-center text-slate-400">No jobs yet. Trigger a blast to create jobs.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs?.map((job: any) => (
            <Card key={job.id} className="bg-slate-800 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <PlatformIcon platform={job.platform} />
                    <div>
                      <p className="text-sm font-medium text-slate-100">{job.type || 'Job'}</p>
                      <p className="text-xs text-slate-400">
                        {job.platform} • {formatDate(job.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={job.status === 'completed' ? 'success' : job.status === 'running' ? 'warning' : job.status === 'failed' ? 'error' : 'neutral'} text={job.status} />
                    {job.status === 'failed' && (
                      <Button variant="outline" size="sm" onClick={() => retryMutation.mutate(job.id)}>
                        Retry
                      </Button>
                    )}
                  </div>
                </div>
                {job.status === 'running' && (
                  <div className="mt-3">
                    <Progress value={job.progress || 0} className="h-2" />
                    <p className="text-xs text-slate-400 mt-1">{job.progress || 0}% complete</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
