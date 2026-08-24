import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { ROLE_PERMISSIONS } from '@/lib/rbac/permissions';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getServerSession(req);

  if (!session) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  const permissions = ROLE_PERMISSIONS[session.role] || {};

  let institution = null;
  let campuses: any[] = [];

  if (session.tenantId) {
    try {
      const inst = await db.institution.findFirst({
        where: { tenantId: session.tenantId },
        include: { campuses: true }
      });
      if (inst) {
        institution = {
          id: inst.id,
          name: inst.name,
          shortName: inst.shortName,
          primaryColor: inst.primaryColor,
          secondaryColor: inst.secondaryColor,
          boardAffiliation: inst.boardAffiliation,
          eiin: inst.eiin,
          address: inst.address,
          phone: inst.phone,
          email: inst.email,
          principalHeadName: inst.principalHeadName,
          principalHeadTitle: inst.principalHeadTitle,
        };
        campuses = inst.campuses.map((c) => ({
          id: c.id,
          name: c.name,
          code: c.code,
          type: c.type,
          address: c.address,
          phone: c.phone,
          email: c.email,
          isMain: c.isMain,
        }));
      }
    } catch (e) {
      console.error('Error fetching institution context in /api/auth/me:', e);
    }
  }

  return NextResponse.json({
    authenticated: true,
    user: session,
    institution,
    campuses,
    permissions
  });
}
