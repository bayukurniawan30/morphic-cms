import { ChevronDown } from 'lucide-react'
import React from 'react'
import {
  buildPreviewFilters,
  previewFilterFields,
  type PreviewField,
  type PreviewFilter,
} from '../lib/api-preview-filters'
import { Button } from './ui/button'
import { Input } from './ui/input'

function FilterSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className='relative block'>
      <select
        {...props}
        className='h-8 w-full appearance-none rounded-md border bg-background pl-2 pr-8 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      />
      <ChevronDown
        aria-hidden='true'
        className='pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground'
      />
    </span>
  )
}

type Props = {
  fields: PreviewField[]
  rows: PreviewFilter[]
  onChange: (rows: PreviewFilter[]) => void
  onApply: (filters: ReturnType<typeof buildPreviewFilters>) => void
  activeCount: number
}

export function ApiPreviewFilters({
  fields,
  rows,
  onChange,
  onApply,
  activeCount,
}: Props) {
  const [error, setError] = React.useState('')
  const available = previewFilterFields(fields)
  if (!available.length) return null
  const initial = (name: string): PreviewFilter => {
    const field = fields.find((field) => field.name === name)
    return {
      field: name,
      operator: 'eq',
      value:
        field?.type === 'boolean' ? 'true' : field?.options?.[0]?.value || '',
      end: '',
    }
  }
  const update = (index: number, changes: Partial<PreviewFilter>) => {
    setError('')
    onChange(rows.map((row, i) => (i === index ? { ...row, ...changes } : row)))
  }
  return (
    <div className='space-y-3 rounded-lg border bg-muted/20 p-3 shrink-0'>
      <div className='flex items-center justify-between gap-2'>
        <div>
          <p className='text-xs font-semibold'>Filters</p>
          <p className='text-xs text-muted-foreground'>
            All filters must match. {activeCount} applied. Apply filters after
            editing.
          </p>
        </div>
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={rows.length >= available.length}
          onClick={() => {
            const field = available.find(
              (field) => !rows.some((row) => row.field === field.name)
            )
            if (field) onChange([...rows, initial(field.name)])
          }}
        >
          Add filter
        </Button>
      </div>
      <div className='max-h-40 overflow-y-auto space-y-2'>
        {rows.map((row, index) => {
          const field = available.find((field) => field.name === row.field)
          return (
            <div key={index} className='flex flex-wrap items-end gap-2'>
              <label className='flex-1 min-w-28 text-xs'>
                Field
                <FilterSelect
                  value={row.field}
                  onChange={(e) => update(index, initial(e.target.value))}
                >
                  {available
                    .filter(
                      (field) =>
                        field.name === row.field ||
                        !rows.some((row) => row.field === field.name)
                    )
                    .map((field) => (
                      <option key={field.name} value={field.name}>
                        {field.label || field.name} ({field.name})
                      </option>
                    ))}
                </FilterSelect>
              </label>
              <label className='w-32 text-xs'>
                Match
                <FilterSelect
                  value={row.operator}
                  onChange={(e) =>
                    update(index, {
                      operator: e.target.value as PreviewFilter['operator'],
                    })
                  }
                >
                  <option value='eq'>Equals</option>
                  {['text', 'textarea'].includes(field?.type || '') && (
                    <option value='icontains'>Contains (ignore case)</option>
                  )}
                  {field?.type === 'date' && (
                    <option value='range'>Date range</option>
                  )}
                </FilterSelect>
              </label>
              <label className='flex-1 min-w-28 text-xs'>
                {row.operator === 'range'
                  ? 'On or after (optional)'
                  : field?.type === 'relation'
                    ? 'Connected entry ID'
                    : 'Value'}
                {field?.type === 'boolean' ? (
                  <FilterSelect
                    value={row.value}
                    onChange={(e) => update(index, { value: e.target.value })}
                  >
                    <option value='true'>True</option>
                    <option value='false'>False</option>
                  </FilterSelect>
                ) : ['select', 'radio'].includes(field?.type || '') ? (
                  <FilterSelect
                    value={row.value}
                    onChange={(e) => update(index, { value: e.target.value })}
                  >
                    {field?.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </FilterSelect>
                ) : (
                  <Input
                    className='h-8 bg-background text-xs'
                    type={
                      field?.type === 'date'
                        ? 'date'
                        : field?.type === 'relation'
                          ? 'number'
                          : 'text'
                    }
                    min={field?.type === 'relation' ? 1 : undefined}
                    step={field?.type === 'relation' ? 1 : undefined}
                    value={row.value}
                    onChange={(e) => update(index, { value: e.target.value })}
                  />
                )}
              </label>
              {row.operator === 'range' && (
                <label className='flex-1 min-w-28 text-xs'>
                  On or before (optional)
                  <Input
                    className='h-8 bg-background text-xs'
                    type='date'
                    value={row.end}
                    onChange={(e) => update(index, { end: e.target.value })}
                  />
                </label>
              )}
              <Button
                type='button'
                variant='ghost'
                size='sm'
                aria-label={`Remove filter ${index + 1}`}
                onClick={() => {
                  setError('')
                  onChange(rows.filter((_, i) => i !== index))
                }}
              >
                Remove
              </Button>
            </div>
          )
        })}
      </div>
      {error && (
        <p role='alert' className='text-xs text-destructive'>
          {error}
        </p>
      )}
      {(rows.length > 0 || activeCount > 0) && (
        <div className='flex gap-2'>
          <Button
            type='button'
            size='sm'
            onClick={() => {
              try {
                onApply(buildPreviewFilters(fields, rows))
                setError('')
              } catch (error) {
                setError(
                  error instanceof Error ? error.message : 'Invalid filters'
                )
              }
            }}
          >
            Apply filters
          </Button>
          <Button
            type='button'
            size='sm'
            variant='ghost'
            onClick={() => {
              onChange([])
              onApply(buildPreviewFilters(fields, []))
              setError('')
            }}
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  )
}
