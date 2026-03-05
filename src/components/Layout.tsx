import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import { Link, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { SettingsIcon, SunIcon, MoonIcon, GithubIcon } from '@/components/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar';
import { Menu, X, Mail, Key, FileImageIcon, FileText, LayoutGrid, Database, Users, Globe } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { getAppVersion } from '@/lib/version';

interface UserProps {
  id?: number;
  name?: string;
  email?: string;
}

interface LayoutProps {
  user: UserProps;
  children: React.ReactNode;
}

export default function Layout({ user, children }: LayoutProps) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const { theme, setTheme } = useTheme();
  const { url } = usePage();
  const [globals, setGlobals] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetch('/api/collections')
      .then(res => res.json())
      .then(data => {
        const globalCollections = (data.collections || []).filter((c: any) => c.type === 'global');
        setGlobals(globalCollections);
      })
      .catch(err => console.error('Failed to fetch globals', err));
  }, []);

  const handleLogout = () => {
    document.cookie = 'morphic_token=; Max-Age=0; path=/;';
    window.location.href = '/';
  };

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getLinkClasses = (path: string) => {
    const isActive = url.includes(path);
    return `block px-4 py-2 rounded-md font-medium transition-colors ${
      isActive 
        ? 'bg-secondary text-secondary-foreground' 
        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
    }`;
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <Toaster />
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${!isSidebarOpen && 'lg:w-0 lg:hidden'} flex flex-col`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-tight leading-none uppercase">Morphic</span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-1">Headless CMS</span>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={toggleSidebar}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="p-4 space-y-2 flex-1">
          <Link href="/dashboard" className={getLinkClasses('/dashboard')}>
            Dashboard
          </Link>

          <div className="pt-4 pb-2">
            <h3 className="px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Content</h3>
            <div className="space-y-1">
              <Link href="/collections" className={getLinkClasses('/collections')}>
                <div className="flex items-center gap-3">
                  <LayoutGrid className="h-4 w-4" />
                  <span>Collections</span>
                </div>
              </Link>
              <Link href="/entries" className={getLinkClasses('/entries')}>
                <div className="flex items-center gap-3">
                  <Database className="h-4 w-4" />
                  <span>Entries</span>
                </div>
              </Link>
            </div>
          </div>

          <div className="pt-2 pb-2">
            <h3 className="px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Assets</h3>
            <div className="space-y-1">
              <Link href="/media" className={getLinkClasses('/media')}>
                <div className="flex items-center gap-3">
                  <FileImageIcon className="h-4 w-4" />
                  <span>Media</span>
                </div>
              </Link>
              <Link href="/documents" className={getLinkClasses('/documents')}>
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4" />
                  <span>Documents</span>
                </div>
              </Link>
            </div>
          </div>

          {globals.length > 0 && (
            <div className="pt-2 pb-2">
              <h3 className="px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Globals</h3>
              <div className="space-y-1">
                {globals.map((global) => (
                  <Link 
                    key={global.id} 
                    href={`/globals/${global.slug}`} 
                    className={getLinkClasses(`/globals/${global.slug}`)}
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4" />
                      <span className="truncate">{global.name}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          
          <div className="pt-2 pb-2">
            <h3 className="px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Settings</h3>
            <div className="space-y-1">
              <Link href="/email-settings" className={getLinkClasses('/email-settings')}>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </div>
              </Link>
              <Link href="/api-key-abilities" className={getLinkClasses('/api-key-abilities')}>
                <div className="flex items-center gap-3">
                  <Key className="h-4 w-4" />
                  <span>API Key Abilities</span>
                </div>
              </Link>
              {/* <Link href="/settings" className={getLinkClasses('/settings')}>
                <div className="flex items-center gap-3">
                  <SettingsIcon className="h-4 w-4" />
                  <span>General</span>
                </div>
              </Link> */}
            </div>
          </div>

          <Link href="/users" className={getLinkClasses('/users')}>
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4" />
              <span>Users</span>
            </div>
          </Link>
        </nav>

        <div className="p-2 border-t space-y-2 bg-muted/20">
          <a 
            href="https://github.com/bayukurniawan30/morphic-cms" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-2 rounded-md font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm"
          >
            <GithubIcon className="h-5 w-5" />
            <span>Support Us on GitHub</span>
          </a>
          <div className="px-4 py-1 text-[10px] text-muted-foreground font-mono flex items-center justify-between">
            <span>Version <span className='uppercase'>{getAppVersion()}</span></span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen transition-all w-full overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-8 border-b bg-card">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-4">
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold hidden sm:block">Dashboard</h2>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
              <span className="sr-only">Toggle theme</span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full ml-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{getInitials(user?.name || 'User')}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email || 'user@example.com'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={user?.id ? `/users/edit/${user.id}` : '#'}>
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-destructive font-medium cursor-pointer focus:bg-destructive focus:text-destructive-foreground">
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto bg-muted/20">
          {children}
        </main>
      </div>
    </div>
  );
}
