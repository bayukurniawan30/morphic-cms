import { GithubIcon, Logo, MoonIcon, SunIcon } from '@/components/icons'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Toaster } from '@/components/ui/sonner'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { getAppVersion } from '@/lib/version'
import { Link, usePage } from '@inertiajs/react'
import {
  Book,
  Building2,
  Check,
  ChevronDown,
  Database,
  FileCheckIcon,
  FileImageIcon,
  FileText,
  Globe,
  Languages,
  LayoutDashboard,
  LayoutGrid,
  Mail,
  Menu,
  Plus,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import React, { useState } from 'react'

interface UserProps {
  id?: number
  name?: string
  email?: string
  role?: 'super_admin' | 'editor'
}

interface TenantProps {
  id: number
  name: string
  slug: string
}

interface LayoutProps {
  user: UserProps
  children: React.ReactNode
}

interface NavItemProps {
  href: string
  icon: any
  label: string
  isSidebarOpen: boolean
  currentUrl: string
}

const NavItem = ({
  href,
  icon: Icon,
  label,
  isSidebarOpen,
  currentUrl,
}: NavItemProps) => {
  const isActive = currentUrl.includes(href)
  const content = (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-4 py-2 rounded-md font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/20',
        isActive
          ? 'bg-secondary text-secondary-foreground shadow-sm'
          : 'hover:bg-muted text-muted-foreground hover:text-foreground hover:shadow-sm',
        !isSidebarOpen && 'lg:justify-center lg:px-2'
      )}
    >
      <Icon className='h-5 w-5 lg:h-4 lg:w-4 shrink-0' />
      <span
        className={cn(
          'truncate transition-all duration-300',
          !isSidebarOpen && 'lg:hidden lg:w-0'
        )}
      >
        {label}
      </span>
    </Link>
  )

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent
        side='right'
        className={cn('hidden', !isSidebarOpen && 'lg:block')}
      >
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

export default function Layout({ user, children }: LayoutProps) {
  const [isSidebarOpen, setSidebarOpen] = useState(false) // Closed by default

  const { theme, setTheme, resolvedTheme } = useTheme()
  const { url, props } = usePage()
  const { activeTenant, availableTenants } = props as any as {
    activeTenant: TenantProps | null
    availableTenants: TenantProps[]
  }
  const [globals, setGlobals] = React.useState<any[]>([])

  React.useEffect(() => {
    fetch('/api/collections')
      .then((res) => res.json())
      .then((data) => {
        const globalCollections = (data.collections || []).filter(
          (c: any) => c.type === 'global'
        )
        setGlobals(globalCollections)
      })
      .catch((err) => console.error('Failed to fetch globals', err))
  }, [])

  const handleLogout = () => {
    window.location.href = '/logout'
  }

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen)
  const toggleTheme = () =>
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')

  const handleTenantSwitch = (tenantId: number | null) => {
    fetch('/api/tenants/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId }),
    }).then((res) => {
      if (res.ok) {
        window.location.reload()
      }
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <TooltipProvider>
      <div className='min-h-screen flex bg-background text-foreground'>
        <Toaster />
        {/* ... existing aside and main ... */}
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 bg-card border-r transition-all duration-300 ease-in-out flex flex-col lg:relative lg:translate-x-0',
            isSidebarOpen
              ? 'w-64 translate-x-0'
              : 'w-64 -translate-x-full lg:w-20 lg:translate-x-0'
          )}
        >
          <div
            className={cn(
              'flex items-center justify-between h-16 border-b shrink-0 transition-all',
              isSidebarOpen ? 'px-6' : 'px-0 lg:justify-center'
            )}
          >
            <div className='flex items-center gap-3 overflow-hidden'>
              <Logo className='h-10 w-10 shrink-0 text-[#514849] dark:text-white' />
              <div
                className={cn(
                  'flex flex-col transition-all duration-300',
                  !isSidebarOpen && 'lg:hidden lg:w-0 lg:opacity-0'
                )}
              >
                <span className='text-xl font-bold tracking-tight leading-none uppercase text-[#514849] dark:text-white'>
                  Morphic
                </span>
                <span className='text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-1'>
                  Headless CMS
                </span>
              </div>
            </div>
            {isSidebarOpen && (
              <Button
                variant='ghost'
                size='icon'
                className='lg:hidden'
                onClick={toggleSidebar}
              >
                <X className='h-5 w-5' />
              </Button>
            )}
          </div>
          <nav className='p-4 space-y-2 flex-1 overflow-y-auto custom-scrollbar'>
            <NavItem
              href='/dashboard'
              icon={LayoutDashboard}
              label='Dashboard'
              isSidebarOpen={isSidebarOpen}
              currentUrl={url}
            />

            <div className='pt-4 pb-2'>
              <h3
                className={cn(
                  'px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 transition-all',
                  !isSidebarOpen && 'lg:hidden'
                )}
              >
                Content
              </h3>
              <div className='space-y-1'>
                <NavItem
                  href='/collections'
                  icon={LayoutGrid}
                  label='Collections'
                  isSidebarOpen={isSidebarOpen}
                  currentUrl={url}
                />
                <NavItem
                  href='/entries'
                  icon={Database}
                  label='Entries'
                  isSidebarOpen={isSidebarOpen}
                  currentUrl={url}
                />
                <NavItem
                  href='/forms'
                  icon={FileCheckIcon}
                  label='Form Builder'
                  isSidebarOpen={isSidebarOpen}
                  currentUrl={url}
                />
              </div>
            </div>

            <div className='pt-2 pb-2'>
              <h3
                className={cn(
                  'px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 transition-all',
                  !isSidebarOpen && 'lg:hidden'
                )}
              >
                Assets
              </h3>
              <div className='space-y-1'>
                <NavItem
                  href='/media'
                  icon={FileImageIcon}
                  label='Media'
                  isSidebarOpen={isSidebarOpen}
                  currentUrl={url}
                />
                <NavItem
                  href='/documents'
                  icon={FileText}
                  label='Documents'
                  isSidebarOpen={isSidebarOpen}
                  currentUrl={url}
                />
              </div>
            </div>

            {globals.length > 0 && (
              <div className='pt-2 pb-2'>
                <h3
                  className={cn(
                    'px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 transition-all',
                    !isSidebarOpen && 'lg:hidden'
                  )}
                >
                  Globals
                </h3>
                <div className='space-y-1'>
                  {globals.map((global) => (
                    <NavItem
                      key={global.id}
                      href={`/globals/${global.slug}`}
                      icon={Globe}
                      label={global.name}
                      isSidebarOpen={isSidebarOpen}
                      currentUrl={url}
                    />
                  ))}
                </div>
              </div>
            )}

            {user.role === 'super_admin' && (
              <div className='pt-2 pb-2'>
                <h3
                  className={cn(
                    'px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 transition-all',
                    !isSidebarOpen && 'lg:hidden'
                  )}
                >
                  Settings
                </h3>
                <div className='space-y-1'>
                  <NavItem
                    href='/email-settings'
                    icon={Mail}
                    label='Email'
                    isSidebarOpen={isSidebarOpen}
                    currentUrl={url}
                  />
                  <NavItem
                    href='/api-key-abilities'
                    icon={ShieldCheck}
                    label='API Key Abilities'
                    isSidebarOpen={isSidebarOpen}
                    currentUrl={url}
                  />
                  <NavItem
                    href='/localization'
                    icon={Languages}
                    label='Localization'
                    isSidebarOpen={isSidebarOpen}
                    currentUrl={url}
                  />
                </div>
              </div>
            )}

            {user.role === 'super_admin' && (
              <NavItem
                href='/users'
                icon={Users}
                label='Users'
                isSidebarOpen={isSidebarOpen}
                currentUrl={url}
              />
            )}
          </nav>

          <div
            className={cn(
              'p-2 border-t space-y-2 bg-muted/20 transition-all',
              !isSidebarOpen && 'lg:p-1'
            )}
          >
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <a
                  href='https://github.com/bayukurniawan30/morphic-cms'
                  target='_blank'
                  rel='noopener noreferrer'
                  className={cn(
                    'flex items-center gap-3 px-4 py-2 rounded-md font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm',
                    !isSidebarOpen && 'lg:justify-center lg:px-0'
                  )}
                >
                  <GithubIcon className='h-5 w-5 shrink-0' />
                  <span
                    className={cn(
                      'truncate transition-all duration-300',
                      !isSidebarOpen && 'lg:hidden lg:w-0'
                    )}
                  >
                    Support Us
                  </span>
                </a>
              </TooltipTrigger>
              <TooltipContent
                side='right'
                className={cn('hidden', !isSidebarOpen && 'lg:block')}
              >
                Support Us on GitHub
              </TooltipContent>
            </Tooltip>
            <div
              className={cn(
                'px-4 py-1 text-[10px] text-muted-foreground font-mono flex items-center justify-between transition-all',
                !isSidebarOpen && 'lg:hidden'
              )}
            >
              <span>
                Version <span className='uppercase'>{getAppVersion()}</span>
              </span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className='flex-1 flex flex-col min-h-screen transition-all w-full overflow-hidden'>
          {/* Header */}
          <header className='h-16 flex items-center justify-between px-4 lg:px-8 border-b bg-card'>
            <div className='flex items-center'>
              <Button
                variant='ghost'
                size='icon'
                onClick={toggleSidebar}
                className='mr-4'
              >
                <Menu className='h-5 w-5' />
              </Button>
              <h2 className='text-lg font-semibold hidden sm:block'>
                {activeTenant ? activeTenant.name : 'System Global'}
              </h2>
            </div>

            <div className='flex items-center space-x-2'>
              {/* Tenant Switcher */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='outline'
                    size='sm'
                    className='h-9 hidden md:flex items-center gap-2 border-dashed bg-muted/50 hover:bg-muted transition-colors'
                  >
                    <Building2 className='h-4 w-4 text-muted-foreground' />
                    <span className='max-w-[120px] truncate font-medium'>
                      {activeTenant ? activeTenant.name : 'System Global'}
                    </span>
                    <ChevronDown className='h-3 w-3 text-muted-foreground' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-64 p-1'>
                  <DropdownMenuLabel className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2 py-1.5'>
                    Switch Workspace
                  </DropdownMenuLabel>
                  <div className='max-h-[300px] overflow-y-auto custom-scrollbar'>
                    {user.role === 'super_admin' && (
                      <DropdownMenuItem
                        onClick={() => handleTenantSwitch(null)}
                        className='flex items-center justify-between'
                      >
                        <div className='flex items-center gap-2'>
                          <ShieldCheck className='h-4 w-4 text-primary' />
                          <span>System Global</span>
                        </div>
                        {!activeTenant && (
                          <Check className='h-3 w-3 text-primary' />
                        )}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {availableTenants?.map((tenant) => (
                      <DropdownMenuItem
                        key={tenant.id}
                        onClick={() => handleTenantSwitch(tenant.id)}
                        className='flex items-center justify-between'
                      >
                        <div className='flex items-center gap-2'>
                          <Building2 className='h-4 w-4 text-muted-foreground' />
                          <span className='truncate'>{tenant.name}</span>
                        </div>
                        {activeTenant?.id === tenant.id && (
                          <Check className='h-3 w-3 text-primary' />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </div>
                  {user.role === 'super_admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link
                          href='/tenants/add'
                          className='flex items-center gap-2 text-primary font-medium'
                        >
                          <Plus className='h-4 w-4' />
                          <span>Create New Tenant</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant='ghost' size='icon' onClick={toggleTheme}>
                {resolvedTheme === 'dark' ? (
                  <SunIcon className='h-5 w-5' />
                ) : (
                  <MoonIcon className='h-5 w-5' />
                )}
                <span className='sr-only'>Toggle theme</span>
              </Button>

              <Button
                variant='ghost'
                size='sm'
                asChild
                className='hidden sm:flex'
              >
                <Link href='/docs' className='flex items-center gap-2'>
                  <Book className='h-4 w-4' />
                  <span>Docs</span>
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    className='relative h-8 w-8 rounded-full ml-2'
                  >
                    <Avatar className='h-8 w-8'>
                      <AvatarFallback>
                        {getInitials(user?.name || 'User')}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className='w-56' align='end' forceMount>
                  <DropdownMenuLabel className='font-normal'>
                    <div className='flex flex-col space-y-1'>
                      <p className='text-sm font-medium leading-none'>
                        {user?.name || 'User'}
                      </p>
                      <p className='text-xs leading-none text-muted-foreground'>
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
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className='text-destructive font-medium cursor-pointer focus:bg-destructive focus:text-destructive-foreground'
                  >
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Page Content */}
          <main className='flex-1 p-4 lg:p-8 overflow-auto bg-muted/20'>
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
