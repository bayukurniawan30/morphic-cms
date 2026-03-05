import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowLeftIcon, 
  SaveIcon, 
  LockIcon,
  ShieldCheckIcon,
  HelpCircleIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface Collection {
  id: number;
  name: string;
  slug: string;
}

interface Ability {
  id: number;
  name: string;
  permissions: Record<string, { create: boolean; read: boolean; update: boolean; delete: boolean }>;
  isSystem: string;
}

interface Props {
  user: any;
  collections: Collection[];
  ability?: Ability;
  mode: 'create' | 'edit';
}

export default function AbilityForm({ user, collections, ability, mode }: Props) {
  const { data, setData, processing } = useForm({
    name: ability?.name || '',
    permissions: ability?.permissions || collections.reduce((acc, col) => {
      acc[col.slug] = { create: false, read: false, update: false, delete: false };
      return acc;
    }, {} as any)
  });

  const handlePermissionChange = (slug: string, action: 'create' | 'read' | 'update' | 'delete', checked: boolean) => {
    const newPermissions = { ...data.permissions };
    if (!newPermissions[slug]) {
      newPermissions[slug] = { create: false, read: false, update: false, delete: false };
    }
    newPermissions[slug][action] = checked;
    setData('permissions', newPermissions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.name) {
      toast.error('Name is required');
      return;
    }

    const url = mode === 'create' ? '/api/abilities' : `/api/abilities/${ability?.id}`;
    const method = mode === 'create' ? 'POST' : 'PUT';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      
      if (res.ok) {
        toast.success(mode === 'create' ? 'Ability created' : 'Ability updated');
        window.location.href = '/api-key-abilities';
      } else {
        toast.error(result.error || 'Failed to save ability');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  return (
    <Layout user={user}>
      <Head title={mode === 'create' ? 'Create Ability' : 'Edit Ability'} />
      
      <div className="w-full space-y-6 flex flex-col pt-4 pb-12">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
             <Button variant="ghost" size="icon" asChild className="rounded-full">
               <Link href="/api-key-abilities">
                 <ArrowLeftIcon className="w-5 h-5 text-muted-foreground" />
               </Link>
             </Button>
             <div>
               <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                 {mode === 'create' ? 'Create Ability' : (ability?.isSystem === '1' ? 'View System Ability' : 'Edit Ability')}
                 {ability?.isSystem === '1' && <LockIcon className="w-6 h-6 text-blue-500" />}
               </h1>
               <p className="text-muted-foreground text-sm">
                 {ability?.isSystem === '1' 
                   ? 'System abilities are protected and cannot be modified.' 
                   : 'Define granular CRUD permissions for your collections.'}
               </p>
             </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-card rounded-xl border p-6 shadow-sm space-y-4">
             <div className="space-y-2 max-w-md">
               <Label htmlFor="name">Ability Name</Label>
               <Input 
                 id="name" 
                 placeholder="e.g. Blogger, Analytics Read-Only" 
                 value={data.name} 
                 onChange={e => setData('name', e.target.value)}
                 disabled={ability?.isSystem === '1'}
               />
               {ability?.isSystem === '1' && (
                 <p className="text-[10px] text-blue-600 flex items-center gap-1 mt-1">
                   <LockIcon className="w-3 h-3" /> System abilities have restricted name editing.
                 </p>
               )}
             </div>
          </div>

          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
             <div className="p-4 bg-muted/30 border-b flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground ml-2 flex items-center gap-2">
                   Collection Permissions
                   <span title="Define access levels for each collection.">
                    <HelpCircleIcon className="w-4 h-4 text-muted-foreground" />
                   </span>
                </h3>
             </div>
             
             <div className="divide-y">
                {collections.length > 0 ? (
                  collections.map((col) => {
                    const colPerms = data.permissions[col.slug] || { create: false, read: false, update: false, delete: false };
                    return (
                      <div key={col.id} className="grid grid-cols-1 md:grid-cols-5 p-6 md:p-4 hover:bg-muted/10 transition-colors">
                        <div className="md:col-span-1 flex flex-col justify-center">
                           <span className="font-semibold text-foreground text-sm">{col.name}</span>
                           <span className="text-[10px] font-mono text-muted-foreground">{col.slug}</span>
                        </div>
                        
                        <div className="md:col-span-4 grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4 md:mt-0">
                           {['read', 'create', 'update', 'delete'].map((action) => (
                             <div key={action} className="flex items-center space-x-2 bg-muted/20 p-2.5 rounded-lg border border-transparent hover:border-border transition-all">
                                <Checkbox 
                                  id={`perm-${col.slug}-${action}`}
                                  checked={colPerms[action as keyof typeof colPerms]}
                                  onCheckedChange={(checked) => handlePermissionChange(col.slug, action as any, !!checked)}
                                  disabled={ability?.isSystem === '1'}
                                />
                                <Label 
                                  htmlFor={`perm-${col.slug}-${action}`}
                                  className="text-xs font-medium uppercase tracking-widest cursor-pointer select-none"
                                >
                                  {action}
                                </Label>
                             </div>
                           ))}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-12 text-center text-muted-foreground text-sm italic">
                    No collections created yet.
                  </div>
                )}
             </div>
          </div>

          {ability?.isSystem !== '1' && (
            <div className="flex justify-end pt-2">
               <Button type="submit" size="lg" disabled={processing} className="min-w-[120px]">
                  <SaveIcon className="w-4 h-4 mr-2" />
                  {processing ? 'Saving...' : 'Save Ability'}
               </Button>
            </div>
          )}
        </form>
      </div>
    </Layout>
  );
}
