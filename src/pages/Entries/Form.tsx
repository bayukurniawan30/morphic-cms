import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { ArrowLeftIcon, SaveIcon, Loader2Icon, FileText, X, ImagePlus } from 'lucide-react';
import MediaPicker from '@/components/MediaPicker';
import { toast } from 'sonner';
import { FieldDefinition } from '@/lib/dynamic-schema';

interface Collection {
  id: number;
  name: string;
  slug: string;
  type: 'collection' | 'global';
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

const FieldInput = ({ 
  field, 
  value, 
  onChange, 
  error, 
  relationData, 
  availableDocuments, 
  onMediaPickerOpen 
}: { 
  field: FieldDefinition, 
  value: any, 
  onChange: (val: any) => void, 
  error?: string,
  relationData: Record<number, any[]>,
  availableDocuments: any[],
  onMediaPickerOpen: (name: string) => void
}) => {
  const handleValueChange = (val: any) => {
    onChange(val);
  };

  switch (field.type) {
    case 'text':
      return (
        <Input 
          value={value || ''}
          onChange={e => handleValueChange(e.target.value)}
          placeholder={`Enter ${field.label || field.name}`}
          className={error ? 'border-destructive' : ''}
        />
      );
    
    case 'email':
      return (
        <Input 
          type="email"
          value={value || ''}
          onChange={e => handleValueChange(e.target.value)}
          placeholder={`Enter ${field.label || field.name}`}
          className={error ? 'border-destructive' : ''}
        />
      );
    
    case 'textarea':
      return (
        <Textarea 
          value={value || ''}
          onChange={e => handleValueChange(e.target.value)}
          placeholder={`Enter ${field.label || field.name}`}
          className={error ? 'border-destructive' : ''}
          rows={5}
        />
      );
    
    case 'rich-text':
      return (
        <RichTextEditor 
          value={value || ''}
          onChange={val => handleValueChange(val)}
        />
      );
    
    case 'number':
      return (
        <Input 
          type="number"
          value={value ?? ''}
          onChange={e => handleValueChange(e.target.value === '' ? undefined : Number(e.target.value))}
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
          onChange={e => handleValueChange(e.target.value)}
          className={error ? 'border-destructive' : ''}
        />
      );

    case 'select':
      return (
        <Select 
          value={value || ''} 
          onValueChange={val => handleValueChange(val)}
        >
          <SelectTrigger className={error ? 'border-destructive' : ''}>
            <SelectValue placeholder={`Select ${field.label || field.name}`} />
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
          onValueChange={val => handleValueChange(val)}
          className="flex flex-col space-y-2 pt-1"
        >
          {field.options?.map(opt => (
            <div key={opt.value} className="flex items-center space-x-2">
              <RadioGroupItem value={opt.value} id={`${field.id}-${opt.value}`} />
              <Label htmlFor={`${field.id}-${opt.value}`} className="font-normal cursor-pointer text-xs">
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
                  handleValueChange(next);
                }}
              />
              <Label htmlFor={`${field.id}-${opt.value}`} className="font-normal cursor-pointer text-xs">
                {opt.label}
              </Label>
            </div>
          ))}
        </div>
      ); }

    case 'media':
      {
        const mediaArray = Array.isArray(value) ? value : (value ? [value] : []);
        const handleMediaUpdate = (next: any) => {
          handleValueChange(field.multiple ? next : (next[0] || null));
        };
        
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {mediaArray.map((m: any, idx: number) => (
                <div key={idx} className="group relative aspect-square rounded-lg border overflow-hidden bg-muted transition-all hover:ring-2 hover:ring-primary/50">
                  <img src={m.secureUrl} alt={m.filename} className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => {
                      const next = mediaArray.filter((_, i) => i !== idx);
                      handleMediaUpdate(next);
                    }}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {(field.multiple || mediaArray.length === 0) && (
                <button 
                  type="button"
                  onClick={() => onMediaPickerOpen(field.name)}
                  className="flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-lg hover:border-primary hover:bg-accent/50 transition-all text-muted-foreground hover:text-primary group"
                >
                  <ImagePlus className="w-4 h-4 mb-1" />
                  <span className="text-[10px] font-medium">Add Media</span>
                </button>
              )}
            </div>
          </div>
        );
      }

    case 'relation':
      {
        const options = field.relationCollectionId ? (relationData[field.relationCollectionId] || []) : [];
        return (
          <Select 
            value={value?.toString() || ''} 
            onValueChange={val => handleValueChange(parseInt(val))}
          >
            <SelectTrigger className={error ? 'border-destructive' : ''}>
              <SelectValue placeholder={`Select ${field.label || field.name}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map(entry => (
                <SelectItem key={entry.id} value={entry.id.toString()}>
                  {field.relationLabelField ? entry.content[field.relationLabelField] : `Entry #${entry.id}`}
                </SelectItem>
              ))}
              {options.length === 0 && (
                <div className="p-2 text-xs text-muted-foreground text-center italic">No entries found</div>
              )}
            </SelectContent>
          </Select>
        );
      }

    case 'documents':
      return (
        <Select 
          value={value?.id?.toString() || (typeof value === 'number' ? value.toString() : '')} 
          onValueChange={val => {
            const doc = availableDocuments.find(d => d.id === parseInt(val));
            handleValueChange(doc || parseInt(val));
          }}
        >
          <SelectTrigger className={error ? 'border-destructive' : ''}>
            <SelectValue placeholder={`Select ${field.label || field.name}`} />
          </SelectTrigger>
          <SelectContent>
            {availableDocuments.map(doc => (
              <SelectItem key={doc.id} value={doc.id.toString()}>
                <div className="flex items-center">
                  <FileText className="w-3 h-3 mr-2 opacity-50" />
                  {doc.filename}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case 'slug':
      return (
        <Input 
          value={value || ''}
          onChange={e => handleValueChange(e.target.value)}
          placeholder={`Enter ${field.label || field.name}`}
          className={error ? 'border-destructive' : ''}
        />
      );

    case 'array':
      {
        const items = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-4">
            {items.map((item: any, itemIndex: number) => (
              <div key={itemIndex} className="relative p-6 border rounded-xl bg-muted/4 shadow-inner space-y-6 group animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-50">
                    {field.label || field.name} #{itemIndex + 1}
                  </span>
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      const next = items.filter((_, i) => i !== itemIndex);
                      handleValueChange(next);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-6">
                  {field.fields?.map((childField) => (
                    <div key={childField.id} className="space-y-2 text-left">
                      <Label className="text-sm font-medium text-muted-foreground/80">
                        {childField.label || childField.name} {childField.required && <span className="text-destructive">*</span>}
                      </Label>
                      <FieldInput
                        field={childField} 
                        value={item[childField.name]} 
                        onChange={(val) => {
                          const nextItems = [...items];
                          nextItems[itemIndex] = { ...nextItems[itemIndex], [childField.name]: val };
                          handleValueChange(nextItems);
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
              type="button" 
              variant="outline" 
              size="sm" 
              className="w-full py-6 border-dashed border-2 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all group"
              onClick={() => {
                const newItem = (field.fields || []).reduce((acc: any, f) => {
                  acc[f.name] = f.type === 'boolean' ? false : (f.type === 'number' ? 0 : (f.type === 'checkbox' ? [] : ''));
                  return acc;
                }, {});
                handleValueChange([...items, newItem]);
              }}
            >
              <ImagePlus className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
              Add Item to {field.label || 'List'}
            </Button>
          </div>
        );
      }

    default:
      return <p className="text-xs text-destructive">Unsupported field type: {field.type}</p>;
  }
};

export default function EntriesForm({ collection, entry, user, mode }: FormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(entry?.content || {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, any>>({});
  const [availableDocuments, setAvailableDocuments] = useState<any[]>([]);
  const [activeMediaPickerField, setActiveMediaPickerField] = useState<string | null>(null);

  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')     // Replace spaces with -
      .replace(/[^\w-]+/g, '')  // Remove all non-word chars
      .replace(/--+/g, '-');    // Replace multiple - with single -
  };

  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      
      // Auto-fill slug fields
      collection.fields.forEach(field => {
        if (field.type === 'slug' && field.slugSourceField === name) {
          // Only auto-fill if the slug is empty or was previously auto-generated from the old value
          // For simplicity, let's auto-fill if the source field is being changed
          // but allow manual override later. 
          // If we want to be smart: only auto-fill if the slug field is currently empty or matches the slugified old value.
          // But usually, users expect reactive slugs.
          next[field.name] = slugify(value || '');
        }
      });
      
      return next;
    });
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

  const [relationData, setRelationData] = useState<Record<number, any[]>>({});

  useEffect(() => {
    const fetchRelations = async () => {
      const relationFields = collection.fields.filter(f => f.type === 'relation' && f.relationCollectionId);
      
      for (const field of relationFields) {
        const id = field.relationCollectionId!;
        if (relationData[id]) continue;

        try {
          const res = await fetch(`/api/collections/${id}/entries`);
          if (res.ok) {
            const data = await res.json();
            setRelationData(prev => ({ ...prev, [id]: data.entries || [] }));
          }
        } catch (err) {
          console.error(`Failed to fetch relation data for collection ${id}`, err);
        }
      }
    };

    fetchRelations();
  }, [collection.fields, relationData]);

  useEffect(() => {
    const fetchDocuments = async () => {
      const hasDocumentField = collection.fields.some(f => f.type === 'documents');
      if (!hasDocumentField) return;

      try {
        const res = await fetch('/api/documents?limit=100'); // Fetch more for selection
        if (res.ok) {
          const data = await res.json();
          setAvailableDocuments(data.files || []);
        }
      } catch (err) {
        console.error('Failed to fetch documents', err);
      }
    };

    fetchDocuments();
  }, [collection.fields]);

  const handleMediaSelect = (mediaItems: any[]) => {
    if (!activeMediaPickerField) return;
    
    const field = collection.fields.find(f => f.name === activeMediaPickerField);
    if (!field) return;

    if (field.multiple) {
      const current = formData[activeMediaPickerField] || [];
      const next = [...(Array.isArray(current) ? current : []), ...mediaItems];
      // Optional: deduplicate by id
      const unique = next.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
      handleFieldChange(activeMediaPickerField, unique);
    } else {
      handleFieldChange(activeMediaPickerField, mediaItems[0]);
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
                <div className="flex items-center justify-between border-b border-border/30 pb-1">
                   <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
                      {field.label || field.name} {field.required && <span className="text-destructive">*</span>}
                   </Label>
                   <span className="text-[10px] font-mono opacity-40">{field.type}</span>
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
                  <p className="text-[10px] text-muted-foreground italic">You can select multiple files for this field.</p>
                )}
                {errors[field.name] && (
                  <p className="text-xs font-medium text-destructive mt-1">{errors[field.name]}</p>
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

      <MediaPicker 
        open={!!activeMediaPickerField}
        onOpenChange={(open) => !open && setActiveMediaPickerField(null)}
        onSelectMedia={handleMediaSelect}
        multiple={collection.fields.find(f => f.name === activeMediaPickerField)?.multiple}
      />
    </Layout>
  );
}
