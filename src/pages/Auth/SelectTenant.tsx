import { Head, Link, useForm } from '@inertiajs/react'
import { Building2, ChevronRight, LogOut, Shield } from 'lucide-react'

interface Tenant {
  id: number
  name: string
  slug: string
}

interface SelectTenantProps {
  user: any
  tenants: Tenant[]
}

export default function SelectTenant({ user, tenants }: SelectTenantProps) {
  const { post, processing } = useForm()

  const handleSelect = (tenantId: number) => {
    fetch('/api/tenants/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId }),
    }).then((res) => {
      if (res.ok) {
        window.location.href = '/dashboard'
      }
    })
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-background text-foreground p-6 overflow-hidden relative'>
      {/* Background Decorations */}
      <div className='absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none'>
        <div className='absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]' />
        <div className='absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]' />
      </div>

      <Head title='Select Organization | Morphic CMS' />

      <div className='w-full max-w-2xl z-10'>
        <div className='text-center mb-12 space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700'>
          <div className='inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-card border shadow-xl shadow-primary/5 mb-6 group transition-transform hover:rotate-3'>
            <Building2 className='w-10 h-10 text-primary' />
          </div>
          <h1 className='text-4xl md:text-5xl font-black tracking-tighter'>
            Select your{' '}
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-primary to-deep-mocha-400'>
              Workspace
            </span>
          </h1>
          <p className='text-muted-foreground text-lg max-w-md mx-auto leading-relaxed'>
            Welcome back,{' '}
            <span className='text-foreground font-semibold'>{user?.name}</span>.
            Choose the organization you want to manage today.
          </p>
        </div>

        <div className='grid gap-4 sm:grid-cols-2 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200'>
          {tenants.map((tenant) => (
            <button
              key={tenant.id}
              onClick={() => handleSelect(tenant.id)}
              disabled={processing}
              className='group relative flex flex-col p-6 text-left rounded-2xl bg-card border border-border shadow-sm hover:border-primary hover:shadow-md hover:shadow-primary/5 transition-all duration-300 overflow-hidden'
            >
              <div className='flex items-center justify-between mb-4 relative z-10'>
                <div className='w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-primary/80 group-hover:bg-primary/10 group-hover:text-primary transition-colors'>
                  <Building2 className='w-6 h-6' />
                </div>
                <ChevronRight className='w-5 h-5 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all' />
              </div>

              <h3 className='text-xl font-bold text-card-foreground mb-1 relative z-10'>
                {tenant.name}
              </h3>
              <p className='text-sm text-muted-foreground group-hover:text-foreground/70 font-mono relative z-10'>
                {tenant.slug}.morphic.cms
              </p>
            </button>
          ))}

          {/* Admin bypass */}
          {user.role === 'super_admin' && (
            <Link
              href='/dashboard'
              className='group relative flex flex-col p-6 text-left rounded-2xl bg-primary/[0.03] border border-primary/20 hover:border-primary hover:bg-primary/5 transition-all duration-300 shadow-sm'
            >
              <div className='flex items-center justify-between mb-4'>
                <div className='w-12 h-12 rounded-xl bg-card border border-primary/10 flex items-center justify-center text-primary shadow-sm'>
                  <Shield className='w-6 h-6' />
                </div>
                <ChevronRight className='w-5 h-5 text-primary/40 group-hover:translate-x-1 transition-all' />
              </div>
              <h3 className='text-xl font-bold text-primary mb-1'>
                Global Admin
              </h3>
              <p className='text-sm text-primary/60 italic'>
                Full system access
              </p>
            </Link>
          )}
        </div>

        <div className='mt-12 text-center animate-in fade-in duration-1000 delay-500'>
          <Link
            href='/logout'
            className='inline-flex items-center text-muted-foreground hover:text-foreground transition-colors text-sm font-medium bg-card px-4 py-2 rounded-full border border-border shadow-sm hover:shadow-md'
          >
            <LogOut className='w-4 h-4 mr-2' />
            Switch Account
          </Link>
        </div>
      </div>

      {/* Footer Branding */}
      <div className='absolute bottom-8 left-0 right-0 text-center'>
        <p className='text-muted-foreground/50 text-[10px] uppercase tracking-[0.2em] font-bold'>
          Powered by Morphic Core
        </p>
      </div>
    </div>
  )
}
