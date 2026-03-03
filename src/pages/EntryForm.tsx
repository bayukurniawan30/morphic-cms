import { useForm } from '@inertiajs/react';
import React, { FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { FieldDefinition } from '@/lib/dynamic-schema';

interface Collection {
  id: number;
  name: string;
  slug: string;
  fields: FieldDefinition[];
}

interface EntryFormProps {
  collection: Collection;
}

export default function EntryForm({ collection }: EntryFormProps) {
  // Initialize form data with empty strings or default values based on field type
  const initialData = collection.fields.reduce((acc, field) => {
    if (field.type === 'boolean') acc[field.name] = false;
    else if (field.type === 'number') acc[field.name] = 0;
    else acc[field.name] = '';
    return acc;
  }, {} as Record<string, any>);

  const { data, setData, post, processing, errors } = useForm(initialData);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // In Inertia, this will POST to the current URL by default or to a specific route
    post(`/api/collections/${collection.id}/entries`);
  };

  const renderField = (field: FieldDefinition) => {
    const error = errors[field.name];
    const value = data[field.name];

    let inputType = 'text';
    if (field.type === 'number') inputType = 'number';
    if (field.type === 'date') inputType = 'datetime-local';
    
    // basic handling for boolean, could be a checkbox
    if (field.type === 'boolean') {
        return (
            <div className="flex items-center space-x-2" key={field.name}>
                <input 
                    type="checkbox" 
                    id={field.name}
                    checked={!!value}
                    onChange={e => setData(field.name, e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor={field.name}>{field.name} {field.required && '*'}</Label>
                {error && <div className="text-sm text-destructive mt-1">{error}</div>}
            </div>
        )
    }

    return (
      <div key={field.name} className="space-y-2">
        <Label htmlFor={field.name}>
          {field.name} {field.required && <span className="text-destructive">*</span>}
        </Label>
        <Input
          id={field.name}
          type={inputType}
          value={value}
          onChange={(e) => {
             const val = field.type === 'number' ? parseFloat(e.target.value) : e.target.value;
             setData(field.name, val)
          }}
          required={field.required}
          className={error ? "border-destructive focus-visible:ring-destructive" : ""}
        />
        {error && <div className="text-sm text-destructive">{error}</div>}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
        <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Create {collection.name} Entry</h1>
            <p className="text-muted-foreground">Fill out the dynamic form below.</p>
        </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-lg border shadow-sm">
        {collection.fields.map(renderField)}

        <Button type="submit" disabled={processing} className="w-full">
          {processing ? 'Saving...' : 'Save Entry'}
        </Button>
      </form>
    </div>
  );
}
