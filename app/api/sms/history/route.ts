import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from '@/lib/auth/server-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session || !session.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const take = parseInt(searchParams.get('take') || '30', 10);

    const broadcasts = await db.smsBroadcast.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        _count: { select: { deliveries: true } }
      }
    });

    return NextResponse.json({
      success: true,
      broadcasts
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
