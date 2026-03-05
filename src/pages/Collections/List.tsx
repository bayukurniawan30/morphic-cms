import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { 
  PlusIcon, 
  LayersIcon, 
  DatabaseIcon, 
  CalendarIcon, 
  TrashIcon, 
  EditIcon, 
  ArrowUp, 
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  FileTextIcon
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Collection {
  id: number;
  name: string;
  slug: string;
  fields: any[];
  type: 'collection' | 'global';
  createdAt: string;
  updatedAt: string;
}

interface ListProps {
  collections: Collection[];
  user?: any;
  filters?: {
    sort: string;
    dir: string;
    page?: number;
    limit?: number;
  };
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  };
}

export default function CollectionsList({ collections, user, filters, pagination }: ListProps) {
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this collection? All schema definitions will be lost.')) return;

    try {
      const res = await fetch(`/api/collections/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Collection deleted successfully');
        window.location.reload();
      } else {
        toast.error(data.error || 'Failed to delete collection');
      }
    } catch (e) {
      toast.error('Network error');
    }
  };

  const currentSort = filters?.sort || 'createdAt';
  const currentDir = filters?.dir || 'desc';
  const currentPage = pagination?.currentPage || 1;

  const updateFilters = (newFilters: any) => {
    router.get('/collections', { 
      sort: currentSort, 
      dir: currentDir, 
      page: currentPage,
      ...newFilters 
    }, { preserveState: true });
  };

  const toggleSort = (field: string) => {
    const newDir = currentSort === field && currentDir === 'asc' ? 'desc' : 'asc';
    updateFilters({ sort: field, dir: newDir, page: 1 });
  };

  const handlePageChange = (page: number) => {
    updateFilters({ page });
  };

  const renderSortIcon = (field: string) => {
    if (currentSort !== field) return null;
    return currentDir === 'asc' ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />;
  };

  const renderFieldsTooltip = (fields: any[]) => {
    if (!fields || fields.length === 0) return "No fields defined";
    
    const displayFields = fields.slice(0, 3).map(f => f.label || f.name);
    const remaining = fields.length - 3;
    
    let text = displayFields.join(", ");
    if (remaining > 0) {
      text += ` and ${remaining} more field${remaining > 1 ? 's' : ''}`;
    }
    
    return text;
  };

  return (
    <Layout user={user}>
      <Head title="Collections | Morphic" />
      
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Collections</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your content types and schemas ({pagination?.totalCount || 0} total).</p>
          </div>
          <Button asChild>
            <Link href="/collections/add">
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Collection
            </Link>
          </Button>
        </div>

        <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                <tr>
                  <th 
                    className="px-6 py-4 font-medium uppercase tracking-wider cursor-pointer hover:bg-muted/60 transition-colors"
                    onClick={() => toggleSort('name')}
                  >
                    <div className="flex items-center">
                      Collection
                      {renderSortIcon('name')}
                    </div>
                  </th>
                    <th className="px-6 py-4 font-medium uppercase tracking-wider">Slug</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">Fields</th>
                  <th 
                    className="px-6 py-4 font-medium uppercase tracking-wider cursor-pointer hover:bg-muted/60 transition-colors"
                    onClick={() => toggleSort('createdAt')}
                  >
                    <div className="flex items-center">
                      Created Date
                      {renderSortIcon('createdAt')}
                    </div>
                  </th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {collections.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      <LayersIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="text-lg font-medium">No collections found</p>
                      <p className="text-sm opacity-70 mt-1">Create your first collection to start managing content.</p>
                      <Button variant="outline" className="mt-4" asChild>
                        <Link href="/collections/add">Add Collection</Link>
                      </Button>
                    </td>
                  </tr>
                ) : (
                  collections.map((collection) => (
                    <tr key={collection.id} className="hover:bg-muted/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <DatabaseIcon className="w-5 h-5" />
                          </div>
                          <span className="font-semibold text-foreground text-base">
                            {collection.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                          {collection.slug}
                      </td>
                      <td className="px-6 py-4 capitalize text-xs">
                          {collection.type}
                      </td>
                      <td className="px-6 py-4">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground cursor-help">
                                {collection.fields?.length || 0} Fields
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{renderFieldsTooltip(collection.fields)}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <CalendarIcon className="w-3.5 h-3.5" />
                          <span>{new Date(collection.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={collection.type === 'global' ? `/globals/${collection.slug}` : `/entries/${collection.id}`}>
                            {collection.type === 'global' ? 'Edit' : 'Entries'}
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/collections/edit/${collection.id}`}>
                            Edit
                          </Link>
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDelete(collection.id)}
                        >
                          Delete
                        </Button>
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
                Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount} collections
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
