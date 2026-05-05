'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import FormField from '@/components/ui/FormField'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useCreateAccount } from '@/lib/hooks'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { ErrorResponse } from '@/lib/types'

const schema = z.object({
  platform: z.string().min(1),
  username: z.string().min(1, 'Username required'),
  credentials: z.string().min(1, 'Credentials required'),
})

const platformHelp: Record<string, string> = {
  facebook: 'Paste your Facebook session cookie (c_user=...; xs=...; datr=...)',
  twitter: 'Enter your Twitter Bearer token or API credentials',
  instagram: 'Paste your Instagram session cookie',
  threads: 'Enter your Threads access token',
  whatsapp: 'Enter WhatsApp API key or session string',
  telegram: 'Enter Telegram bot token',
}

export default function NewAccountPage() {
  const router = useRouter()
  const { mutate: create, isPending } = useCreateAccount()
  const [platform, setPlatform] = useState('twitter')

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { platform: 'twitter', username: '', credentials: '' },
  })

  const onSubmit = (data: { platform: string; username: string; credentials: string }) => {
    create(
      { platform: data.platform, username: data.username, credentials: data.credentials },
      {
        onSuccess: () => {
          toast.success('Account created!')
          router.push('/accounts')
        },
        onError: (e: ErrorResponse | Error) => {
          const message = e instanceof Error ? e.message : (e?.message ?? e?.error ?? 'Failed to create account')
          toast.error(message)
        },
      }
    )
  }

  const handlePlatformChange = (p: string) => {
    setPlatform(p)
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Add Account</h1>
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              label="Platform"
              type="select"
              options={[
                { value: 'twitter', label: 'Twitter' },
                { value: 'facebook', label: 'Facebook' },
                { value: 'instagram', label: 'Instagram' },
                { value: 'threads', label: 'Threads' },
                { value: 'whatsapp', label: 'WhatsApp' },
                { value: 'telegram', label: 'Telegram' },
              ]}
              error={errors.platform?.message as string}
              {...register('platform')}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handlePlatformChange(e.target.value)}
            />
            <FormField
              label="Username"
              placeholder="test_account"
              error={errors.username?.message as string}
              {...register('username')}
            />
            <FormField
              label={platform === 'facebook' ? 'Session Cookie' : 'Credentials'}
              type={platform === 'facebook' ? 'textarea' : 'password'}
              placeholder={platformHelp[platform] ?? ''}
              error={errors.credentials?.message as string}
              {...register('credentials')}
            />
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Account
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
