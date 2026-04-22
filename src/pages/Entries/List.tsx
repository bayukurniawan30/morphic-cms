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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
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
  enableTrash?: boolean
  fields: Field[]
}

interface Entry {
  id: number
  content: Record<string, any>
  updatedBy?: { id: number; name: string }
  status: 'published' | 'draft'
  locale?: string
  createdAt: string
  updatedAt: string
}

interface ListProps {
  collection: {
    id: number
    name: string
    slug: string
    localized?: boolean
    enableTrash?: boolean
    fields: Field[]
  }
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
    trash?: boolean
    locale?: string
  }
  allLocales?: { id: number; code: string; name: string; isDefault: boolean }[]
}

export default function EntriesList({
  collection,
  entries,
  user,
  pagination,
  filters,
  allLocales = [],
}: ListProps) {
  const isTrash = filters?.trash || false

  const handleDelete = async (entryId: number, force?: boolean) => {
    if (
      !confirm(
        `Are you sure you want to ${force ? 'permanently delete' : 'delete'} this entry?`
      )
    )
      return

    try {
      const res = await fetch(
        `/api/entries/${entryId}${force ? '?force=true' : ''}`,
        {
          method: 'DELETE',
        }
      )
      if (res.ok) {
        toast.success(
          `Entry ${force ? 'permanently deleted' : 'moved to trash'}`
        )
        window.location.reload()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to delete entry')
      }
    } catch (e) {
      toast.error('Network error')
    }
  }

  const handleRestore = async (entryId: number) => {
    try {
      const res = await fetch(`/api/entries/${entryId}/restore`, {
        method: 'POST',
      })
      if (res.ok) {
        toast.success('Entry restored')
        window.location.reload()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to restore entry')
      }
    } catch (e) {
      toast.error('Network error')
    }
  }

  const handlePageChange = (page: number) => {
    router.get(
      `/entries/${collection.id}`,
      { page, trash: isTrash, locale: filters?.locale },
      { preserveState: true }
    )
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
  const [previewLocale, setPreviewLocale] = React.useState('')
  const [previewData, setPreviewData] = React.useState<any>(null)
  const [isPreviewLoading, setIsPreviewLoading] = React.useState(false)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)

  React.useEffect(() => {
    if (!isDialogOpen) return

    const collectionType = (collection as any).type
    const fetchPreview = async () => {
      setIsPreviewLoading(true)
      try {
        let url =
          collectionType === 'global'
            ? `/api/collections/${collection.slug}/entries`
            : `/api/collections/${collection.slug}/entries?page=${previewPage}&limit=${previewLimit}`

        if (collection.localized && previewLocale) {
          url += (url.includes('?') ? '&' : '?') + `locale=${previewLocale}`
        }

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
  }, [
    previewPage,
    previewLimit,
    previewLocale,
    collection.slug,
    isDialogOpen,
    collection,
  ])

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
                <span className='inline-flex items-center px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[10px] uppercase tracking-wider'>
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
                    <div
                      className={cn(
                        'grid gap-4 bg-muted/30 p-4 rounded-lg border',
                        collection.localized
                          ? 'grid-cols-1 md:grid-cols-3'
                          : 'grid-cols-1 md:grid-cols-2'
                      )}
                    >
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
                      </div>
                      {collection.localized && (
                        <div className='space-y-2'>
                          <label className='text-[10px] font-bold uppercase tracking-widest opacity-50'>
                            Locale
                          </label>
                          <Select
                            value={previewLocale}
                            onValueChange={setPreviewLocale}
                          >
                            <SelectTrigger className='h-8 text-xs'>
                              <SelectValue placeholder='Select locale' />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='_all'>
                                All Languages
                              </SelectItem>
                              {allLocales.map((l) => (
                                <SelectItem key={l.code} value={l.code}>
                                  {l.name} ({l.code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  )}

                  <div className='space-y-2'>
                    <label className='text-[10px] font-bold uppercase tracking-widest opacity-50'>
                      Endpoint URL
                    </label>
                    <div className='flex space-x-2'>
                      <Input
                        readOnly
                        value={(() => {
                          let url =
                            (collection as any).type === 'global'
                              ? `${window.location.origin}/api/collections/${collection.slug}/entries`
                              : `${window.location.origin}/api/collections/${collection.slug}/entries?page=${previewPage}&limit=${previewLimit}`

                          if (collection.localized && previewLocale) {
                            url += `&locale=${previewLocale}`
                          }
                          return url
                        })()}
                        className='font-mono text-xs bg-muted/50'
                      />
                      <Button
                        variant='secondary'
                        size='icon'
                        onClick={() => {
                          let url =
                            (collection as any).type === 'global'
                              ? `${window.location.origin}/api/collections/${collection.slug}/entries`
                              : `${window.location.origin}/api/collections/${collection.slug}/entries?page=${previewPage}&limit=${previewLimit}`

                          if (collection.localized && previewLocale) {
                            url += `&locale=${previewLocale}`
                          }

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
                      <div className='flex items-center space-x-2'>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-7 text-[10px]'
                          onClick={() => {
                            const name = collection.name.replace(
                              /[^a-zA-Z0-9]/g,
                              ''
                            )
                            let fieldsTs = ''

                            collection.fields.forEach((f: any) => {
                              let type = 'any'
                              if (
                                [
                                  'text',
                                  'textarea',
                                  'rich-text',
                                  'slug',
                                  'email',
                                  'date',
                                  'datetime',
                                  'time',
                                  'select',
                                  'radio',
                                ].includes(f.type)
                              )
                                type = 'string'
                              if (['number'].includes(f.type)) type = 'number'
                              if (['boolean', 'checkbox'].includes(f.type))
                                type = 'boolean'
                              if (f.type === 'array') type = 'any[]'
                              if (f.type === 'relation')
                                type = '{ id: number; [key: string]: any }'

                              fieldsTs += `  ${f.name}${f.required ? '' : '?'}: ${type};\n`
                            })

                            const tsInterface = `export interface ${name}Content {\n${fieldsTs}}\n\nexport interface ${name}Entry {\n  id: number;\n  content: ${name}Content;\n  createdAt: string;\n  updatedAt: string;\n}\n`

                            navigator.clipboard.writeText(tsInterface)
                            toast.success(
                              'TypeScript interface copied to clipboard'
                            )
                          }}
                        >
                          <CodeIcon className='w-3 h-3 mr-1.5' />
                          Copy Types
                        </Button>
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

        {collection.enableTrash && (
          <div className='flex items-center space-x-2'>
            <Button
              variant={!isTrash ? 'secondary' : 'ghost'}
              size='sm'
              onClick={() =>
                router.get(
                  `/entries/${collection.id}`,
                  { trash: false },
                  { preserveState: true }
                )
              }
            >
              Active
            </Button>
            <Button
              variant={isTrash ? 'secondary' : 'ghost'}
              size='sm'
              onClick={() =>
                router.get(
                  `/entries/${collection.id}`,
                  { trash: true },
                  { preserveState: true }
                )
              }
              className={isTrash ? '' : 'text-muted-foreground'}
            >
              Trash
            </Button>
          </div>
        )}

        {collection.localized && (
          <div className='flex items-center space-x-2 bg-muted/40 p-1 rounded-lg border w-fit'>
            <Button
              variant={!filters?.locale ? 'secondary' : 'ghost'}
              size='sm'
              onClick={() =>
                router.get(
                  `/entries/${collection.id}`,
                  { locale: '' },
                  { preserveState: true }
                )
              }
              className='h-8 text-xs'
            >
              All Languages
            </Button>
            {allLocales.map((l) => (
              <Button
                key={l.id}
                variant={filters?.locale === l.code ? 'secondary' : 'ghost'}
                size='sm'
                onClick={() =>
                  router.get(
                    `/entries/${collection.id}`,
                    { locale: l.code },
                    { preserveState: true }
                  )
                }
                className='h-8 text-xs gap-2'
              >
                <span className='font-mono uppercase text-[10px]'>
                  {l.code}
                </span>
                <span>{l.name}</span>
              </Button>
            ))}
          </div>
        )}

        <div className='bg-card rounded-xl shadow-sm border overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm text-left'>
              <thead className='text-xs text-muted-foreground uppercase bg-muted/50 border-b'>
                <tr>
                  <th className='px-6 py-4 font-medium uppercase tracking-wider'>
                    #
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
                  {collection.localized && (
                    <th className='px-6 py-4 font-medium uppercase tracking-wider'>
                      Locale
                    </th>
                  )}
                  <th className='px-6 py-4 font-medium uppercase tracking-wider'>
                    Status
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
                      colSpan={visibleFields.length + 7}
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
                  entries.map((entry, index) => {
                    const currentPage = pagination?.currentPage || 1
                    const limit = pagination?.limit || 10
                    const rowNumber = (currentPage - 1) * limit + index + 1
                    return (
                      <tr
                        key={entry.id}
                        className='hover:bg-muted/30 transition-colors group'
                      >
                        <td className='px-6 py-4 font-mono text-xs opacity-50'>
                          {rowNumber}
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
                        {collection.localized && (
                          <td className='px-6 py-4 whitespace-nowrap'>
                            <span className='inline-flex items-center px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-mono text-[10px] uppercase font-bold'>
                              {entry.locale || 'en'}
                            </span>
                          </td>
                        )}
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <span
                            className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                              entry.status === 'published'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                            )}
                          >
                            <span
                              className={cn(
                                'w-1.5 h-1.5 rounded-full mr-1.5',
                                entry.status === 'published'
                                  ? 'bg-green-500'
                                  : 'bg-zinc-400'
                              )}
                            />
                            {entry.status || 'published'}
                          </span>
                        </td>
                        <td className='px-6 py-4 text-right space-x-2 whitespace-nowrap'>
                          {!isTrash ? (
                            <>
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
                            </>
                          ) : (
                            <>
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() => handleRestore(entry.id)}
                              >
                                Restore
                              </Button>
                              <Button
                                variant='destructive'
                                size='sm'
                                onClick={() => handleDelete(entry.id, true)}
                              >
                                Delete Permanently
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    )
                  })
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
