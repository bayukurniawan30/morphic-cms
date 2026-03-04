import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { 
  PlusIcon, 
  ArrowLeftIcon, 
  EditIcon, 
  TrashIcon, 
  DatabaseIcon,
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
  MoreVerticalIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Field {
  name: string;
  label: string;
  type: string;
}

interface Collection {
  id: number;
  name: string;
  fields: Field[];
}

interface Entry {
  id: number;
  content: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface ListProps {
  collection: Collection;
  entries: Entry[];
  user?: any;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  };
}

export default function EntriesList({ collection, entries, user, pagination }: ListProps) {
  const handleDelete = async (entryId: number) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      const res = await fetch(`/api/entries/${entryId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Entry deleted successfully');
        window.location.reload();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete entry');
      }
    } catch (e) {
      toast.error('Network error');
    }
  };

  const handlePageChange = (page: number) => {
    router.get(`/entries/${collection.id}`, { page }, { preserveState: true });
  };

  // Get visible columns (first 3 fields)
  const visibleFields = collection.fields.slice(0, 3);

  const renderCellValue = (field: Field, value: any) => {
    if (value === null || value === undefined) return <span className="text-muted-foreground italic">empty</span>;

    switch (field.type) {
      case 'media':
        if (Array.isArray(value)) {
          return `${value.length} files`;
        }
        return <span className="truncate max-w-[150px] inline-block">File selected</span>;
      case 'rich-text':
        return <span className="truncate max-w-[200px] inline-block opacity-70 italic text-xs">Rich content...</span>;
      case 'date':
      case 'datetime':
        return format(new Date(value), field.type === 'date' ? 'PPP' : 'PPP p');
      case 'checkbox':
        return Array.isArray(value) ? value.join(', ') : String(value);
      default:
        return String(value);
    }
  };

  return (
    <Layout user={user}>
      <Head title={`${collection.name} Entries | Morphic`} />
      
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" asChild className="rounded-full">
              <Link href="/entries">
                <ArrowLeftIcon className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center space-x-2">
                 <h1 className="text-3xl font-bold tracking-tight">{collection.name}</h1>
                 <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Entries</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Manage data for this collection ({pagination?.totalCount || 0} total).</p>
            </div>
          </div>
          <Button asChild>
            <Link href={`/entries/${collection.id}/add`}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Entry
            </Link>
          </Button>
        </div>

        <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">ID</th>
                  {visibleFields.map(field => (
                    <th key={field.name} className="px-6 py-4 font-medium uppercase tracking-wider">
                      {field.label}
                    </th>
                  ))}
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">Created</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={visibleFields.length + 3} className="px-6 py-12 text-center text-muted-foreground">
                      <div className="max-w-xs mx-auto">
                        <DatabaseIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-medium">No entries yet</p>
                        <p className="text-sm opacity-70 mt-1">Start adding content to this collection.</p>
                        <Button variant="outline" className="mt-6" asChild>
                          <Link href={`/entries/${collection.id}/add`}>Add Your First Entry</Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4 font-mono text-xs opacity-50">
                        #{entry.id}
                      </td>
                      {visibleFields.map(field => (
                        <td key={field.name} className="px-6 py-4 font-medium whitespace-nowrap">
                          {renderCellValue(field, entry.content[field.name])}
                        </td>
                      ))}
                      <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                        <span className="text-xs flex items-center">
                          <CalendarIcon className="w-3 h-3 mr-1.5 opacity-40" />
                          {format(new Date(entry.createdAt), 'MMM d, yyyy')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/entries/${collection.id}/edit/${entry.id}`}>Edit</Link>
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(entry.id)}>
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
            <div className="px-6 py-4 bg-muted/20 border-t flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount} entries
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={pagination.currentPage <= 1}
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  className="h-8"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Prev
                </Button>
                <div className="text-xs font-semibold px-2">
                   {pagination.currentPage} / {pagination.totalPages}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={pagination.currentPage >= pagination.totalPages}
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  className="h-8"
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
