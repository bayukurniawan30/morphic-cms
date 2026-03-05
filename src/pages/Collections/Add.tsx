import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
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
import { Switch } from '@/components/ui/switch';
import Layout from '@/components/Layout';
import { 
  PlusIcon, 
  TrashIcon, 
  GripVerticalIcon, 
  ChevronUpIcon, 
  ChevronDownIcon,
  Settings2Icon
} from 'lucide-react';
import { toast } from 'sonner';
import { FieldDefinition, FieldType } from '@/lib/dynamic-schema';

interface AddProps {
  user?: any;
}

export default function AddCollection({ user }: AddProps) {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    fields: [] as FieldDefinition[],
  });

  const addField = () => {
    const newField: FieldDefinition = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      label: '',
      type: 'text',
      required: false,
    };
    setData('fields', [...data.fields, newField]);
  };

  const removeField = (index: number) => {
    const newFields = [...data.fields];
    newFields.splice(index, 1);
    setData('fields', newFields);
  };

  const updateField = (index: number, updates: Partial<FieldDefinition>) => {
    const newFields = [...data.fields];
    newFields[index] = { ...newFields[index], ...updates };
    setData('fields', newFields);
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === data.fields.length - 1) return;

    const newFields = [...data.fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    setData('fields', newFields);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.name.trim()) {
      toast.error('Collection name is required');
      return;
    }
    if (data.fields.length === 0) {
      toast.error('At least one field is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || 'Failed to create collection');
        setIsSubmitting(false);
        return;
      }

      toast.success('Collection created successfully');
      window.location.href = '/collections';
    } catch (err) {
      toast.error('Network error');
      setIsSubmitting(false);
    }
  };

  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());

  const toggleAdvanced = (fieldId: string) => {
    const next = new Set(expandedFields);
    if (next.has(fieldId)) {
      next.delete(fieldId);
    } else {
      next.add(fieldId);
    }
    setExpandedFields(next);
  };

  const addOption = (fieldIndex: number) => {
    const fields = [...data.fields];
    const options = fields[fieldIndex].options || [];
    fields[fieldIndex] = {
      ...fields[fieldIndex],
      options: [...options, { label: '', value: '' }]
    };
    setData('fields', fields);
  };

  const updateOption = (fieldIndex: number, optionIndex: number, updates: Partial<{ label: string; value: string }>) => {
    const fields = [...data.fields];
    const options = [...(fields[fieldIndex].options || [])];
    options[optionIndex] = { ...options[optionIndex], ...updates };
    fields[fieldIndex] = { ...fields[fieldIndex], options };
    setData('fields', fields);
  };

  const removeOption = (fieldIndex: number, optionIndex: number) => {
    const fields = [...data.fields];
    const options = [...(fields[fieldIndex].options || [])];
    options.splice(optionIndex, 1);
    fields[fieldIndex] = { ...fields[fieldIndex], options };
    setData('fields', fields);
  };

  const updateValidation = (fieldIndex: number, updates: any) => {
    const fields = [...data.fields];
    fields[fieldIndex] = {
      ...fields[fieldIndex],
      validation: { ...(fields[fieldIndex].validation || {}), ...updates }
    };
    setData('fields', fields);
  };

  const fieldTypes: { value: FieldType; label: string }[] = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'datetime', label: 'DateTime' },
    { value: 'time', label: 'Time' },
    { value: 'select', label: 'Select' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'radio', label: 'Radio' },
    { value: 'media', label: 'Media' },
    { value: 'documents', label: 'Documents' },
    { value: 'rich-text', label: 'Rich Text' },
    { value: 'relation', label: 'Collection (Relation)' },
    { value: 'slug', label: 'Slug' },
  ];

  const [availableCollections, setAvailableCollections] = useState<any[]>([]);

  React.useEffect(() => {
    fetch('/api/collections')
      .then(res => res.json())
      .then(data => setAvailableCollections(data.collections || []))
      .catch(err => console.error('Failed to fetch collections', err));
  }, []);

  return (
    <Layout user={user}>
      <Head title="Add Collection | Morphic" />

      <div className="w-full space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Collection</h1>
          <p className="text-muted-foreground mt-1">Define your content schema and fields.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-card p-6 rounded-xl border shadow-sm space-y-4">
            <div className="space-y-2">
              <Label htmlFor="collectionName">Collection Name <span className="text-destructive ml-1">*</span></Label>
              <Input 
                id="collectionName"
                placeholder="e.g. Blog Posts"
                value={data.name}
                onChange={e => setData('name', e.target.value)}
                className="max-w-md"
              />
              <p className="text-xs text-muted-foreground italic">Slug will be automatically generated from the name.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Fields</h2>
              <Button type="button" onClick={addField} size="sm">
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Field
              </Button>
            </div>

            <div className="space-y-4">
              {data.fields.map((field, index) => (
                <div key={field.id} className="bg-card p-4 rounded-lg border shadow-sm group relative">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-1 flex flex-col items-center space-y-1 pb-2">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => moveField(index, 'up')}
                        disabled={index === 0}
                      >
                        <ChevronUpIcon className="w-4 h-4" />
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => moveField(index, 'down')}
                        disabled={index === data.fields.length - 1}
                      >
                        <ChevronDownIcon className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="md:col-span-3 space-y-2">
                      <Label>Field Label</Label>
                      <Input 
                        placeholder="e.g. Title"
                        value={field.label}
                        onChange={e => {
                          const label = e.target.value;
                          const name = label.toLowerCase().replace(/[^a-z0-0]/g, '_');
                          updateField(index, { label, name });
                        }}
                      />
                    </div>

                    <div className="md:col-span-3 space-y-2">
                      <Label>Field Type</Label>
                      <Select 
                        value={field.type} 
                        onValueChange={(val: FieldType) => updateField(index, { type: val })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fieldTypes.map(t => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-3 flex items-center space-x-2 pb-3">
                      <Switch 
                        id={`req-${field.id}`}
                        checked={field.required}
                        onCheckedChange={val => updateField(index, { required: val })}
                      />
                      <Label htmlFor={`req-${field.id}`} className="cursor-pointer">Required</Label>
                    </div>

                    <div className="md:col-span-2 flex justify-end pb-1">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeField(index)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {expandedFields.has(field.id) && (
                    <div className="mt-4 p-4 bg-muted/30 rounded-md space-y-4 border border-muted-foreground/10 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex justify-between items-center">
                         <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Advanced Settings</h4>
                         <span className="text-[10px] font-mono opacity-50 uppercase">{field.type} Field</span>
                      </div>

                      {field.type === 'text' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs">Min Length</Label>
                            <Input 
                              type="number" 
                              placeholder="0"
                              className="bg-background"
                              value={field.validation?.minLength || ''}
                              onChange={e => updateValidation(index, { minLength: parseInt(e.target.value) || undefined })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Max Length</Label>
                            <Input 
                              type="number" 
                              placeholder="255"
                              className="bg-background"
                              value={field.validation?.maxLength || ''}
                              onChange={e => updateValidation(index, { maxLength: parseInt(e.target.value) || undefined })}
                            />
                          </div>
                        </div>
                      )}

                      {field.type === 'number' && (
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs">Min Value</Label>
                            <Input 
                              type="number" 
                              placeholder="Min"
                              className="bg-background"
                              value={field.validation?.min ?? ''}
                              onChange={e => updateValidation(index, { min: e.target.value === '' ? undefined : Number(e.target.value) })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Max Value</Label>
                            <Input 
                              type="number" 
                              placeholder="Max"
                              className="bg-background"
                              value={field.validation?.max ?? ''}
                              onChange={e => updateValidation(index, { max: e.target.value === '' ? undefined : Number(e.target.value) })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Step</Label>
                            <Input 
                              type="number" 
                              placeholder="1"
                              className="bg-background"
                              value={field.validation?.step ?? ''}
                              onChange={e => updateValidation(index, { step: e.target.value === '' ? undefined : Number(e.target.value) })}
                            />
                          </div>
                        </div>
                      )}

                      {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <Label className="text-xs">Options (Label and Value)</Label>
                            <Button type="button" variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => addOption(index)}>
                              Add Option
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {field.options?.map((opt, optIndex) => (
                              <div key={optIndex} className="flex gap-2 items-center">
                                <Input 
                                  placeholder="Label" 
                                  value={opt.label} 
                                  className="h-8 text-xs bg-background"
                                  onChange={e => updateOption(index, optIndex, { label: e.target.value })}
                                />
                                <Input 
                                  placeholder="Value" 
                                  value={opt.value} 
                                  className="h-8 text-xs bg-background"
                                  onChange={e => updateOption(index, optIndex, { value: e.target.value })}
                                />
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => removeOption(index, optIndex)}
                                >
                                  <TrashIcon className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            ))}
                            {(!field.options || field.options.length === 0) && (
                              <p className="text-[10px] italic text-muted-foreground text-center py-2">No options added yet.</p>
                            )}
                          </div>
                        </div>
                      )}

                      {field.type === 'media' && (
                        <div className="flex items-center justify-between p-2 bg-background rounded-md border border-muted-foreground/10">
                          <div className="space-y-0.5">
                            <Label className="text-xs font-semibold">Multiple Selection</Label>
                            <p className="text-[10px] text-muted-foreground">Allow selecting more than one file.</p>
                          </div>
                          <Switch 
                            checked={field.multiple || false}
                            onCheckedChange={val => updateField(index, { multiple: val })}
                          />
                        </div>
                      )}

                      {field.type === 'relation' && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-xs">Target Collection</Label>
                            <Select 
                              value={field.relationCollectionId?.toString() || ''} 
                              onValueChange={val => updateField(index, { relationCollectionId: parseInt(val), relationLabelField: undefined })}
                            >
                              <SelectTrigger className="h-8 text-xs bg-background">
                                <SelectValue placeholder="Select collection" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableCollections.map(c => (
                                  <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {field.relationCollectionId && (
                            <div className="space-y-2">
                              <Label className="text-xs">Display Field</Label>
                              <Select 
                                value={field.relationLabelField || ''} 
                                onValueChange={val => updateField(index, { relationLabelField: val })}
                              >
                                <SelectTrigger className="h-8 text-xs bg-background">
                                  <SelectValue placeholder="Select display field" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableCollections.find(c => c.id === field.relationCollectionId)?.fields.map((f: any) => (
                                    <SelectItem key={f.name} value={f.name}>{f.label} ({f.name})</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <p className="text-[10px] text-muted-foreground italic">This field will be shown in the dropdown when creating entries.</p>
                            </div>
                          )}
                        </div>
                      )}

                      {field.type === 'slug' && (
                        <div className="space-y-2 text-left">
                          <Label className="text-xs">Base Field (for auto-generation)</Label>
                          <Select 
                            value={field.slugSourceField || ''} 
                            onValueChange={val => updateField(index, { slugSourceField: val })}
                          >
                            <SelectTrigger className="h-8 text-xs bg-background">
                              <SelectValue placeholder="Select base field" />
                            </SelectTrigger>
                            <SelectContent>
                              {data.fields
                                .filter(f => f.type === 'text' && f.id !== field.id)
                                .map(f => (
                                  <SelectItem key={f.id} value={f.name}>{f.label} ({f.name})</SelectItem>
                                ))
                              }
                              {data.fields.filter(f => f.type === 'text' && f.id !== field.id).length === 0 && (
                                <p className="text-[10px] p-2 text-muted-foreground italic text-center">No text fields available</p>
                              )}
                            </SelectContent>
                          </Select>
                          <p className="text-[10px] text-muted-foreground italic">The slug will be automatically created from this field's value.</p>
                        </div>
                      )}

                      {/* Fallback for types without special advanced settings */}
                      {['date', 'datetime', 'time', 'rich-text'].includes(field.type) && (
                        <p className="text-[10px] text-muted-foreground italic">No advanced settings available for this field type.</p>
                      )}
                    </div>
                  )}

                  <div className="mt-2 flex justify-end">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => toggleAdvanced(field.id)}
                      className={`text-[10px] h-6 uppercase tracking-tight transition-opacity ${expandedFields.has(field.id) ? 'opacity-100 bg-muted text-primary font-bold' : 'opacity-50 hover:opacity-100'}`}
                    >
                       <Settings2Icon className={`w-3 h-3 mr-1 ${expandedFields.has(field.id) ? 'animate-spin-slow' : ''}`} />
                       ADVANCED: {field.name || 'no-name'}
                    </Button>
                  </div>
                </div>
              ))}

              {data.fields.length === 0 && (
                <div className="text-center p-12 border-2 border-dashed rounded-xl">
                  <p className="text-muted-foreground">No fields added yet. Click "Add Field" to start.</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-4 border-t">
            <Button type="button" variant="outline" asChild>
              <Link href="/collections">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Save Collection'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
