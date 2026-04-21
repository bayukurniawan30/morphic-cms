import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Head, Link } from '@inertiajs/react'
import { Languages, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'

interface Locale {
  id: number
  code: string
  name: string
  isDefault: boolean
  createdAt: string
}

interface ListProps {
  user: any
}

export default function List({ user }: ListProps) {
  const [locales, setLocales] = useState<Locale[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchLocales = async () => {
    try {
      const res = await fetch('/api/locales')
      const data = await res.json()
      setLocales(data.locales || [])
    } catch (e) {
      toast.error('Failed to fetch locales')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLocales()
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this language?')) return

    try {
      const res = await fetch(`/api/locales/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) {
        toast.success('Language deleted successfully')
        fetchLocales()
      } else {
        toast.error(data.error || 'Failed to delete language')
      }
    } catch (e) {
      toast.error('Network error')
    }
  }

  return (
    <Layout user={user}>
      <Head title='Localization Management' />
      <div className='space-y-6'>
        <div className='flex flex-col sm:flex-row justify-between items-end gap-4'>
          <div>
            <div className='flex items-center space-x-2 mb-1'>
              <Languages className='w-5 h-5 text-primary' />
              <h1 className='text-3xl font-bold tracking-tight text-foreground'>
                Localization
              </h1>
            </div>
            <p className='text-muted-foreground text-sm'>
              Manage supported languages for your content.
            </p>
          </div>
          <Button asChild>
            <Link href='/localization/add'>
              <Plus className='w-4 h-4 mr-2' />
              Add Language
            </Link>
          </Button>
        </div>

        <div className='bg-card rounded-xl shadow-sm border overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm text-left'>
              <thead className='text-xs text-muted-foreground uppercase bg-muted/50 border-b'>
                <tr>
                  <th className='px-6 py-4 font-medium'>Language Name</th>
                  <th className='px-6 py-4 font-medium'>Code</th>
                  <th className='px-6 py-4 font-medium'>Status</th>
                  <th className='px-6 py-4 font-medium text-right'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y'>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className='px-6 py-8 text-center text-muted-foreground'
                    >
                      Loading languages...
                    </td>
                  </tr>
                ) : locales.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className='px-6 py-8 text-center text-muted-foreground'
                    >
                      No languages found.
                    </td>
                  </tr>
                ) : (
                  locales.map((locale) => (
                    <tr
                      key={locale.id}
                      className='hover:bg-muted/50 transition-colors'
                    >
                      <td className='px-6 py-4 font-medium text-foreground'>
                        {locale.name}
                      </td>
                      <td className='px-6 py-4 font-mono text-xs uppercase'>
                        {locale.code}
                      </td>
                      <td className='px-6 py-4'>
                        {locale.isDefault ? (
                          <span className='inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-500 dark:bg-blue-400/10 dark:text-blue-400'>
                            Default
                          </span>
                        ) : (
                          <span className='inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary'>
                            Additional
                          </span>
                        )}
                      </td>
                      <td className='px-6 py-4 text-right space-x-2 whitespace-nowrap'>
                        {locale.code !== 'en' && (
                          <Button
                            variant='destructive'
                            size='sm'
                            onClick={() => handleDelete(locale.id)}
                            title='Delete'
                          >
                            <Trash2 className='w-3.5 h-3.5' />
                          </Button>
                        )}
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
