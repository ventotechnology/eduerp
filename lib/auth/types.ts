import { UserRole } from '../types';

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  LOCKED = 'LOCKED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION'
}

export interface ImpersonatorInfo {
  userId: string;
  email: string;
  role: UserRole;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string | null;
  status: UserStatus;
  isPlatformAdmin: boolean;
  impersonator?: ImpersonatorInfo | null;
}

export interface AuthSessionPayload {
  userId: string;
  email: string;
  role: UserRole;
  tenantId: string | null;
  issuedAt: number;
  expiresAt: number;
  impersonator?: ImpersonatorInfo | null;
}
