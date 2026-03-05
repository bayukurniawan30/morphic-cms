import React, { useState, useEffect } from 'react';
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
import { ArrowLeftIcon, SaveIcon, Loader2Icon, FileText, X, ImagePlus } from 'lucide-react';
import MediaPicker from '@/components/MediaPicker';
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
        {
          const value = formData[field.name];
          const mediaArray = Array.isArray(value) ? value : (value ? [value] : []);
          
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
                        handleFieldChange(field.name, field.multiple ? next : (next[0] || null));
                      }}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-1 text-[8px] truncate opacity-0 group-hover:opacity-100 transition-opacity">
                      {m.filename}
                    </div>
                  </div>
                ))}
                {(field.multiple || mediaArray.length === 0) && (
                  <button 
                    type="button"
                    onClick={() => setActiveMediaPickerField(field.name)}
                    className="flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-lg hover:border-primary hover:bg-accent/50 transition-all text-muted-foreground hover:text-primary group"
                  >
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors mb-2">
                      <ImagePlus className="w-4 h-4" />
                    </div>
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
              onValueChange={val => handleFieldChange(field.name, parseInt(val))}
            >
              <SelectTrigger className={error ? 'border-destructive' : ''}>
                <SelectValue placeholder={`Select ${field.label}`} />
              </SelectTrigger>
              <SelectContent>
                {options.map(entry => (
                  <SelectItem key={entry.id} value={entry.id.toString()}>
                    {field.relationLabelField ? entry.content[field.relationLabelField] : `Entry #${entry.id}`}
                  </SelectItem>
                ))}
                {options.length === 0 && (
                  <div className="p-2 text-xs text-muted-foreground text-center italic">No entries found in target collection</div>
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
              handleFieldChange(field.name, doc || parseInt(val));
            }}
          >
            <SelectTrigger className={error ? 'border-destructive' : ''}>
              <SelectValue placeholder={`Select ${field.label}`} />
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
              {availableDocuments.length === 0 && (
                <div className="p-2 text-xs text-muted-foreground text-center italic">No documents found</div>
              )}
            </SelectContent>
          </Select>
        );

      case 'slug':
        return (
          <Input 
            value={value || ''}
            onChange={e => handleFieldChange(field.name, e.target.value)}
            placeholder={`Enter ${field.label}`}
            className={error ? 'border-destructive' : ''}
          />
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

      <MediaPicker 
        open={!!activeMediaPickerField}
        onOpenChange={(open) => !open && setActiveMediaPickerField(null)}
        onSelectMedia={handleMediaSelect}
        multiple={collection.fields.find(f => f.name === activeMediaPickerField)?.multiple}
      />
    </Layout>
  );
}
