import { describe, it, expect, vi } from 'vitest';
import { safeFetchJson, apiSuccess, apiError } from '@/lib/api/safe-response';

describe('lib/api/safe-response: Client Response Safety & Contract Suite', () => {
  it('safely handles successful JSON response without error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => JSON.stringify({ success: true, ok: true, data: { name: 'SITA' } })
    } as any);

    const result = await safeFetchJson('/api/test');
    expect(result.ok).toBe(true);
    expect(result.success).toBe(true);
    expect(result.status).toBe(200);
    expect(result.data).toEqual({ name: 'SITA' });
    expect(result.error).toBeUndefined();
  });

  it('safely handles empty 204 No Content response without throwing JSON parse error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      statusText: 'No Content',
      text: async () => ''
    } as any);

    const result = await safeFetchJson('/api/test');
    expect(result.ok).toBe(true);
    expect(result.status).toBe(204);
    expect(result.error).toBeUndefined();
  });

  it('safely handles HTML 500 error page without throwing Unexpected end of JSON', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: async () => '<html><body>Internal Server Error</body></html>'
    } as any);

    const result = await safeFetchJson('/api/test');
    expect(result.ok).toBe(false);
    expect(result.success).toBe(false);
    expect(result.status).toBe(500);
    expect(result.error).toContain('Internal Server Error');
  });

  it('safely handles JSON error response with code and message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      text: async () => JSON.stringify({
        success: false,
        ok: false,
        error: { code: 'IMPERSONATION_NOT_ALLOWED', message: 'Insufficient platform privileges.' }
      })
    } as any);

    const result = await safeFetchJson('/api/test');
    expect(result.ok).toBe(false);
    expect(result.status).toBe(403);
    expect(result.error).toBe('Insufficient platform privileges.');
    expect(result.errorCode).toBe('IMPERSONATION_NOT_ALLOWED');
  });

  it('safely catches network failure without uncaught exception', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network connection refused'));

    const result = await safeFetchJson('/api/test');
    expect(result.ok).toBe(false);
    expect(result.status).toBe(0);
    expect(result.error).toContain('Network connection refused');
  });

  it('verifies apiSuccess helper generates valid JSON with headers', () => {
    const res = apiSuccess({ role: 'PRINCIPAL' }, { message: 'Active' }, 200);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/json');
  });

  it('verifies apiError helper generates structured error response', () => {
    const res = apiError('NO_OWNER_AVAILABLE', 'No institution owner available', 404);
    expect(res.status).toBe(404);
    expect(res.headers.get('Content-Type')).toBe('application/json');
  });
});
