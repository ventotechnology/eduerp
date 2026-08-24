import { NextRequest } from 'next/server';
import { getServerSession } from './server-auth';

export interface ExtendedAuthSession {
  authenticated: boolean;
  userId: string;
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
  tenantSlug: string | null;
  isPlatformAdmin: boolean;
  institutionId?: string;
}

export async function getAuthSession(request?: NextRequest): Promise<ExtendedAuthSession> {
  const user = await getServerSession(request);
  if (!user) {
    return {
      authenticated: false,
      userId: '',
      id: '',
      email: '',
      name: '',
      role: '',
      tenantId: '',
      tenantSlug: null,
      isPlatformAdmin: false,
      institutionId: undefined
    };
  }

  return {
    authenticated: true,
    userId: user.id,
    id: user.id,
    email: user.email,
    name: user.name || user.email.split('@')[0],
    role: user.role,
    tenantId: user.tenantId || '',
    tenantSlug: user.tenantSlug || null,
    isPlatformAdmin: !!user.isPlatformAdmin,
    institutionId: undefined
  };
}
