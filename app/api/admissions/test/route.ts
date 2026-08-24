import { NextRequest } from 'next/server';
import { submitAdmissionTest } from '@/lib/services/admission-service';
import { successResponse, errorResponse } from '@/lib/errors/api-response';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await submitAdmissionTest(body.tenantId || 'dhaka-ideal-school', body);
    return successResponse(result, 'Admission test evaluated and recorded successfully');
  } catch (err) {
    return errorResponse(err);
  }
}
