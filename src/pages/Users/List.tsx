import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { ThemeProvider } from '@/components/theme-provider';
import Layout from '@/components/Layout';
import { ArrowUp, ArrowDown, ChevronLeft, ChevronRight, UsersIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface User {
  id: number;
  name: string | null;
  email: string;
  username: string;
  role: string;
  abilityName?: string | null;
  lastLogin: string | null;
  createdAt: string;
}

interface ListProps {
  users: User[];
  user?: any;
  filters?: {
    sort: string;
    dir: string;
    role?: string;
    page?: number;
    limit?: number;
  };
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  };
  flash?: {
    success?: string;
    error?: string;
  };
}

export default function List({ users, user, filters, pagination, flash }: ListProps) {
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
  const currentRole = filters?.role || 'all';
  const currentPage = pagination?.currentPage || 1;

  const updateFilters = (newFilters: any) => {
    router.get('/users', { 
      sort: currentSort, 
      dir: currentDir, 
      role: currentRole,
      page: currentPage,
      ...newFilters 
    }, { preserveState: true });
  };

  const toggleSort = (field: string) => {
    const newDir = currentSort === field && currentDir === 'asc' ? 'desc' : 'asc';
    updateFilters({ sort: field, dir: newDir, page: 1 });
  };

  const handleRoleChange = (role: string) => {
    updateFilters({ role, page: 1 });
  };

  const handlePageChange = (page: number) => {
    updateFilters({ page });
  };

  const renderSortIcon = (field: string) => {
    if (currentSort !== field) return null;
    return currentDir === 'asc' ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />;
  };

  return (
    <Layout user={user}>
      <Head title="Users Management" />
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
               <UsersIcon className="w-5 h-5 text-primary" />
               <h1 className="text-3xl font-bold tracking-tight text-foreground">Users</h1>
            </div>
            <p className="text-muted-foreground text-sm">Manage platform administrators and editors ({pagination?.totalCount || 0} total).</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
             <div className="w-40">
              <Select value={currentRole} onValueChange={handleRoleChange}>
                <SelectTrigger className="h-10 bg-card border-muted-foreground/20">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                  <th className="px-6 py-4 font-medium">CMS Role</th>
                  <th className="px-6 py-4 font-medium">API Key Ability</th>
                  <th className="px-6 py-4 font-medium cursor-pointer hover:bg-muted/60 transition-colors" onClick={() => toggleSort('createdAt')}>
                    <div className="flex items-center">
                      Created At
                      {renderSortIcon('createdAt')}
                    </div>
                  </th>
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
                      <td className="px-6 py-4">
                        <span className="text-xs text-muted-foreground">
                          {u.abilityName || 'Role Default'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
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
          
          {pagination && pagination.totalPages > 1 && (
            <div className="px-6 py-4 bg-muted/30 border-t flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount} users
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="text-xs font-medium">
                  Page {currentPage} of {pagination.totalPages}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage >= pagination.totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
