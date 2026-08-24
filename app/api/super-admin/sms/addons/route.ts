import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from '@/lib/auth/server-auth';
import { requirePlatformPermission } from '@/lib/rbac/platform-guard';

export async function GET() {
  try {
    const packages = await db.smsAddonPackage.findMany({
      orderBy: { displayOrder: 'asc' }
    });
    return NextResponse.json({ success: true, packages });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    requirePlatformPermission(session, 'GATEWAY_MANAGE');

    const body = await request.json();
    const { name, slug, messageQuantity, price, currency = 'BDT', validityDays = 365, isActive = true, displayOrder = 0 } = body;

    if (!name || !slug || !messageQuantity || !price) {
      return NextResponse.json({ success: false, error: 'Name, slug, quantity, and price are required.' }, { status: 400 });
    }

    const pkg = await db.smsAddonPackage.create({
      data: {
        name,
        slug: slug.toLowerCase().trim(),
        messageQuantity: parseInt(messageQuantity, 10),
        price: parseFloat(price),
        currency,
        validityDays: parseInt(validityDays, 10),
        isActive: Boolean(isActive),
        displayOrder: parseInt(displayOrder, 10)
      }
    });

    return NextResponse.json({ success: true, package: pkg }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    requirePlatformPermission(session, 'GATEWAY_MANAGE');

    const body = await request.json();
    const { id, name, messageQuantity, price, currency, validityDays, isActive, displayOrder } = body;

    if (!id) return NextResponse.json({ success: false, error: 'Package ID is required.' }, { status: 400 });

    const pkg = await db.smsAddonPackage.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(messageQuantity !== undefined && { messageQuantity: parseInt(messageQuantity, 10) }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(currency && { currency }),
        ...(validityDays !== undefined && { validityDays: parseInt(validityDays, 10) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(displayOrder !== undefined && { displayOrder: parseInt(displayOrder, 10) })
      }
    });

    return NextResponse.json({ success: true, package: pkg });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    requirePlatformPermission(session, 'GATEWAY_MANAGE');

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Package ID required' }, { status: 400 });

    await db.smsAddonPackage.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Package deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
