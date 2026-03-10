import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Head, Link, router } from '@inertiajs/react'
import {
  ArrowLeftIcon,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CodeIcon,
  CopyIcon,
  DatabaseIcon,
  PlusIcon,
  TerminalIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import React from 'react'
import { format } from 'date-fns'

interface Field {
  name: string
  label: string
  type: string
}

interface Collection {
  id: number
  name: string
  slug: string
  fields: Field[]
}

interface Entry {
  id: number
  content: Record<string, any>
  updatedBy?: { id: number; name: string }
  createdAt: string
  updatedAt: string
}

interface ListProps {
  collection: Collection
  entries: Entry[]
  user?: any
  pagination?: {
    currentPage: number
    totalPages: number
    totalCount: number
    limit: number
  }
  filters?: {
    type?: string
  }
}

export default function EntriesList({
  collection,
  entries,
  user,
  pagination,
}: ListProps) {
  const handleDelete = async (entryId: number) => {
    if (!confirm('Are you sure you want to delete this entry?')) return

    try {
      const res = await fetch(`/api/entries/${entryId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success('Entry deleted successfully')
        window.location.reload()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to delete entry')
      }
    } catch (e) {
      toast.error('Network error')
    }
  }

  const handlePageChange = (page: number) => {
    router.get(`/entries/${collection.id}`, { page }, { preserveState: true })
  }

  // Get visible columns (first 3 fields)
  const visibleFields = collection.fields.slice(0, 3)

  const [relationData, setRelationData] = React.useState<Record<number, any[]>>(
    {}
  )
  const [availableDocuments, setAvailableDocuments] = React.useState<any[]>([])

  // API Preview states
  const [previewPage, setPreviewPage] = React.useState(1)
  const [previewLimit, setPreviewLimit] = React.useState(10)
  const [previewData, setPreviewData] = React.useState<any>(null)
  const [isPreviewLoading, setIsPreviewLoading] = React.useState(false)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)

  React.useEffect(() => {
    if (!isDialogOpen) return

    const collectionType = (collection as any).type
    const fetchPreview = async () => {
      setIsPreviewLoading(true)
      try {
        const url =
          collectionType === 'global'
            ? `/api/collections/${collection.slug}/entries`
            : `/api/collections/${collection.slug}/entries?page=${previewPage}&limit=${previewLimit}`
        const res = await fetch(url)
        const data = await res.json()
        setPreviewData(data)
      } catch (err) {
        console.error('Failed to fetch API preview:', err)
      } finally {
        setIsPreviewLoading(false)
      }
    }

    const timer = setTimeout(fetchPreview, 300) // Debounce
    return () => clearTimeout(timer)
  }, [previewPage, previewLimit, collection.slug, isDialogOpen, collection])

  React.useEffect(() => {
    const fetchRelations = async () => {
      const relationFields = collection.fields.filter(
        (f: any) => f.type === 'relation' && f.relationCollectionId
      )

      for (const field of relationFields) {
        const id = (field as any).relationCollectionId!
        if (relationData[id]) continue

        try {
          const res = await fetch(`/api/collections/${id}/entries`)
          if (res.ok) {
            const data = await res.json()
            setRelationData((prev) => ({ ...prev, [id]: data.entries || [] }))
          }
        } catch (err) {
          console.error(
            `Failed to fetch relation data for collection ${id}`,
            err
          )
        }
      }
    }

    fetchRelations()
  }, [collection.fields, relationData])

  React.useEffect(() => {
    const fetchDocuments = async () => {
      const hasDocumentField = collection.fields.some(
        (f: any) => f.type === 'documents'
      )
      if (!hasDocumentField) return

      try {
        const res = await fetch('/api/documents?limit=100')
        if (res.ok) {
          const data = await res.json()
          setAvailableDocuments(data.files || [])
        }
      } catch (err) {
        console.error('Failed to fetch documents', err)
      }
    }

    fetchDocuments()
  }, [collection.fields])

  const renderCellValue = (field: Field, value: any) => {
    if (value === null || value === undefined)
      return <span className='text-muted-foreground italic'>empty</span>

    switch (field.type) {
      case 'media':
        if (Array.isArray(value)) {
          return `${value.length} files`
        }
        return (
          <span className='truncate max-w-[150px] inline-block'>
            File selected
          </span>
        )
      case 'rich-text':
        return (
          <span className='truncate max-w-[200px] inline-block opacity-70 italic text-xs'>
            Rich content...
          </span>
        )
      case 'date':
      case 'datetime':
        return format(new Date(value), field.type === 'date' ? 'PPP' : 'PPP p')
      case 'checkbox':
        return Array.isArray(value) ? value.join(', ') : String(value)
      case 'relation': {
        const targetCollectionId = (field as any).relationCollectionId
        const labelField = (field as any).relationLabelField
        const targetEntries = targetCollectionId
          ? relationData[targetCollectionId] || []
          : []
        const relatedEntry = targetEntries.find((e) => e.id === value)

        if (relatedEntry) {
          return labelField
            ? relatedEntry.content[labelField]
            : `Entry #${value}`
        }
        return (
          <span className='text-muted-foreground font-mono text-[10px]'>
            #{value}
          </span>
        )
      }
      case 'documents': {
        if (value && typeof value === 'object' && value.filename) {
          return value.filename
        }
        const docId = typeof value === 'object' ? value.id : value
        const doc = availableDocuments.find((d) => d.id === docId)
        return doc ? (
          doc.filename
        ) : (
          <span className='text-muted-foreground font-mono text-[10px]'>
            Doc #{docId}
          </span>
        )
      }
      default:
        return String(value)
    }
  }

  return (
    <Layout user={user}>
      <Head title={`${collection.name} Entries | Morphic`} />

      <div className='flex flex-col space-y-6'>
        <div className='flex flex-col sm:flex-row justify-between lg:items-end space-y-4 sm:space-y-0'>
          <div className='flex items-center space-x-4'>
            <Button
              variant='ghost'
              size='icon'
              asChild
              className='rounded-full'
            >
              <Link href='/entries'>
                <ArrowLeftIcon className='w-5 h-5' />
              </Link>
            </Button>
            <div>
              <div className='flex items-center space-x-2 mb-1'>
                <h1 className='text-3xl font-bold tracking-tight'>
                  {collection.name}
                </h1>
                <span className='text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full'>
                  Entries
                </span>
              </div>
              <p className='text-muted-foreground text-sm'>
                Manage data for this collection ({pagination?.totalCount || 0}{' '}
                total).
              </p>
            </div>
          </div>

          <div className='flex items-center space-x-2'>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant='outline'>
                  <CodeIcon className='w-4 h-4 mr-2' />
                  API Preview
                </Button>
              </DialogTrigger>
              <DialogContent className='max-w-3xl max-h-[90vh] flex flex-col'>
                <DialogHeader>
                  <DialogTitle className='flex items-center'>
                    <TerminalIcon className='w-5 h-5 mr-2 text-primary' />
                    REST API Preview
                  </DialogTitle>
                  <DialogDescription>
                    Interactive preview of the JSON response for this
                    collection.
                  </DialogDescription>
                </DialogHeader>

                <div className='flex-1 space-y-4 overflow-hidden flex flex-col mt-4'>
                  {(collection as any).type !== 'global' && (
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border'>
                      <div className='space-y-2'>
                        <label className='text-[10px] font-bold uppercase tracking-widest opacity-50'>
                          Page Number
                        </label>
                        <Input
                          type='number'
                          min={1}
                          value={previewPage}
                          onChange={(e) =>
                            setPreviewPage(
                              Math.max(1, parseInt(e.target.value) || 1)
                            )
                          }
                          className='h-8 text-xs'
                        />
                      </div>
                      <div className='space-y-2'>
                        <label className='text-[10px] font-bold uppercase tracking-widest opacity-50'>
                          Limit per Page
                        </label>
                        <Input
                          type='number'
                          min={1}
                          max={100}
                          value={previewLimit}
                          onChange={(e) =>
                            setPreviewLimit(
                              Math.max(
                                1,
                                Math.min(100, parseInt(e.target.value) || 10)
                              )
                            )
                          }
                          className='h-8 text-xs'
                        />
                        <p className='text-[10px] text-muted-foreground italic'>
                          Max 100 entries per request.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className='space-y-2'>
                    <label className='text-[10px] font-bold uppercase tracking-widest opacity-50'>
                      Endpoint URL
                    </label>
                    <div className='flex space-x-2'>
                      <Input
                        readOnly
                        value={
                          (collection as any).type === 'global'
                            ? `${window.location.origin}/api/collections/${collection.slug}/entries`
                            : `${window.location.origin}/api/collections/${collection.slug}/entries?page=${previewPage}&limit=${previewLimit}`
                        }
                        className='font-mono text-xs bg-muted/50'
                      />
                      <Button
                        variant='secondary'
                        size='icon'
                        onClick={() => {
                          const url =
                            (collection as any).type === 'global'
                              ? `${window.location.origin}/api/collections/${collection.slug}/entries`
                              : `${window.location.origin}/api/collections/${collection.slug}/entries?page=${previewPage}&limit=${previewLimit}`
                          navigator.clipboard.writeText(url)
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
                        {isPreviewLoading && (
                          <span className='text-[10px] animate-pulse text-primary font-bold'>
                            LOADING...
                          </span>
                        )}
                      </div>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-7 text-[10px]'
                        onClick={() => {
                          const json = JSON.stringify(
                            previewData || { entries, pagination },
                            null,
                            2
                          )
                          navigator.clipboard.writeText(json)
                          toast.success('JSON copied to clipboard')
                        }}
                      >
                        <CopyIcon className='w-3 h-3 mr-1.5' />
                        Copy JSON
                      </Button>
                    </div>
                    <ScrollArea className='h-[350px] rounded-md border bg-zinc-950 p-4 font-mono text-xs text-zinc-300'>
                      <div className='min-w-max'>
                        <pre className='whitespace-pre'>
                          {previewData
                            ? JSON.stringify(previewData, null, 2)
                            : '// Loading preview data...'}
                        </pre>
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button asChild>
              <Link href={`/entries/${collection.id}/add`}>
                <PlusIcon className='w-4 h-4 mr-2' />
                Add Entry
              </Link>
            </Button>
          </div>
        </div>

        <div className='bg-card rounded-xl shadow-sm border overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm text-left'>
              <thead className='text-xs text-muted-foreground uppercase bg-muted/50 border-b'>
                <tr>
                  <th className='px-6 py-4 font-medium uppercase tracking-wider'>
                    ID
                  </th>
                  {visibleFields.map((field) => (
                    <th
                      key={field.name}
                      className='px-6 py-4 font-medium uppercase tracking-wider'
                    >
                      {field.label}
                    </th>
                  ))}
                  <th className='px-6 py-4 font-medium uppercase tracking-wider'>
                    Created
                  </th>
                  <th className='px-6 py-4 font-medium uppercase tracking-wider'>
                    Last Updated By
                  </th>
                  <th className='px-6 py-4 font-medium uppercase tracking-wider text-right'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y'>
                {entries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleFields.length + 4}
                      className='px-6 py-12 text-center text-muted-foreground'
                    >
                      <div className='max-w-xs mx-auto'>
                        <DatabaseIcon className='w-12 h-12 mx-auto mb-4 opacity-20' />
                        <p className='text-lg font-medium'>No entries yet</p>
                        <p className='text-sm opacity-70 mt-1'>
                          Start adding content to this collection.
                        </p>
                        <Button variant='outline' className='mt-6' asChild>
                          <Link href={`/entries/${collection.id}/add`}>
                            Add Your First Entry
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr
                      key={entry.id}
                      className='hover:bg-muted/30 transition-colors group'
                    >
                      <td className='px-6 py-4 font-mono text-xs opacity-50'>
                        #{entry.id}
                      </td>
                      {visibleFields.map((field) => (
                        <td
                          key={field.name}
                          className='px-6 py-4 font-medium whitespace-nowrap'
                        >
                          {renderCellValue(field, entry.content[field.name])}
                        </td>
                      ))}
                      <td className='px-6 py-4 text-muted-foreground whitespace-nowrap'>
                        <span className='text-xs flex items-center'>
                          <CalendarIcon className='w-3 h-3 mr-1.5 opacity-40' />
                          {format(new Date(entry.createdAt), 'MMM d, yyyy')}
                        </span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        {entry.updatedBy ? (
                          <div className='flex items-center space-x-2'>
                            <span className='text-xs font-medium'>
                              {entry.updatedBy.name}
                            </span>
                          </div>
                        ) : (
                          <span className='text-xs text-muted-foreground italic'>
                            System
                          </span>
                        )}
                      </td>
                      <td className='px-6 py-4 text-right space-x-2 whitespace-nowrap'>
                        <Button variant='outline' size='sm' asChild>
                          <Link
                            href={`/entries/${collection.id}/edit/${entry.id}`}
                          >
                            Edit
                          </Link>
                        </Button>
                        <Button
                          variant='destructive'
                          size='sm'
                          onClick={() => handleDelete(entry.id)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className='px-6 py-4 bg-muted/20 border-t flex items-center justify-between'>
              <div className='text-xs text-muted-foreground'>
                Showing {(pagination.currentPage - 1) * pagination.limit + 1} to{' '}
                {Math.min(
                  pagination.currentPage * pagination.limit,
                  pagination.totalCount
                )}{' '}
                of {pagination.totalCount} entries
              </div>
              <div className='flex items-center space-x-2'>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={pagination.currentPage <= 1}
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  className='h-8'
                >
                  <ChevronLeft className='h-4 w-4 mr-1' />
                  Prev
                </Button>
                <div className='text-xs font-semibold px-2'>
                  {pagination.currentPage} / {pagination.totalPages}
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={pagination.currentPage >= pagination.totalPages}
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  className='h-8'
                >
                  Next
                  <ChevronRight className='h-4 w-4 ml-1' />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
