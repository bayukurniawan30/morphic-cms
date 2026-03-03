import React from 'react';
import { Head } from '@inertiajs/react';
import Layout from '@/components/Layout';

interface UserProps {
  name?: string;
  email?: string;
}

export default function Dashboard({ user }: { user: UserProps }) {
  return (
    <Layout user={user}>
      <Head title="Dashboard" />
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Placeholder cards */}
          <div className="bg-card p-6 rounded-xl shadow-sm border flex flex-col justify-center items-center h-48">
            <h3 className="text-xl font-semibold mb-2">Collections</h3>
            <p className="text-muted-foreground text-center">Manage your content schemas.</p>
          </div>
          
          <div className="bg-card p-6 rounded-xl shadow-sm border flex flex-col justify-center items-center h-48">
            <h3 className="text-xl font-semibold mb-2">Entries</h3>
            <p className="text-muted-foreground text-center">View and edit your data.</p>
          </div>

          <div className="bg-card p-6 rounded-xl shadow-sm border flex flex-col justify-center items-center h-48">
            <h3 className="text-xl font-semibold mb-2">Media</h3>
            <p className="text-muted-foreground text-center">Manage your uploaded assets.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
