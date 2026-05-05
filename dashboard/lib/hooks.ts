'use client'

import { useQuery, useMutation, useQueryClient, type QueryFunctionContext } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { api, type AxiosError as ApiError } from './api'
import { toast } from 'sonner'

export interface Campaign {
  id: string
  name: string
  content: string
  cta_link: string
  platforms: string[]
  status: string
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

export function useAnalytics(campaignId?: string) {
  return useQuery({
    queryKey: ['analytics', campaignId],
    queryFn: async () => {
      const url = campaignId
        ? `/v1/track/stats/${campaignId}`
        : '/v1/track/stats'
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
    onError: (e: any) => toast.error(e?.message ?? 'Blast failed'),
  })

  return { blastMutation }
}
export type { AxiosError as ApiError }
