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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { Link, router, usePage } from '@inertiajs/react'
import {
  ArrowDown,
  ArrowLeftIcon,
  ArrowUp,
  BookOpen,
  CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  CodeIcon,
  Copy,
  CopyIcon,
  DatabaseIcon,
  FileCheckIcon,
  FileText,
  Image as ImageIcon,
  Maximize2,
  Minimize2,
  MoreVertical,
  PlusIcon,
  Shield,
  TerminalIcon,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import React from 'react'
import { format } from 'date-fns'

const truncateStringValues = (obj: any): any => {
  if (typeof obj === 'string') {
    return obj.length > 100 ? `${obj.slice(0, 100)}...` : obj
  }
  if (Array.isArray(obj)) {
    return obj.map(truncateStringValues)
  }
  if (obj && typeof obj === 'object') {
    const res: Record<string, any> = {}
    for (const [key, val] of Object.entries(obj)) {
      res[key] = truncateStringValues(val)
    }
    return res
  }
  return obj
}

const DocCodeBlock = ({
  code,
  language = 'bash',
  label,
}: {
  code: string
  language?: string
  label?: string
}) => {
  const [copied, setCopied] = React.useState(false)

  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className='relative group my-2.5 rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden shadow-sm'>
      {label && (
        <div className='flex items-center justify-between px-3 py-1.5 bg-zinc-900/80 border-b border-zinc-800 text-[11px] font-mono text-zinc-400'>
          <span className='font-semibold'>{label}</span>
          <span className='uppercase text-[10px] opacity-60'>{language}</span>
        </div>
      )}
      <div className='absolute right-2.5 top-2.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity'>
        <Button
          size='icon'
          variant='secondary'
          className='h-6 w-6 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
          onClick={copy}
        >
          {copied ? (
            <Check className='h-3.5 w-3.5 text-green-400' />
          ) : (
            <Copy className='h-3.5 w-3.5' />
          )}
        </Button>
      </div>
      <div className='p-3.5 max-h-72 overflow-x-auto overflow-y-auto font-mono text-xs text-zinc-300'>
        <pre className='whitespace-pre font-mono leading-relaxed'>{code}</pre>
      </div>
    </div>
  )
}

interface Field {
  name: string
  label: string
  type: string
  options?: { label: string; value: string }[]
}

interface Collection {
  id: number
  name: string
  slug: string
  type?: 'collection' | 'global'
  enableTrash?: boolean
  fields: Field[]
}

interface Entry {
  id: number
  content: Record<string, any>
  updatedBy?: { id: number; name: string }
  status: 'published' | 'draft'
  locale?: string
  translationGroupId?: string
  createdAt: string
  updatedAt: string
}

interface ListProps {
  collection: {
    id: number
    name: string
    slug: string
    type?: 'collection' | 'global'
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
    sort?: string
    dir?: string
  }
  allLocales?: { id: number; code: string; name: string; isDefault: boolean }[]
  connectedForms?: any[]
}

export default function EntriesList({
  collection,
  entries,
  user,
  pagination,
  filters,
  allLocales = [],
  connectedForms = [],
}: ListProps) {
  const isTrash = filters?.trash || false
  const { props: pageProps } = usePage()
  const activeTenant = (pageProps as any).activeTenant

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

  const currentSort = filters?.sort || 'createdAt'
  const currentDir = filters?.dir || 'desc'

  const updateFilters = (newFilters: any) => {
    const finalFilters = {
      trash: isTrash,
      locale: filters?.locale || '',
      sort: currentSort,
      dir: currentDir,
      page: pagination?.currentPage || 1,
      ...newFilters,
    }

    router.get(`/entries/${collection.id}`, finalFilters, {
      preserveState: true,
      preserveScroll: true,
    })
  }

  const handlePageChange = (page: number) => {
    updateFilters({ page })
  }

  const toggleSort = (field: string) => {
    const newDir =
      currentSort === field && currentDir === 'asc' ? 'desc' : 'asc'
    updateFilters({ sort: field, dir: newDir, page: 1 })
  }

  const renderSortIcon = (field: string) => {
    if (currentSort !== field) return null
    return currentDir === 'asc' ? (
      <ArrowUp className='ml-1 h-4 w-4' />
    ) : (
      <ArrowDown className='ml-1 h-4 w-4' />
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
  const [previewSortBy, setPreviewSortBy] = React.useState('createdAt')
  const [previewSortDir, setPreviewSortDir] = React.useState('desc')
  const [previewLocale, setPreviewLocale] = React.useState('')
  const [previewData, setPreviewData] = React.useState<any>(null)
  const [isPreviewLoading, setIsPreviewLoading] = React.useState(false)
  const [isPreviewExpanded, setIsPreviewExpanded] = React.useState(false)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [previewIncludeDrafts, setPreviewIncludeDrafts] = React.useState(false)

  React.useEffect(() => {
    if (!isDialogOpen) return

    const collectionType = (collection as any).type
    const fetchPreview = async () => {
      setIsPreviewLoading(true)
      try {
        let url =
          collectionType === 'global'
            ? `/api/collections/${collection.slug}/entries`
            : `/api/collections/${collection.slug}/entries?page=${previewPage}&limit=${previewLimit}&sortBy=${previewSortBy}&sortDir=${previewSortDir}`

        if (collection.localized && previewLocale) {
          url += (url.includes('?') ? '&' : '?') + `locale=${previewLocale}`
        }

        if (previewIncludeDrafts) {
          url += (url.includes('?') ? '&' : '?') + 'status=all'
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
    previewSortBy,
    previewSortDir,
    previewLocale,
    previewIncludeDrafts,
    collection.slug,
    isDialogOpen,
    collection,
  ])

  const hasMediaField = React.useMemo(() => {
    const checkFields = (fields: any[]): boolean => {
      return (
        fields?.some((f) => {
          if (f.type === 'media') return true
          if (f.type === 'group' && Array.isArray(f.fields))
            return checkFields(f.fields)
          if (f.type === 'array' && Array.isArray(f.fields))
            return checkFields(f.fields)
          return false
        }) || false
      )
    }
    return checkFields(collection.fields || [])
  }, [collection.fields])

  const mediaFieldNames = React.useMemo(() => {
    const names: string[] = []
    const collectNames = (fields: any[]) => {
      fields?.forEach((f) => {
        if (f.type === 'media') names.push(f.name)
        if (f.type === 'group' && Array.isArray(f.fields))
          collectNames(f.fields)
        if (f.type === 'array' && Array.isArray(f.fields))
          collectNames(f.fields)
      })
    }
    collectNames(collection.fields || [])
    return names
  }, [collection.fields])

  const sampleContent = React.useMemo(() => {
    const generateContent = (fields: any[]) => {
      const obj: Record<string, any> = {}
      fields?.forEach((f) => {
        if (f.type === 'text') obj[f.name] = `Sample ${f.label || f.name}`
        else if (f.type === 'textarea' || f.type === 'rich-text')
          obj[f.name] = `<p>Sample text for ${f.label || f.name}...</p>`
        else if (f.type === 'number') obj[f.name] = 42
        else if (f.type === 'boolean') obj[f.name] = true
        else if (f.type === 'date') obj[f.name] = '2026-08-30'
        else if (f.type === 'datetime')
          obj[f.name] = '2026-08-30T10:00:00.000Z'
        else if (f.type === 'time') obj[f.name] = '14:30'
        else if (f.type === 'email') obj[f.name] = 'user@example.com'
        else if (f.type === 'select' || f.type === 'radio') {
          obj[f.name] = f.options?.[0]?.value || 'option_1'
        } else if (f.type === 'checkbox') {
          obj[f.name] = f.options?.map((o: any) => o.value) || ['option_1']
        } else if (f.type === 'slug') {
          obj[f.name] = 'sample-entry-slug'
        } else if (f.type === 'relation') {
          obj[f.name] = { id: 1, name: 'Related Item' }
        } else if (f.type === 'media') {
          const sampleMedia = {
            id: 10,
            filename: 'image.jpg',
            secureUrl: 'https://storage.morphic-cms.com/tenants/1/image.jpg',
            mimeType: 'image/jpeg',
            size: 204800,
            width: 1200,
            height: 800,
          }
          obj[f.name] = f.multiple ? [sampleMedia] : sampleMedia
        } else if (f.type === 'documents') {
          const sampleDoc = {
            id: 5,
            filename: 'document.pdf',
            fileUrl: 'https://storage.morphic-cms.com/tenants/1/document.pdf',
            size: 1048576,
          }
          obj[f.name] = f.multiple ? [sampleDoc] : sampleDoc
        } else if (f.type === 'group') {
          obj[f.name] = f.fields ? generateContent(f.fields) : {}
        } else if (f.type === 'array') {
          obj[f.name] = f.fields ? [generateContent(f.fields)] : []
        } else {
          obj[f.name] = 'value'
        }
      })
      return obj
    }
    return generateContent(collection.fields || [])
  }, [collection.fields])

  const sampleEntry = React.useMemo(() => {
    const rawContent = entries?.[0]?.content
      ? truncateStringValues(entries[0].content)
      : truncateStringValues(sampleContent)
    return {
      id: entries?.[0]?.id || 1,
      tenantId: activeTenant?.id || 1,
      collectionId: collection.id,
      content: rawContent,
      status: entries?.[0]?.status || 'published',
      locale: entries?.[0]?.locale || (collection.localized ? 'en' : 'en'),
      translationGroupId:
        entries?.[0]?.translationGroupId ||
        '3d7258f9-1147-4ddc-b212-6eb30d5110fe',
      createdAt: entries?.[0]?.createdAt || new Date().toISOString(),
      updatedAt: entries?.[0]?.updatedAt || new Date().toISOString(),
      deletedAt: null,
      updatedBy: {
        id: user?.id || 1,
        name: user?.name || 'Admin User',
      },
    }
  }, [
    entries,
    sampleContent,
    activeTenant?.id,
    collection.id,
    collection.localized,
    user,
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
      case 'media': {
        const mediaArray = Array.isArray(value) ? value : value ? [value] : []
        if (mediaArray.length === 0) {
          return <span className='text-muted-foreground italic'>empty</span>
        }

        const maxVisible = 3
        const visibleMedia = mediaArray.slice(0, maxVisible)
        const extraCount = mediaArray.length - maxVisible

        return (
          <div className='flex items-center space-x-1'>
            {visibleMedia.map((m: any, idx: number) => {
              const url =
                m.resourceType === 'video'
                  ? m.secureUrl?.replace(/\.[^/.]+$/, '.jpg')
                  : m.secureUrl
              return (
                <img
                  key={idx}
                  src={url}
                  alt={m.filename || 'media'}
                  className='w-8 h-8 object-cover rounded border bg-muted'
                />
              )
            })}
            {extraCount > 0 && (
              <span className='text-xs font-semibold text-muted-foreground pl-1'>
                +{extraCount}
              </span>
            )}
          </div>
        )
      }
      case 'array': {
        const arrayItems = Array.isArray(value) ? value : []
        const count = arrayItems.length
        if (count === 0) {
          return (
            <span className='text-muted-foreground italic text-xs'>Empty</span>
          )
        }
        return (
          <span className='truncate max-w-[200px] inline-block opacity-70 italic text-xs'>
            {count} {count === 1 ? 'item' : 'items'}
          </span>
        )
      }
      case 'rich-text':
        return (
          <span className='truncate max-w-[200px] inline-block opacity-70 italic text-xs'>
            Rich content...
          </span>
        )
      case 'group': {
        const keys =
          value && typeof value === 'object' ? Object.keys(value) : []
        if (keys.length === 0) {
          return (
            <span className='text-muted-foreground italic text-xs'>Empty</span>
          )
        }
        return (
          <span className='truncate max-w-[200px] inline-block opacity-70 italic text-xs'>
            Group ({keys.length} fields)
          </span>
        )
      }
      case 'date':
      case 'datetime':
        return format(new Date(value), field.type === 'date' ? 'PPP' : 'PPP p')
      case 'radio':
      case 'checkbox':
      case 'select': {
        const getLabel = (val: any) => {
          const opt = field.options?.find(
            (o) => String(o.value) === String(val)
          )
          return opt ? opt.label : String(val)
        }
        const strValue = Array.isArray(value)
          ? value.map(getLabel).join(', ')
          : getLabel(value)
        return (
          <span
            className='truncate max-w-[150px] inline-block'
            title={strValue}
          >
            {strValue}
          </span>
        )
      }
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
      default: {
        const strValue = String(value)
        return (
          <span
            className='truncate max-w-[150px] inline-block'
            title={strValue}
          >
            {strValue}
          </span>
        )
      }
    }
  }

  return (
    <Layout user={user} title={`${collection.name} Entries | Morphic`}>
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
                  <TerminalIcon className='w-4 h-4 mr-2' />
                  API Preview
                </Button>
              </DialogTrigger>
              <DialogContent className='max-w-4xl max-h-[90vh] flex flex-col min-h-0 overflow-hidden'>
                <DialogHeader>
                  <DialogTitle className='flex items-center'>
                    <TerminalIcon className='w-5 h-5 mr-2 text-primary' />
                    API Documentation & Preview
                  </DialogTitle>
                  <DialogDescription>
                    API reference, endpoints, schemas, and live responses for{' '}
                    <strong>{collection.name}</strong>.
                  </DialogDescription>
                </DialogHeader>

                <Tabs
                  defaultValue='docs'
                  className='flex-1 flex flex-col mt-4 overflow-hidden min-h-0'
                >
                  <TabsList className='grid w-full grid-cols-3 mb-4 shrink-0'>
                    <TabsTrigger value='docs' className='flex items-center'>
                      <BookOpen className='w-4 h-4 mr-2' />
                      Documentation
                    </TabsTrigger>
                    <TabsTrigger value='rest' className='flex items-center'>
                      <TerminalIcon className='w-4 h-4 mr-2' />
                      REST Preview
                    </TabsTrigger>
                    <TabsTrigger value='graphql' className='flex items-center'>
                      <DatabaseIcon className='w-4 h-4 mr-2' />
                      GraphQL Preview
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent
                    value='docs'
                    className='flex-1 overflow-y-auto min-h-0 m-0 pr-3 pb-4 space-y-6 text-sm text-foreground focus-visible:outline-none'
                  >
                        {/* Auth & Mandatory Header Info */}
                        <div className='bg-primary/5 border border-primary/20 p-4 rounded-xl flex items-start space-x-3'>
                          <Shield className='w-5 h-5 text-primary mt-0.5 shrink-0' />
                          <div className='text-xs space-y-1.5 flex-1'>
                            <p className='font-bold text-foreground text-sm'>
                              Authentication & Required Headers
                            </p>
                            <p className='text-muted-foreground'>
                              Include your API key as a Bearer token and your workspace ID in the <code>X-Tenant-ID</code> header:
                            </p>
                            <div className='font-mono bg-background/80 p-2.5 rounded border text-[11px] space-y-1 text-primary mt-1 shadow-sm'>
                              <div>Authorization: Bearer {user?.apiKey || '<YOUR_API_KEY>'}</div>
                              <div>X-Tenant-ID: {activeTenant?.id || '<TENANT_ID>'}</div>
                            </div>
                          </div>
                        </div>

                        {/* 1. GET Entries */}
                        <div className='space-y-3 border-b pb-6'>
                          <div className='flex items-center justify-between'>
                            <h4 className='font-bold flex items-center text-xs uppercase tracking-widest text-foreground'>
                              <span className='w-2 h-2 rounded-full bg-green-500 mr-2' />
                              1. Get Collection Entries
                            </h4>
                            <span className='px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-600 border border-green-500/20'>
                              GET
                            </span>
                          </div>
                          <DocCodeBlock
                            code={`GET ${typeof window !== 'undefined' ? window.location.origin : ''}/api/collections/${collection.slug}/entries?page=1&limit=10`}
                            language='http'
                          />
                          <p className='text-xs text-muted-foreground'>
                            Retrieve paginated entries for <strong>{collection.name}</strong>.
                          </p>

                          <div className='bg-muted/30 p-3 rounded-lg border text-xs space-y-2'>
                            <p className='font-semibold text-[11px] uppercase tracking-wider text-muted-foreground'>
                              Query Parameters
                            </p>
                            <ul className='space-y-1.5 text-xs text-muted-foreground'>
                              <li>
                                <code className='text-primary font-mono font-semibold'>page</code>: Page number (default: <code>1</code>)
                              </li>
                              <li>
                                <code className='text-primary font-mono font-semibold'>limit</code>: Items per page (default: <code>10</code>, max: <code>100</code>)
                              </li>
                              <li>
                                <code className='text-primary font-mono font-semibold'>sortBy</code>: Field name to sort by (e.g. <code>createdAt</code>, <code>id</code>)
                              </li>
                              <li>
                                <code className='text-primary font-mono font-semibold'>sortDir</code>: Sort direction (<code>asc</code> or <code>desc</code>)
                              </li>
                              {collection.localized && (
                                <li>
                                  <code className='text-primary font-mono font-semibold'>locale</code>: Language code (e.g. <code>en</code>, <code>id</code>, or <code>_all</code> for all translations)
                                </li>
                              )}
                              <li>
                                <code className='text-primary font-mono font-semibold'>status</code>: Entry status (<code>published</code>, <code>draft</code>, or <code>all</code>)
                              </li>
                              {collection.enableTrash && (
                                <li>
                                  <code className='text-primary font-mono font-semibold'>trash</code>: Set to <code>true</code> to retrieve deleted items from trash
                                </li>
                              )}
                            </ul>
                          </div>

                          <p className='text-[11px] font-bold uppercase tracking-wider text-muted-foreground pt-1'>
                            Response Payload (200 OK)
                          </p>
                          <DocCodeBlock
                            code={JSON.stringify(
                              {
                                type: collection.type || 'collection',
                                entries: [sampleEntry],
                                pagination: {
                                  currentPage: 1,
                                  totalPages: 1,
                                  totalCount: 1,
                                  limit: 10,
                                },
                              },
                              null,
                              2
                            )}
                            language='json'
                          />
                        </div>

                        {/* 2. GET Single Entry */}
                        <div className='space-y-3 border-b pb-6'>
                          <div className='flex items-center justify-between'>
                            <h4 className='font-bold flex items-center text-xs uppercase tracking-widest text-foreground'>
                              <span className='w-2 h-2 rounded-full bg-green-500 mr-2' />
                              2. Get Single Entry
                            </h4>
                            <span className='px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-600 border border-green-500/20'>
                              GET
                            </span>
                          </div>
                          <DocCodeBlock
                            code={`GET ${typeof window !== 'undefined' ? window.location.origin : ''}/api/entries/${sampleEntry.id}`}
                            language='http'
                          />
                          <p className='text-xs text-muted-foreground'>
                            Retrieve a single entry by its numeric ID (e.g. <code>{sampleEntry.id}</code>).
                          </p>
                          <p className='text-[11px] font-bold uppercase tracking-wider text-muted-foreground pt-1'>
                            Response Payload (200 OK)
                          </p>
                          <DocCodeBlock
                            code={JSON.stringify(sampleEntry, null, 2)}
                            language='json'
                          />
                        </div>

                        {/* 3. POST Create Entry */}
                        <div className='space-y-3 border-b pb-6'>
                          <div className='flex items-center justify-between'>
                            <h4 className='font-bold flex items-center text-xs uppercase tracking-widest text-foreground'>
                              <span className='w-2 h-2 rounded-full bg-blue-500 mr-2' />
                              3. Create Entry
                            </h4>
                            <span className='px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20'>
                              POST
                            </span>
                          </div>
                          <DocCodeBlock
                            code={`POST ${typeof window !== 'undefined' ? window.location.origin : ''}/api/collections/${collection.slug}/entries\nContent-Type: application/json`}
                            language='http'
                          />
                          <p className='text-xs text-muted-foreground'>
                            Create a new entry in this collection. Requires an API key with <code>create</code> permissions for <code>{collection.slug}</code>.
                          </p>
                          <p className='text-[11px] font-bold uppercase tracking-wider text-muted-foreground pt-1'>
                            Request Body Payload (JSON)
                          </p>
                          <DocCodeBlock
                            code={JSON.stringify(
                              {
                                ...sampleContent,
                                status: 'published',
                                ...(collection.localized ? { locale: 'en' } : {}),
                              },
                              null,
                              2
                            )}
                            language='json'
                          />
                          {collection.localized && (
                            <>
                              <p className='text-[11px] font-bold uppercase tracking-wider text-muted-foreground pt-1'>
                                Alternative: Bulk Multi-Language Save
                              </p>
                              <DocCodeBlock
                                code={JSON.stringify(
                                  {
                                    locales: {
                                      en: sampleContent,
                                      id: sampleContent,
                                    },
                                    status: 'published',
                                  },
                                  null,
                                  2
                                )}
                                language='json'
                              />
                            </>
                          )}
                          <p className='text-[11px] font-bold uppercase tracking-wider text-muted-foreground pt-1'>
                            Response Payload (201 Created)
                          </p>
                          <DocCodeBlock
                            code={JSON.stringify(
                              { success: true, entry: sampleEntry },
                              null,
                              2
                            )}
                            language='json'
                          />
                        </div>

                        {/* 4. PUT Update Entry */}
                        <div className='space-y-3 border-b pb-6'>
                          <div className='flex items-center justify-between'>
                            <h4 className='font-bold flex items-center text-xs uppercase tracking-widest text-foreground'>
                              <span className='w-2 h-2 rounded-full bg-amber-500 mr-2' />
                              4. Update Entry
                            </h4>
                            <span className='px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20'>
                              PUT
                            </span>
                          </div>
                          <DocCodeBlock
                            code={`PUT ${typeof window !== 'undefined' ? window.location.origin : ''}/api/entries/${sampleEntry.id}\nContent-Type: application/json`}
                            language='http'
                          />
                          <p className='text-xs text-muted-foreground'>
                            Update an existing entry by its ID (e.g. <code>{sampleEntry.id}</code>). Requires an API key with <code>update</code> permissions for <code>{collection.slug}</code>.
                          </p>
                          <p className='text-[11px] font-bold uppercase tracking-wider text-muted-foreground pt-1'>
                            Request Body Payload (JSON)
                          </p>
                          <DocCodeBlock
                            code={JSON.stringify(
                              {
                                ...sampleContent,
                                status: 'published',
                              },
                              null,
                              2
                            )}
                            language='json'
                          />
                          <p className='text-[11px] font-bold uppercase tracking-wider text-muted-foreground pt-1'>
                            Response Payload (200 OK)
                          </p>
                          <DocCodeBlock
                            code={JSON.stringify(
                              { success: true, entry: sampleEntry },
                              null,
                              2
                            )}
                            language='json'
                          />
                        </div>

                        {/* 5. DELETE Entry */}
                        <div className='space-y-3 border-b pb-6'>
                          <div className='flex items-center justify-between'>
                            <h4 className='font-bold flex items-center text-xs uppercase tracking-widest text-foreground'>
                              <span className='w-2 h-2 rounded-full bg-red-500 mr-2' />
                              5. Delete Entry
                            </h4>
                            <span className='px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-600 border border-red-500/20'>
                              DELETE
                            </span>
                          </div>
                          <DocCodeBlock
                            code={`DELETE ${typeof window !== 'undefined' ? window.location.origin : ''}/api/entries/${sampleEntry.id}`}
                            language='http'
                          />
                          <p className='text-xs text-muted-foreground'>
                            Permanently delete an entry by its ID (e.g. <code>{sampleEntry.id}</code>) or move to trash if trash is enabled for this collection. Requires an API key with <code>delete</code> permissions.
                          </p>
                          <p className='text-[11px] font-bold uppercase tracking-wider text-muted-foreground pt-1'>
                            Response Payload (200 OK)
                          </p>
                          <DocCodeBlock
                            code={JSON.stringify({ success: true }, null, 2)}
                            language='json'
                          />
                        </div>

                        {/* 6. Media Upload Section */}
                        {hasMediaField && (
                          <div className='space-y-4 bg-primary/5 p-4 rounded-xl border border-primary/20'>
                            <div className='flex items-center space-x-2'>
                              <ImageIcon className='w-5 h-5 text-primary' />
                              <h3 className='font-bold text-sm text-foreground'>
                                How to Upload & Attach Media
                              </h3>
                            </div>
                            <p className='text-xs text-muted-foreground'>
                              This collection contains media field(s):{' '}
                              <strong className='text-foreground'>{mediaFieldNames.join(', ')}</strong>.
                              To attach media files, first upload the binary file to the Media API, then pass the returned media object or URL in your entry payload.
                            </p>

                            <div className='space-y-2'>
                              <p className='text-[11px] font-bold uppercase tracking-wider text-muted-foreground'>
                                Step 1: Upload File to Media API
                              </p>
                              <DocCodeBlock
                                code={`POST ${typeof window !== 'undefined' ? window.location.origin : ''}/api/media/upload\nContent-Type: multipart/form-data\n\nfile: <binary_file>\nfolderId: 123 (optional)`}
                                language='http'
                              />
                              <p className='text-[11px] font-bold uppercase tracking-wider text-muted-foreground'>
                                Upload Response (200 OK)
                              </p>
                              <DocCodeBlock
                                code={JSON.stringify(
                                  {
                                    id: 10,
                                    tenantId: activeTenant?.id || 1,
                                    filename: 'banner.jpg',
                                    originalName: 'banner.jpg',
                                    mimeType: 'image/jpeg',
                                    size: 524288,
                                    secureUrl: 'https://storage.morphic-cms.com/tenants/1/banner.jpg',
                                    createdAt: new Date().toISOString(),
                                  },
                                  null,
                                  2
                                )}
                                language='json'
                              />
                            </div>

                            <div className='space-y-2 pt-2'>
                              <p className='text-[11px] font-bold uppercase tracking-wider text-muted-foreground'>
                                Step 2: Attach Media Object to Entry
                              </p>
                              <p className='text-xs text-muted-foreground'>
                                Pass the uploaded media object into the <code>{mediaFieldNames[0] || 'media_field'}</code> field when creating or updating entries in <code>POST ${typeof window !== 'undefined' ? window.location.origin : ''}/api/collections/{collection.slug}/entries</code>:
                              </p>
                              <DocCodeBlock
                                code={JSON.stringify(
                                  {
                                    ...sampleContent,
                                    status: 'published',
                                  },
                                  null,
                                  2
                                )}
                                language='json'
                              />
                            </div>
                          </div>
                        )}
                  </TabsContent>

                  <TabsContent
                    value='rest'
                    className='flex-1 flex flex-col overflow-hidden space-y-4 m-0'
                  >
                    {!isPreviewExpanded &&
                      (collection as any).type !== 'global' && (
                        <div
                          className={cn(
                            'grid gap-4 bg-muted/30 p-4 rounded-lg border',
                            collection.localized
                              ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5'
                              : 'grid-cols-2 md:grid-cols-4'
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
                                    Math.min(
                                      100,
                                      parseInt(e.target.value) || 10
                                    )
                                  )
                                )
                              }
                              className='h-8 text-xs'
                            />
                          </div>
                          <div className='space-y-2'>
                            <label className='text-[10px] font-bold uppercase tracking-widest opacity-50'>
                              Sort By
                            </label>
                            <Select
                              value={previewSortBy}
                              onValueChange={setPreviewSortBy}
                            >
                              <SelectTrigger className='h-8 text-xs'>
                                <SelectValue placeholder='Sort by' />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value='createdAt'>
                                  Created At
                                </SelectItem>
                                <SelectItem value='id'>ID</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className='space-y-2'>
                            <label className='text-[10px] font-bold uppercase tracking-widest opacity-50'>
                              Sort Direction
                            </label>
                            <Select
                              value={previewSortDir}
                              onValueChange={setPreviewSortDir}
                            >
                              <SelectTrigger className='h-8 text-xs'>
                                <SelectValue placeholder='Sort direction' />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value='desc'>Descending</SelectItem>
                                <SelectItem value='asc'>Ascending</SelectItem>
                              </SelectContent>
                            </Select>
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

                    {!isPreviewExpanded && (
                      <div className='flex items-center space-x-3 bg-muted/10 p-3.5 rounded-lg border border-border/40 text-xs'>
                        <input
                          id='include-drafts'
                          type='checkbox'
                          checked={previewIncludeDrafts}
                          onChange={(e) =>
                            setPreviewIncludeDrafts(e.target.checked)
                          }
                          className='h-4 w-4 rounded border-zinc-800 bg-zinc-950 text-primary focus:ring-primary focus:ring-offset-zinc-950 accent-primary cursor-pointer'
                        />
                        <label
                          htmlFor='include-drafts'
                          className='font-medium leading-none text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none'
                        >
                          Include Draft Entries{' '}
                          <span className='opacity-60 font-normal'>
                            (Appends{' '}
                            <code className='text-[10px] font-mono bg-muted/50 px-1 py-0.5 rounded'>
                              &status=all
                            </code>{' '}
                            to queries)
                          </span>
                        </label>
                      </div>
                    )}

                    {!isPreviewExpanded && (
                      <div className='space-y-2'>
                        <label className='text-[10px] font-bold uppercase tracking-widest opacity-50'>
                          REST Endpoint URL
                        </label>
                        <div className='flex space-x-2'>
                          <Input
                            readOnly
                            value={(() => {
                              let url =
                                (collection as any).type === 'global'
                                  ? `${window.location.origin}/api/collections/${collection.slug}/entries`
                                  : `${window.location.origin}/api/collections/${collection.slug}/entries?page=${previewPage}&limit=${previewLimit}&sortBy=${previewSortBy}&sortDir=${previewSortDir}`

                              if (collection.localized && previewLocale) {
                                url += `&locale=${previewLocale}`
                              }
                              if (previewIncludeDrafts) {
                                url += `&status=all`
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
                              if (previewIncludeDrafts) {
                                url += `&status=all`
                              }

                              navigator.clipboard.writeText(url)
                              toast.success('URL copied to clipboard')
                            }}
                          >
                            <CopyIcon className='w-4 h-4' />
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className='flex-1 flex flex-col min-h-0 space-y-2'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center space-x-3'>
                          <label className='text-[10px] font-bold uppercase tracking-widest opacity-50'>
                            JSON Response
                          </label>
                          {isPreviewLoading && (
                            <span className='text-[10px] animate-pulse text-primary font-bold'>
                              LOADING...
                            </span>
                          )}
                          <Button
                            variant='ghost'
                            size='sm'
                            className='h-6 px-2 text-[9px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground'
                            onClick={() =>
                              setIsPreviewExpanded(!isPreviewExpanded)
                            }
                          >
                            {isPreviewExpanded ? (
                              <>
                                <Minimize2 className='w-3 h-3 mr-1' />
                                Collapse
                              </>
                            ) : (
                              <>
                                <Maximize2 className='w-3 h-3 mr-1' />
                                Expand
                              </>
                            )}
                          </Button>
                        </div>
                        {/* Desktop Copy Buttons: Hidden on mobile, shown on desktop */}
                        <div className='hidden sm:flex items-center space-x-2'>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='h-7 text-[10px]'
                            onClick={() => {
                              const name = collection.name.replace(
                                /[^a-zA-Z0-9]/g,
                                ''
                              )

                              const getFieldTsType = (
                                f: any,
                                depth = 1
                              ): string => {
                                const indent = '  '.repeat(depth + 1)
                                const closingIndent = '  '.repeat(depth)

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
                                ) {
                                  return 'string'
                                }
                                if (['number'].includes(f.type)) return 'number'
                                if (['boolean', 'checkbox'].includes(f.type))
                                  return 'boolean'
                                if (f.type === 'array') {
                                  if (f.fields && Array.isArray(f.fields)) {
                                    const childFieldsTs = f.fields
                                      .map(
                                        (cf: any) =>
                                          `${indent}${cf.name}${cf.required ? '' : '?'}: ${getFieldTsType(cf, depth + 1)};`
                                      )
                                      .join('\n')
                                    return `{\n${childFieldsTs}\n${closingIndent}}[]`
                                  }
                                  return 'any[]'
                                }
                                if (f.type === 'relation') {
                                  return '{ id: number; [key: string]: any }'
                                }
                                if (f.type === 'media') {
                                  const mediaType =
                                    '{ id: number; secureUrl: string; filename: string; mimeType: string; size: number; width: number | null; height: number | null; }'
                                  return f.multiple
                                    ? `${mediaType}[]`
                                    : mediaType
                                }
                                if (f.type === 'group') {
                                  if (f.fields && Array.isArray(f.fields)) {
                                    const childFieldsTs = f.fields
                                      .map(
                                        (cf: any) =>
                                          `${indent}${cf.name}${cf.required ? '' : '?'}: ${getFieldTsType(cf, depth + 1)};`
                                      )
                                      .join('\n')
                                    return `{\n${childFieldsTs}\n${closingIndent}}`
                                  }
                                  return 'any'
                                }
                                return 'any'
                              }

                              let fieldsTs = ''
                              collection.fields.forEach((f: any) => {
                                const type = getFieldTsType(f)
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
                          <Button
                            variant='ghost'
                            size='sm'
                            className='h-7 text-[10px]'
                            onClick={() => {
                              let url =
                                (collection as any).type === 'global'
                                  ? `${window.location.origin}/api/collections/${collection.slug}/entries`
                                  : `${window.location.origin}/api/collections/${collection.slug}/entries?page=${previewPage}&limit=${previewLimit}&sortBy=${previewSortBy}&sortDir=${previewSortDir}`

                              if (collection.localized && previewLocale) {
                                url += `&locale=${previewLocale}`
                              }
                              if (previewIncludeDrafts) {
                                url += `&status=all`
                              }

                              const tenantId =
                                activeTenant?.id || 'YOUR_TENANT_ID'
                              const apiKey = user?.apiKey || 'YOUR_API_KEY'
                              const curlCmd = `curl -X GET "${url}" \\\n  -H "Authorization: Bearer ${apiKey}" \\\n  -H "X-Tenant-ID: ${tenantId}"`
                              navigator.clipboard.writeText(curlCmd)
                              toast.success('cURL copied to clipboard')
                            }}
                          >
                            <TerminalIcon className='w-3 h-3 mr-1.5' />
                            Copy cURL
                          </Button>
                        </div>

                        {/* Mobile Dropdown Menu: Shown on mobile, hidden on desktop */}
                        <div className='flex sm:hidden'>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-7 w-7 text-muted-foreground hover:text-foreground'
                              >
                                <MoreVertical className='w-4 h-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end' className='w-48'>
                              <DropdownMenuItem
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
                                    if (['number'].includes(f.type))
                                      type = 'number'
                                    if (
                                      ['boolean', 'checkbox'].includes(f.type)
                                    )
                                      type = 'boolean'
                                    if (f.type === 'array') type = 'any[]'
                                    if (f.type === 'relation')
                                      type =
                                        '{ id: number; [key: string]: any }'

                                    fieldsTs += `  ${f.name}${f.required ? '' : '?'}: ${type};\n`
                                  })

                                  const tsInterface = `export interface ${name}Content {\n${fieldsTs}}\n\nexport interface ${name}Entry {\n  id: number;\n  content: ${name}Content;\n  createdAt: string;\n  updatedAt: string;\n}\n`

                                  navigator.clipboard.writeText(tsInterface)
                                  toast.success(
                                    'TypeScript interface copied to clipboard'
                                  )
                                }}
                              >
                                <CodeIcon className='w-4 h-4 mr-2 text-muted-foreground' />
                                Copy TS Types
                              </DropdownMenuItem>
                              <DropdownMenuItem
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
                                <CopyIcon className='w-4 h-4 mr-2 text-muted-foreground' />
                                Copy JSON
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  let url =
                                    (collection as any).type === 'global'
                                      ? `${window.location.origin}/api/collections/${collection.slug}/entries`
                                      : `${window.location.origin}/api/collections/${collection.slug}/entries?page=${previewPage}&limit=${previewLimit}&sortBy=${previewSortBy}&sortDir=${previewSortDir}`

                                  if (collection.localized && previewLocale) {
                                    url += `&locale=${previewLocale}`
                                  }
                                  if (previewIncludeDrafts) {
                                    url += `&status=all`
                                  }

                                  const tenantId =
                                    activeTenant?.id || 'YOUR_TENANT_ID'
                                  const apiKey = user?.apiKey || 'YOUR_API_KEY'
                                  const curlCmd = `curl -X GET "${url}" \\\n  -H "Authorization: Bearer ${apiKey}" \\\n  -H "X-Tenant-ID: ${tenantId}"`
                                  navigator.clipboard.writeText(curlCmd)
                                  toast.success('cURL copied to clipboard')
                                }}
                              >
                                <TerminalIcon className='w-4 h-4 mr-2 text-muted-foreground' />
                                Copy cURL
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className='relative overflow-hidden rounded-md border bg-zinc-950 group'>
                        {/* Decorative Glow */}
                        <div className='absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-blue-500/30 rounded-full blur-[80px] group-hover:blur-[100px] transition-all duration-500 pointer-events-none' />

                        <ScrollArea
                          className={cn(
                            'p-4 font-mono text-xs text-zinc-300 transition-all duration-300 bg-transparent',
                            isPreviewExpanded ? 'h-[500px]' : 'h-[300px]'
                          )}
                        >
                          <div className='min-w-max relative z-10'>
                            <pre className='whitespace-pre'>
                              {previewData
                                ? JSON.stringify(previewData, null, 2)
                                : '// Loading preview data...'}
                            </pre>
                          </div>
                        </ScrollArea>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value='graphql'
                    className='flex-1 flex flex-col overflow-hidden space-y-4 m-0'
                  >
                    <div className='space-y-2'>
                      <label className='text-[10px] font-bold uppercase tracking-widest opacity-50'>
                        GraphQL Endpoint
                      </label>
                      <div className='flex space-x-2'>
                        <Input
                          readOnly
                          value={`${window.location.origin}/api/graphql`}
                          className='font-mono text-xs bg-muted/50'
                        />
                        <Button
                          variant='secondary'
                          size='icon'
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `${window.location.origin}/api/graphql`
                            )
                            toast.success(
                              'GraphQL endpoint copied to clipboard'
                            )
                          }}
                        >
                          <CopyIcon className='w-4 h-4' />
                        </Button>
                      </div>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0'>
                      <div className='flex flex-col space-y-2 overflow-hidden'>
                        <div className='flex items-center justify-between'>
                          <label className='text-[10px] font-bold uppercase tracking-widest opacity-50'>
                            GraphQL Query
                          </label>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='h-7 text-[10px]'
                            onClick={() => {
                              const query = `query {\n  entries(collectionSlug: "${collection.slug}", limit: ${previewLimit}, page: ${previewPage}, sortBy: "${previewSortBy}", sortDir: "${previewSortDir}"${previewLocale && previewLocale !== '_all' ? `, locale: "${previewLocale}"` : ''}) {\n    id\n    content\n    status\n    locale\n    createdAt\n  }\n}`
                              navigator.clipboard.writeText(query)
                              toast.success('Query copied to clipboard')
                            }}
                          >
                            <CopyIcon className='w-3 h-3 mr-1.5' />
                            Copy Query
                          </Button>
                        </div>
                        <div className='relative overflow-hidden rounded-md border bg-zinc-950 group flex-1 flex flex-col min-h-0'>
                          {/* Decorative Glow */}
                          <div className='absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-purple-500/10 rounded-full blur-[80px] group-hover:blur-[100px] transition-all duration-500 pointer-events-none' />

                          <ScrollArea className='flex-1 p-4 font-mono text-[11px] text-zinc-400 bg-transparent'>
                            <div className='relative z-10'>
                              <pre className='whitespace-pre'>
                                {`query {\n  entries(collectionSlug: "${collection.slug}", limit: ${previewLimit}, page: ${previewPage}, sortBy: "${previewSortBy}", sortDir: "${previewSortDir}"${previewLocale && previewLocale !== '_all' ? `, locale: "${previewLocale}"` : ''}) {\n    id\n    content\n    status\n    locale\n    createdAt\n  }\n}`}
                              </pre>
                            </div>
                          </ScrollArea>
                        </div>
                      </div>

                      <div className='flex flex-col space-y-2 overflow-hidden'>
                        <div className='flex items-center justify-between'>
                          <label className='text-[10px] font-bold uppercase tracking-widest opacity-50'>
                            Data Response
                          </label>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='h-7 px-2 text-[10px]'
                            onClick={() => {
                              const json = JSON.stringify(
                                {
                                  data: {
                                    entries:
                                      previewData?.entries || previewData || [],
                                  },
                                },
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
                        <div className='relative overflow-hidden rounded-md border bg-zinc-950 group flex-1 flex flex-col min-h-0'>
                          {/* Decorative Glow */}
                          <div className='absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[80px] group-hover:blur-[100px] transition-all duration-500 pointer-events-none' />

                          <ScrollArea className='flex-1 p-4 font-mono text-[11px] text-zinc-300 bg-transparent'>
                            <div className='relative z-10'>
                              <pre className='whitespace-pre'>
                                {previewData
                                  ? JSON.stringify(
                                      {
                                        data: {
                                          entries:
                                            previewData.entries || previewData,
                                        },
                                      },
                                      null,
                                      2
                                    )
                                  : '// Requesting data...'}
                              </pre>
                            </div>
                          </ScrollArea>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className='mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-start space-x-3'>
                  <DatabaseIcon className='w-4 h-4 text-primary mt-0.5' />
                  <div className='text-[11px] text-zinc-500 leading-relaxed'>
                    <span className='font-bold text-primary'>
                      External Request Tip:
                    </span>{' '}
                    When hitting the API from external apps (Mobile, Frontend,
                    cURL), you must include the header{' '}
                    <code className='text-primary font-mono'>
                      X-Tenant-ID: {activeTenant?.id || '[TENANT_ID]'}
                    </code>{' '}
                    to authorize access to this workspace's data.
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {!(collection.type === 'global' && entries.length >= 1) && (
              <Button asChild>
                <Link href={`/entries/${collection.id}/add`}>
                  <PlusIcon className='w-4 h-4 mr-2' />
                  Add Entry
                </Link>
              </Button>
            )}
          </div>
        </div>

        {connectedForms.length > 0 && (
          <div className='flex flex-wrap gap-3 p-4 bg-primary/5 rounded-xl border border-primary/10'>
            <div className='flex items-center gap-2 mr-2'>
              <FileCheckIcon className='w-4 h-4 text-primary' />
              <span className='text-xs font-bold uppercase tracking-wider text-primary/70'>
                Connected Forms:
              </span>
            </div>
            {connectedForms.map((f) => (
              <Button
                key={f.id}
                variant='secondary'
                size='sm'
                asChild
                className='h-7 text-xs bg-background hover:bg-primary/10 border-primary/20'
              >
                <Link href={`/forms/${f.slug}/entries`}>
                  View {f.name} Entries
                </Link>
              </Button>
            ))}
          </div>
        )}

        {collection.enableTrash && (
          <div className='flex items-center space-x-2'>
            <Button
              variant={!isTrash ? 'secondary' : 'ghost'}
              size='sm'
              onClick={() => updateFilters({ trash: false, page: 1 })}
            >
              Active
            </Button>
            <Button
              variant={isTrash ? 'secondary' : 'ghost'}
              size='sm'
              onClick={() => updateFilters({ trash: true, page: 1 })}
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
              onClick={() => updateFilters({ locale: '', page: 1 })}
              className='h-8 text-xs'
            >
              All Languages
            </Button>
            {allLocales.map((l) => (
              <Button
                key={l.id}
                variant={filters?.locale === l.code ? 'secondary' : 'ghost'}
                size='sm'
                onClick={() => updateFilters({ locale: l.code, page: 1 })}
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
                  <th
                    className='px-6 py-4 font-medium uppercase tracking-wider cursor-pointer hover:bg-muted/60 transition-colors'
                    onClick={() => toggleSort('createdAt')}
                  >
                    <div className='flex items-center'>
                      Created
                      {renderSortIcon('createdAt')}
                    </div>
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
