import { NextResponse } from 'next/server';

export interface ApiResponse<T = any> {
  success: boolean;
  ok: boolean;
  data?: T;
  error?: {
    code?: string;
    message: string;
  } | string;
  message?: string;
  redirectUrl?: string;
  [key: string]: any;
}

/**
 * Creates a standardized JSON success response with explicit application/json Content-Type
 */
export function apiSuccess<T>(data: T, extra: Record<string, any> = {}, status = 200) {
  const body: ApiResponse<T> = {
    success: true,
    ok: true,
    data,
    ...extra
  };
  return NextResponse.json(body, {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Creates a standardized JSON error response with explicit application/json Content-Type
 */
export function apiError(code: string, message: string, status = 400, extra: Record<string, any> = {}) {
  const body: ApiResponse = {
    success: false,
    ok: false,
    error: {
      code,
      message
    },
    ...extra
  };
  return NextResponse.json(body, {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Safely fetches and parses JSON response on client side.
 * Never throws "Unexpected end of JSON input".
 */
export async function safeFetchJson<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<{
  ok: boolean;
  success: boolean;
  status: number;
  data?: T;
  error?: string;
  errorCode?: string;
  raw?: any;
}> {
  try {
    const res = await fetch(url, {
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });

    const text = await res.text();
    let json: any = null;

    if (text && text.trim().length > 0) {
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }
    }

    if (!res.ok) {
      const errorMsg =
        json?.error?.message ||
        json?.error ||
        json?.message ||
        (text && text.length < 200 ? text : `HTTP ${res.status} ${res.statusText}`);
      const errorCode = json?.error?.code || `HTTP_${res.status}`;
      return {
        ok: false,
        success: false,
        status: res.status,
        error: errorMsg,
        errorCode,
        raw: json
      };
    }

    if (json) {
      return {
        ok: json.ok ?? json.success ?? true,
        success: json.success ?? json.ok ?? true,
        status: res.status,
        data: json.data ?? json,
        error: json.error ? (typeof json.error === 'string' ? json.error : json.error.message) : undefined,
        errorCode: json.error?.code,
        raw: json
      };
    }

    return {
      ok: res.ok,
      success: res.ok,
      status: res.status,
      data: null as any,
      raw: null
    };
  } catch (err: any) {
    return {
      ok: false,
      success: false,
      status: 0,
      error: err?.message || 'Network request failed',
      errorCode: 'NETWORK_ERROR'
    };
  }
}
