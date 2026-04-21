import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Head, Link, router } from '@inertiajs/react'
import {
  ArrowDown,
  ArrowUp,
  Building2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Trash2,
  UsersIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'

interface User {
  id: number
  name: string | null
  email: string
  username: string
  globalRole: string
  workspaceRole: string | null
  ownedCount: number
  memberCount: number
  firstOwnedName: string | null
  firstMemberName: string | null
  abilityName?: string | null
  lastLogin: string | null
  createdAt: string
  canManage: boolean
}

interface Tenant {
  id: number
  name: string
  slug: string
}

interface UserTenant {
  id: number
  name: string
  slug: string
  role: string
  joinedAt: string
}

interface ListProps {
  users: User[]
  user?: any
  activeTenantRole?: string | null
  allTenants: Tenant[]
  filters?: {
    sort: string
    dir: string
    role?: string
    page?: number
    limit?: number
  }
  pagination?: {
    currentPage: number
    totalPages: number
    totalCount: number
    limit: number
  }
  flash?: {
    success?: string
    error?: string
  }
}

export default function List({
  users,
  user,
  activeTenantRole,
  allTenants = [],
  filters,
  pagination,
  flash,
}: ListProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userTenants, setUserTenants] = useState<UserTenant[]>([])
  const [loadingTenants, setLoadingTenants] = useState(false)
  const [addingTenant, setAddingTenant] = useState(false)
  const [newTenantId, setNewTenantId] = useState<string>('')
  const [newTenantRole, setNewTenantRole] = useState<string>('member')

  const fetchUserTenants = async (userId: number) => {
    setLoadingTenants(true)
    try {
      const res = await fetch(`/api/users/${userId}/tenants`)
      if (res.ok) {
        const data = await res.json()
        setUserTenants(data)
      }
    } catch (e) {
      toast.error('Failed to load workspaces')
    } finally {
      setLoadingTenants(false)
    }
  }

  const handleAddTenant = async () => {
    if (!selectedUser || !newTenantId) return
    setAddingTenant(true)
    try {
      const res = await fetch(`/api/tenants/${newTenantId}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id, role: newTenantRole }),
      })
      if (res.ok) {
        toast.success('Workspace assigned successfully')
        fetchUserTenants(selectedUser.id)
        setNewTenantId('')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to assign workspace')
      }
    } catch (e) {
      toast.error('Network error')
    } finally {
      setAddingTenant(false)
    }
  }

  const handleRemoveTenant = async (tenantId: number) => {
    if (!selectedUser || !confirm('Remove user from this workspace?')) return
    try {
      const res = await fetch(
        `/api/tenants/${tenantId}/users/${selectedUser.id}`,
        {
          method: 'DELETE',
        }
      )
      if (res.ok) {
        toast.success('User removed from workspace')
        fetchUserTenants(selectedUser.id)
      }
    } catch (e) {
      toast.error('Failed to remove user')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('User deleted successfully')
        window.location.reload()
      } else {
        toast.error(data.error || 'Failed to delete user')
      }
    } catch (e) {
      toast.error('Network error')
    }
  }

  const currentSort = filters?.sort || 'createdAt'
  const currentDir = filters?.dir || 'desc'
  const currentRole = filters?.role || 'all'
  const currentPage = pagination?.currentPage || 1

  const updateFilters = (newFilters: any) => {
    router.get(
      '/users',
      {
        sort: currentSort,
        dir: currentDir,
        role: currentRole,
        page: currentPage,
        ...newFilters,
      },
      { preserveState: true }
    )
  }

  const toggleSort = (field: string) => {
    const newDir =
      currentSort === field && currentDir === 'asc' ? 'desc' : 'asc'
    updateFilters({ sort: field, dir: newDir, page: 1 })
  }

  const handleRoleChange = (role: string) => {
    updateFilters({ role, page: 1 })
  }

  const handlePageChange = (page: number) => {
    updateFilters({ page })
  }

  const renderSortIcon = (field: string) => {
    if (currentSort !== field) return null
    return currentDir === 'asc' ? (
      <ArrowUp className='ml-1 h-4 w-4' />
    ) : (
      <ArrowDown className='ml-1 h-4 w-4' />
    )
  }

  const canManageAny =
    user?.role === 'super_admin' ||
    activeTenantRole === 'owner' ||
    users.some((u) => u.canManage)

  return (
    <Layout user={user}>
      <Head title='Users Management' />
      <div className='max-w-6xl mx-auto space-y-6'>
        <div className='flex flex-col sm:flex-row justify-between items-end gap-4'>
          <div>
            <div className='flex items-center space-x-2 mb-1'>
              <UsersIcon className='w-5 h-5 text-primary' />
              <h1 className='text-3xl font-bold tracking-tight text-foreground'>
                Users
              </h1>
            </div>
            <p className='text-muted-foreground text-sm'>
              Manage platform administrators and editors (
              {pagination?.totalCount || 0} total).
            </p>
          </div>
          <div className='flex flex-wrap gap-2 items-center'>
            <Button asChild>
              <Link href='/users/add'>Add User</Link>
            </Button>
          </div>
        </div>

        {flash?.success && (
          <div className='p-4 bg-green-500/10 text-green-600 rounded-md border border-green-500/20'>
            {flash.success}
          </div>
        )}

        <div className='bg-card rounded-xl shadow-sm border overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm text-left'>
              <thead className='text-xs text-muted-foreground uppercase bg-muted/50 border-b'>
                <tr>
                  <th
                    className='px-6 py-4 font-medium cursor-pointer hover:bg-muted/60 transition-colors'
                    onClick={() => toggleSort('name')}
                  >
                    <div className='flex items-center'>
                      Name
                      {renderSortIcon('name')}
                    </div>
                  </th>
                  <th className='px-6 py-4 font-medium'>Email / Username</th>
                  <th className='px-6 py-4 font-medium'>Workspace Role</th>
                  <th
                    className='px-6 py-4 font-medium cursor-pointer hover:bg-muted/60 transition-colors'
                    onClick={() => toggleSort('createdAt')}
                  >
                    <div className='flex items-center'>
                      Joined
                      {renderSortIcon('createdAt')}
                    </div>
                  </th>
                  {user?.role === 'super_admin' && (
                    <th className='px-6 py-4 font-medium'>Workspaces</th>
                  )}
                  {canManageAny && (
                    <th className='px-6 py-4 font-medium text-right'>
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className='divide-y'>
                {users?.length === 0 ? (
                  <tr>
                    <td
                      colSpan={canManageAny ? 6 : 4}
                      className='px-6 py-8 text-center text-muted-foreground'
                    >
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users?.map((u) => (
                    <tr
                      key={u.id}
                      className='hover:bg-muted/50 transition-colors'
                    >
                      <td className='px-6 py-4 font-medium text-foreground'>
                        {u.name || u.username}
                      </td>
                      <td className='px-6 py-4'>
                        <div className='flex flex-col'>
                          <span className='text-foreground'>{u.email}</span>
                          <span className='text-xs text-muted-foreground'>
                            @{u.username}
                          </span>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border
                          ${
                            u.globalRole === 'super_admin'
                              ? 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400'
                              : u.workspaceRole === 'owner' || u.ownedCount > 0
                                ? 'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400'
                                : 'bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400'
                          }
                        `}
                        >
                          {u.globalRole === 'super_admin' ? (
                            'Super Admin'
                          ) : u.workspaceRole ? (
                            u.workspaceRole.charAt(0).toUpperCase() +
                            u.workspaceRole.slice(1)
                          ) : (
                            <div className='flex flex-col items-start'>
                              {u.ownedCount > 0 && (
                                <span className='text-purple-600 dark:text-purple-400'>
                                  Owner of {u.firstOwnedName}
                                  {u.ownedCount > 1 &&
                                    ` +${u.ownedCount - 1} more`}
                                </span>
                              )}
                              {u.memberCount > 0 && (
                                <span className='text-orange-600 dark:text-orange-400'>
                                  Member of {u.firstMemberName}
                                  {u.memberCount > 1 &&
                                    ` +${u.memberCount - 1} more`}
                                </span>
                              )}
                              {u.ownedCount === 0 && u.memberCount === 0 && (
                                <span className='text-muted-foreground'>
                                  No Workspace
                                </span>
                              )}
                            </div>
                          )}
                        </span>
                      </td>
                      <td className='px-6 py-4 text-muted-foreground whitespace-nowrap text-sm'>
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString()
                          : '-'}
                      </td>
                      {user?.role === 'super_admin' && (
                        <td className='px-6 py-4'>
                          {u.canManage && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  className='h-8 text-xs gap-1'
                                  onClick={() => {
                                    setSelectedUser(u)
                                    fetchUserTenants(u.id)
                                  }}
                                >
                                  <Building2 className='w-3.5 h-3.5' />
                                  Manage
                                </Button>
                              </DialogTrigger>
                              <DialogContent className='sm:max-w-[425px]'>
                                <DialogHeader>
                                  <DialogTitle>Workspace Access</DialogTitle>
                                  <DialogDescription>
                                    Manage workspaces for {u.email}
                                  </DialogDescription>
                                </DialogHeader>

                                <div className='py-4 space-y-4'>
                                  {loadingTenants ? (
                                    <div className='flex justify-center py-4'>
                                      <Loader2 className='w-6 h-6 animate-spin text-muted-foreground' />
                                    </div>
                                  ) : (
                                    <div className='space-y-2'>
                                      {userTenants.length === 0 ? (
                                        <p className='text-sm text-muted-foreground text-center py-2'>
                                          No workspaces assigned.
                                        </p>
                                      ) : (
                                        userTenants.map((ut) => (
                                          <div
                                            key={ut.id}
                                            className='flex items-center justify-between p-2 rounded-lg border bg-muted/30'
                                          >
                                            <div className='flex flex-col'>
                                              <span className='text-sm font-medium'>
                                                {ut.name}
                                              </span>
                                              <span className='text-xs text-muted-foreground capitalize'>
                                                {ut.role}
                                              </span>
                                            </div>
                                            <Button
                                              variant='ghost'
                                              size='icon'
                                              className='h-8 w-8 text-destructive'
                                              onClick={() =>
                                                handleRemoveTenant(ut.id)
                                              }
                                            >
                                              <Trash2 className='w-4 h-4' />
                                            </Button>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  )}

                                  <div className='pt-4 border-t space-y-3'>
                                    <h4 className='text-sm font-medium'>
                                      Assign New Workspace
                                    </h4>
                                    <div className='grid grid-cols-2 gap-2'>
                                      <Select
                                        value={newTenantId}
                                        onValueChange={setNewTenantId}
                                      >
                                        <SelectTrigger className='text-xs h-9'>
                                          <SelectValue placeholder='Select...' />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {allTenants
                                            .filter(
                                              (t) =>
                                                !userTenants.some(
                                                  (ut) => ut.id === t.id
                                                )
                                            )
                                            .map((t) => (
                                              <SelectItem
                                                key={t.id}
                                                value={t.id.toString()}
                                              >
                                                {t.name}
                                              </SelectItem>
                                            ))}
                                        </SelectContent>
                                      </Select>
                                      <Select
                                        value={newTenantRole}
                                        onValueChange={setNewTenantRole}
                                      >
                                        <SelectTrigger className='text-xs h-9'>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value='owner'>
                                            Owner
                                          </SelectItem>
                                          <SelectItem value='member'>
                                            Member
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <Button
                                      className='w-full h-9 gap-1.5'
                                      disabled={!newTenantId || addingTenant}
                                      onClick={handleAddTenant}
                                    >
                                      {addingTenant ? (
                                        <Loader2 className='w-4 h-4 animate-spin' />
                                      ) : (
                                        <Plus className='w-4 h-4' />
                                      )}
                                      Add to Workspace
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </td>
                      )}
                      {canManageAny && (
                        <td className='px-6 py-4 text-right space-x-2 whitespace-nowrap'>
                          <>
                            <Button variant='outline' size='sm' asChild>
                              <Link href={`/users/edit/${u.id}`}>Edit</Link>
                            </Button>
                            {u.id !== user.id && (
                              <Button
                                variant='destructive'
                                size='sm'
                                onClick={() => handleDelete(u.id)}
                              >
                                Delete
                              </Button>
                            )}
                          </>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className='px-6 py-4 bg-muted/30 border-t flex items-center justify-between'>
              <div className='text-xs text-muted-foreground'>
                Showing {(currentPage - 1) * pagination.limit + 1} to{' '}
                {Math.min(
                  currentPage * pagination.limit,
                  pagination.totalCount
                )}{' '}
                of {pagination.totalCount} users
              </div>
              <div className='flex items-center space-x-2'>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  <ChevronLeft className='h-4 w-4 mr-1' />
                  Previous
                </Button>
                <div className='text-xs font-medium'>
                  Page {currentPage} of {pagination.totalPages}
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={currentPage >= pagination.totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Next
                  <ChevronRight className='h-4 w-4 ml-1' />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
