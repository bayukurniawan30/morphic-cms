import Layout from '@/components/Layout'
import MediaPicker from '@/components/MediaPicker'
import RichTextEditor from '@/components/RichTextEditor'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { FieldDefinition } from '@/lib/dynamic-schema'
import { cn } from '@/lib/utils'
import { Head, Link } from '@inertiajs/react'
import {
  ArrowLeft,
  Save,
  Loader2Icon,
  FileText,
  XIcon,
  ImagePlus,
  History,
  RotateCcw,
  User,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import React, { useState, useEffect } from 'react'
import { useCallback } from 'react'

interface Collection {
  id: number
  name: string
  slug: string
  type: 'collection' | 'global'
  fields: FieldDefinition[]
}

interface Entry {
  id: number
  content: Record<string, any>
}

interface FormProps {
  collection: Collection
  entry?: Entry
  updatedBy?: { id: number; name: string }
  user?: any
  mode: 'create' | 'edit'
}

const FieldInput = ({
  field,
  value,
  onChange,
  error,
  relationData,
  availableDocuments,
  onMediaPickerOpen,
}: {
  field: FieldDefinition
  value: any
  onChange: (val: any) => void
  error?: string
  relationData: Record<number, any[]>
  availableDocuments: any[]
  onMediaPickerOpen: (name: string) => void
}) => {
  const handleValueChange = (val: any) => {
    onChange(val)
  }

  switch (field.type) {
    case 'text':
      return (
        <Input
          value={value || ''}
          onChange={(e) => handleValueChange(e.target.value)}
          placeholder={`Enter ${field.label || field.name}`}
          className={error ? 'border-destructive' : ''}
        />
      )

    case 'email':
      return (
        <Input
          type='email'
          value={value || ''}
          onChange={(e) => handleValueChange(e.target.value)}
          placeholder={`Enter ${field.label || field.name}`}
          className={error ? 'border-destructive' : ''}
        />
      )

    case 'textarea':
      return (
        <Textarea
          value={value || ''}
          onChange={(e) => handleValueChange(e.target.value)}
          placeholder={`Enter ${field.label || field.name}`}
          className={error ? 'border-destructive' : ''}
          rows={5}
        />
      )

    case 'rich-text':
      return (
        <RichTextEditor
          value={value || ''}
          onChange={(val) => handleValueChange(val)}
        />
      )

    case 'number':
      return (
        <Input
          type='number'
          value={value ?? ''}
          onChange={(e) =>
            handleValueChange(
              e.target.value === '' ? undefined : Number(e.target.value)
            )
          }
          min={field.validation?.min}
          max={field.validation?.max}
          step={field.validation?.step || 'any'}
          className={error ? 'border-destructive' : ''}
        />
      )

    case 'date':
    case 'datetime':
    case 'time':
      return (
        <Input
          type={field.type === 'datetime' ? 'datetime-local' : field.type}
          value={value || ''}
          onChange={(e) => handleValueChange(e.target.value)}
          className={error ? 'border-destructive' : ''}
        />
      )

    case 'select':
      return (
        <Select
          value={value || ''}
          onValueChange={(val) => handleValueChange(val)}
        >
          <SelectTrigger className={error ? 'border-destructive' : ''}>
            <SelectValue placeholder={`Select ${field.label || field.name}`} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )

    case 'radio':
      return (
        <RadioGroup
          value={value || ''}
          onValueChange={(val) => handleValueChange(val)}
          className='flex flex-col space-y-2 pt-1'
        >
          {field.options?.map((opt) => (
            <div key={opt.value} className='flex items-center space-x-2'>
              <RadioGroupItem
                value={opt.value}
                id={`${field.id}-${opt.value}`}
              />
              <Label
                htmlFor={`${field.id}-${opt.value}`}
                className='font-normal cursor-pointer text-xs'
              >
                {opt.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      )

    case 'checkbox': {
      const currentVals = Array.isArray(value) ? value : []
      return (
        <div className='flex flex-col space-y-3 pt-1'>
          {field.options?.map((opt) => (
            <div key={opt.value} className='flex items-center space-x-2'>
              <Checkbox
                id={`${field.id}-${opt.value}`}
                checked={currentVals.includes(opt.value)}
                onCheckedChange={(checked) => {
                  const next = checked
                    ? [...currentVals, opt.value]
                    : currentVals.filter((v) => v !== opt.value)
                  handleValueChange(next)
                }}
              />
              <Label
                htmlFor={`${field.id}-${opt.value}`}
                className='font-normal cursor-pointer text-xs'
              >
                {opt.label}
              </Label>
            </div>
          ))}
        </div>
      )
    }

    case 'media': {
      const mediaArray = Array.isArray(value) ? value : value ? [value] : []
      const handleMediaUpdate = (next: any) => {
        handleValueChange(field.multiple ? next : next[0] || null)
      }

      return (
        <div className='space-y-4'>
          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4'>
            {mediaArray.map((m: any, idx: number) => (
              <div
                key={idx}
                className='group relative aspect-square rounded-lg border overflow-hidden bg-muted transition-all hover:ring-2 hover:ring-primary/50'
              >
                <img
                  src={m.secureUrl}
                  alt={m.filename}
                  className='w-full h-full object-cover'
                />
                <button
                  type='button'
                  onClick={() => {
                    const next = mediaArray.filter((_, i) => i !== idx)
                    handleMediaUpdate(next)
                  }}
                  className='absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm'
                >
                  <XIcon className='w-3 h-3' />
                </button>
              </div>
            ))}
            {(field.multiple || mediaArray.length === 0) && (
              <button
                type='button'
                onClick={() => onMediaPickerOpen(field.name)}
                className='flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-lg hover:border-primary hover:bg-accent/50 transition-all text-muted-foreground hover:text-primary group'
              >
                <ImagePlus className='w-4 h-4 mb-1' />
                <span className='text-[10px] font-medium'>Add Media</span>
              </button>
            )}
          </div>
        </div>
      )
    }

    case 'relation': {
      const options = field.relationCollectionId
        ? relationData[field.relationCollectionId] || []
        : []
      return (
        <Select
          value={value?.toString() || ''}
          onValueChange={(val) => handleValueChange(parseInt(val))}
        >
          <SelectTrigger className={error ? 'border-destructive' : ''}>
            <SelectValue placeholder={`Select ${field.label || field.name}`} />
          </SelectTrigger>
          <SelectContent>
            {options.map((entry) => (
              <SelectItem key={entry.id} value={entry.id.toString()}>
                {field.relationLabelField
                  ? entry.content[field.relationLabelField]
                  : `Entry #${entry.id}`}
              </SelectItem>
            ))}
            {options.length === 0 && (
              <div className='p-2 text-xs text-muted-foreground text-center italic'>
                No entries found
              </div>
            )}
          </SelectContent>
        </Select>
      )
    }

    case 'documents':
      return (
        <Select
          value={
            value?.id?.toString() ||
            (typeof value === 'number' ? value.toString() : '')
          }
          onValueChange={(val) => {
            const doc = availableDocuments.find((d) => d.id === parseInt(val))
            handleValueChange(doc || parseInt(val))
          }}
        >
          <SelectTrigger className={error ? 'border-destructive' : ''}>
            <SelectValue placeholder={`Select ${field.label || field.name}`} />
          </SelectTrigger>
          <SelectContent>
            {availableDocuments.map((doc) => (
              <SelectItem key={doc.id} value={doc.id.toString()}>
                <div className='flex items-center'>
                  <FileText className='w-3 h-3 mr-2 opacity-50' />
                  {doc.filename}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )

    case 'slug':
      return (
        <Input
          value={value || ''}
          onChange={(e) => handleValueChange(e.target.value)}
          placeholder={`Enter ${field.label || field.name}`}
          className={error ? 'border-destructive' : ''}
        />
      )

    case 'array': {
      const items = Array.isArray(value) ? value : []
      return (
        <div className='space-y-4'>
          {items.map((item: any, itemIndex: number) => (
            <div
              key={itemIndex}
              className='relative p-6 border rounded-xl bg-muted/4 shadow-inner space-y-6 group animate-in fade-in slide-in-from-top-2 duration-300'
            >
              <div className='flex justify-between items-center mb-2'>
                <span className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-50'>
                  {field.label || field.name} #{itemIndex + 1}
                </span>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 text-destructive hover:bg-destructive/10'
                  onClick={() => {
                    const next = items.filter((_, i) => i !== itemIndex)
                    handleValueChange(next)
                  }}
                >
                  <XIcon className='w-4 h-4' />
                </Button>
              </div>

              <div className='space-y-6'>
                {field.fields?.map((childField) => (
                  <div key={childField.id} className='space-y-2 text-left'>
                    <Label className='text-sm font-medium text-muted-foreground/80'>
                      {childField.label || childField.name}{' '}
                      {childField.required && (
                        <span className='text-destructive'>*</span>
                      )}
                    </Label>
                    <FieldInput
                      field={childField}
                      value={item[childField.name]}
                      onChange={(val) => {
                        const nextItems = [...items]
                        nextItems[itemIndex] = {
                          ...nextItems[itemIndex],
                          [childField.name]: val,
                        }
                        handleValueChange(nextItems)
                      }}
                      error={undefined} // could pass errors if we have deep mapping
                      relationData={relationData}
                      availableDocuments={availableDocuments}
                      onMediaPickerOpen={onMediaPickerOpen}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='w-full py-6 border-dashed border-2 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all group'
            onClick={() => {
              const newItem = (field.fields || []).reduce((acc: any, f) => {
                acc[f.name] =
                  f.type === 'boolean'
                    ? false
                    : f.type === 'number'
                      ? 0
                      : f.type === 'checkbox'
                        ? []
                        : ''
                return acc
              }, {})
              handleValueChange([...items, newItem])
            }}
          >
            <ImagePlus className='w-4 h-4 mr-2 group-hover:scale-110 transition-transform' />
            Add Item to {field.label || 'List'}
          </Button>
        </div>
      )
    }

    default:
      return (
        <p className='text-xs text-destructive'>
          Unsupported field type: {field.type}
        </p>
      )
  }
}

export default function EntriesForm({
  collection,
  entry,
  updatedBy,
  user,
  mode,
}: FormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(
    entry?.content || {}
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, any>>({})
  const [availableDocuments, setAvailableDocuments] = useState<any[]>([])
  const [activeMediaPickerField, setActiveMediaPickerField] = useState<
    string | null
  >(null)
  const [versions, setVersions] = useState<any[]>([])
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const [isPreviewingVersion, setPreviewingVersion] = useState<any | null>(null)

  const fetchVersions = useCallback(async () => {
    if (mode === 'edit' && entry?.id) {
      try {
        const res = await fetch(`/api/entries/${entry.id}/versions`)
        if (res.ok) {
          const data = await res.json()
          setVersions(data.versions || [])
        }
      } catch (err) {
        console.error('Failed to fetch versions', err)
      }
    }
  }, [mode, entry?.id])

  useEffect(() => {
    let isMounted = true
    if (mode === 'edit' && entry?.id && isMounted) {
      fetchVersions()
    }
    return () => {
      isMounted = false
    }
  }, [mode, entry?.id, fetchVersions])

  const handleRevert = async (version: any) => {
    if (
      !confirm(
        `Are you sure you want to revert to version #${version.versionNumber}? Current unsaved changes will be lost.`
      )
    )
      return

    try {
      const res = await fetch(
        `/api/entries/${entry?.id}/versions/${version.id}/revert`,
        {
          method: 'POST',
        }
      )

      if (res.ok) {
        const result = await res.json()
        setFormData(result.entry.content)
        setPreviewingVersion(null)
        setSidebarOpen(false)
        toast.success(
          'Successfully reverted to version #' + version.versionNumber
        )
        fetchVersions()
      } else {
        toast.error('Failed to revert')
      }
    } catch (err) {
      toast.error('Network error during revert')
    }
  }

  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/[^\w-]+/g, '') // Remove all non-word chars
      .replace(/--+/g, '-') // Replace multiple - with single -
  }

  const handleFieldChange = (name: string, value: any) => {
    setFormData((prev) => {
      const next = { ...prev, [name]: value }

      // Auto-fill slug fields
      collection.fields.forEach((field) => {
        if (field.type === 'slug' && field.slugSourceField === name) {
          next[field.name] = slugify(value || '')
        }
      })

      return next
    })
    // Clear error for this field
    if (errors[name]) {
      const newErrors = { ...errors }
      delete newErrors[name]
      setErrors(newErrors)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    const url =
      mode === 'create'
        ? `/api/collections/${collection.id}/entries`
        : `/api/entries/${entry?.id}`

    const method = mode === 'create' ? 'POST' : 'PUT'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await res.json()

      if (!res.ok) {
        if (result.error === 'Validation failed' && result.details) {
          const fieldErrors: Record<string, string> = {}
          Object.keys(result.details).forEach((key) => {
            if (key !== '_errors') {
              fieldErrors[key] =
                result.details[key]._errors?.[0] || 'Invalid value'
            }
          })
          setErrors(fieldErrors)
          toast.error('Please check the form for errors')
        } else {
          toast.error(result.error || 'Failed to save entry')
        }
        setIsSubmitting(false)
        return
      }

      toast.success(
        mode === 'create'
          ? 'Entry created successfully'
          : 'Entry updated successfully'
      )
      window.location.href = `/entries/${collection.id}`
    } catch (err) {
      toast.error('Network error')
      setIsSubmitting(false)
    }
  }

  const [relationData, setRelationData] = useState<Record<number, any[]>>({})

  useEffect(() => {
    const fetchRelations = async () => {
      const relationFields = collection.fields.filter(
        (f) => f.type === 'relation' && f.relationCollectionId
      )

      for (const field of relationFields) {
        const id = field.relationCollectionId!
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection.fields])

  useEffect(() => {
    const fetchDocuments = async () => {
      const hasDocumentField = collection.fields.some(
        (f) => f.type === 'documents'
      )
      if (!hasDocumentField) return

      try {
        const res = await fetch('/api/documents?limit=100') // Fetch more for selection
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

  const handleMediaSelect = (mediaItems: any[]) => {
    if (!activeMediaPickerField) return

    const field = collection.fields.find(
      (f) => f.name === activeMediaPickerField
    )
    if (!field) return

    if (field.multiple) {
      const current = formData[activeMediaPickerField] || []
      const next = [...(Array.isArray(current) ? current : []), ...mediaItems]
      // Optional: deduplicate by id
      const unique = next.filter(
        (v, i, a) => a.findIndex((t) => t.id === v.id) === i
      )
      handleFieldChange(activeMediaPickerField, unique)
    } else {
      handleFieldChange(activeMediaPickerField, mediaItems[0])
    }
  }

  return (
    <Layout user={user}>
      <Head
        title={`${mode === 'create' ? 'Add' : 'Edit'} ${collection.name} Entry | Morphic`}
      />

      <div className='space-y-6 pb-12'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <Button
              variant='ghost'
              size='icon'
              asChild
              className='rounded-full'
            >
              <Link href={`/entries/${collection.id}`}>
                <ArrowLeft className='w-5 h-5' />
              </Link>
            </Button>
            <div>
              <h1 className='text-3xl font-bold tracking-tight'>
                {mode === 'create' ? 'Add Entry' : 'Edit Entry'}
              </h1>
              <div className='flex items-center space-x-4 mt-1'>
                <p className='text-muted-foreground text-sm'>
                  Collection:{' '}
                  <span className='font-semibold text-foreground'>
                    {collection.name}
                  </span>
                </p>
                {mode === 'edit' && updatedBy && (
                  <>
                    <span className='text-muted-foreground/30'>•</span>
                    <div className='flex items-center text-xs text-muted-foreground'>
                      <User className='w-3 h-3 mr-1' />
                      Last updated by{' '}
                      <span className='font-semibold text-foreground ml-1'>
                        {updatedBy.name}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {mode === 'edit' && (
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => setSidebarOpen(true)}
              className='relative'
            >
              <History className='w-4 h-4 mr-2' />
              History
              {versions.length > 0 && (
                <span className='absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold border-2 border-background'>
                  {versions.length}
                </span>
              )}
            </Button>
          )}
        </div>

        {isPreviewingVersion && (
          <div className='bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-4 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-4'>
            <div className='flex items-center text-amber-800 dark:text-amber-400'>
              <RotateCcw className='w-5 h-5 mr-3' />
              <div>
                <p className='font-semibold'>
                  Previewing Version #{isPreviewingVersion.versionNumber}
                </p>
                <p className='text-sm opacity-80'>
                  This is a read-only preview. Click "Revert" to restore these
                  values.
                </p>
              </div>
            </div>
            <div className='flex space-x-2'>
              <Button
                size='sm'
                variant='ghost'
                className='text-amber-800 dark:text-amber-400'
                onClick={() => {
                  setFormData(entry?.content || {})
                  setPreviewingVersion(null)
                }}
              >
                Cancel
              </Button>
              <Button
                size='sm'
                className='bg-amber-600 hover:bg-amber-700 text-white'
                onClick={() => handleRevert(isPreviewingVersion)}
              >
                Revert to this Version
              </Button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-6'>
          <div
            className={`bg-card p-8 rounded-xl border shadow-sm space-y-8 ${isPreviewingVersion ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}
          >
            {collection.fields.map((field) => (
              <div key={field.id} className='space-y-2'>
                <div className='flex items-center justify-between border-b border-border/30 pb-1'>
                  <Label className='text-xs font-bold uppercase tracking-widest text-muted-foreground/80'>
                    {field.label || field.name}{' '}
                    {field.required && (
                      <span className='text-destructive'>*</span>
                    )}
                  </Label>
                  <span className='text-[10px] font-mono opacity-40'>
                    {field.type}
                  </span>
                </div>
                <FieldInput
                  field={field}
                  value={formData[field.name]}
                  onChange={(val) => handleFieldChange(field.name, val)}
                  error={errors[field.name]}
                  relationData={relationData}
                  availableDocuments={availableDocuments}
                  onMediaPickerOpen={setActiveMediaPickerField}
                />
                {field.type === 'media' && field.multiple && (
                  <p className='text-[10px] text-muted-foreground italic'>
                    You can select multiple files for this field.
                  </p>
                )}
                {errors[field.name] && (
                  <p className='text-xs font-medium text-destructive mt-1'>
                    {errors[field.name]}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className='flex justify-end space-x-4'>
            <Button type='button' variant='outline' asChild>
              <Link href={`/entries/${collection.id}`}>Cancel</Link>
            </Button>
            {!isPreviewingVersion && (
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2Icon className='w-4 h-4 mr-2 animate-spin' />
                    Saving...
                  </>
                ) : (
                  <>{mode === 'create' ? 'Save Entry' : 'Update Entry'}</>
                )}
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* History Sidebar Overlay */}
      {isSidebarOpen && (
        <div className='fixed inset-0 z-50 flex justify-end'>
          <div
            className='absolute inset-0 bg-background/80 backdrop-blur-sm'
            onClick={() => setSidebarOpen(false)}
          />
          <div className='relative w-full max-w-md bg-card border-l h-full shadow-xl flex flex-col animate-in slide-in-from-right duration-300'>
            <div className='p-6 border-b flex items-center justify-between bg-muted/20'>
              <div className='flex items-center space-x-2'>
                <History className='w-5 h-5 text-primary' />
                <h2 className='text-xl font-bold'>Version History</h2>
              </div>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => setSidebarOpen(false)}
              >
                <XIcon className='w-5 h-5' />
              </Button>
            </div>

            <div className='flex-1 overflow-y-auto p-6 space-y-4'>
              <p className='text-xs text-muted-foreground mb-4'>
                We store up to the last 5 versions of this entry. Click on a
                version to preview it.
              </p>

              {versions.length > 0 ? (
                versions.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setPreviewingVersion(v)
                      setFormData(v.content)
                      setSidebarOpen(false)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className={cn(
                      'w-full text-left p-4 rounded-xl border transition-all group hover:border-primary/50 hover:shadow-md',
                      isPreviewingVersion?.id === v.id
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'bg-background'
                    )}
                  >
                    <div className='flex justify-between items-start mb-2'>
                      <span className='text-xs font-bold uppercase tracking-widest text-primary'>
                        Version #{v.versionNumber}
                      </span>
                      <Clock className='w-3 h-3 text-muted-foreground opacity-50' />
                    </div>
                    <div className='space-y-1'>
                      <div className='flex items-center text-sm font-medium'>
                        <User className='w-3 h-3 mr-1.5 opacity-60' />
                        {v.createdBy?.name || 'Unknown User'}
                      </div>
                      <p className='text-[10px] text-muted-foreground'>
                        Saved on {new Date(v.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className='mt-3 flex items-center text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity'>
                      <RotateCcw className='w-3 h-3 mr-1' />
                      PREVIEW TO REVERT
                    </div>
                  </button>
                ))
              ) : (
                <div className='h-64 flex flex-col items-center justify-center text-muted-foreground italic border-2 border-dashed rounded-xl'>
                  <History className='w-8 h-8 mb-2 opacity-20' />
                  <p>No previous versions found.</p>
                </div>
              )}
            </div>

            <div className='p-6 border-t bg-muted/10'>
              <Button
                variant='outline'
                className='w-full'
                onClick={() => setSidebarOpen(false)}
              >
                Close History
              </Button>
            </div>
          </div>
        </div>
      )}

      <MediaPicker
        open={!!activeMediaPickerField}
        onOpenChange={(open) => !open && setActiveMediaPickerField(null)}
        onSelectMedia={handleMediaSelect}
        multiple={
          collection.fields.find((f) => f.name === activeMediaPickerField)
            ?.multiple
        }
      />
    </Layout>
  )
}
