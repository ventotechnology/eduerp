import { SmsProviderAdapter, SmsConnectionTestResult, SmsSendMessageParams, SmsProviderSendResult, SmsSendBulkParams, SmsProviderBulkResult } from './types';

export class GenericHttpAdapter implements SmsProviderAdapter {
  code = 'GENERIC_HTTP';
  name = 'Custom HTTP REST Gateway';

  async testConnection(credentials: Record<string, any>, baseUrl?: string): Promise<SmsConnectionTestResult> {
    const url = baseUrl || credentials.apiUrl;
    if (!url) {
      return { status: 'INVALID_CONFIGURATION', message: 'Generic HTTP adapter requires a valid API URL.' };
    }

    try {
      const res = await fetch(url, {
        method: credentials.httpMethod || 'GET',
        headers: credentials.headers || {},
        signal: AbortSignal.timeout(5000)
      }).catch(() => null);

      if (!res) {
        return { status: 'PROVIDER_UNAVAILABLE', message: 'Target HTTP server unreachable.' };
      }

      return { status: 'CONNECTED', message: `Server responded with HTTP ${res.status}.` };
    } catch (err: any) {
      return { status: 'PROVIDER_UNAVAILABLE', message: err.message };
    }
  }

  async sendMessage(credentials: Record<string, any>, params: SmsSendMessageParams, baseUrl?: string): Promise<SmsProviderSendResult> {
    const url = baseUrl || credentials.apiUrl;
    if (!url) {
      return { success: false, status: 'FAILED', error: 'Missing API URL in generic HTTP adapter.' };
    }

    try {
      const method = (credentials.httpMethod || 'POST').toUpperCase();
      let reqUrl = url;
      let body: any = undefined;
      const headers: Record<string, string> = { ...credentials.headers };

      if (method === 'GET') {
        const u = new URL(url);
        u.searchParams.set(credentials.toParam || 'to', params.to.replace(/^\+/, ''));
        u.searchParams.set(credentials.msgParam || 'msg', params.message);
        if (params.senderId || credentials.senderId) {
          u.searchParams.set(credentials.senderParam || 'sender', params.senderId || credentials.senderId);
        }
        reqUrl = u.toString();
      } else {
        headers['Content-Type'] = headers['Content-Type'] || 'application/json';
        body = JSON.stringify({
          [credentials.toParam || 'to']: params.to.replace(/^\+/, ''),
          [credentials.msgParam || 'message']: params.message,
          [credentials.senderParam || 'sender']: params.senderId || credentials.senderId || 'EduERP',
          ...credentials.extraBody
        });
      }

      const res = await fetch(reqUrl, {
        method,
        headers,
        body,
        signal: AbortSignal.timeout(8000)
      });

      const isOk = res.ok;
      const text = await res.text().catch(() => '');

      return {
        success: isOk,
        status: isOk ? 'SUBMITTED' : 'FAILED',
        providerMessageId: `GEN-${Date.now()}`,
        rawResponse: text,
        error: isOk ? undefined : `HTTP ${res.status}: ${text}`
      };
    } catch (err: any) {
      return { success: false, status: 'FAILED', error: err.message };
    }
  }

  async sendBulk(credentials: Record<string, any>, params: SmsSendBulkParams, baseUrl?: string): Promise<SmsProviderBulkResult> {
    const results = [];
    let totalSent = 0;
    let totalFailed = 0;

    for (const phone of params.recipients) {
      const res = await this.sendMessage(credentials, { ...params, to: phone }, baseUrl);
      if (res.success) {
        totalSent++;
        results.push({ phone, success: true, providerMessageId: res.providerMessageId });
      } else {
        totalFailed++;
        results.push({ phone, success: false, error: res.error });
      }
    }

    return { success: totalSent > 0, totalSent, totalFailed, results };
  }
}
