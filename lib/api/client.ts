export interface ApiErrorDetails {
  field?: string;
  message: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  details?: ApiErrorDetails[];
  requestId?: string;
}

/**
 * Standardized client fetch wrapper with unified session expiry handling,
 * RBAC permission error formatting, and request tracing.
 */
export async function authenticatedFetch<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const defaultHeaders: Record<string, string> = {
    'Accept': 'application/json',
  };

  if (options.body && typeof options.body === 'string') {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const mergedHeaders = {
    ...defaultHeaders,
    ...((options.headers as Record<string, string>) || {}),
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers: mergedHeaders,
      credentials: 'include',
    });

    const isJson = res.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await res.json() : null;

    if (res.status === 401) {
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname + window.location.search;
        if (!currentPath.startsWith('/login') && !currentPath.startsWith('/apply') && !currentPath.startsWith('/site')) {
          console.warn('[AUTH] Session expired or unauthenticated. Redirecting to login.');
          window.location.href = `/login?returnUrl=${encodeURIComponent(currentPath)}&reason=session_expired`;
        }
      }
      return {
        success: false,
        code: 'UNAUTHORIZED',
        error: data?.error || 'Session expired. Please log in again.'
      };
    }

    if (res.status === 403) {
      return {
        success: false,
        code: 'FORBIDDEN',
        error: data?.error || 'Access denied: You do not have permission to perform this action.'
      };
    }

    if (!res.ok) {
      return {
        success: false,
        code: data?.code || `HTTP_${res.status}`,
        error: data?.error || data?.message || `Request failed with status ${res.status}`,
        details: data?.details,
        requestId: data?.requestId
      };
    }

    return data || { success: true };
  } catch (err: any) {
    return {
      success: false,
      code: 'NETWORK_ERROR',
      error: err.message || 'Network connection failed. Please check your internet connection.'
    };
  }
}
