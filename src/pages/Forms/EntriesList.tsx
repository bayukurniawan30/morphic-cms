import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { 
  ArrowLeftIcon,
  FileCheckIcon,
  SearchIcon,
  ExternalLinkIcon,
  PlusIcon,
  DatabaseIcon,
  RefreshCwIcon,
  MoreHorizontalIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface EntriesListProps {
  form: {
    id: number;
    name: string;
    slug: string;
    fields: any[];
    storageType: 'internal' | 'external';
    apiUrl?: string;
  };
  user?: any;
}

export default function FormEntriesList({ form, user }: EntriesListProps) {
  const [entries, setEntries] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchEntries = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/forms/${form.slug}/entries`);
      const data = await res.json();
      if (res.ok) {
        setEntries(data.entries || []);
      } else {
        toast.error(data.error || 'Failed to fetch entries');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setIsLoading(false);
    }
  }, [form.slug]);

  React.useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return (
    <Layout user={user}>
      <Head title={`${form.name} Entries | Morphic`} />
      
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" asChild className="rounded-full">
              <Link href="/forms">
                <ArrowLeftIcon className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center space-x-2 mb-1">
                 <FileCheckIcon className="w-5 h-5 text-primary" />
                 <h1 className="text-3xl font-bold tracking-tight">{form.name} Entries</h1>
              </div>
              <p className="text-muted-foreground text-sm flex items-center gap-2">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${
                  form.storageType === 'internal' 
                    ? 'bg-primary/10 text-primary border-primary/20' 
                    : 'bg-muted text-muted-foreground border-muted-foreground/20'
                }`}>
                  {form.storageType}
                </span>
                {form.storageType === 'external' ? (
                  <span className="font-mono text-xs opacity-70 truncate max-w-[200px]">{form.apiUrl}</span>
                ) : (
                  <span className="text-xs opacity-70">Stored internally in CMS</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchEntries} disabled={isLoading}>
              <RefreshCwIcon className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {form.storageType === 'external' && form.apiUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={form.apiUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLinkIcon className="w-4 h-4 mr-2" />
                  View API Source
                </a>
              </Button>
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <RefreshCwIcon className="w-8 h-8 mx-auto mb-4 animate-spin text-primary opacity-20" />
              <p className="text-muted-foreground italic">Fetching entries...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                 <SearchIcon className="w-8 h-8 text-muted-foreground opacity-40" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">No entries found</h2>
                <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                  {form.storageType === 'internal' 
                    ? "Entries submitted through the public API will appear here." 
                    : "The third-party API returned an empty list or it's not configured correctly."}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                  <tr>
                    <th className="px-6 py-4 font-medium">Date</th>
                    {form.fields.map(field => (
                      <th key={field.id} className="px-6 py-4 font-medium uppercase tracking-wider">
                        {field.label}
                      </th>
                    ))}
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {entries.map((entry, idx) => (
                    <tr key={entry.id || idx} className="hover:bg-muted/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground font-mono text-[11px]">
                        {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : '-'}
                      </td>
                      {form.fields.map(field => (
                        <td key={field.id} className="px-6 py-4">
                          {entry[field.name] !== undefined ? (
                            typeof entry[field.name] === 'boolean' 
                              ? (entry[field.name] ? 'Yes' : 'No')
                              : String(entry[field.name])
                          ) : (
                            <span className="text-muted-foreground italic text-xs">null</span>
                          )}
                        </td>
                      ))}
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontalIcon className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
