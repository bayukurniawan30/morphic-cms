import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Head, Link, router } from '@inertiajs/react'
import {
  CheckCircle2Icon,
  EditIcon,
  LockIcon,
  PlusIcon,
  SearchIcon,
  ShieldCheckIcon,
  TrashIcon,
} from 'lucide-react'
import { toast } from 'sonner'

interface Ability {
  id: number
  name: string
  permissions: Record<
    string,
    { create: boolean; read: boolean; update: boolean; delete: boolean }
  >
  isSystem: string
  createdAt: string
}

export default function ApiKeyAbilities({
  user,
  abilities = [],
}: {
  user?: any
  abilities: Ability[]
}) {
  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete the ability "${name}"?`))
      return

    try {
      const res = await fetch(`/api/abilities/${id}`, { method: 'DELETE' })
      const data = await res.json()

      if (res.ok) {
        toast.success(`Ability "${name}" deleted`)
        router.reload()
      } else {
        toast.error(data.error || 'Failed to delete ability')
      }
    } catch (err) {
      toast.error('Network error')
    }
  }

  return (
    <Layout user={user}>
      <Head title='API Key Abilities | Morphic' />

      <div className='space-y-6 flex flex-col'>
        <div className='flex flex-col sm:flex-row justify-between space-y-4 sm:space-y-0'>
          <div>
            <div className='flex items-center space-x-2 mb-1'>
              <ShieldCheckIcon className='w-5 h-5 text-primary' />
              <h1 className='text-3xl font-bold tracking-tight'>
                API Key Abilities
              </h1>
            </div>
            <p className='text-muted-foreground text-sm'>
              Manage granular permissions for API access keys.
            </p>
          </div>
          <Button asChild>
            <Link href='/api-key-abilities/add'>
              <PlusIcon className='w-4 h-4 mr-2' />
              Create Ability
            </Link>
          </Button>
        </div>

        <div className='bg-card rounded-xl border shadow-sm overflow-x-auto'>
          <table className='w-full text-sm text-left'>
            <thead className='bg-muted/50 text-muted-foreground font-medium border-b'>
              <tr>
                <th className='px-6 py-4'>Name</th>
                <th className='px-6 py-4'>Status</th>
                <th className='px-6 py-4'>Active Permissions</th>
                <th className='px-6 py-4'>Created</th>
                <th className='px-6 py-4 text-right'>Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y'>
              {abilities.length > 0 ? (
                abilities.map((ability) => (
                  <tr
                    key={ability.id}
                    className='hover:bg-muted/30 transition-colors group'
                  >
                    <td className='px-6 py-4 font-medium text-foreground'>
                      <div className='flex items-center space-x-2'>
                        <span>{ability.name}</span>
                        {ability.isSystem === '1' && (
                          <span title='System Protected'>
                            <LockIcon className='w-3 h-3 text-muted-foreground' />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      {ability.isSystem === '1' ? (
                        <span className='inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-600 border border-blue-500/20'>
                          System
                        </span>
                      ) : (
                        <span className='inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-green-500/10 text-green-600 border border-green-500/20'>
                          Custom
                        </span>
                      )}
                    </td>
                    <td className='px-6 py-4'>
                      <div className='flex flex-wrap gap-1'>
                        {ability.isSystem === '1' &&
                        ability.name === 'Read Access' ? (
                          <span className='text-[10px] text-muted-foreground italic'>
                            Global Read Access
                          </span>
                        ) : (
                          Object.entries(ability.permissions).map(
                            ([slug, perms]) => {
                              const active = Object.entries(perms)
                                .filter(([_, v]) => v)
                                .map(([k]) => k[0].toUpperCase())
                              if (active.length === 0) return null
                              return (
                                <span
                                  key={slug}
                                  className='px-1.5 py-0.5 bg-muted rounded text-[10px] border'
                                >
                                  {slug}: {active.join('')}
                                </span>
                              )
                            }
                          )
                        )}
                        {ability.isSystem !== '1' &&
                          Object.keys(ability.permissions).length === 0 && (
                            <span className='text-[10px] text-muted-foreground italic'>
                              No permissions set
                            </span>
                          )}
                      </div>
                    </td>
                    <td className='px-6 py-4 text-muted-foreground text-xs font-mono'>
                      {new Date(ability.createdAt).toLocaleDateString()}
                    </td>
                    <td className='px-6 py-4 text-right'>
                      <div className='flex justify-end space-x-1'>
                        <Button
                          variant='ghost'
                          size='icon'
                          asChild
                          className='h-8 w-8'
                        >
                          <Link href={`/api-key-abilities/edit/${ability.id}`}>
                            <EditIcon className='h-4 w-4' />
                          </Link>
                        </Button>
                        {ability.isSystem !== '1' && (
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10'
                            onClick={() =>
                              handleDelete(ability.id, ability.name)
                            }
                          >
                            <TrashIcon className='h-4 w-4' />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className='px-6 py-12 text-center text-muted-foreground'
                  >
                    <div className='flex flex-col items-center space-y-2'>
                      <SearchIcon className='w-8 h-8 opacity-20' />
                      <p>No abilities found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className='p-4 bg-muted/40 rounded-lg border border-dashed flex items-start space-x-3'>
          <CheckCircle2Icon className='w-5 h-5 text-muted-foreground mt-0.5' />
          <div className='text-xs text-muted-foreground space-y-1'>
            <p className='font-semibold text-foreground'>
              Understanding Abilities
            </p>
            <p>
              Abilities define granular CRUD (Create, Read, Update, Delete)
              permissions for Collections. Once created, an ability can be
              assigned to any user from the User Management page.
            </p>
            <p className='italic'>
              Note: Super Admins always have full access regardless of their
              assigned ability.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
