import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getAdmissionSettings } from '@/lib/services/admission-service';
import ApplyClient from './apply-client';

export const dynamic = 'force-dynamic';

interface ApplyPageProps {
  params: Promise<{ tenantSlug: string }>;
}

export default async function ApplyPage({ params }: ApplyPageProps) {
  const { tenantSlug } = await params;

  const tenant = await db.tenant.findUnique({
    where: { slug: tenantSlug },
    include: {
      institution: {
        include: {
          campuses: true,
          academicYears: {
            where: { status: 'ACTIVE' },
            take: 1
          },
          classes: {
            include: {
              sections: true
            },
            orderBy: { sequence: 'asc' }
          },
          departments: {
            include: {
              programs: {
                include: {
                  batches: true
                }
              }
            }
          },
          technologyTrades: true,
          shifts: true,
          academicGroups: true
        }
      }
    }
  });

  if (!tenant || !tenant.institution) {
    notFound();
  }

  const settings = await getAdmissionSettings(tenant.slug);

  return (
    <ApplyClient
      tenantSlug={tenant.slug}
      institution={tenant.institution}
      settings={settings}
      institutionType={tenant.institutionType}
    />
  );
}
