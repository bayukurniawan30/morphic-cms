import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Link } from '@inertiajs/react'
import {
  ArrowLeftIcon,
  CodeIcon,
  CopyIcon,
  ExternalLinkIcon,
  RefreshCwIcon,
  SearchIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import React from 'react'

interface EntriesListProps {
  form: {
    id: number
    name: string
    slug: string
    fields: any[]
    storageType: 'internal' | 'external'
    apiUrl?: string
    collectionId?: number | null
    collectionName?: string | null
  }
  user?: any
}

export default function FormEntriesList({ form, user }: EntriesListProps) {
  const [entries, setEntries] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [selectedEntry, setSelectedEntry] = React.useState<any>(null)
  const [showApiPreview, setShowApiPreview] = React.useState(false)

  const handleDelete = async (entryId: number) => {
    if (!confirm('Are you sure you want to delete this entry?')) return

    try {
      const res = await fetch(`/api/forms/${form.slug}/entries/${entryId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Entry deleted successfully')
        fetchEntries()
      } else {
        toast.error(data.error || 'Failed to delete entry')
      }
    } catch (e) {
      toast.error('Network error')
    }
  }

  const fetchEntries = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/forms/${form.slug}/entries`)
      const data = await res.json()
      if (res.ok) {
        setEntries(data.entries || [])
      } else {
        toast.error(data.error || 'Failed to fetch entries')
      }
    } catch (err) {
      toast.error('Network error')
    } finally {
      setIsLoading(false)
    }
  }, [form.slug])

  React.useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  return (
    <Layout user={user} title={`${form.name} Entries | Morphic`}>
      <div className='flex flex-col space-y-6'>
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0'>
          <div className='flex items-center space-x-4'>
            <Button
              variant='ghost'
              size='icon'
              asChild
              className='rounded-full'
            >
              <Link href='/forms'>
                <ArrowLeftIcon className='w-5 h-5' />
              </Link>
            </Button>
            <div>
              <div className='flex items-center space-x-2 mb-1'>
                <h1 className='text-3xl font-bold tracking-tight'>
                  {form.name} Entries
                </h1>
              </div>
              <p className='text-muted-foreground text-sm flex items-center gap-2'>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${
                    form.storageType === 'internal'
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'bg-muted text-muted-foreground border-muted-foreground/20'
                  }`}
                >
                  {form.storageType}
                </span>
                {form.storageType === 'external' ? (
                  <span className='font-mono text-xs opacity-70 truncate max-w-[200px]'>
                    {form.apiUrl}
                  </span>
                ) : (
                  <span className='text-xs opacity-70'>
                    Stored internally in CMS
                  </span>
                )}
                {form.collectionName && (
                  <>
                    <span className='text-muted-foreground/30 text-xs'>•</span>
                    <span className='text-xs opacity-70'>
                      Connected Collection:{' '}
                      <span className='font-semibold text-foreground text-xs'>
                        {form.collectionName}
                      </span>
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={fetchEntries}
              disabled={isLoading}
            >
              <RefreshCwIcon
                className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
            {form.storageType === 'internal' && (
              <Button
                variant='outline'
                size='sm'
                onClick={() => setShowApiPreview(true)}
              >
                <CodeIcon className='w-4 h-4 mr-2' />
                API Preview
              </Button>
            )}
            {form.storageType === 'external' && form.apiUrl && (
              <Button variant='outline' size='sm' asChild>
                <a href={form.apiUrl} target='_blank' rel='noopener noreferrer'>
                  <ExternalLinkIcon className='w-4 h-4 mr-2' />
                  View API Source
                </a>
              </Button>
            )}
          </div>
        </div>

        <div className='bg-card rounded-xl shadow-sm border overflow-hidden'>
          {isLoading ? (
            <div className='p-12 text-center'>
              <RefreshCwIcon className='w-8 h-8 mx-auto mb-4 animate-spin text-primary opacity-20' />
              <p className='text-muted-foreground italic'>
                Fetching entries...
              </p>
            </div>
          ) : entries.length === 0 ? (
            <div className='p-12 text-center space-y-4'>
              <div className='w-16 h-16 border border-muted rounded-full flex items-center justify-center mx-auto'>
                <SearchIcon className='w-8 h-8 text-muted-foreground opacity-40' />
              </div>
              <div>
                <h2 className='text-xl font-semibold'>No entries found</h2>
                <p className='text-muted-foreground mt-2 max-w-md mx-auto'>
                  {form.storageType === 'internal'
                    ? 'Entries submitted through the public API will appear here.'
                    : "The third-party API returned an empty list or it's not configured correctly."}
                </p>
              </div>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full text-sm text-left'>
                <thead className='text-xs text-muted-foreground uppercase bg-muted/50 border-b'>
                  <tr>
                    <th className='px-6 py-4 font-medium w-[200px]'>Date</th>
                    {form.fields.map((field) => (
                      <th
                        key={field.id}
                        className='px-6 py-4 font-medium uppercase tracking-wider'
                      >
                        {field.label}
                      </th>
                    ))}
                    <th className='px-6 py-4 font-medium text-right'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y'>
                  {entries.map((entry, idx) => (
                    <tr
                      key={entry.id || idx}
                      className='hover:bg-muted/50 transition-colors group'
                    >
                      <td className='px-6 py-4 whitespace-nowrap text-muted-foreground font-mono text-[11px]'>
                        {entry.createdAt
                          ? new Date(entry.createdAt).toLocaleString()
                          : '-'}
                      </td>
                      {form.fields.map((field) => (
                        <td key={field.id} className='px-6 py-4'>
                          {entry[field.name] !== undefined ? (
                            typeof entry[field.name] === 'boolean' ? (
                              entry[field.name] ? (
                                'Yes'
                              ) : (
                                'No'
                              )
                            ) : (
                              String(entry[field.name])
                            )
                          ) : (
                            <span className='text-muted-foreground italic text-xs'>
                              null
                            </span>
                          )}
                        </td>
                      ))}
                      <td className='px-6 py-4 text-right space-x-2 whitespace-nowrap'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => setSelectedEntry(entry)}
                        >
                          Details
                        </Button>
                        {form.storageType === 'internal' && (
                          <Button
                            variant='destructive'
                            size='sm'
                            onClick={() => handleDelete(entry.id)}
                          >
                            Delete
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={!!selectedEntry}
        onOpenChange={(open) => !open && setSelectedEntry(null)}
      >
        <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Entry Details</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 mt-4'>
            <div className='grid grid-cols-3 gap-4 border-b pb-4'>
              <div className='text-sm font-medium text-muted-foreground'>
                Date
              </div>
              <div className='col-span-2 text-sm font-mono'>
                {selectedEntry?.createdAt
                  ? new Date(selectedEntry.createdAt).toLocaleString()
                  : '-'}
              </div>
            </div>
            {form.fields.map((field) => (
              <div
                key={field.id}
                className='grid grid-cols-3 gap-4 border-b pb-4 last:border-0 last:pb-0'
              >
                <div className='text-sm font-medium text-muted-foreground'>
                  {field.label}
                </div>
                <div className='col-span-2 text-sm break-words whitespace-pre-wrap'>
                  {selectedEntry && selectedEntry[field.name] !== undefined ? (
                    typeof selectedEntry[field.name] === 'boolean' ? (
                      selectedEntry[field.name] ? (
                        'Yes'
                      ) : (
                        'No'
                      )
                    ) : typeof selectedEntry[field.name] === 'object' ? (
                      JSON.stringify(selectedEntry[field.name], null, 2)
                    ) : (
                      String(selectedEntry[field.name])
                    )
                  ) : (
                    <span className='text-muted-foreground italic text-xs'>
                      null
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showApiPreview} onOpenChange={setShowApiPreview}>
        <DialogContent className='max-w-3xl max-h-[90vh] flex flex-col'>
          <DialogHeader>
            <DialogTitle className='flex items-center'>
              <CodeIcon className='w-5 h-5 mr-2 text-primary' />
              API Documentation & Preview
            </DialogTitle>
          </DialogHeader>
          <div className='flex-1 flex flex-col overflow-hidden space-y-4 m-0'>
            <div className='space-y-2'>
              <label className='text-[10px] font-bold uppercase tracking-widest opacity-50'>
                REST Endpoint URL
              </label>
              <div className='flex space-x-2'>
                <Input
                  readOnly
                  value={`${window.location.origin}/api/forms/${form.slug}/entries`}
                  className='font-mono text-xs bg-muted/50'
                />
                <Button
                  variant='secondary'
                  size='icon'
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/api/forms/${form.slug}/entries`
                    )
                    toast.success('URL copied to clipboard')
                  }}
                >
                  <CopyIcon className='w-4 h-4' />
                </Button>
              </div>
            </div>

            <div className='flex-1 flex flex-col min-h-0 space-y-2'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-2'>
                  <label className='text-[10px] font-bold uppercase tracking-widest opacity-50'>
                    JSON Response
                  </label>
                </div>
                <div className='flex items-center space-x-2'>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='h-7 text-[10px]'
                    onClick={() => {
                      navigator.clipboard.writeText(
                        JSON.stringify({ entries }, null, 2)
                      )
                      toast.success('JSON copied to clipboard')
                    }}
                  >
                    <CopyIcon className='w-3 h-3 mr-1.5' />
                    Copy JSON
                  </Button>
                </div>
              </div>
              <ScrollArea className='flex-1 rounded-md border bg-zinc-950 p-4 font-mono text-[11px] text-zinc-300'>
                <pre className='whitespace-pre'>
                  {JSON.stringify({ entries }, null, 2)}
                </pre>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  )
}
