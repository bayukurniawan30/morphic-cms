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
import { Head, Link, usePage } from '@inertiajs/react'
import {
  Book,
  Building2,
  Check,
  ChevronDown,
  Database,
  FileCheckIcon,
  FileImageIcon,
  FileText,
  Flame,
  Globe,
  Languages,
  LayoutDashboard,
  LayoutGrid,
  Mail,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  Terminal,
  Users,
  Webhook,
  X,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import React, { useState } from 'react'

interface UserProps {
  id?: number
  name?: string
  email?: string
  role?: 'super_admin' | 'editor'
  planTier?: string
}

interface TenantProps {
  id: number
  name: string
  slug: string
  planTier?: string
  allowedMonthlyRequests?: number
}

interface LayoutProps {
  user: UserProps
  title?: string
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
  const isActive = currentUrl.startsWith(href)
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

export default function Layout({ user, title, children }: LayoutProps) {
  const [isSidebarOpen, setSidebarOpen] = useState(false)

  React.useEffect(() => {
    // Open sidebar by default on large screens
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setSidebarOpen(true)
    }
  }, [])

  const { theme, setTheme, resolvedTheme } = useTheme()
  const { url, props } = usePage()
  const {
    activeTenant,
    activeTenantRole,
    availableTenants,
    appDomain,
    features,
    canCreateWorkspace = false,
    isSelfHosted = false,
  } = props as any as {
    activeTenant: TenantProps | null
    activeTenantRole: string | null
    availableTenants: TenantProps[]
    appDomain?: string
    features?: {
      maxCollections: number
      maxUsers: number
      maxWorkspaces: number
      hasLocalization: boolean
      hasWebhooks: boolean
      hasFormBuilder: boolean
    }
    canCreateWorkspace?: boolean
    isSelfHosted?: boolean
  }
  const [globals, setGlobals] = React.useState<any[]>([])
  const [showAllGlobals, setShowAllGlobals] = React.useState(false)
  const [tenantSearchQuery, setTenantSearchQuery] = React.useState('')

  const filteredTenants = React.useMemo(() => {
    if (!availableTenants) return []
    return availableTenants.filter(
      (tenant) =>
        tenant.name.toLowerCase().includes(tenantSearchQuery.toLowerCase()) ||
        tenant.slug.toLowerCase().includes(tenantSearchQuery.toLowerCase())
    )
  }, [availableTenants, tenantSearchQuery])

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

  const isAdmin = user.role === 'super_admin' || activeTenantRole === 'owner'

  const handleTenantSwitch = (tenantId: number | null) => {
    const tenant = availableTenants?.find((t) => t.id === tenantId)
    fetch('/api/tenants/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId }),
    }).then((res) => {
      if (res.ok) {
        const host = window.location.host
        const cleanHost = host.split(':')[0]
        const baseDomain = appDomain || 'morphic-cms.com'
        let isCustomDomain = false

        if (
          cleanHost.includes(baseDomain) ||
          cleanHost.endsWith(`.${baseDomain}`)
        ) {
          isCustomDomain = true
        }

        if (isCustomDomain && tenant) {
          const protocol = window.location.protocol
          window.location.href = `${protocol}//${tenant.slug}.${baseDomain}/dashboard`
        } else if (isCustomDomain && !tenant) {
          const protocol = window.location.protocol
          window.location.href = `${protocol}//${baseDomain}/dashboard`
        } else {
          window.location.href = '/dashboard'
        }
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
      <Head title={title ? `${title} | Morphic CMS` : 'Morphic CMS'}>
        <link rel='icon' type='image/png' href='/favicon.png' />
      </Head>
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
                {(user.role === 'super_admin' ||
                  !features ||
                  features.hasFormBuilder) && (
                  <NavItem
                    href='/forms'
                    icon={FileCheckIcon}
                    label='Form Builder'
                    isSidebarOpen={isSidebarOpen}
                    currentUrl={url}
                  />
                )}
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
                  {(showAllGlobals ? globals : globals.slice(0, 3)).map(
                    (global) => (
                      <NavItem
                        key={global.id}
                        href={`/globals/${global.slug}`}
                        icon={Globe}
                        label={global.name}
                        isSidebarOpen={isSidebarOpen}
                        currentUrl={url}
                      />
                    )
                  )}
                  {globals.length > 3 && (
                    <button
                      type='button'
                      onClick={() => setShowAllGlobals(!showAllGlobals)}
                      className={cn(
                        'w-full flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mt-1.5',
                        isSidebarOpen
                          ? 'px-4 py-2 justify-start'
                          : 'justify-center py-2'
                      )}
                    >
                      {isSidebarOpen ? (
                        <span>
                          {showAllGlobals
                            ? 'Show less'
                            : `Show ${globals.length - 3} more`}
                        </span>
                      ) : (
                        <span>{showAllGlobals ? '«' : '»'}</span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

            {isAdmin && (
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
                  {user.role === 'super_admin' && (
                    <NavItem
                      href='/email-settings'
                      icon={Mail}
                      label='Email'
                      isSidebarOpen={isSidebarOpen}
                      currentUrl={url}
                    />
                  )}
                  <NavItem
                    href='/api-key-abilities'
                    icon={ShieldCheck}
                    label='API Key Abilities'
                    isSidebarOpen={isSidebarOpen}
                    currentUrl={url}
                  />
                  {(!features || features.hasLocalization) && (
                    <NavItem
                      href='/localization'
                      icon={Languages}
                      label='Localization'
                      isSidebarOpen={isSidebarOpen}
                      currentUrl={url}
                    />
                  )}
                  {(user.role === 'super_admin' ||
                    !features ||
                    features.hasWebhooks) && (
                    <NavItem
                      href='/webhooks'
                      icon={Webhook}
                      label='Webhooks'
                      isSidebarOpen={isSidebarOpen}
                      currentUrl={url}
                    />
                  )}
                  <NavItem
                    href='/api-playground'
                    icon={Terminal}
                    label='API Playground'
                    isSidebarOpen={isSidebarOpen}
                    currentUrl={url}
                  />
                </div>
              </div>
            )}

            {isAdmin && (
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
                {isSelfHosted ? (
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
                ) : (
                  <a
                    href={`mailto:support@morphic-cms.com?subject=Morphic%20CMS%20Support&body=${encodeURIComponent(
                      `User: ${user?.email || ''}\nActive Workspace: ${
                        activeTenant ? activeTenant.name : 'System Global'
                      }\n\n`
                    )}`}
                    title='support@morphic-cms.com'
                    className={cn(
                      'flex items-center gap-3 px-4 py-2 rounded-md font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm',
                      !isSidebarOpen && 'lg:justify-center lg:px-0'
                    )}
                  >
                    <Mail className='h-5 w-5 shrink-0' />
                    <span
                      className={cn(
                        'truncate transition-all duration-300',
                        !isSidebarOpen && 'lg:hidden lg:w-0'
                      )}
                    >
                      Contact Support
                    </span>
                  </a>
                )}
              </TooltipTrigger>
              <TooltipContent
                side='right'
                className={cn('hidden', !isSidebarOpen && 'lg:block')}
              >
                {isSelfHosted ? 'Support Us on GitHub' : 'Contact Support'}
              </TooltipContent>
            </Tooltip>
            {isSelfHosted && (
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
            )}
          </div>
        </aside>

        {/* Main Content */}
        <div className='flex-1 flex flex-col min-h-screen transition-all w-full overflow-hidden'>
          {/* Header */}
          <header className='h-16 flex items-center justify-between px-3 sm:px-6 lg:px-8 border-b bg-card'>
            <div className='flex items-center'>
              <Button
                variant='ghost'
                size='icon'
                onClick={toggleSidebar}
                className='mr-2 sm:mr-4'
              >
                <Menu className='h-5 w-5' />
              </Button>
              {url.includes('/dashboard') && (
                <h2 className='text-lg font-semibold hidden sm:block text-foreground'>
                  Dashboard
                </h2>
              )}
            </div>

            <div className='flex items-center space-x-1.5 sm:space-x-2'>
              {/* Tenant Switcher */}
              <DropdownMenu
                onOpenChange={(open) => {
                  if (!open) {
                    setTenantSearchQuery('')
                  }
                }}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='outline'
                    size='sm'
                    className='h-9 px-2 sm:px-3 md:flex items-center gap-1.5 sm:gap-2 border-dashed bg-muted/50 hover:bg-muted transition-colors'
                  >
                    <Building2 className='h-4 w-4 text-muted-foreground shrink-0' />
                    <div className='flex items-center gap-1 sm:gap-1.5 min-w-0'>
                      <span className='max-w-[75px] sm:max-w-[120px] truncate font-medium'>
                        {activeTenant ? activeTenant.name : 'System Global'}
                      </span>
                      {activeTenant &&
                        (activeTenant.planTier === 'PRO' ? (
                          <span className='inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-sm border border-purple-400/20 shrink-0'>
                            PRO
                          </span>
                        ) : (
                          <Link
                            href='/pricing'
                            className='inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary transition-colors border border-border shrink-0'
                            onClick={(e) => e.stopPropagation()}
                          >
                            FREE
                          </Link>
                        ))}
                    </div>
                    <ChevronDown className='h-3 w-3 text-muted-foreground shrink-0' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-64 p-1'>
                  <DropdownMenuLabel className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2 py-1.5'>
                    Switch Workspace
                  </DropdownMenuLabel>

                  {/* Search input to filter workspaces */}
                  <div className='px-2 py-1 relative flex items-center mb-1'>
                    <Search className='absolute left-3.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none' />
                    <input
                      type='text'
                      placeholder='Search workspaces...'
                      value={tenantSearchQuery}
                      onChange={(e) => setTenantSearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      className='w-full pl-7 pr-2 py-1 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground/60'
                    />
                  </div>
                  <DropdownMenuSeparator />

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
                    {filteredTenants.length === 0 ? (
                      <div className='text-xs text-muted-foreground text-center py-4 px-2 italic'>
                        No workspaces found
                      </div>
                    ) : (
                      filteredTenants.map((tenant) => (
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
                      ))
                    )}
                  </div>
                  {user && canCreateWorkspace && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link
                          href='/tenants/add'
                          className='flex items-center gap-2 text-primary font-medium'
                        >
                          <Plus className='h-4 w-4' />
                          <span>Create New Workspace</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {activeTenant && activeTenant.planTier !== 'PRO' && (
                <Button
                  variant='outline'
                  size='sm'
                  asChild
                  className='h-9 px-2.5 sm:px-3 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/20 dark:hover:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/50 hover:border-purple-300 transition-all font-semibold shrink-0'
                >
                  <Link href='/pricing' className='flex items-center gap-1.5'>
                    <Flame className='h-3.5 w-3.5' />
                    <span className='hidden sm:inline'>Upgrade Plan</span>
                  </Link>
                </Button>
              )}

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
                  <DropdownMenuItem asChild>
                    <Link href='/pricing'>Pricing & Plans</Link>
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
