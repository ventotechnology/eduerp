import { AppError } from '../errors/app-error';

export type PlatformPermission =
  | 'PLATFORM_VIEW_DASHBOARD'
  | 'TENANT_VIEW'
  | 'TENANT_CREATE'
  | 'TENANT_UPDATE'
  | 'TENANT_SUSPEND'
  | 'TENANT_IMPERSONATE'
  | 'PLAN_VIEW'
  | 'PLAN_CREATE'
  | 'PLAN_UPDATE'
  | 'PLAN_ARCHIVE'
  | 'SUBSCRIPTION_VIEW'
  | 'SUBSCRIPTION_MANAGE'
  | 'ORDER_VIEW'
  | 'PAYMENT_VIEW'
  | 'PAYMENT_MANAGE'
  | 'GATEWAY_VIEW'
  | 'GATEWAY_MANAGE'
  | 'DEMO_CREDENTIAL_VIEW'
  | 'DEMO_CREDENTIAL_RESET'
  | 'DEMO_CLIENT_EXPORT'
  | 'PLATFORM_USER_VIEW'
  | 'PLATFORM_USER_MANAGE'
  | 'PLATFORM_SETTINGS_VIEW'
  | 'PLATFORM_SETTINGS_MANAGE'
  | 'AUDIT_VIEW';

export const PLATFORM_ROLE_PERMISSIONS: Record<string, PlatformPermission[]> = {
  PLATFORM_SUPER_ADMIN: [
    'PLATFORM_VIEW_DASHBOARD',
    'TENANT_VIEW',
    'TENANT_CREATE',
    'TENANT_UPDATE',
    'TENANT_SUSPEND',
    'TENANT_IMPERSONATE',
    'PLAN_VIEW',
    'PLAN_CREATE',
    'PLAN_UPDATE',
    'PLAN_ARCHIVE',
    'SUBSCRIPTION_VIEW',
    'SUBSCRIPTION_MANAGE',
    'ORDER_VIEW',
    'PAYMENT_VIEW',
    'PAYMENT_MANAGE',
    'GATEWAY_VIEW',
    'GATEWAY_MANAGE',
    'DEMO_CREDENTIAL_VIEW',
    'DEMO_CREDENTIAL_RESET',
    'DEMO_CLIENT_EXPORT',
    'PLATFORM_USER_VIEW',
    'PLATFORM_USER_MANAGE',
    'PLATFORM_SETTINGS_VIEW',
    'PLATFORM_SETTINGS_MANAGE',
    'AUDIT_VIEW'
  ],
  SUPER_ADMIN: [
    'PLATFORM_VIEW_DASHBOARD',
    'TENANT_VIEW',
    'TENANT_CREATE',
    'TENANT_UPDATE',
    'TENANT_SUSPEND',
    'TENANT_IMPERSONATE',
    'PLAN_VIEW',
    'PLAN_CREATE',
    'PLAN_UPDATE',
    'PLAN_ARCHIVE',
    'SUBSCRIPTION_VIEW',
    'SUBSCRIPTION_MANAGE',
    'ORDER_VIEW',
    'PAYMENT_VIEW',
    'PAYMENT_MANAGE',
    'GATEWAY_VIEW',
    'GATEWAY_MANAGE',
    'DEMO_CREDENTIAL_VIEW',
    'DEMO_CREDENTIAL_RESET',
    'DEMO_CLIENT_EXPORT',
    'PLATFORM_USER_VIEW',
    'PLATFORM_USER_MANAGE',
    'PLATFORM_SETTINGS_VIEW',
    'PLATFORM_SETTINGS_MANAGE',
    'AUDIT_VIEW'
  ],
  PLATFORM_ADMIN: [
    'PLATFORM_VIEW_DASHBOARD',
    'TENANT_VIEW',
    'TENANT_CREATE',
    'TENANT_UPDATE',
    'TENANT_SUSPEND',
    'TENANT_IMPERSONATE',
    'PLAN_VIEW',
    'PLAN_CREATE',
    'PLAN_UPDATE',
    'SUBSCRIPTION_VIEW',
    'SUBSCRIPTION_MANAGE',
    'ORDER_VIEW',
    'PAYMENT_VIEW',
    'GATEWAY_VIEW',
    'DEMO_CREDENTIAL_VIEW',
    'DEMO_CLIENT_EXPORT',
    'PLATFORM_USER_VIEW',
    'PLATFORM_SETTINGS_VIEW',
    'AUDIT_VIEW'
  ],
  BILLING_ADMIN: [
    'PLATFORM_VIEW_DASHBOARD',
    'TENANT_VIEW',
    'PLAN_VIEW',
    'SUBSCRIPTION_VIEW',
    'SUBSCRIPTION_MANAGE',
    'ORDER_VIEW',
    'PAYMENT_VIEW',
    'PAYMENT_MANAGE',
    'GATEWAY_VIEW',
    'AUDIT_VIEW'
  ],
  SUPPORT_ADMIN: [
    'PLATFORM_VIEW_DASHBOARD',
    'TENANT_VIEW',
    'TENANT_IMPERSONATE',
    'PLAN_VIEW',
    'SUBSCRIPTION_VIEW',
    'AUDIT_VIEW'
  ],
  SALES_ADMIN: [
    'PLATFORM_VIEW_DASHBOARD',
    'TENANT_VIEW',
    'PLAN_VIEW',
    'ORDER_VIEW',
    'DEMO_CREDENTIAL_VIEW',
    'DEMO_CLIENT_EXPORT'
  ]
};

export function hasPlatformPermission(session: any, permission: PlatformPermission): boolean {
  if (!session || (!session.isPlatformAdmin && !session.user?.isPlatformAdmin)) {
    return false;
  }

  const role = session.role || session.user?.role || '';
  const perms = PLATFORM_ROLE_PERMISSIONS[role] || [];
  return perms.includes(permission);
}

export function requirePlatformPermission(session: any, permission: PlatformPermission): void {
  if (!hasPlatformPermission(session, permission)) {
    throw AppError.forbidden(`Platform permission denied: Requires '${permission}' authorization.`);
  }
}
