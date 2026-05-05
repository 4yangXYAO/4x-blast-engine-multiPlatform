'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import FormField from '@/components/ui/FormField'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { ErrorResponse } from '@/lib/types'

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  content: z.string().min(1, 'Content required'),
  variables: z.string(),
  type: z.string().default('template'),
})

export default function NewTemplatePage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const { mutate: create, isPending } = useMutation({
    mutationFn: async (data: { name: string; content: string; variables: string[]; type: string }) => api.post('/v1/templates', data),
    onSuccess: () => {
      toast.success('Template created!')
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      router.push('/templates')
    },
    onError: (e: ErrorResponse | Error) => {
      const message = e instanceof Error ? e.message : (e?.message ?? e?.error ?? 'Failed')
      toast.error(message)
    },
  })

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', content: '', variables: '', type: 'template' },
  })

  const onSubmit = (data: { name: string; content: string; variables: string; type: string }) => {
    const payload = {
      ...data,
      variables: data.variables.split(',').map((v: string) => v.trim()).filter(Boolean),
    }
    create(payload)
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">New Template</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-slate-800 border-slate-700 md:col-span-2">
          <CardHeader>
            <CardTitle>Template Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                label="Name"
                placeholder="Summer Promo"
                error={errors.name?.message as string}
                {...register('name')}
              />

              <FormField
                label="Content"
                type="textarea"
                placeholder="Check this out {link}"
                helperText="Use {link} for CTA, {name} for recipient name"
                error={errors.content?.message as string}
                {...register('content')}
              />

              <FormField
                label="Variables"
                placeholder="link, name"
                helperText="Comma-separated list of variables"
                error={errors.variables?.message as string}
                {...register('variables')}
              />

              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Create Template
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-300">Preview will appear here</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
