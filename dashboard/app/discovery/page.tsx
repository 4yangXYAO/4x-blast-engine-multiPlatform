'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDiscovery, useSaveTargets, useAccounts } from '@/lib/hooks'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Loader2, Search, Save, Target } from 'lucide-react'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'

export default function DiscoveryPage() {
  const [platform, setPlatform] = useState('facebook')
  const [strategy, setStrategy] = useState('AD_ENGAGEMENT')
  const [keyword, setKeyword] = useState('')
  const [accountId, setAccountId] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const { accounts } = useAccounts()
  const { data, isLoading, refetch: runSearch } = useDiscovery(
    platform && accountId && keyword ? { platform, accountId, keyword, strategy } : null
  )
  const { saveTargets, isSaving } = useSaveTargets()

  const handleSearch = () => {
    if (!accountId || !keyword) {
      toast.error('Please select an account and enter a keyword')
      return
    }
    runSearch()
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const handleSave = async () => {
    if (selectedIds.length === 0) return
    try {
      await saveTargets(selectedIds)
      toast.success(`Successfully saved ${selectedIds.length} targets to targets.txt`)
      setSelectedIds([])
    } catch (e) {
      toast.error('Failed to save targets')
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 50) return 'bg-blue-500'
    return 'bg-gray-500'
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Target Hunter</h1>
          <p className="text-muted-foreground">Find high-relevance targets using Sniper Strategy & Stealth Discovery.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Discovery Settings</CardTitle>
          <CardDescription>Configure your hunting parameters.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Platform</label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger>
                <SelectValue placeholder="Select Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="twitter">Twitter / X</SelectItem>
                <SelectItem value="threads">Threads</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Account</label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Select Account" />
              </SelectTrigger>
              <SelectContent>
                {accounts?.map((acc: any) => (
                  <SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.username})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Strategy</label>
            <Select value={strategy} onValueChange={setStrategy}>
              <SelectTrigger>
                <SelectValue placeholder="Select Strategy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AD_ENGAGEMENT">Sniper: Ad Engagement</SelectItem>
                <SelectItem value="BUSINESS_PROSPECT">Niche: Business Prospect</SelectItem>
                <SelectItem value="INTENT_DETECTION">Deep: Intent Detection</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Keyword / Context</label>
            <div className="flex gap-2">
              <Input 
                placeholder="e.g. Jasa Website UMKM" 
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
              <Button onClick={handleSearch} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {data?.targets && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Results Found</CardTitle>
              <CardDescription>Filtered and scored by Intent Engine.</CardDescription>
            </div>
            <Button 
              variant="default" 
              disabled={selectedIds.length === 0 || isSaving}
              onClick={handleSave}
              className="bg-primary text-primary-foreground"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save {selectedIds.length} Targets
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Target ID</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Context</TableHead>
                  <TableHead className="text-right">Relevance Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.targets.map((target: any) => (
                  <TableRow key={target.id}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedIds.includes(target.id)}
                        onCheckedChange={() => toggleSelect(target.id)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{target.id}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{target.action}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{target.context}</TableCell>
                    <TableCell className="text-right">
                      <Badge className={getScoreColor(target.score)}>
                        {target.score}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
