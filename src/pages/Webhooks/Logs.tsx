import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/ui/loader'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Link } from '@inertiajs/react'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
  Terminal,
  FileText,
  Search,
  ExternalLink,
} from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface WebhookLog {
  id: number
  webhookId: number
  webhookName: string | null
  event: string
  url: string
  statusCode: number | null
  responseTime: number | null
  requestHeaders: any
  requestBody: string | null
  responseHeaders: any
  responseBody: string | null
  errorMessage: string | null
  createdAt: string
}

interface Webhook {
  id: number
  name: string
  url: string
}

interface Props {
  user: any
  initialWebhookId?: number
}

export default function WebhookLogs({ user, initialWebhookId }: Props) {
  const [logs, setLogs] = useState<WebhookLog[]>([])
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Filters
  const [selectedWebhookId, setSelectedWebhookId] = useState<string>(
    initialWebhookId ? String(initialWebhookId) : 'all'
  )
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'error'>('all')

  // Selected Log for Details Modal
  const [activeLog, setActiveLog] = useState<WebhookLog | null>(null)

  useEffect(() => {
    fetchWebhooks()
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [selectedWebhookId, statusFilter])

  const fetchWebhooks = async () => {
    try {
      const res = await fetch('/api/webhooks')
      if (res.ok) {
        const data = await res.json()
        setWebhooks(data.webhooks || [])
      }
    } catch (err) {
      console.error('Failed to fetch webhooks list:', err)
    }
  }

  const fetchLogs = async (isManual = false) => {
    if (isManual) setRefreshing(true)
    else setLoading(true)

    try {
      const params = new URLSearchParams()
      if (selectedWebhookId !== 'all') {
        params.append('webhookId', selectedWebhookId)
      }
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const res = await fetch(`/api/webhooks/logs?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs || [])
        if (isManual) toast.success('Logs refreshed')
      } else {
        toast.error('Failed to load webhook logs')
      }
    } catch (err) {
      toast.error('Error fetching webhook logs')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const formatRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffSecs = Math.floor(diffMs / 1000)
      const diffMins = Math.floor(diffSecs / 60)
      const diffHours = Math.floor(diffMins / 60)
      const diffDays = Math.floor(diffHours / 24)

      if (diffSecs < 10) return 'Just now'
      if (diffSecs < 60) return `${diffSecs}s ago`
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays < 7) return `${diffDays}d ago`
      return date.toLocaleString()
    } catch (e) {
      return dateStr
    }
  }

  const parseJSON = (text: string | null | any) => {
    if (!text) return null
    if (typeof text === 'object') return text
    try {
      return JSON.parse(text)
    } catch (e) {
      return null
    }
  }

  return (
    <Layout user={user} title="Webhook Logs">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <Button variant="ghost" size="icon" asChild className="mr-1">
                <Link href="/webhooks">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
              </Button>
              <h1 className="text-3xl font-bold tracking-tight">Webhook Logs</h1>
            </div>
            <p className="text-muted-foreground text-sm pl-11">
              Review delivery reports, request payloads, and status codes.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => fetchLogs(true)}
            disabled={loading || refreshing}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-card p-4 rounded-xl border shadow-sm flex flex-col md:flex-row gap-4 items-center">
          <div className="w-full md:w-auto flex-1 flex flex-col sm:flex-row gap-4 items-center">
            {/* Webhook Filter */}
            <div className="flex flex-col space-y-1.5 w-full sm:w-[240px]">
              <span className="text-xs font-semibold text-muted-foreground">Filter by Webhook</span>
              <Select value={selectedWebhookId} onValueChange={setSelectedWebhookId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Webhooks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Webhooks</SelectItem>
                  {webhooks.map((webhook) => (
                    <SelectItem key={webhook.id} value={String(webhook.id)}>
                      {webhook.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="flex flex-col space-y-1.5 w-full sm:w-[200px]">
              <span className="text-xs font-semibold text-muted-foreground">Filter by Status</span>
              <div className="flex bg-muted p-0.5 rounded-lg border w-full">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${
                    statusFilter === 'all'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('success')}
                  className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${
                    statusFilter === 'success'
                      ? 'bg-background text-green-600 dark:text-green-400 shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Success
                </button>
                <button
                  onClick={() => setStatusFilter('error')}
                  className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${
                    statusFilter === 'error'
                      ? 'bg-background text-red-600 dark:text-red-400 shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Errors
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-xs text-muted-foreground uppercase border-b">
                <tr>
                  <th className="px-6 py-4 font-medium w-[120px]">Status</th>
                  <th className="px-6 py-4 font-medium w-[180px]">Webhook</th>
                  <th className="px-6 py-4 font-medium w-[160px]">Event</th>
                  <th className="px-6 py-4 font-medium">Endpoint URL</th>
                  <th className="px-6 py-4 font-medium w-[100px]">Duration</th>
                  <th className="px-6 py-4 font-medium w-[150px]">Time</th>
                  <th className="px-6 py-4 font-medium text-right w-[100px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12">
                      <LoadingState text="Fetching webhook logs..." />
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground italic">
                      No webhook logs found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const isSuccess = log.statusCode && log.statusCode >= 200 && log.statusCode < 300 && !log.errorMessage
                    return (
                      <tr key={log.id} className="hover:bg-muted/30 transition-colors group">
                        <td className="px-6 py-4">
                          {isSuccess ? (
                            <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-600 border border-green-500/20">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>{log.statusCode || '200'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-600 border border-red-500/20">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>{log.statusCode || 'Fail'}</span>
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-medium text-foreground max-w-[180px] truncate">
                          {log.webhookName || <span className="text-muted-foreground italic text-xs">Deleted webhook</span>}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 bg-secondary text-[10px] rounded border font-mono">
                            {log.event}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground font-mono text-xs max-w-xs truncate">
                          {log.url}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground text-xs whitespace-nowrap">
                          {log.responseTime ? `${log.responseTime} ms` : '-'}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground text-xs whitespace-nowrap">
                          {formatRelativeTime(log.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveLog(log)}
                          >
                            Details
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Details Dialog */}
      <Dialog open={!!activeLog} onOpenChange={(open) => !open && setActiveLog(null)}>
        {activeLog && (
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader className="border-b pb-4 mb-2">
              <DialogTitle className="flex items-center justify-between pr-6">
                <span className="flex items-center space-x-2">
                  <Terminal className="w-5 h-5 text-primary" />
                  <span>Webhook Log #{activeLog.id}</span>
                </span>
                {activeLog.statusCode && activeLog.statusCode >= 200 && activeLog.statusCode < 300 && !activeLog.errorMessage ? (
                  <Badge className="bg-green-500/10 text-green-600 border border-green-500/20 hover:bg-green-500/20">
                    Success ({activeLog.statusCode})
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="bg-red-500/10 text-red-600 border border-red-500/20 hover:bg-red-500/20">
                    Failed ({activeLog.statusCode || 'Error'})
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="font-mono text-xs break-all pt-2 flex items-center space-x-1.5 text-muted-foreground">
                <span className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-bold text-foreground">POST</span>
                <span className="truncate">{activeLog.url}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/40 p-3 rounded-lg border text-xs mb-4">
              <div>
                <span className="block text-muted-foreground font-semibold">Event</span>
                <span className="font-medium">{activeLog.event}</span>
              </div>
              <div>
                <span className="block text-muted-foreground font-semibold">Duration</span>
                <span className="font-medium flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{activeLog.responseTime ? `${activeLog.responseTime} ms` : '-'}</span>
                </span>
              </div>
              <div>
                <span className="block text-muted-foreground font-semibold">Created At</span>
                <span className="font-medium">{new Date(activeLog.createdAt).toLocaleString()}</span>
              </div>
              <div>
                <span className="block text-muted-foreground font-semibold">Webhook</span>
                <span className="font-medium truncate block">
                  {activeLog.webhookName || 'Deleted webhook'}
                </span>
              </div>
            </div>

            <Tabs defaultValue="request" className="w-full">
              <TabsList className="grid grid-cols-2 w-[240px] mb-4">
                <TabsTrigger value="request" className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Request</span>
                </TabsTrigger>
                <TabsTrigger value="response" className="flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4" />
                  <span>Response</span>
                </TabsTrigger>
              </TabsList>

              {/* Request Tab */}
              <TabsContent value="request" className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">Headers</h4>
                  <pre className="bg-muted/80 p-3 rounded-lg border text-[11px] font-mono whitespace-pre-wrap break-all max-h-[150px] overflow-y-auto custom-scrollbar text-foreground">
                    {activeLog.requestHeaders
                      ? JSON.stringify(activeLog.requestHeaders, null, 2)
                      : '{}'}
                  </pre>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">Body Payload</h4>
                  <pre className="bg-muted/80 p-3 rounded-lg border text-[11px] font-mono whitespace-pre-wrap break-all max-h-[300px] overflow-y-auto custom-scrollbar text-foreground">
                    {parseJSON(activeLog.requestBody)
                      ? JSON.stringify(parseJSON(activeLog.requestBody), null, 2)
                      : activeLog.requestBody || '{}'}
                  </pre>
                </div>
              </TabsContent>

              {/* Response Tab */}
              <TabsContent value="response" className="space-y-4">
                {activeLog.errorMessage && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-lg text-xs font-mono">
                    <span className="font-bold">Execution Error:</span> {activeLog.errorMessage}
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">Headers</h4>
                  <pre className="bg-muted/80 p-3 rounded-lg border text-[11px] font-mono whitespace-pre-wrap break-all max-h-[150px] overflow-y-auto custom-scrollbar text-foreground">
                    {activeLog.responseHeaders
                      ? JSON.stringify(activeLog.responseHeaders, null, 2)
                      : '{}'}
                  </pre>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">Body</h4>
                  <pre className="bg-muted/80 p-3 rounded-lg border text-[11px] font-mono whitespace-pre-wrap break-all max-h-[300px] overflow-y-auto custom-scrollbar text-foreground">
                    {parseJSON(activeLog.responseBody)
                      ? JSON.stringify(parseJSON(activeLog.responseBody), null, 2)
                      : activeLog.responseBody || 'No response body'}
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        )}
      </Dialog>
    </Layout>
  )
}
