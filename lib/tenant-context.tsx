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
  switchTenant: (slug: string) => void;
  switchRole: (role: UserRole) => void;
  switchCampus: (campusId: string) => void;
  switchLanguage: (lang: LanguageCode) => void;
}

const TenantContext = createContext<TenantContextState | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenantSlug, setTenantSlug] = useState<string>('dhaka-ideal-school');
  const [activeRole, setActiveRole] = useState<UserRole>('PRINCIPAL');
  const [activeCampusId, setActiveCampusId] = useState<string>('CAMPUS-MAIN');
  const [language, setLanguage] = useState<LanguageCode>('en');

  const activePreset = PRESET_DEMO_TENANTS.find((t) => t.slug === tenantSlug) || PRESET_DEMO_TENANTS[0];
  const institutionTypeConfig = INSTITUTION_TYPE_CONFIGS[activePreset.type];

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
    },
    {
      id: 'CAMPUS-BRANCH-01',
      name: `${activePreset.shortName} Dhanmondi Branch Campus`,
      code: 'CMP-02',
      type: 'Branch Campus',
      address: 'Road 8/A, Dhanmondi, Dhaka',
      phone: '+880 2-9118944',
      isMain: false,
      studentCount: 840,
      teacherCount: 42
    }
  ];

  const persona = DEMO_USER_PERSONAS.find((p) => p.role === activeRole) || DEMO_USER_PERSONAS[1];
  const activeUser: UserModel = {
    id: `USR-${activeRole}`,
    name: persona.name,
    email: `${activeRole.toLowerCase()}@${activePreset.slug}.edu.bd`,
    role: activeRole,
    designation: persona.title,
    department: 'Academic Administration'
  };

  const switchTenant = (slug: string) => {
    setTenantSlug(slug);
  };

  const switchRole = (role: UserRole) => {
    setActiveRole(role);
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
