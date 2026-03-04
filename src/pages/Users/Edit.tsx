import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Layout from '@/components/Layout';
import { CopyIcon } from '@/components/icons';

import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';

export default function Edit({ userToEdit, user }: { userToEdit: any, user: any }) {
  const { data, setData, setError, errors } = useForm({
    name: userToEdit?.name || '',
    email: userToEdit?.email || '',
    username: userToEdit?.username || '',
    password: '', // blank by default, only sent if changed
    role: userToEdit?.role || 'editor',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isKeyActioning, setIsKeyActioning] = useState(false);
  const [currentKey, setCurrentKey] = useState(userToEdit?.apiKey);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('email', '');

    try {
      const payload: any = { ...data };
      if (!payload.password) delete payload.password; // Don't send empty password

      const res = await fetch(`/api/users/${userToEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      
      if (!res.ok) {
        setError('email', result.error || 'Failed to update user');
        setIsSubmitting(false);
        return;
      }

      window.location.href = '/users';
    } catch (err) {
      setError('email', 'Network error');
      setIsSubmitting(false);
    }
  };

  const generateApiKey = async () => {
    if (!confirm('Generating a new API Key will invalidate any previous keys for this user. Continue?')) return;
    setIsKeyActioning(true);
    try {
      const res = await fetch(`/api/users/${userToEdit.id}/api-key`, { method: 'POST' });
      const body = await res.json();
      if (res.ok) {
        setCurrentKey(body.apiKey);
        toast.success('API Key generated successfully');
        // We do a hard reload or just update state, setting state is enough for UX
        router.reload({ only: ['userToEdit'] });
      } else {
        toast.error(body.error || 'Failed to generate key');
      }
    } catch (e) {
      toast.error('Network error');
    } finally {
      setIsKeyActioning(false);
    }
  };

  const revokeApiKey = async () => {
    if (!confirm('Are you sure you want to revoke this API Key? Any apps using it will lose access immediately.')) return;
    setIsKeyActioning(true);
    try {
      const res = await fetch(`/api/users/${userToEdit.id}/api-key`, { method: 'DELETE' });
      if (res.ok) {
        setCurrentKey(null);
        toast.success('API Key revoked');
        router.reload({ only: ['userToEdit'] });
      } else {
        const body = await res.json();
        toast.error(body.error || 'Failed to revoke key');
      }
    } catch (e) {
      toast.error('Network error');
    } finally {
      setIsKeyActioning(false);
    }
  };

  return (
    <Layout user={user}>
      <Head title="Edit User" />
      <div className="w-full space-y-6 max-w-5xl mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Edit User</h1>
            <p className="text-muted-foreground mt-1">Update platform member details.</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/users">Cancel</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Main Edit Form */}
          <form onSubmit={handleSubmit} className="bg-card p-6 rounded-xl shadow-sm border space-y-4 md:col-span-2">
            <h3 className="text-lg font-semibold mb-2 text-foreground">Profile Information</h3>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                value={data.name} 
                onChange={e => setData('name', e.target.value)} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username <span className="text-destructive ml-1">*</span></Label>
              <Input 
                id="username" 
                value={data.username} 
                onChange={e => setData('username', e.target.value)} 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email <span className="text-destructive ml-1">*</span></Label>
              <Input 
                id="email" 
                type="email" 
                value={data.email} 
                onChange={e => setData('email', e.target.value)} 
                required 
              />
              {errors.email && <p className="text-sm font-medium text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Reset Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={data.password} 
                onChange={e => setData('password', e.target.value)} 
                placeholder="Leave blank to keep current password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select 
                value={data.role} 
                onValueChange={(value) => setData('role', value)}
              >
                <SelectTrigger id="role" className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>

          {/* Developer Settings Sidebar */}
          <div className="bg-card p-6 rounded-xl shadow-sm border space-y-4 md:col-span-1">
            <h3 className="text-lg font-semibold text-foreground">Developer Settings</h3>
            <p className="text-sm text-muted-foreground">
              This API key is required for third-party applications to access and modify the collections via our REST API.
            </p>
            
            <div className="pt-2">
              {currentKey ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Active Key</Label>
                    <div className="relative">
                      <Input value={currentKey} readOnly className="font-mono text-xs pr-12 bg-muted/30" />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-1 top-1 h-7 w-7 text-xs"
                        onClick={() => {
                          navigator.clipboard.writeText(currentKey);
                          toast.success('Copied to clipboard!');
                        }}
                      >
                        <CopyIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button 
                    type="button" 
                    variant="destructive" 
                    className="w-full" 
                    onClick={revokeApiKey}
                    disabled={isKeyActioning}
                  >
                    {isKeyActioning ? 'Revoking...' : 'Revoke API Key'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-muted/40 rounded-lg border border-dashed border-border/60 text-center">
                    <span className="text-sm text-muted-foreground">No API key assigned to this user.</span>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    onClick={generateApiKey}
                    disabled={isKeyActioning}
                  >
                    {isKeyActioning ? 'Generating...' : 'Generate New API Key'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
