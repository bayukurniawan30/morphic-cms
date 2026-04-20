import { Button } from '@/components/ui/button'
import { Head, Link, useForm } from '@inertiajs/react'
import { Building2, ChevronRight, LogOut, Shield } from 'lucide-react'
import React from 'react'

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
    // We use fetch instead of inertia post for more control or just inertia post
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
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white p-6 overflow-hidden relative">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse delay-700" />

      <Head title="Select Organization | Morphic CMS" />

      <div className="w-full max-w-2xl z-10">
        <div className="text-center mb-12 space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-primary to-primary/50 shadow-2xl shadow-primary/20 mb-6 group transition-transform hover:scale-110">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
            Select your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Workspace</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-md mx-auto leading-relaxed">
            Welcome back, <span className="text-white font-semibold">{user?.name}</span>. 
            Please choose the organization you want to manage.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
          {tenants.map((tenant) => (
            <button
              key={tenant.id}
              onClick={() => handleSelect(tenant.id)}
              disabled={processing}
              className="group relative flex flex-col p-6 text-left rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-primary/50 hover:bg-zinc-800/80 transition-all duration-300 backdrop-blur-sm overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                  <Building2 className="w-6 h-6" />
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>

              <h3 className="text-xl font-bold text-zinc-100 group-hover:text-white mb-1 relative z-10">
                {tenant.name}
              </h3>
              <p className="text-sm text-zinc-500 group-hover:text-zinc-400 font-mono relative z-10">
                {tenant.slug}.morphic.cms
              </p>
            </button>
          ))}

          {/* Admin bypass / Create New placeholder if super admin */}
          {user.role === 'super_admin' && (
            <Link
              href="/dashboard"
              className="group relative flex flex-col p-6 text-left rounded-2xl bg-primary/10 border border-primary/20 hover:border-primary/50 hover:bg-primary/20 transition-all duration-300 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                  <Shield className="w-6 h-6" />
                </div>
                <ChevronRight className="w-5 h-5 text-primary/60 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-xl font-bold text-primary mb-1">
                Global Admin
              </h3>
              <p className="text-sm text-primary/60">
                Manage all tenants & system settings
              </p>
            </Link>
          )}
        </div>

        <div className="mt-12 text-center animate-in fade-in duration-1000 delay-500">
          <Link
            href="/logout"
            className="inline-flex items-center text-zinc-500 hover:text-white transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Switch Account
          </Link>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-zinc-600 text-[10px] uppercase tracking-[0.2em] font-bold">
          Powered by Morphic Core
        </p>
      </div>
    </div>
  )
}
