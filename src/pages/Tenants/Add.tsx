import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Head, router } from '@inertiajs/react'
import { Building2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import React, { useState } from 'react'

interface AddTenantProps {
  user: any
}

export default function AddTenant({ user }: AddTenantProps) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(false)

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setName(val)
    // Auto-generate slug
    setSlug(
      val
        .toLowerCase()
        .replace(/ /g, '-')
        .replace(/[^\w-]/g, '')
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !slug) return

    setLoading(true)
    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug }),
      })
      const data = await res.json()

      if (res.ok) {
        toast.success('Workspace created successfully!')
        // Redirect to dashboard of the new tenant
        router.visit('/dashboard')
      } else {
        toast.error(data.error || 'Failed to create workspace')
      }
    } catch (e) {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout user={user}>
      <Head title='Create Workspace' />
      <div className='max-w-2xl space-y-6'>
        <div>
          <div className='flex items-center gap-3'>
            <Building2 className='w-5 h-5 text-primary' />
            <h1 className='text-3xl font-bold tracking-tight'>
              Create New Workspace
            </h1>
          </div>
          <p className='text-muted-foreground mt-2'>
            Workspaces allow you to isolate content, users, and settings for
            different projects or organizations.
          </p>
        </div>

        <div className='bg-card border rounded-xl p-6 shadow-sm'>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Workspace Name</Label>
              <Input
                id='name'
                placeholder='e.g. My Awesome Project'
                value={name}
                onChange={handleNameChange}
                required
                className='h-11'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='slug'>Workspace URL Slug</Label>
              <div className='relative'>
                <Input
                  id='slug'
                  placeholder='my-awesome-project'
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                  className='h-11 pr-24'
                />
                <div className='absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground uppercase tracking-widest pointer-events-none'>
                  Unique ID
                </div>
              </div>
              <p className='text-[11px] text-muted-foreground'>
                This is a unique identifier used in URLs and API calls. Only
                lowercase letters, numbers, and hyphens are allowed.
              </p>
            </div>

            <div className='pt-4'>
              <Button
                type='submit'
                className='w-full h-11 text-base font-medium gap-2'
                disabled={loading || !name || !slug}
              >
                {loading && <Loader2 className='w-5 h-5 animate-spin' />}
                Create Workspace
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}
