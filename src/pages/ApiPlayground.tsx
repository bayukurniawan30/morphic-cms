import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePage } from '@inertiajs/react'
import {
  Copy,
  Loader2,
  Play,
  Plus,
  Terminal,
  Trash2,
} from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function ApiPlayground() {
  const { props } = usePage()
  const user = (props as any).user
  const activeTenant = (props as any).activeTenant

  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET')
  const [path, setPath] = useState('/api/collections')
  const [apiKey, setApiKey] = useState(user?.apiKey || '')
  const [body, setBody] = useState('{\n  \n}')

  const [headers, setHeaders] = useState<{ key: string; value: string }[]>([])

  const [loading, setLoading] = useState(false)
  const [responseStatus, setResponseStatus] = useState<number | null>(null)
  const [responseStatusText, setResponseStatusText] = useState<string>('')
  const [responseTime, setResponseTime] = useState<number | null>(null)
  const [responseBody, setResponseBody] = useState<string>('')
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({})

  // Auto-fill active workspace tenant header and API Key auth
  useEffect(() => {
    const list = []
    if (apiKey) {
      list.push({ key: 'Authorization', value: `Bearer ${apiKey}` })
    }
    if (activeTenant?.id) {
      list.push({ key: 'X-Tenant-ID', value: activeTenant.id.toString() })
    }
    setHeaders(list)
  }, [apiKey, activeTenant])

  const handleAddHeader = () => {
    setHeaders([...headers, { key: '', value: '' }])
  }

  const handleRemoveHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index))
  }

  const handleHeaderChange = (index: number, field: 'key' | 'value', val: string) => {
    const next = [...headers]
    next[index] = { ...next[index], [field]: val }
    setHeaders(next)
  }

  const handleSend = async () => {
    if (!path.startsWith('/api')) {
      toast.error("Endpoint path must start with '/api'")
      return
    }

    if (/^https?:\/\//i.test(path) || path.includes('//')) {
      toast.error('External domains are not allowed.')
      return
    }

    setLoading(true)
    setResponseStatus(null)
    setResponseTime(null)
    setResponseBody('')
    setResponseHeaders({})

    const reqHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    headers.forEach((h) => {
      if (h.key.trim()) {
        reqHeaders[h.key.trim()] = h.value
      }
    })

    const options: RequestInit = {
      method,
      headers: reqHeaders,
    }

    if (method !== 'GET' && method !== 'DELETE' && body.trim()) {
      try {
        JSON.parse(body) // Validate JSON
        options.body = body.trim()
      } catch (err) {
        toast.error('Invalid JSON body')
        setLoading(false)
        return
      }
    }

    const startTime = performance.now()
    try {
      const res = await fetch(path, options)
      const endTime = performance.now()

      setResponseTime(Math.round(endTime - startTime))
      setResponseStatus(res.status)
      setResponseStatusText(res.statusText)

      // Fetch headers
      const resHeaders: Record<string, string> = {}
      res.headers.forEach((value, key) => {
        resHeaders[key] = value
      })
      setResponseHeaders(resHeaders)

      const text = await res.text()
      try {
        const json = JSON.parse(text)
        setResponseBody(JSON.stringify(json, null, 2))
      } catch {
        setResponseBody(text)
      }
    } catch (err: any) {
      const endTime = performance.now()
      setResponseTime(Math.round(endTime - startTime))
      setResponseStatus(500)
      setResponseStatusText('Fetch Error')
      setResponseBody(err.message || 'Network error encountered')
    } finally {
      setLoading(false)
    }
  }

  const copyResponse = () => {
    if (!responseBody) return
    navigator.clipboard.writeText(responseBody)
    toast.success('Response copied to clipboard')
  }

  return (
    <Layout user={user} title="API Playground">
      <div className="w-full space-y-8 pb-12">
        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <Terminal className="w-5 h-5 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">
                API Playground
              </h1>
            </div>
            <p className="text-muted-foreground text-sm">
              Test and interact with local headless CMS endpoints. Only relative paths starting with{' '}
              <code className="bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 border border-violet-200/50 dark:border-violet-800/30 px-1.5 py-0.5 rounded text-xs font-mono font-semibold">/api</code> are allowed.
            </p>
          </div>
        </div>

        {/* Endpoint Configuration Bar (Full Width) */}
        <div className="bg-card p-4 rounded-xl border shadow-sm">
          <div className="flex flex-col md:flex-row gap-2 items-stretch">
            <div className="w-full md:w-28 shrink-0">
              <Select
                value={method}
                onValueChange={(val: any) => setMethod(val)}
              >
                <SelectTrigger className="font-bold h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET" className="text-emerald-500 font-bold">GET</SelectItem>
                  <SelectItem value="POST" className="text-blue-500 font-bold">POST</SelectItem>
                  <SelectItem value="PUT" className="text-amber-500 font-bold">PUT</SelectItem>
                  <SelectItem value="DELETE" className="text-rose-500 font-bold">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 flex items-center border border-input rounded-md bg-background focus-within:ring-1 focus-within:ring-ring focus-within:border-ring overflow-hidden">
              <span className="px-3 text-xs text-muted-foreground font-mono select-none bg-muted/50 border-r border-input shrink-0 self-stretch flex items-center">
                {typeof window !== 'undefined' ? window.location.origin : ''}
              </span>
              <input
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/api/collections"
                className="flex-1 bg-transparent px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus:outline-none min-w-0"
              />
            </div>
            <Button
              type="button"
              className="h-10 px-6 text-sm font-bold gap-2 shrink-0"
              onClick={handleSend}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Send Request
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Request Configurator Panel */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-card p-6 rounded-xl border shadow-sm space-y-6">
              {/* API Key */}
              <div className="space-y-2">
                <Label htmlFor="apiKey" className="text-sm font-semibold">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Bearer api_key_..."
                  className="font-mono bg-background"
                />
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Your workspace API Key. Automatically added to the `Authorization` header below.
                </p>
              </div>

              {/* Headers List */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-semibold">Request Headers</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px]"
                    onClick={handleAddHeader}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Header
                  </Button>
                </div>
                <div className="space-y-2">
                  {headers.map((h, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        placeholder="Header-Key"
                        value={h.key}
                        onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
                        className="h-8 text-xs font-mono bg-background"
                      />
                      <Input
                        placeholder="Value"
                        value={h.value}
                        onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
                        className="h-8 text-xs font-mono bg-background"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive shrink-0"
                        onClick={() => handleRemoveHeader(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {headers.length === 0 && (
                    <p className="text-[10px] italic text-muted-foreground text-center py-2">
                      No headers added.
                    </p>
                  )}
                </div>
              </div>

              {/* Request Body */}
              {method !== 'GET' && method !== 'DELETE' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-3 duration-200">
                  <Label htmlFor="body" className="text-sm font-semibold">Request Body (JSON)</Label>
                  <textarea
                    id="body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="{}"
                    className="flex min-h-[140px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Response Panel */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-card rounded-xl border shadow-sm flex flex-col overflow-hidden min-h-[500px]">
              {/* Header */}
              <div className="p-4 border-b flex items-center justify-between bg-muted/20">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-5 h-5 text-primary" />
                  <h2 className="text-sm font-bold uppercase tracking-wider">Response</h2>
                </div>
                {responseBody && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-[11px] font-medium"
                    onClick={copyResponse}
                  >
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    Copy Raw
                  </Button>
                )}
              </div>

              {/* Status and Metadata info */}
              <div className="px-6 py-4 border-b bg-muted/5 flex items-center gap-4 text-xs font-mono">
                <div className="flex items-center space-x-1.5">
                  <span className="text-muted-foreground">Status:</span>
                  {responseStatus ? (
                    <span
                      className={`px-2 py-0.5 rounded font-bold ${
                        responseStatus >= 200 && responseStatus < 300
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : responseStatus >= 400 && responseStatus < 500
                            ? 'bg-amber-500/10 text-amber-500'
                            : 'bg-rose-500/10 text-rose-500'
                      }`}
                    >
                      {responseStatus} {responseStatusText}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/60">—</span>
                  )}
                </div>

                <div className="flex items-center space-x-1.5">
                  <span className="text-muted-foreground">Time:</span>
                  {responseTime !== null ? (
                    <span className="font-bold text-foreground">
                      {responseTime} ms
                    </span>
                  ) : (
                    <span className="text-muted-foreground/60">—</span>
                  )}
                </div>
              </div>

              {/* Content Panel */}
              <div className="flex-1 flex flex-col min-h-0 bg-zinc-950 text-zinc-300 font-mono text-xs">
                <ScrollArea className="flex-1 p-6 h-[400px]">
                  {responseBody ? (
                    <pre className="whitespace-pre-wrap break-all leading-relaxed">
                      {responseBody}
                    </pre>
                  ) : (
                    <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-zinc-500/60 select-none">
                      <Terminal className="w-10 h-10 mb-2 opacity-20" />
                      <p className="text-xs">No request sent yet</p>
                      <p className="text-[10px] opacity-70 mt-1">Configure parameters and hit "Send Request"</p>
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
