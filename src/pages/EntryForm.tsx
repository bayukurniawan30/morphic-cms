import { Button } from '@/components/ui/button'
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
import { Switch } from '@/components/ui/switch'
import type { FieldDefinition } from '@/lib/dynamic-schema'
import { useForm, Head } from '@inertiajs/react'
import React, { FormEvent } from 'react'

interface Collection {
  id: number
  name: string
  slug: string
  fields: FieldDefinition[]
}

interface EntryFormProps {
  collection: Collection
}

export default function EntryForm({ collection }: EntryFormProps) {
  // Initialize form data with correct defaults based on field type
  const initialData = collection.fields.reduce(
    (acc, field) => {
      if (field.type === 'boolean') acc[field.name] = false
      else if (field.type === 'checkbox') acc[field.name] = []
      else if (field.type === 'number') acc[field.name] = 0
      else acc[field.name] = ''
      return acc
    },
    {} as Record<string, any>
  )

  const { data, setData, post, processing, errors } = useForm(initialData)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    post(`/api/collections/${collection.id}/entries`)
  }

  const renderField = (field: FieldDefinition) => {
    const error = errors[field.name]
    const value = data[field.name]
    const fieldLabel = field.label || field.name

    const errorDisplay = error && (
      <div className='text-sm text-destructive mt-1'>{error}</div>
    )

    // Handle Boolean/Switch
    if (field.type === 'boolean') {
      return (
        <div className='flex items-center space-x-2 py-2' key={field.id}>
          <Switch
            id={field.name}
            checked={!!value}
            onCheckedChange={(checked) => setData(field.name, checked)}
          />
          <Label htmlFor={field.name} className='cursor-pointer font-medium'>
            {fieldLabel}{' '}
            {field.required && <span className='text-destructive'>*</span>}
          </Label>
          {errorDisplay}
        </div>
      )
    }

    // Handle Select
    if (field.type === 'select' && field.options) {
      return (
        <div key={field.id} className='space-y-2'>
          <Label htmlFor={field.name}>
            {fieldLabel}{' '}
            {field.required && <span className='text-destructive'>*</span>}
          </Label>
          <Select
            value={value}
            onValueChange={(val) => setData(field.name, val)}
            required={field.required}
          >
            <SelectTrigger
              id={field.name}
              className={error ? 'border-destructive' : ''}
            >
              <SelectValue placeholder={`Select ${fieldLabel}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errorDisplay}
        </div>
      )
    }

    // Handle Radio
    if (field.type === 'radio' && field.options) {
      return (
        <div key={field.id} className='space-y-3'>
          <Label>
            {fieldLabel}{' '}
            {field.required && <span className='text-destructive'>*</span>}
          </Label>
          <RadioGroup
            value={value}
            onValueChange={(val) => setData(field.name, val)}
            required={field.required}
            className='flex flex-col space-y-1'
          >
            {field.options.map((opt) => (
              <div key={opt.value} className='flex items-center space-x-2'>
                <RadioGroupItem
                  value={opt.value}
                  id={`${field.name}-${opt.value}`}
                />
                <Label
                  htmlFor={`${field.name}-${opt.value}`}
                  className='font-normal cursor-pointer'
                >
                  {opt.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
          {errorDisplay}
        </div>
      )
    }

    // Default Input Types
    let inputType = 'text'
    if (field.type === 'number') inputType = 'number'
    else if (field.type === 'date') inputType = 'date'
    else if (field.type === 'datetime') inputType = 'datetime-local'
    else if (field.type === 'time') inputType = 'time'
    else if (field.type === 'email') inputType = 'email'

    return (
      <div key={field.id} className='space-y-2'>
        <Label htmlFor={field.name}>
          {fieldLabel}{' '}
          {field.required && <span className='text-destructive'>*</span>}
        </Label>
        <Input
          id={field.name}
          type={inputType}
          value={value === null || value === undefined ? '' : value}
          onChange={(e) => {
            let val: any = e.target.value
            if (field.type === 'number') {
              const parsed = parseFloat(val)
              val = isNaN(parsed) ? 0 : parsed
            }
            setData(field.name, val)
          }}
          required={field.required}
          className={
            error ? 'border-destructive focus-visible:ring-destructive' : ''
          }
        />
        {errorDisplay}
      </div>
    )
  }

  return (
    <div className='max-w-2xl mx-auto p-6 space-y-8 pb-12'>
      <Head title={`Create ${collection.name} Entry | Morphic`} />

      <div className='space-y-2'>
        <h1 className='text-3xl font-bold tracking-tight'>
          Create {collection.name} Entry
        </h1>
        <p className='text-muted-foreground'>
          Fill out the fields to create a new content entry.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className='space-y-6 bg-card p-6 rounded-lg border shadow-sm'
      >
        <div className='space-y-4'>{collection.fields.map(renderField)}</div>

        <div className='pt-4 border-t flex items-center justify-between gap-4'>
          <Button
            type='button'
            variant='ghost'
            onClick={() => window.history.back()}
          >
            Cancel
          </Button>
          <Button type='submit' disabled={processing} className='px-8'>
            {processing ? 'Saving...' : 'Save Entry'}
          </Button>
        </div>
      </form>
    </div>
  )
}
