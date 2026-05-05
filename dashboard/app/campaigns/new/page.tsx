'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import FormField from '@/components/ui/FormField'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useCreateCampaign } from '@/lib/hooks'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { ErrorResponse } from '@/lib/types'

const schema = z.object({
  name: z.string().min(3),
  content: z.string().max(2000),
  cta_link: z.string().url(),
  platforms: z.array(z.string()).min(1),
})

export default function NewCampaignPage() {
  const router = useRouter()
  const { mutate: create, isPending } = useCreateCampaign()
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])

  const { register, handleSubmit } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = (data: { name: string; content: string; cta_link: string; platforms?: string[] }) => {
    create(
      { ...data, platforms: selectedPlatforms },
      {
        onSuccess: (result: { id: string }) => {
          toast.success('Campaign dibuat')
          router.push(`/campaigns/${result.id}`)
        },
      }
    )
  }

  return (
    <div className="max-w-2xl">
      <h1>New Campaign</h1>
      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FormField label="Name" name="name" />
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creating...' : 'Create'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
