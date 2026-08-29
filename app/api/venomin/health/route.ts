import { NextResponse } from 'next/server';
import { ProductHealthResponse } from '@/lib/venomin/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const env = process.env.NODE_ENV === 'production' ? 'production' : 'staging';

  const healthData: ProductHealthResponse = {
    status: 'ok',
    product: 'eduerp',
    environment: env,
    integrationVersion: 'v1',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    capabilities: {
      provisioning: true,
      sso: true,
      webhooks: true,
      usageSync: true,
      schoolEngine: true,
      collegeEngine: true,
      universityEngine: true,
      madrashaEngine: true,
    },
  };

  return NextResponse.json(healthData);
}
