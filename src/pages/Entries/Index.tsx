import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { DatabaseIcon, LayersIcon, ArrowRightIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Collection {
  id: number;
  name: string;
  slug: string;
  type: 'collection' | 'global';
  _count?: {
    entries: number;
  };
}

interface IndexProps {
  collections: Collection[];
  user?: any;
  filters?: {
    type?: string;
  };
}

export default function EntriesIndex({ collections, user, filters }: IndexProps) {
  const currentType = filters?.type || 'all';

  const handleTypeChange = (type: string) => {
    router.get('/entries', { type }, { preserveState: true });
  };

  return (
    <Layout user={user}>
      <Head title="Content Manager | Morphic" />
      
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center space-x-2 mb-1">
               <DatabaseIcon className="w-5 h-5 text-primary" />
               <h1 className="text-3xl font-bold tracking-tight">Content Manager</h1>
            </div>
            <p className="text-muted-foreground text-sm">Select a collection to manage its entries.</p>
          </div>
          <div className="w-48">
            <Select value={currentType} onValueChange={handleTypeChange}>
              <SelectTrigger className="h-10 bg-card border-muted-foreground/20">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="collection">Collections</SelectItem>
                <SelectItem value="global">Global Singletons</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.length === 0 ? (
            <div className="md:col-span-2 lg:col-span-3 text-center p-12 bg-card rounded-xl border-2 border-dashed">
              <LayersIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No collections found</p>
              <p className="text-sm text-muted-foreground mt-1">Create a collection first to start adding content.</p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/collections/add">Add Collection</Link>
              </Button>
            </div>
          ) : (
            collections.map((collection) => (
              <Link 
                key={collection.id} 
                href={`/entries/${collection.id}`}
                className="group block"
              >
                <div className="bg-card p-6 rounded-xl border shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-200 h-full relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRightIcon className="w-5 h-5 text-primary" />
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
                      <DatabaseIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                        {collection.name}
                      </h3>
                      <p className="text-sm text-muted-foreground font-mono mt-1">
                        /{collection.slug}
                      </p>
                      <div className="mt-4 flex items-center text-xs font-bold uppercase tracking-widest text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full w-fit">
                        {collection.type === 'global' ? 'Global Singleton' : 'Collection'}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
