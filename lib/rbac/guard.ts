import { UserRole } from '../types';
import { SessionUser } from '../auth/types';
import { PermissionAction, PermissionResource, ROLE_PERMISSIONS } from './permissions';

/**
 * Checks if a specific role possesses the requested action on a given resource.
 */
export function hasPermission(
  role: UserRole,
  action: PermissionAction,
  resource: PermissionResource
): boolean {
  if (role === 'PLATFORM_SUPER_ADMIN') {
    return true; // Super Admin has universal access
  }

  const roleResourcePerms = ROLE_PERMISSIONS[role]?.[resource];
  if (!roleResourcePerms) {
    return false;
  }

  return roleResourcePerms.includes(action) || roleResourcePerms.includes('MANAGE');
}

/**
 * Enforces permission on the authenticated user.
 * Throws 403 error on violation.
 */
export function requirePermission(
  session: SessionUser,
  action: PermissionAction,
  resource: PermissionResource
): void {
  if (!hasPermission(session.role, action, resource)) {
    throw new Error(
      `FORBIDDEN: Role '${session.role}' is not authorized to perform '${action}' on '${resource}'.`
    );
  }
}
