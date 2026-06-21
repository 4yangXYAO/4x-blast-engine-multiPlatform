'use client'

import { useQuery, useMutation, useQueryClient, type QueryFunctionContext } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { api, type AxiosError as ApiError } from './api'
import { toast } from 'sonner'

export interface Schedule {
  id: string
  cron: string
  template_id: string
  account_id: string
  platform: string
  active: boolean
  last_run?: string
}

export interface Template {
  id: string
  name: string
  content: string
  variables: string[]
  type: string
  created_at?: string
  updated_at?: string
}

export interface Account {
  id: string
  platform: string
  username?: string
  status: string
  last_used?: string
}

export interface Campaign {
  id: string
  name: string
  content: string
  cta_link: string
  platforms: string[]
  status: string
  created_at?: string
  updated_at?: string
}

export function useCampaigns() {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const res = await api.get('/v1/campaigns')
      return res.data
    },
    staleTime: 30_000,
  })
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      const res = await api.get(`/v1/campaigns/${id}`)
      return res.data
    },
    enabled: !!id,
    staleTime: 30_000,
  })
}

export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const res = await api.get('/v1/accounts')
      return res.data
    },
    staleTime: 30_000,
  })
}

export function useAccount(id: string) {
  return useQuery({
    queryKey: ['account', id],
    queryFn: async () => {
      const res = await api.get(`/v1/accounts/${id}`)
      return res.data
    },
    enabled: !!id,
    staleTime: 30_000,
  })
}

export function useTemplates() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const res = await api.get('/v1/templates')
      return res.data
    },
    staleTime: 30_000,
  })
}

export function useJobs() {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const res = await api.get('/v1/jobs')
      return res.data
    },
    refetchInterval: 3000,
    staleTime: 0,
  })
}

export function useJob(id: string) {
  return useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      const res = await api.get(`/v1/jobs/${id}`)
      return res.data
    },
    enabled: !!id,
    refetchInterval: 3000,
    staleTime: 0,
  })
}

export function useLeads() {
  return useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const res = await api.get('/v1/webhooks/leads')
      return res.data
    },
    staleTime: 30_000,
  })
}

export function useAnalytics(campaignId?: string, from?: string) {
  return useQuery({
    queryKey: ['analytics', campaignId, from],
    queryFn: async () => {
      let url = campaignId
        ? `/v1/track/stats/${campaignId}`
        : '/v1/track/stats'
      if (from) {
        url += `${url.includes('?') ? '&' : '?'}from=${from}`
      }
      const res = await api.get(url)
      return res.data
    },
    staleTime: 30_000,
  })
}

export function useAdapters() {
  return useQuery({
    queryKey: ['adapters'],
    queryFn: async () => {
      const res = await api.get('/v1/adapters')
      return res.data
    },
    staleTime: 60_000,
  })
}

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/v1/settings/integrations')
      return res.data
    },
    staleTime: 60_000,
  })
}

export function useBlastRunner() {
  const queryClient = useQueryClient()

  const blastMutation = useMutation({
    mutationFn: async (data: {
      platform: string
      accountId: string
      message: string
      maxActions?: number
      searchQuery?: string
    }) => {
      const res = await api.post('/v1/blast/run', data)
      return res.data
    },
  })

  const statusQuery = useQuery({
    queryKey: ['blast-status'],
    queryFn: async () => {
      const res = await api.get('/v1/blast/status')
      return res.data
    },
    refetchInterval: 3000,
    staleTime: 0,
  })

  return { blastMutation, statusQuery }
}

export function useCreateCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      name: string
      content: string
      cta_link: string
      platforms: string[]
    }) => {
      const res = await api.post('/v1/campaigns', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    },
  })
}

export function useCreateAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      platform: string
      username: string
      credentials: string
    }) => {
      const res = await api.post('/v1/accounts', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}

export function useCreateTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      name: string
      content: string
      variables: string[]
      type: string
    }) => {
      const res = await api.post('/v1/templates', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })
}

export function useBlastCampaign() {
  const queryClient = useQueryClient()

  const blastMutation = useMutation({
    mutationFn: async (data: { campaignId: string; accountIds: Record<string, string> }) => {
      const res = await api.post(`/v1/campaigns/${data.campaignId}/blast`, {
        account_ids: data.accountIds,
      })
      return res.data
    },
    onSuccess: () => {
      toast.success('Blast started')
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    },
    onError: (e: ApiError) => toast.error(e?.message ?? 'Blast failed'),
  })

  return { blastMutation }
}
export function useUpdateAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; platform?: string; username?: string; credentials?: string; status?: string }) => {
      const res = await api.put(`/v1/accounts/${id}`, data)
      return res.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['account', variables.id] })
      toast.success('Account updated')
    },
    onError: (e: ApiError) => toast.error(e?.message ?? 'Update failed'),
  })
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; content?: string; variables?: string[]; type?: string }) => {
      const res = await api.put(`/v1/templates/${id}`, data)
      return res.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      queryClient.invalidateQueries({ queryKey: ['template', variables.id] })
      toast.success('Template updated')
    },
    onError: (e: ApiError) => toast.error(e?.message ?? 'Update failed'),
  })
}

export function useTriggerJob() {
  return useMutation({
    mutationFn: async (data: { template_id: string; account_id: string; to?: string; platform?: string; message?: string }) => {
      const res = await api.post('/v1/jobs/trigger', data)
      return res.data
    },
    onSuccess: () => {
      toast.success('Manual job triggered successfully')
    },
    onError: (e: ApiError) => toast.error(e?.message ?? 'Trigger failed'),
  })
}

export function useSchedules() {
  return useQuery({
    queryKey: ['schedules'],
    queryFn: async () => (await api.get('/v1/schedules')).data,
    staleTime: 30_000,
  })
}

export function useCreateSchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { cron: string; template_id: string; account_id: string; platform?: string }) => {
      const res = await api.post('/v1/jobs/schedule', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
      toast.success('Schedule created')
    },
    onError: (e: ApiError) => toast.error(e?.message ?? 'Creation failed'),
  })
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/v1/schedules/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
      toast.success('Schedule deleted')
    },
  })
}

export function useStatus() {
  return useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await api.get('/v1/health')
      return res.data
    },
    refetchInterval: 10000,
    staleTime: 5000,
    retry: false,
  })
}
export function useUpdateCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; description?: string; active?: boolean }) => {
      const res = await api.put(`/v1/campaigns/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast.success('Campaign updated')
    },
    onError: (e: ApiError) => toast.error(e?.message ?? 'Update failed'),
  })
}

export function useCommentRandom() {
  return useMutation({
    mutationFn: async (data: { message: string; accountId: string; count?: number }) => {
      const res = await api.post('/v1/jobs/comment-random', data)
      return res.data
    },
    onSuccess: (data) => {
      toast.success(`Enqueued ${data.enqueued} comments successfully`)
    },
    onError: (e: ApiError) => toast.error(e?.message ?? 'Batch comment failed'),
  })
}

export function useDiscovery(params: { platform: string; accountId: string; keyword: string; strategy?: string; limit?: number } | null) {
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: ['discovery', params],
    queryFn: async () => {
      const res = await api.post('/v1/discovery/search', params)
      return res.data
    },
    enabled: !!params,
    staleTime: 0,
  })
}

export function useSaveTargets() {
  const queryClient = useQueryClient()
  const { mutateAsync: saveTargets, isPending: isSaving } = useMutation({
    mutationFn: async (targets: string[]) => {
      const res = await api.post('/v1/discovery/save', { targets })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targets-count'] })
    },
  })
  return { saveTargets, isSaving }
}

export type { AxiosError as ApiError }
