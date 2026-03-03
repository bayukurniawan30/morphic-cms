import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import { Link, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { SettingsIcon, SunIcon, MoonIcon } from '@/components/icons';
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
import { Menu, X } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';

interface UserProps {
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
        } ${!isSidebarOpen && 'lg:w-0 lg:hidden'}`}
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
        <nav className="p-4 space-y-2">
          <Link href="/dashboard" className={getLinkClasses('/dashboard')}>
            Dashboard
          </Link>
          <Link href="/collections" className={getLinkClasses('/collections')}>
            Collections
          </Link>
          <Link href="/media" className={getLinkClasses('/media')}>
            Media
          </Link>
          <Link href="/users" className={getLinkClasses('/users')}>
            Users
          </Link>
          <Link href="/settings" className={getLinkClasses('/settings')}>
            Settings
          </Link>
        </nav>
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
            
            <Button variant="ghost" size="icon">
              <SettingsIcon className="h-5 w-5" />
              <span className="sr-only">Settings</span>
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
                <DropdownMenuItem>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
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
