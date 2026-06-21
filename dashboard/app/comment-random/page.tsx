'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { MessageSquareText, Send, Info } from 'lucide-react'
import { useCommentRandom, useAccounts } from '@/lib/hooks'

export default function CommentRandomPage() {
  const [message, setMessage] = useState('')
  const [accountId, setAccountId] = useState('')
  const [count, setCount] = useState(50)
  
  const { data: accounts } = useAccounts()
  const commentMutation = useCommentRandom()

  // Only show Facebook accounts as per backend requirement
  const fbAccounts = accounts?.filter((a: any) => a.platform.startsWith('facebook'))

  const handleRun = () => {
    if (!message || !accountId) return
    commentMutation.mutate({
      message,
      accountId,
      count
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <MessageSquareText className="w-8 h-8 text-indigo-500" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Batch Comment Random</h1>
          <p className="text-slate-400 text-sm">Send mass comments to targets loaded from data/targets.txt</p>
        </div>
      </div>

      <div className="bg-blue-900/20 border border-blue-800 text-blue-200 p-4 rounded-xl flex gap-3">
        <Info className="h-5 w-5 shrink-0" />
        <div>
          <p className="font-bold">Facebook Only</p>
          <p className="text-sm">
            This feature currently only supports Facebook and Facebook Page accounts.
            Ensure <code className="bg-blue-950 px-1 rounded">data/targets.txt</code> contains valid Facebook Post IDs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-slate-800/50 bg-slate-950/50">
            <CardHeader>
              <CardTitle>Comment Configuration</CardTitle>
              <CardDescription>Define the message and target count.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                label="Comment Message"
                name="message"
                type="textarea"
                placeholder="Write your comment here..."
                value={message}
                onChange={(e: any) => setMessage(e.target.value)}
                className="min-h-[120px]"
              />
              <FormField
                label="Target Count"
                name="count"
                type="number"
                value={count}
                onChange={(e: any) => setCount(parseInt(e.target.value))}
                helperText="How many random targets to pick from targets.txt (Max 200)"
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-slate-800/50 bg-slate-950/50">
            <CardHeader>
              <CardTitle>Execution Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Select FB Account</label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger className="bg-slate-900 border-slate-800">
                    <SelectValue placeholder="Select account..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    {fbAccounts?.map((acc: any) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.username} ({acc.platform})
                      </SelectItem>
                    ))}
                    {(fbAccounts?.length || 0) === 0 && (
                      <SelectItem value="none">No FB accounts found</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleRun}
                disabled={!message || !accountId || commentMutation.isPending}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 py-6"
              >
                {commentMutation.isPending ? 'Enqueuing...' : (
                  <>
                    <Send className="w-4 h-4 mr-2" /> Run Batch Comment
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
