import React from 'react';
import { 
  Type, 
  Hash, 
  Calendar, 
  Clock, 
  List, 
  CheckSquare, 
  CircleDot, 
  Image as ImageIcon, 
  FileText, 
  FileJson, 
  AlignLeft, 
  Link as LinkIcon, 
  Fingerprint, 
  Mail, 
  Layers,
  Search,
  CheckCircle2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FieldType } from '@/lib/dynamic-schema';


// Removed local FieldType definition to use the one from dynamic-schema


interface FieldTypeOption {
  value: FieldType;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  category: 'basic' | 'selection' | 'advanced' | 'media';
}

const fieldTypeOptions: FieldTypeOption[] = [
  { value: 'text', label: 'Text', description: 'Small to medium text strings', icon: Type, color: 'text-blue-500 bg-blue-50', category: 'basic' },
  { value: 'textarea', label: 'Long Text', description: 'Large blocks of text', icon: AlignLeft, color: 'text-indigo-500 bg-indigo-50', category: 'basic' },
  { value: 'email', label: 'Email', description: 'Email address with validation', icon: Mail, color: 'text-sky-500 bg-sky-50', category: 'basic' },
  { value: 'number', label: 'Number', description: 'Integer or decimal values', icon: Hash, color: 'text-emerald-500 bg-emerald-50', category: 'basic' },
  
  { value: 'select', label: 'Select', description: 'Pick one from a list', icon: List, color: 'text-orange-500 bg-orange-50', category: 'selection' },
  { value: 'checkbox', label: 'Checkbox', description: 'Multi-select boolean values', icon: CheckSquare, color: 'text-amber-500 bg-amber-50', category: 'selection' },
  { value: 'radio', label: 'Radio', description: 'Single choice radio buttons', icon: CircleDot, color: 'text-orange-600 bg-orange-100', category: 'selection' },
  { value: 'boolean', label: 'Boolean', description: 'True or false switch', icon: CheckCircle2, color: 'text-green-600 bg-green-100', category: 'selection' },
  
  { value: 'date', label: 'Date', description: 'Calendars and anniversaries', icon: Calendar, color: 'text-purple-500 bg-purple-50', category: 'advanced' },

  { value: 'datetime', label: 'DateTime', description: 'Specific time and date', icon: Clock, color: 'text-fuchsia-500 bg-fuchsia-50', category: 'advanced' },
  { value: 'time', label: 'Time', description: 'Hours, minutes, seconds', icon: Clock, color: 'text-violet-500 bg-violet-50', category: 'advanced' },
  
  { value: 'media', label: 'Media', description: 'Images and galleries', icon: ImageIcon, color: 'text-pink-500 bg-pink-50', category: 'media' },
  { value: 'documents', label: 'Documents', description: 'PDFs and files', icon: FileText, color: 'text-rose-500 bg-rose-50', category: 'media' },
  
  { value: 'rich-text', label: 'Rich Text', description: 'Formatted HTML content', icon: FileJson, color: 'text-cyan-500 bg-cyan-50', category: 'advanced' },
  { value: 'relation', label: 'Relation', description: 'Link to another collection', icon: LinkIcon, color: 'text-teal-500 bg-teal-50', category: 'advanced' },
  { value: 'slug', label: 'Slug', description: 'Unique URL identifier', icon: Fingerprint, color: 'text-blue-600 bg-blue-100', category: 'advanced' },
  { value: 'array', label: 'Repeater', description: 'List of nested fields', icon: Layers, color: 'text-amber-600 bg-amber-100', category: 'advanced' },
];

interface FieldTypeSelectorProps {
  value: FieldType;
  onSelect: (type: FieldType) => void;
  disabledTypes?: FieldType[];
}

export function FieldTypeSelector({ value, onSelect, disabledTypes = [] }: FieldTypeSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const selectedType = fieldTypeOptions.find(t => t.value === value) || fieldTypeOptions[0];
  const SelectedIcon = selectedType.icon;

  const filteredOptions = fieldTypeOptions.filter(t => 
    !disabledTypes.includes(t.value) &&
    (t.label.toLowerCase().includes(search.toLowerCase()) || 
     t.description.toLowerCase().includes(search.toLowerCase()))
  );

  const categories = [
    { id: 'basic', label: 'Basic Fields' },
    { id: 'selection', label: 'Selection Fields' },
    { id: 'media', label: 'Media & Files' },
    { id: 'advanced', label: 'Advanced Fields' },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full flex items-center justify-between px-3 h-10 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className={cn("p-1.5 rounded-md", selectedType.color)}>
              <SelectedIcon className="w-4 h-4" />
            </div>
            <span className="font-medium">{selectedType.label}</span>
          </div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            Change
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0 border-none rounded-3xl shadow-2xl">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold tracking-tight">Select Field Type</DialogTitle>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search field types..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 h-11 bg-zinc-50 dark:bg-zinc-900 border-none focus-visible:ring-1 focus-visible:ring-primary/20 rounded-xl"
            />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {categories.map(cat => {
            const catOptions = filteredOptions.filter(t => t.category === cat.id);
            if (catOptions.length === 0) return null;

            return (
              <div key={cat.id} className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">{cat.label}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {catOptions.map(option => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          onSelect(option.value);
                          setOpen(false);
                        }}
                        className={cn(
                          "flex items-start text-left p-4 rounded-2xl border transition-all duration-200 group relative",
                          value === option.value 
                            ? "bg-primary/5 border-primary shadow-sm" 
                            : "bg-card border-zinc-100 dark:border-zinc-800 hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5"
                        )}
                      >
                       <div className={cn("p-2.5 rounded-xl mr-4 transition-transform group-hover:scale-110", option.color)}>
                         <Icon className="w-5 h-5" />
                       </div>
                       <div className="flex-1">
                         <p className="font-semibold text-sm mb-0.5">{option.label}</p>
                         <p className="text-xs text-muted-foreground leading-relaxed line-clamp-1">{option.description}</p>
                       </div>
                       {value === option.value && (
                         <div className="absolute right-4 top-1/2 -translate-y-1/2">
                           <div className="h-2 w-2 rounded-full bg-primary" />
                         </div>
                       )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
