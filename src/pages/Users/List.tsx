import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { ThemeProvider } from '@/components/theme-provider';
import Layout from '@/components/Layout';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: number;
  name: string | null;
  email: string;
  username: string;
  role: string;
  lastLogin: string | null;
  createdAt: string;
}

interface ListProps {
  users: User[];
  user?: any;
  filters?: {
    sort: string;
    dir: string;
  };
  flash?: {
    success?: string;
    error?: string;
  };
}

export default function List({ users, user, filters, flash }: ListProps) {
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('User deleted successfully');
        window.location.reload();
      } else {
        toast.error(data.error || 'Failed to delete user');
      }
    } catch (e) {
      toast.error('Network error');
    }
  };

  const currentSort = filters?.sort || 'createdAt';
  const currentDir = filters?.dir || 'desc';

  const toggleSort = (field: string) => {
    if (currentSort === field) {
      // Toggle direction if clicking same field
      const newDir = currentDir === 'asc' ? 'desc' : 'asc';
      router.get('/users', { sort: field, dir: newDir }, { preserveState: true });
    } else {
      // Default to ascending for new field
      router.get('/users', { sort: field, dir: 'asc' }, { preserveState: true });
    }
  };

  const renderSortIcon = (field: string) => {
    if (currentSort !== field) return null;
    return currentDir === 'asc' ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />;
  };

  return (
    <Layout user={user}>
      <Head title="Users Management" />
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Users</h1>
            <p className="text-muted-foreground mt-1">Manage platform administrators and editors.</p>
          </div>
          <div className="flex gap-4">
            <Button asChild>
              <Link href="/users/add">Add User</Link>
            </Button>
          </div>
        </div>

        {flash?.success && (
          <div className="p-4 bg-green-500/10 text-green-600 rounded-md border border-green-500/20">
            {flash.success}
          </div>
        )}

        <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-4 font-medium cursor-pointer hover:bg-muted/60 transition-colors" onClick={() => toggleSort('name')}>
                    <div className="flex items-center">
                      Name
                      {renderSortIcon('name')}
                    </div>
                  </th>
                  <th className="px-6 py-4 font-medium">Email / Username</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium">Last Login</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users?.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">
                        {u.name || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-foreground">{u.email}</span>
                          <span className="text-xs text-muted-foreground">@{u.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                          ${u.role === 'super_admin' ? 'bg-primary/10 text-primary' : 'bg-secondary text-secondary-foreground'}
                        `}>
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/users/edit/${u.id}`}>Edit</Link>
                        </Button>
                        {user?.id !== u.id && (
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(u.id)}>
                            Delete
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
