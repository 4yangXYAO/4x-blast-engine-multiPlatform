'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { useUpdateAccount, type Account } from '@/lib/hooks'
import { ApiError } from '@/lib/hooks'

interface EditAccountModalProps {
  account: Account | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditAccountModal({ account, open, onOpenChange }: EditAccountModalProps) {
  const [username, setUsername] = useState('')
  const [credentials, setCredentials] = useState('')
  const updateMutation = useUpdateAccount()

  useEffect(() => {
    if (account) {
      setUsername(account.username || '')
      setCredentials('') // Don't pre-fill password/token for security
    }
  }, [account, open])

  const handleSave = () => {
    if (!account) return
    updateMutation.mutate({
      id: account.id,
      username,
      ...(credentials ? { credentials } : {}),
    }, {
      onSuccess: () => onOpenChange(false),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-950 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle>Edit Account</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <FormField
            label="Username / Identifier"
            name="username"
            value={username}
            onChange={(e: any) => setUsername(e.target.value)}
          />
          <FormField
            label="New Credentials (optional)"
            name="credentials"
            type="password"
            placeholder="Leave blank to keep current"
            value={credentials}
            onChange={(e: any) => setCredentials(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={updateMutation.isPending}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={updateMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
