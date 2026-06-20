import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/ui/loader'
import { Link, router, usePage } from '@inertiajs/react'
import {
  Edit,
  Plus,
  Trash2,
  Webhook as WebhookIcon,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface Webhook {
  id: number
  name: string
  url: string
  events: string[]
  isActive: boolean
  createdAt: string
  tenant?: { id: number; name: string }
}

export default function WebhooksList({ user }: { user: any }) {
  const { props: pageProps } = usePage()
  const activeTenant = (pageProps as any).activeTenant
  const isSystemGlobal = !activeTenant

  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWebhooks()
  }, [])

  const fetchWebhooks = async () => {
    try {
      const res = await fetch('/api/webhooks')
      const data = await res.json()
      setWebhooks(data.webhooks || [])
    } catch (err) {
      toast.error('Failed to fetch webhooks')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete the webhook "${name}"?`)) return

    try {
      const res = await fetch(`/api/webhooks/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Webhook deleted')
        setWebhooks(webhooks.filter((w) => w.id !== id))
      } else {
        toast.error('Failed to delete webhook')
      }
    } catch (err) {
      toast.error('Network error')
    }
  }

  return (
    <Layout user={user} title='Webhooks'>
      <div className='space-y-6'>
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0'>
          <div>
            <div className='flex items-center space-x-2 mb-1'>
              <WebhookIcon className='w-5 h-5 text-primary' />
              <h1 className='text-3xl font-bold tracking-tight'>Webhooks</h1>
            </div>
            <p className='text-muted-foreground text-sm'>
              Manage outgoing HTTP notifications for your content events.
            </p>
          </div>
          <Button asChild>
            <Link href='/webhooks/add'>
              <Plus className='w-4 h-4 mr-2' />
              Add Webhook
            </Link>
          </Button>
        </div>

        <div className='bg-card rounded-xl border shadow-sm overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm text-left'>
              <thead className='bg-muted/50 text-xs text-muted-foreground uppercase border-b'>
                <tr>
                  <th className='px-6 py-4 font-medium'>Name</th>
                  <th className='px-6 py-4 font-medium'>URL</th>
                  <th className='px-6 py-4 font-medium'>Events</th>
                  <th className='px-6 py-4 font-medium'>Status</th>
                  {isSystemGlobal && <th className='px-6 py-4 font-medium'>Tenant</th>}
                  <th className='px-6 py-4 font-medium text-right'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y'>
                {loading ? (
                  <tr>
                    <td colSpan={isSystemGlobal ? 6 : 5} className='px-6 py-12'>
                      <LoadingState text='Fetching webhooks...' />
                    </td>
                  </tr>
                ) : webhooks.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isSystemGlobal ? 6 : 5}
                      className='px-6 py-12 text-center text-muted-foreground italic'
                    >
                      No webhooks configured yet.
                    </td>
                  </tr>
                ) : (
                  webhooks.map((webhook) => (
                    <tr key={webhook.id} className='hover:bg-muted/30 transition-colors group'>
                      <td className='px-6 py-4 font-medium text-foreground'>
                        {webhook.name}
                      </td>
                      <td className='px-6 py-4 text-muted-foreground max-w-xs truncate font-mono text-[10px]'>
                        <div className='flex items-center space-x-1'>
                          <span className='truncate'>{webhook.url}</span>
                          <a 
                            href={webhook.url} 
                            target='_blank' 
                            rel='noopener noreferrer'
                            className='opacity-0 group-hover:opacity-100 transition-opacity'
                          >
                            <ExternalLink className='w-3 h-3 text-primary' />
                          </a>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='flex flex-wrap gap-1'>
                          {webhook.events.map((event) => (
                            <span
                              key={event}
                              className='px-1.5 py-0.5 bg-secondary text-[10px] rounded border'
                            >
                              {event}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        {webhook.isActive ? (
                          <span className='inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-green-500/10 text-green-600 border border-green-500/20'>
                            Active
                          </span>
                        ) : (
                          <span className='inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-slate-500/10 text-slate-500 border border-slate-500/20'>
                            Paused
                          </span>
                        )}
                      </td>
                      {isSystemGlobal && (
                        <td className='px-6 py-4 text-muted-foreground'>
                          {webhook.tenant?.name || 'System Global'}
                        </td>
                      )}
                      <td className='px-6 py-4 text-right whitespace-nowrap'>
                        <div className='flex items-center justify-end gap-2'>
                          <Button variant='outline' size='sm' asChild title='Edit Webhook'>
                            <Link href={`/webhooks/edit/${webhook.id}`}>
                              Edit
                            </Link>
                          </Button>
                          <Button
                            variant='destructive'
                            size='sm'
                            onClick={() => handleDelete(webhook.id, webhook.name)}
                            title='Delete Webhook'
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}
