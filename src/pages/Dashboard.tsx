import React from 'react';
import { Head, Link } from '@inertiajs/react';
import Layout from '@/components/Layout';
import { 
  LayoutGrid, 
  Database, 
  Image, 
  Users, 
  FileText, 
  ArrowUpRight,
  Plus,
  Clock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface Stats {
  totalCollections: number;
  totalGlobals: number;
  totalEntries: number;
  totalMedia: number;
  totalDocuments: number;
  totalUsers: number;
}

interface Activity {
  id: number;
  collectionId: number;
  content: any;
  createdAt: string;
  updatedAt: string;
  collectionName: string;
  collectionSlug: string;
}

interface CollectionStat {
  id: number;
  name: string;
  slug: string;
  count: number;
}

interface DashboardProps {
  user: any;
  stats: Stats;
  recentActivity: Activity[];
  collectionBreakdown: CollectionStat[];
}

export default function Dashboard({ user, stats, recentActivity, collectionBreakdown }: DashboardProps) {
  const overviewItems = [
    { label: 'Collections', value: stats.totalCollections, icon: LayoutGrid, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Globals', value: stats.totalGlobals, icon: Database, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Media Assets', value: stats.totalMedia, icon: Image, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Documents', value: stats.totalDocuments, icon: FileText, color: 'text-green-500', bg: 'bg-green-50' },
  ];

  return (
    <Layout user={user}>
      <Head title="Dashboard | Morphic CMS" />
      
      <div className="space-y-8 pb-12">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name || 'Administrator'}</h1>
          <p className="text-muted-foreground mt-1 text-lg">Here's what's happening with your content today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {overviewItems.map((item) => (
            <div key={item.label} className="bg-card p-6 rounded-2xl border shadow-sm transition-all hover:shadow-md group">
              <div className="flex items-center justify-between mb-4">
                <div className={`${item.bg} p-2.5 rounded-xl transition-colors group-hover:scale-110 duration-200`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity">Real-time</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-tight">{item.label}</h3>
                <p className="text-3xl font-bold tracking-tight leading-none">{item.value.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recent Activity */}
            <section className="bg-card rounded-2xl border shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b flex items-center justify-between bg-muted/20">
                <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-primary" />
                  <h3 className="text-lg font-semibold">Recent Activity</h3>
                </div>
                <Button variant="ghost" size="sm" className="text-xs" asChild>
                  <Link href="/entries">View All <ChevronRight className="w-3 h-3 ml-1" /></Link>
                </Button>
              </div>
              <div className="divide-y">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <div key={`${activity.id}-${activity.updatedAt}`} className="p-5 hover:bg-muted/30 transition-colors group flex items-start space-x-4">
                      <div className="bg-muted px-2 py-1 rounded-md mt-1 shrink-0">
                        <span className="text-[10px] font-mono font-bold text-muted-foreground">ID #{activity.id}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                           <p className="font-semibold truncate">
                             Updated <span className="text-primary">{activity.collectionName}</span> entry
                           </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(activity.updatedAt), 'PPP p')}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                        <Link href={`/entries/${activity.collectionId}/edit/${activity.id}`}>
                           <ArrowUpRight className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <p className="text-muted-foreground italic">No recent activity found.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Collection Status */}
            <section className="bg-card rounded-2xl border shadow-sm overflow-hidden">
              <div className="p-6 border-b bg-muted/20">
                <h3 className="text-lg font-semibold flex items-center">
                   <LayoutGrid className="w-4 h-4 mr-2" />
                   Collection Breakdown
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                    <tr>
                      <th className="px-6 py-3 font-medium">Name</th>
                      <th className="px-6 py-3 font-medium">Slug</th>
                      <th className="px-6 py-3 font-medium text-right">Entries</th>
                      <th className="px-6 py-3 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {collectionBreakdown.map((col) => (
                      <tr key={col.id} className="hover:bg-muted/30 transition-colors group">
                        <td className="px-6 py-4 font-semibold">{col.name}</td>
                        <td className="px-6 py-4 font-mono text-xs opacity-60">/{col.slug}</td>
                        <td className="px-6 py-4 text-right">
                           <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold text-xs">
                             {col.count}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                             <Link href={`/entries/${col.id}`}>View Entries</Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <section className="bg-card rounded-2xl border shadow-sm p-6 space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                 <Plus className="w-4 h-4 mr-2" />
                 Quick Actions
              </h3>
              <div className="grid grid-cols-1 gap-2">
                <Button variant="outline" className="justify-start h-12 rounded-xl border-dashed hover:border-solid hover:bg-primary/5 hover:text-primary transition-all" asChild>
                  <Link href="/collections/add">
                    <Plus className="w-4 h-4 mr-3" />
                    New Collection
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start h-12 rounded-xl border-dashed hover:border-solid hover:bg-primary/5 hover:text-primary transition-all" asChild>
                  <Link href="/media">
                    <Image className="w-4 h-4 mr-3" />
                    Manage Media
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start h-12 rounded-xl border-dashed hover:border-solid hover:bg-primary/5 hover:text-primary transition-all" asChild>
                  <Link href="/api-key-abilities">
                    <Users className="w-4 h-4 mr-3" />
                    API Permissions
                  </Link>
                </Button>
              </div>
            </section>

            {/* API Status/Key */}
            <section className="bg-zinc-900 text-zinc-100 rounded-2xl p-6 shadow-xl ring-1 ring-zinc-800">
               <div className="flex items-center justify-between mb-4">
                 <div className="bg-zinc-800 p-2 rounded-lg">
                    <ArrowUpRight className="w-4 h-4 text-zinc-400" />
                 </div>
                 <div className="flex items-center space-x-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">API Active</span>
                 </div>
               </div>
               <h3 className="text-lg font-bold mb-1">Morphic API</h3>
               <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                 Access your content programmatically via our REST endpoints.
               </p>
               <Button variant="secondary" className="w-full bg-zinc-100 hover:bg-white text-black font-bold h-11 rounded-xl" asChild>
                  <Link href="/api-docs">
                    Open API Docs
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Link>
               </Button>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}
