import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Link, usePage } from '@inertiajs/react'
import { EditIcon, FileCheckIcon, PlusIcon, TrashIcon, GlobeIcon } from 'lucide-react'
import { toast } from 'sonner'

interface Form {
  id: number
  name: string
  slug: string
  fields: any[]
  storageType: 'internal' | 'external'
  apiUrl?: string
  isActive?: boolean
  maxEntries?: number | null
  createdAt: string
  updatedAt: string
}

interface ListProps {
  forms: Form[]
  user?: any
}

export default function FormsList({ forms, user }: ListProps) {
  const { activeTenant } = usePage().props as any
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this form definition?'))
      return

    try {
      const res = await fetch(`/api/forms/${id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Form deleted successfully')
        window.location.reload()
      } else {
        toast.error(data.error || 'Failed to delete form')
      }
    } catch (e) {
      toast.error('Network error')
    }
  }

  return (
    <Layout user={user} title='Forms'>
      <div className='flex flex-col space-y-6'>
        <div className='flex flex-col sm:flex-row justify-between space-y-4 sm:space-y-0'>
          <div>
            <div className='flex items-center space-x-2 mb-1'>
              <FileCheckIcon className='w-5 h-5 text-primary' />
              <h1 className='text-3xl font-bold tracking-tight'>
                Form Builder
              </h1>
            </div>
            <p className='text-muted-foreground text-sm'>
              Define forms and manage third-party API entries (
              {forms?.length || 0} total).
            </p>
          </div>
          <div className='flex flex-wrap gap-2 items-center'>
            <Button asChild>
              <Link href='/forms/add'>
                <PlusIcon className='w-4 h-4 mr-2' />
                Create Form
              </Link>
            </Button>
          </div>
        </div>

        <div className='bg-card rounded-xl shadow-sm border overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm text-left'>
              <thead className='text-xs text-muted-foreground uppercase bg-muted/50 border-b'>
                <tr>
                  <th className='px-6 py-4 font-medium uppercase tracking-wider'>
                    Form Name
                  </th>
                  <th className='px-6 py-4 font-medium uppercase tracking-wider'>
                    Slug
                  </th>
                  <th className='px-6 py-4 font-medium uppercase tracking-wider'>
                    Storage
                  </th>
                  <th className='px-6 py-4 font-medium uppercase tracking-wider'>
                    Target API URL
                  </th>
                  <th className='px-6 py-4 font-medium uppercase tracking-wider'>
                    Created
                  </th>
                  <th className='px-6 py-4 font-medium uppercase tracking-wider text-right'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y'>
                {forms?.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className='px-6 py-12 text-center text-muted-foreground'
                    >
                      <FileCheckIcon className='w-12 h-12 mx-auto mb-4 opacity-20' />
                      <p className='text-lg font-medium'>No forms found</p>
                      <p className='text-sm opacity-70 mt-1'>
                        Ready to bridge your third-party API? Create your first
                        form.
                      </p>
                      <Button variant='outline' className='mt-4' asChild>
                        <Link href='/forms/add'>Create Form</Link>
                      </Button>
                    </td>
                  </tr>
                ) : (
                  forms?.map((form) => (
                    <tr
                      key={form.id}
                      className='hover:bg-muted/50 transition-colors group'
                    >
                      <td className='px-6 py-4'>
                        <div className='flex items-center gap-2'>
                          <span className='font-semibold text-foreground text-base'>
                            {form.name}
                          </span>
                          {form.isActive === false ? (
                            <span className='inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-destructive/10 text-destructive border border-destructive/20'>
                              Closed
                            </span>
                          ) : form.maxEntries ? (
                            <span className='inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-muted-foreground/20' title={`Max limit: ${form.maxEntries} entries`}>
                              Limit: {form.maxEntries}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className='px-6 py-4 font-mono text-xs'>
                        {form.slug}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            form.storageType === 'internal'
                              ? 'bg-primary/10 text-primary border-primary/20'
                              : 'bg-muted text-muted-foreground border-muted-foreground/20'
                          }`}
                        >
                          {form.storageType || 'external'}
                        </span>
                      </td>
                      <td className='px-6 py-4 max-w-xs truncate text-muted-foreground font-mono text-[10px]'>
                        {form.apiUrl || '-'}
                      </td>
                      <td className='px-6 py-4 text-muted-foreground whitespace-nowrap'>
                        {new Date(form.createdAt).toLocaleDateString()}
                      </td>
                      <td className='px-6 py-4 text-right whitespace-nowrap'>
                        <div className='flex items-center justify-end gap-2'>
                          {form.storageType === 'internal' && (
                            <Button
                              variant='outline'
                              size='sm'
                              asChild
                              title='View Public Form'
                            >
                              <a
                                href={`/public-form/${activeTenant?.slug || 'default'}/${form.slug}`}
                                target='_blank'
                                rel='noopener noreferrer'
                              >
                                <GlobeIcon className='w-4 h-4' />
                              </a>
                            </Button>
                          )}
                          <Button variant='outline' size='sm' asChild>
                            <Link href={`/forms/${form.slug}/entries`}>
                              Entries
                            </Link>
                          </Button>
                          <Button
                            variant='outline'
                            size='sm'
                            asChild
                            title='Edit Form'
                          >
                            <Link href={`/forms/edit/${form.id}`}>
                              Edit
                            </Link>
                          </Button>
                          <Button
                            variant='destructive'
                            size='sm'
                            onClick={() => handleDelete(form.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}
