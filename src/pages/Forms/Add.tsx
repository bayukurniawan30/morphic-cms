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
import { Switch } from '@/components/ui/switch';
import Layout from '@/components/Layout';
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  PlusIcon, 
  TrashIcon, 
  ChevronUpIcon, 
  ChevronDownIcon,
  Settings2Icon,
  ArrowLeftIcon,
  GlobeIcon,
  ShieldCheckIcon,
  HelpCircleIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { FieldDefinition, FieldType } from '@/lib/dynamic-schema';
import { useForm } from '@inertiajs/react';

interface AddProps {
  user?: any;
}

export default function AddForm({ user }: AddProps) {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    slug: '',
    fields: [] as FieldDefinition[],
    storageType: 'external' as 'internal' | 'external',
    apiUrl: '',
    apiMethod: 'POST',
    apiHeaders: {} as Record<string, string>,
    apiEntriesPath: '',
    allowedOrigins: '',
    honeypotField: '',
  });

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

  const updateValidation = (fieldIndex: number, updates: any) => {
    const fields = [...data.fields];
    fields[fieldIndex] = {
      ...fields[fieldIndex],
      validation: { ...(fields[fieldIndex].validation || {}), ...updates }
    };
    setData('fields', fields);
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

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.name.trim()) {
      toast.error('Form name is required');
      return;
    }
    if (!data.slug.trim()) {
      toast.error('Slug is required');
      return;
    }
    if (data.storageType === 'external' && !data.apiUrl.trim()) {
      toast.error('Third-party API URL is required for external storage');
      return;
    }
    if (data.fields.length === 0) {
      toast.error('At least one field is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || 'Failed to create form');
        setIsSubmitting(false);
        return;
      }

      toast.success('Form definition created successfully');
      window.location.href = '/forms';
    } catch (err) {
      toast.error('Network error');
      setIsSubmitting(false);
    }
  };

  const restrictedFieldTypes: { value: FieldType; label: string }[] = [
    { value: 'text', label: 'Text' },
    { value: 'textarea', label: 'Textarea' },
    { value: 'date', label: 'Date' },
    { value: 'datetime', label: 'DateTime' },
    { value: 'time', label: 'Time' },
    { value: 'select', label: 'Select' },
    { value: 'email', label: 'Email' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'radio', label: 'Radio' },
  ];

  const [headerKey, setHeaderKey] = useState('');
  const [headerValue, setHeaderValue] = useState('');

  const addHeader = () => {
    if (!headerKey || !headerValue) return;
    setData('apiHeaders', { ...data.apiHeaders, [headerKey]: headerValue });
    setHeaderKey('');
    setHeaderValue('');
  };

  const removeHeader = (key: string) => {
    const next = { ...data.apiHeaders };
    delete next[key];
    setData('apiHeaders', next);
  };

  return (
    <Layout user={user}>
      <Head title="Create Form | Morphic" />

      <div className="w-full space-y-8">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/forms">
              <ArrowLeftIcon className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Form</h1>
            <p className="text-muted-foreground mt-1">Define form structure and connection to third-party API.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Form Fields Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Form Fields</h2>
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
                          type="button" variant="ghost" size="icon" className="h-6 w-6"
                          onClick={() => moveField(index, 'up')} disabled={index === 0}
                        >
                          <ChevronUpIcon className="w-4 h-4" />
                        </Button>
                        <Button 
                          type="button" variant="ghost" size="icon" className="h-6 w-6"
                          onClick={() => moveField(index, 'down')} disabled={index === data.fields.length - 1}
                        >
                          <ChevronDownIcon className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="md:col-span-4 space-y-2">
                        <Label>Field Label</Label>
                        <Input 
                          placeholder="e.g. Email Address"
                          value={field.label}
                          onChange={e => {
                            const label = e.target.value;
                            const name = label.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
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
                            {restrictedFieldTypes.map(t => (
                              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="md:col-span-2 flex items-center space-x-2 pb-3">
                        <Switch 
                          id={`req-${field.id}`}
                          checked={field.required}
                          onCheckedChange={val => updateField(index, { required: val })}
                        />
                        <Label htmlFor={`req-${field.id}`} className="cursor-pointer text-xs">Required</Label>
                      </div>

                      <div className="md:col-span-2 flex justify-end pb-1">
                        <Button 
                          type="button" variant="ghost" size="icon"
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

                         {(field.type === 'text' || field.type === 'textarea') && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                               <Label className="text-xs">Min Length</Label>
                               <Input 
                                 type="number" 
                                 placeholder="0"
                                 className="bg-background h-8 text-xs"
                                 value={field.validation?.minLength || ''}
                                 onChange={e => updateValidation(index, { minLength: parseInt(e.target.value) || undefined })}
                               />
                            </div>
                            <div className="space-y-2">
                               <Label className="text-xs">Max Length</Label>
                               <Input 
                                 type="number" 
                                 placeholder="255"
                                 className="bg-background h-8 text-xs"
                                 value={field.validation?.maxLength || ''}
                                 onChange={e => updateValidation(index, { maxLength: parseInt(e.target.value) || undefined })}
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

                        {['date', 'datetime', 'time'].includes(field.type) && (
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
                    <p className="text-muted-foreground italic">Add fields to your form definition.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* General Settings */}
            <div className="bg-card p-6 rounded-xl border shadow-sm space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Settings2Icon className="w-4 h-4" />
                Definition
              </h3>
              <div className="space-y-2">
                <Label htmlFor="formName">Form Name</Label>
                <Input 
                  id="formName" value={data.name} 
                  onChange={e => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
                    setData(d => ({ ...d, name, slug }));
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="formSlug">Slug</Label>
                <Input 
                  id="formSlug" value={data.slug} 
                  onChange={e => setData('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                />
              </div>

              <div className="space-y-3 pt-4 border-t">
                <Label className="text-sm font-semibold">Storage Mode</Label>
                <RadioGroup 
                  value={data.storageType} 
                  onValueChange={(val: any) => setData('storageType', val)}
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <RadioGroupItem value="external" id="external" />
                    <Label htmlFor="external" className="cursor-pointer flex-1">
                      <div className="font-medium text-xs">External API</div>
                      <div className="text-[10px] text-muted-foreground">Fetch/Submit to third-party</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <RadioGroupItem value="internal" id="internal" />
                    <Label htmlFor="internal" className="cursor-pointer flex-1">
                      <div className="font-medium text-xs">Internal (CMS)</div>
                      <div className="text-[10px] text-muted-foreground">Save entries in this CMS</div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {data.storageType === 'internal' && data.slug && (
                <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-1">
                  <Label className="text-[10px] font-bold uppercase text-primary">Public Submission Endpoint</Label>
                  <div className="bg-muted p-2 rounded border font-mono text-[10px] break-all select-all">
                    {window.location.origin}/api/forms/{data.slug}/submit
                  </div>
                  <p className="text-[9px] text-muted-foreground">Use this URL as the action for your website's contact form.</p>
                </div>
              )}
            </div>

            {/* API Integration Settings (External Only) */}
            {data.storageType === 'external' ? (
              <div className="bg-card p-6 rounded-xl border shadow-sm space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <GlobeIcon className="w-4 h-4 text-primary" />
                  API Integration
                </h3>
                <div className="space-y-2">
                  <Label>Endpoint URL <span className="text-destructive ml-1">*</span></Label>
                  <Input 
                    placeholder="https://api.example.com/v1/leads"
                    value={data.apiUrl} onChange={e => setData('apiUrl', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Method</Label>
                  <Select value={data.apiMethod} onValueChange={val => setData('apiMethod', val)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET (Fetch Only)</SelectItem>
                      <SelectItem value="POST">POST (Submit)</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3 pt-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Custom Headers</Label>
                  <div className="space-y-2">
                    {Object.entries(data.apiHeaders).map(([k, v]) => (
                      <div key={k} className="flex gap-2 items-center bg-muted/30 p-2 rounded-md group">
                        <div className="flex-1 text-xs font-mono truncate">
                          <span className="text-primary">{k}:</span> {v}
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => removeHeader(k)}>
                          <TrashIcon className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Key" value={headerKey} onChange={e => setHeaderKey(e.target.value)} className="h-8 text-xs" />
                      <Input placeholder="Value" value={headerValue} onChange={e => setHeaderValue(e.target.value)} className="h-8 text-xs" />
                    </div>
                    <Button type="button" variant="outline" size="sm" className="w-full h-8 text-xs" onClick={addHeader}>Add Header</Button>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <Label className="text-xs">Entries JSON Path</Label>
                  <Input 
                    placeholder="e.g. data.items"
                    value={data.apiEntriesPath} onChange={e => setData('apiEntriesPath', e.target.value)}
                    className="h-8 text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground italic">Path in the API response that contains the array of entries.</p>
                </div>
              </div>
            ) : (
              <div className="bg-primary/5 p-6 rounded-xl border border-primary/20 space-y-3 animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Settings2Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm">Internal Storage Active</h3>
                <p className="text-xs text-muted-foreground">
                  Submissions will be saved directly into your Morphic CMS database. 
                  You can view and manage these entries in the <strong>Entries</strong> tab.
                </p>
                <div className="pt-2">
                  <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80">
                    No API Bridge needed
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            <div className="bg-card p-6 rounded-xl border shadow-sm space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ShieldCheckIcon className="w-4 h-4 text-primary" />
                Security & Anti-Spam
              </h3>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="allowedOrigins" className="flex items-center gap-1">
                    Allowed Origins
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircleIcon className="w-3 h-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Domains allowed to submit to this form. Leave empty to allow all.
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                </div>
                <Input 
                  id="allowedOrigins"
                  placeholder="e.g. example.com, myform.co"
                  value={data.allowedOrigins}
                  onChange={e => setData('allowedOrigins', e.target.value)}
                  className="h-8 text-xs font-mono"
                />
                <p className="text-[9px] text-muted-foreground">Comma-separated list of domains. We check the Origin/Referer header.</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="honeypotField" className="flex items-center gap-1">
                    Honeypot Field Name
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircleIcon className="w-3 h-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        A hidden input field name. If bots fill this, submission is ignored.
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                </div>
                <Input 
                  id="honeypotField"
                  placeholder="e.g. _gotcha, website_url"
                  value={data.honeypotField}
                  onChange={e => setData('honeypotField', e.target.value)}
                  className="h-8 text-xs font-mono"
                />
                <p className="text-[9px] text-muted-foreground">Add this field to your HTML form and hide it with CSS (e.g. display:none).</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button type="submit" disabled={isSubmitting || processing} className="w-full">
                {isSubmitting ? 'Saving...' : 'Create Form Definition'}
              </Button>
              <Button type="button" variant="outline" asChild className="w-full">
                <Link href="/forms">Cancel</Link>
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}
