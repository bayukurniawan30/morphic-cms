import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Layout from '@/components/Layout';
import RichTextEditor from '@/components/RichTextEditor';
import { ArrowLeftIcon, SaveIcon, Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { FieldDefinition } from '@/lib/dynamic-schema';

interface Collection {
  id: number;
  name: string;
  fields: FieldDefinition[];
}

interface Entry {
  id: number;
  content: Record<string, any>;
}

interface FormProps {
  collection: Collection;
  entry?: Entry;
  user?: any;
  mode: 'create' | 'edit';
}

export default function EntriesForm({ collection, entry, user, mode }: FormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(entry?.content || {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, any>>({});

  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const url = mode === 'create' 
      ? `/api/collections/${collection.id}/entries`
      : `/api/entries/${entry?.id}`;
    
    const method = mode === 'create' ? 'POST' : 'PUT';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (!res.ok) {
        if (result.error === 'Validation failed' && result.details) {
          // Zod nested errors handling
          const fieldErrors: Record<string, string> = {};
          Object.keys(result.details).forEach(key => {
            if (key !== '_errors') {
              fieldErrors[key] = result.details[key]._errors?.[0] || 'Invalid value';
            }
          });
          setErrors(fieldErrors);
          toast.error('Please check the form for errors');
        } else {
          toast.error(result.error || 'Failed to save entry');
        }
        setIsSubmitting(false);
        return;
      }

      toast.success(mode === 'create' ? 'Entry created successfully' : 'Entry updated successfully');
      window.location.href = `/entries/${collection.id}`;
    } catch (err) {
      toast.error('Network error');
      setIsSubmitting(false);
    }
  };

  const renderFieldInput = (field: FieldDefinition) => {
    const value = formData[field.name];
    const error = errors[field.name];

    switch (field.type) {
      case 'text':
        return (
          <Input 
            value={value || ''}
            onChange={e => handleFieldChange(field.name, e.target.value)}
            placeholder={`Enter ${field.label}`}
            className={error ? 'border-destructive' : ''}
          />
        );
      
      case 'rich-text':
        return (
          <RichTextEditor 
            value={value || ''}
            onChange={val => handleFieldChange(field.name, val)}
          />
        );
      
      case 'number':
        return (
          <Input 
            type="number"
            value={value ?? ''}
            onChange={e => handleFieldChange(field.name, e.target.value === '' ? undefined : Number(e.target.value))}
            min={field.validation?.min}
            max={field.validation?.max}
            step={field.validation?.step || 'any'}
            className={error ? 'border-destructive' : ''}
          />
        );

      case 'date':
      case 'datetime':
      case 'time':
        return (
          <Input 
            type={field.type === 'datetime' ? 'datetime-local' : field.type}
            value={value || ''}
            onChange={e => handleFieldChange(field.name, e.target.value)}
            className={error ? 'border-destructive' : ''}
          />
        );

      case 'select':
        return (
          <Select 
            value={value || ''} 
            onValueChange={val => handleFieldChange(field.name, val)}
          >
            <SelectTrigger className={error ? 'border-destructive' : ''}>
              <SelectValue placeholder={`Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'radio':
        return (
          <RadioGroup 
            value={value || ''} 
            onValueChange={val => handleFieldChange(field.name, val)}
            className="flex flex-col space-y-2 pt-1"
          >
            {field.options?.map(opt => (
              <div key={opt.value} className="flex items-center space-x-2">
                <RadioGroupItem value={opt.value} id={`${field.id}-${opt.value}`} />
                <Label htmlFor={`${field.id}-${opt.value}`} className="font-normal cursor-pointer">
                  {opt.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'checkbox':
        { const currentVals = Array.isArray(value) ? value : [];
        return (
          <div className="flex flex-col space-y-3 pt-1">
            {field.options?.map(opt => (
              <div key={opt.value} className="flex items-center space-x-2">
                <Checkbox 
                  id={`${field.id}-${opt.value}`}
                  checked={currentVals.includes(opt.value)}
                  onCheckedChange={(checked) => {
                    const next = checked 
                      ? [...currentVals, opt.value]
                      : currentVals.filter(v => v !== opt.value);
                    handleFieldChange(field.name, next);
                  }}
                />
                <Label htmlFor={`${field.id}-${opt.value}`} className="font-normal cursor-pointer">
                  {opt.label}
                </Label>
              </div>
            ))}
          </div>
        ); }

      case 'media':
        return (
          <div className="flex flex-col space-y-2 p-4 border rounded-md bg-muted/20 border-dashed">
            <p className="text-sm text-muted-foreground text-center">Media selector integration coming soon...</p>
            <p className="text-[10px] text-center opacity-50 uppercase tracking-widest">{field.multiple ? 'Multiple' : 'Single'} Selection</p>
          </div>
        );

      default:
        return <p className="text-xs text-destructive">Unsupported field type: {field.type}</p>;
    }
  };

  return (
    <Layout user={user}>
      <Head title={`${mode === 'create' ? 'Add' : 'Edit'} ${collection.name} Entry | Morphic`} />
      
      <div className="space-y-6 pb-12">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href={`/entries/${collection.id}`}>
              <ArrowLeftIcon className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {mode === 'create' ? 'Add Entry' : 'Edit Entry'}
            </h1>
            <p className="text-muted-foreground mt-1">
              Collection: <span className="font-semibold text-foreground">{collection.name}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-card p-8 rounded-xl border shadow-sm space-y-8">
            {collection.fields.map((field) => (
              <div key={field.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  <span className="text-[10px] uppercase tracking-wider opacity-40 font-mono">
                    {field.type}
                  </span>
                </div>
                
                {renderFieldInput(field)}
                
                {errors[field.name] && (
                  <p className="text-xs font-medium text-destructive mt-1">{errors[field.name]}</p>
                )}
                
                {field.type === 'media' && field.multiple && (
                  <p className="text-[10px] text-muted-foreground italic">You can select multiple files for this field.</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-4">
             <Button type="button" variant="outline" asChild>
               <Link href={`/entries/${collection.id}`}>Cancel</Link>
             </Button>
             <Button type="submit" disabled={isSubmitting}>
               {isSubmitting ? (
                 <>
                   <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                   Saving...
                 </>
               ) : (
                 <>
                   {mode === 'create' ? 'Save Entry' : 'Update Entry'}
                 </>
               )}
             </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
