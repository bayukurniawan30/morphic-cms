import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Link, router, useForm } from '@inertiajs/react'
import { 
  ChevronDown,
  HelpCircle, 
  RefreshCw, 
  Save, 
  ShieldCheck, 
  X 
} from 'lucide-react'
import { toast } from 'sonner'
import React from 'react'

interface Webhook {
  id: number
  name: string
  url: string
  secret: string
  events: string[]
  isActive: boolean
}

interface Props {
  user: any
  mode: 'create' | 'edit'
  webhook?: Webhook
}

const AVAILABLE_EVENTS = [
  {
    id: 'entry.created',
    label: 'Entry Created',
    description: 'When a new entry is saved.',
  },
  {
    id: 'entry.updated',
    label: 'Entry Updated',
    description: 'When an entry is modified.',
  },
  {
    id: 'entry.published',
    label: 'Entry Published',
    description: 'When an entry status changes to Published.',
  },
  {
    id: 'entry.deleted',
    label: 'Entry Deleted',
    description: 'When an entry is removed.',
  },
  {
    id: 'media.uploaded',
    label: 'Media Uploaded',
    description: 'When a file is uploaded.',
  },
  {
    id: 'form.submitted',
    label: 'Form Submitted',
    description: 'When a frontend form receives a new submission.',
  },
]

export default function WebhookForm({ user, mode, webhook }: Props) {
  const { data, setData, post, processing, errors } = useForm({
    id: webhook?.id || undefined,
    name: webhook?.name || '',
    url: webhook?.url || '',
    secret: webhook?.secret || '',
    events: webhook?.events || [],
    isActive: webhook?.isActive ?? true,
  })

  const generateSecret = () => {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setData('secret', result)
  }

  const toggleEvent = (eventId: string) => {
    setData((prev: any) => {
      const currentEvents = prev.events || []
      const newEvents = currentEvents.includes(eventId)
        ? currentEvents.filter((e: string) => e !== eventId)
        : [...currentEvents, eventId]

      return {
        ...prev,
        events: newEvents,
      }
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (data.events.length === 0) {
      toast.error('Please select at least one event')
      return
    }

    post('/api/webhooks', {
      onSuccess: () => {
        toast.success(mode === 'create' ? 'Webhook created' : 'Webhook updated')
        router.visit('/webhooks')
      },
      onError: () => {
        toast.error('Failed to save webhook')
      },
    })
  }

  return (
    <Layout
      user={user}
      title={mode === 'create' ? 'Add Webhook' : 'Edit Webhook'}
    >
      <div className='w-full space-y-6'>
        <div className='flex justify-between items-center'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight text-foreground'>
              {mode === 'create' ? 'Add Webhook' : 'Edit Webhook'}
            </h1>
            <p className='text-muted-foreground mt-1'>
              {mode === 'create'
                ? 'Configure a new outgoing notification for your workspace.'
                : `Updating configuration for "${webhook?.name}"`}
            </p>
          </div>
          <Button variant='outline' asChild>
            <Link href='/webhooks'>Cancel</Link>
          </Button>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 items-start'>
          <form
            onSubmit={handleSubmit}
            className='lg:col-span-2 bg-card p-6 rounded-xl shadow-sm border space-y-6'
          >
            <div className='flex items-center justify-between pb-4 border-b'>
              <div className='flex items-center space-x-2'>
                <span className='font-bold text-xs uppercase tracking-widest text-muted-foreground'>
                  General Settings
                </span>
              </div>
              <div className='flex items-center space-x-2'>
                <Switch
                  id='is-active'
                  checked={data.isActive}
                  onCheckedChange={(val) => setData('isActive', val)}
                />
                <Label
                  htmlFor='is-active'
                  className='text-xs font-medium cursor-pointer'
                >
                  {data.isActive ? 'Active' : 'Paused'}
                </Label>
              </div>
            </div>

            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='name'>
                  Friendly Name <span className='text-destructive ml-1'>*</span>
                </Label>
                <Input
                  id='name'
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  placeholder='e.g. Vercel Build Trigger'
                  required
                />
                {errors.name && (
                  <p className='text-xs text-destructive font-medium'>
                    {errors.name}
                  </p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='url'>
                  Target URL (Endpoint) <span className='text-destructive ml-1'>*</span>
                </Label>
                <Input
                  id='url'
                  type='url'
                  value={data.url}
                  onChange={(e) => setData('url', e.target.value)}
                  placeholder='https://your-site.com/api/webhook'
                  required
                />
                {errors.url && (
                  <p className='text-xs text-destructive font-medium'>
                    {errors.url}
                  </p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='secret'>
                  Secret Key (Signing Key){' '}
                  <span className='text-muted-foreground font-normal'>
                    (Optional)
                  </span>
                </Label>
                <div className='flex space-x-2'>
                  <Input
                    id='secret'
                    value={data.secret}
                    onChange={(e) => setData('secret', e.target.value)}
                    placeholder='A long random string'
                  />
                  <Button
                    type='button'
                    variant='outline'
                    size='icon'
                    onClick={generateSecret}
                    title='Generate Secret'
                  >
                    <RefreshCw className='w-4 h-4' />
                  </Button>
                </div>
              </div>
            </div>

            <div className='space-y-4 pt-4 border-t'>
              <Label className='text-xs font-bold uppercase tracking-widest text-muted-foreground'>
                Events Trigger <span className='text-destructive ml-1'>*</span>
              </Label>
              
              <div className='space-y-4'>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant='outline' 
                      role='combobox' 
                      className='w-full justify-between font-normal hover:bg-background'
                    >
                      {data.events.length > 0 
                        ? `${data.events.length} event${data.events.length > 1 ? 's' : ''} selected`
                        : 'Select events to trigger...'}
                      <ChevronDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-[--radix-popover-trigger-width] p-0' align='start'>
                    <div className='p-2 space-y-1'>
                      {AVAILABLE_EVENTS.map((event) => {
                        const isChecked = data.events.includes(event.id)
                        return (
                          <div
                            key={event.id}
                            className='flex items-center space-x-2 rounded-md px-2 py-2 hover:bg-muted cursor-pointer transition-colors'
                            onClick={(e) => {
                              e.preventDefault()
                              toggleEvent(event.id)
                            }}
                          >
                            <Checkbox 
                              id={`event-${event.id}`}
                              checked={isChecked}
                              onCheckedChange={() => toggleEvent(event.id)}
                            />
                            <Label 
                              htmlFor={`event-${event.id}`}
                              className='flex-1 cursor-pointer text-sm font-medium'
                            >
                              {event.label}
                            </Label>
                          </div>
                        )
                      })}
                    </div>
                  </PopoverContent>
                </Popover>

                {data.events.length > 0 && (
                  <div className='space-y-3'>
                    <Label className='text-[10px] font-medium text-muted-foreground uppercase'>
                      Active Triggers
                    </Label>
                    <div className='grid grid-cols-1 gap-2'>
                      {data.events.map((eventId) => {
                        const event = AVAILABLE_EVENTS.find(
                          (e) => e.id === eventId
                        )
                        if (!event) return null

                        return (
                          <div
                            key={event.id}
                            className='flex items-start justify-between p-3 rounded-lg border bg-muted/30 group animate-in fade-in slide-in-from-top-1 duration-200'
                          >
                            <div className='space-y-1'>
                              <div className='flex items-center space-x-2'>
                                <span className='text-sm font-bold'>
                                  {event.label}
                                </span>
                              </div>
                              <p className='text-xs text-muted-foreground leading-relaxed'>
                                {event.description}
                              </p>
                            </div>
                            <Button
                              type='button'
                              variant='ghost'
                              size='icon'
                              className='h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive'
                              onClick={() => toggleEvent(event.id)}
                            >
                              <X className='w-3.5 h-3.5' />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className='pt-6 border-t flex justify-end'>
              <Button
                type='submit'
                disabled={processing}
                className='w-full sm:w-auto min-w-[140px]'
              >
                {processing ? (
                  'Saving...'
                ) : (
                  <>
                    <Save className='w-4 h-4 mr-2' />
                    {mode === 'create' ? 'Create Webhook' : 'Save Changes'}
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className='lg:col-span-1 space-y-6'>
            <div className='bg-muted/30 rounded-xl p-6 border border-dashed'>
              <div className='flex items-center space-x-2 text-muted-foreground mb-4'>
                <HelpCircle className='w-5 h-5' />
                <h3 className='font-bold text-sm uppercase tracking-widest'>
                  How it works
                </h3>
              </div>
              <div className='text-sm text-muted-foreground space-y-4 leading-relaxed'>
                <p>
                  A webhook is a way for Morphic CMS to{' '}
                  <strong>push real-time data</strong> to other applications
                  when certain events occur. Morphic will send a{' '}
                  <strong>POST</strong> request to your URL immediately when an
                  event is triggered.
                </p>
                <div className='bg-background rounded-lg p-3 border text-[11px] font-mono'>
                  <p className='text-primary mb-1'>// Example Use Cases</p>
                  <ul className='space-y-1 opacity-80'>
                    <li>• Trigger site rebuilds on Vercel/Netlify.</li>
                    <li>• Send alerts to Slack or Discord.</li>
                    <li>• Sync content with external databases.</li>
                  </ul>
                </div>
                <div className='flex items-start space-x-2 bg-primary/5 p-3 rounded-lg border border-primary/10'>
                  <ShieldCheck className='w-4 h-4 text-primary shrink-0 mt-0.5' />
                  <p className='text-[11px] leading-normal'>
                    <strong>Security:</strong> Morphic sends a{' '}
                    <code>X-Morphic-Signature</code> header. Use your{' '}
                    <strong>Secret Key</strong> to verify it.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
