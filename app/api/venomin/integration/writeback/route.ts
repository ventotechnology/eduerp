import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return NextResponse.json(
    {
      status: 'DENIED',
      error: 'WRITE_BACK_DISABLED',
      safeMessage: 'Write-back commands are disabled for EduERP (Command 35 pre-activation policy).',
    },
    { status: 403 }
  );
}

export async function GET(req: NextRequest) {
  return NextResponse.json(
    {
      status: 'DENIED',
      error: 'WRITE_BACK_DISABLED',
      safeMessage: 'Write-back commands are disabled for EduERP (Command 35 pre-activation policy).',
    },
    { status: 403 }
  );
}
