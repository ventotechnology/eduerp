'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  InstitutionType,
  UserRole,
  LanguageCode,
  InstitutionBranding,
  CampusModel,
  UserModel,
  InstitutionTypeConfig
} from './types';
import { PRESET_DEMO_TENANTS, INSTITUTION_TYPE_CONFIGS, DEMO_USER_PERSONAS } from './constants';

import { usePathname } from 'next/navigation';
import { resolveCanonicalTenantSlug } from './tenant/tenant-aliases';

interface TenantContextState {
  tenantSlug: string;
  institutionType: InstitutionType;
  branding: InstitutionBranding;
  campuses: CampusModel[];
  activeCampusId: string;
  activeRole: UserRole;
  activeUser: UserModel;
  language: LanguageCode;
  institutionTypeConfig: InstitutionTypeConfig;
  impersonator?: { userId: string; email: string; role: string } | null;
  exitImpersonation?: () => Promise<void>;
  switchTenant: (slug: string) => void;
  switchRole: (role: UserRole) => void;
  switchCampus: (campusId: string) => void;
  switchLanguage: (lang: LanguageCode) => void;
}

const TenantContext = createContext<TenantContextState | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [tenantSlug, setTenantSlug] = useState<string>('demo-school');
  const [activeRole, setActiveRole] = useState<UserRole>('PRINCIPAL');
  const [activeCampusId, setActiveCampusId] = useState<string>('CAMPUS-MAIN');
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [authenticatedUser, setAuthenticatedUser] = useState<{
    id: string;
    name: string;
    email: string;
    role: UserRole;
    impersonator?: { userId: string; email: string; role: string } | null;
  } | null>(null);

  // Sync with route URL on navigation
  useEffect(() => {
    if (pathname) {
      const parts = pathname.split('/').filter(Boolean);
      if (parts.length > 0) {
        const publicNonTenantRoutes = [
          'login', 'signup', 'super-admin', 'pricing', 'demo',
          'contact', 'privacy', 'terms', 'checkout', 'payment',
          'verify', 'apply', 'site', 'api', 'results'
        ];
        if (!publicNonTenantRoutes.includes(parts[0])) {
          const canonical = resolveCanonicalTenantSlug(parts[0]);
          setTenantSlug(canonical);
        }
      }
    }
  }, [pathname]);

  // Sync with server authentication state on mount
  useEffect(() => {
    async function syncAuth() {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const json = await res.json();
          if (json.authenticated && json.user) {
            setAuthenticatedUser(json.user);
            setActiveRole(json.user.role);
            if (json.user.tenantSlug) {
              const canonical = resolveCanonicalTenantSlug(json.user.tenantSlug);
              setTenantSlug(canonical);
            }
          }
        }
      } catch (e) {
        console.error('Failed to sync auth in TenantProvider', e);
      }
    }
    syncAuth();
  }, []);

  const exitImpersonation = async () => {
    try {
      const res = await fetch('/api/auth/impersonation/exit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success && data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch (e) {
      console.error('Failed to exit impersonation', e);
    }
  };

  const activePreset = PRESET_DEMO_TENANTS.find((t) => t.slug === tenantSlug) || PRESET_DEMO_TENANTS[0];
  const institutionTypeConfig = INSTITUTION_TYPE_CONFIGS[activePreset.type] || INSTITUTION_TYPE_CONFIGS['SCHOOL'];

  const branding: InstitutionBranding = {
    name: activePreset.name,
    shortName: activePreset.shortName,
    primaryColor: activePreset.primaryColor,
    secondaryColor: activePreset.secondaryColor,
    eiin: activePreset.eiin,
    boardAffiliation: activePreset.board,
    address: activePreset.address,
    phone: '+880 2-9568123',
    email: `info@${activePreset.slug.replace(/-/g, '')}.edu.bd`,
    website: `https://${activePreset.slug}.eduerp.app`,
    principalHeadName: activePreset.headName,
    principalHeadTitle: activePreset.headTitle
  };

  const campuses: CampusModel[] = [
    {
      id: 'CAMPUS-MAIN',
      name: `${activePreset.shortName} Main Campus`,
      code: 'CMP-01',
      type: 'Main Campus',
      address: activePreset.address,
      phone: '+880 2-9568123',
      isMain: true,
      studentCount: activePreset.type === 'UNIVERSITY' ? 4200 : 1850,
      teacherCount: activePreset.type === 'UNIVERSITY' ? 195 : 78
    }
  ];

  const persona = DEMO_USER_PERSONAS.find((p) => p.role === activeRole) || DEMO_USER_PERSONAS[1];
  const activeUser: UserModel = {
    id: authenticatedUser?.id || `USR-${activeRole}`,
    name: authenticatedUser?.name || persona.name,
    email: authenticatedUser?.email || `${activeRole.toLowerCase()}@${activePreset.slug}.edu.bd`,
    role: activeRole,
    designation: persona.title,
    department: 'Academic Administration'
  };

  const switchTenant = async (slug: string) => {
    setTenantSlug(slug);
    try {
      const res = await fetch('/api/auth/demo-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantSlug: slug, role: activeRole }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success && data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch (e) {
      console.error('Failed to switch tenant session', e);
    }
  };

  const switchRole = async (role: UserRole) => {
    setActiveRole(role);
    try {
      const res = await fetch('/api/auth/demo-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantSlug, role }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success && data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch (e) {
      console.error('Failed to switch role session', e);
    }
  };

  const switchCampus = (campusId: string) => {
    setActiveCampusId(campusId);
  };

  const switchLanguage = (lang: LanguageCode) => {
    setLanguage(lang);
  };

  // Sync CSS primary color variables dynamically
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--primary-brand', branding.primaryColor);
    }
  }, [branding.primaryColor]);

  return (
    <TenantContext.Provider
      value={{
        tenantSlug,
        institutionType: activePreset.type,
        branding,
        campuses,
        activeCampusId,
        activeRole,
        activeUser,
        language,
        institutionTypeConfig,
        impersonator: authenticatedUser?.impersonator || null,
        exitImpersonation,
        switchTenant,
        switchRole,
        switchCampus,
        switchLanguage
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
