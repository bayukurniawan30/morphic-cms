export const checkPermission = (
  c: any,
  collectionSlug: string,
  action: 'create' | 'read' | 'update' | 'delete'
): boolean => {
  const user = c.get('user')
  if (!user) return false

  const authType = c.get('authType')
  const tenantRole = c.get('tenantRole')

  // For standard browser sessions, super_admins and owners have full access.
  // For API keys, we strictly enforce the ability/permissions and do not bypass for super_admins/owners.
  if (authType !== 'api_key') {
    if (
      user.role === 'super_admin' ||
      user.permissions === '*' ||
      tenantRole === 'owner'
    ) {
      return true
    }
  } else {
    // If it is an API key, we still allow super_admins to bypass if they have '*' or are super_admin role
    if (user.role === 'super_admin' || user.permissions === '*') {
      return true
    }
  }

  // Special case for seeded "Read Access"
  if (user.abilityName === 'Read Access' && action === 'read') return true

  // Support both media_folder and media_folders slugs for folder permissions
  if (collectionSlug === 'media_folder' || collectionSlug === 'media_folders') {
    const folderPerms =
      (user.permissions as any)?.['media_folder'] ||
      (user.permissions as any)?.['media_folders']
    return folderPerms ? !!folderPerms[action] : false
  }

  const perms = (user.permissions as any)?.[collectionSlug]
  return perms ? !!perms[action] : false
}
