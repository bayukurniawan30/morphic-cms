import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { DatabaseIcon, LayersIcon, ArrowRightIcon } from 'lucide-react';

interface Collection {
  id: number;
  name: string;
  slug: string;
  _count?: {
    entries: number;
  };
}

interface IndexProps {
  collections: Collection[];
  user?: any;
}

export default function EntriesIndex({ collections, user }: IndexProps) {
  return (
    <Layout user={user}>
      <Head title="Content Manager | Morphic" />
      
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Manager</h1>
          <p className="text-muted-foreground mt-1">Select a collection to manage its entries.</p>
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
                      <div className="mt-4 flex items-center text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-full w-fit">
                        Manage Content
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
