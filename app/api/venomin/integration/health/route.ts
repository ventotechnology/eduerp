import { NextRequest, NextResponse } from 'next/server';
import { validateVenominIntegrationAuth } from '@/lib/venomin/integration-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await validateVenominIntegrationAuth(req);
  if (!auth.authenticated) {
    return NextResponse.json(
      { status: 'UNAUTHORIZED', error: auth.error, message: auth.message },
      { status: auth.status }
    );
  }

  return NextResponse.json({
    status: 'HEALTHY',
    productKey: 'EDUERP',
    name: 'EduERP Education Management',
    environment: process.env.NODE_ENV || 'development',
    schemaVersion: 'v1',
    version: '1.0.0',
    capabilities: ['EVENT_PUSH', 'READ_RECORD', 'RECONCILIATION'],
    writeBackEnabled: false,
    timestamp: new Date().toISOString(),
  });
}
