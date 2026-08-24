import { SmsProviderAdapter, SmsConnectionTestResult, SmsSendMessageParams, SmsProviderSendResult, SmsSendBulkParams, SmsProviderBulkResult } from './types';

export class BanglalinkAdapter implements SmsProviderAdapter {
  code = 'BANGLALINK';
  name = 'Banglalink Corporate SMS';

  async testConnection(credentials: Record<string, any>, baseUrl?: string): Promise<SmsConnectionTestResult> {
    if (!credentials.userId || !credentials.password) {
      return {
        status: 'INVALID_CONFIGURATION',
        message: 'Banglalink requires userId and password.'
      };
    }

    try {
      const url = baseUrl || 'https://vas.banglalink.net/sendSMS/smsStatus';
      const res = await fetch(`${url}?userID=${encodeURIComponent(credentials.userId)}&passwd=${encodeURIComponent(credentials.password)}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json, text/plain' },
        signal: AbortSignal.timeout(5000)
      }).catch(() => null);

      if (!res) {
        return {
          status: 'PROVIDER_UNAVAILABLE',
          message: 'Could not connect to Banglalink gateway server.'
        };
      }

      if (res.status === 401 || res.status === 403) {
        return {
          status: 'AUTHENTICATION_FAILED',
          message: 'Invalid Banglalink user credentials or unauthorized IP.'
        };
      }

      return {
        status: 'CONNECTED',
        message: 'Successfully connected to Banglalink SMS gateway.'
      };
    } catch (err: any) {
      return {
        status: 'PROVIDER_UNAVAILABLE',
        message: err.message || 'Connection test failed.'
      };
    }
  }

  async sendMessage(credentials: Record<string, any>, params: SmsSendMessageParams, baseUrl?: string): Promise<SmsProviderSendResult> {
    if (!credentials.userId || !credentials.password) {
      return { success: false, status: 'FAILED', error: 'Missing Banglalink credentials.' };
    }

    try {
      const url = baseUrl || 'https://vas.banglalink.net/sendSMS/sendSMS';
      const bodyParams = new URLSearchParams({
        userID: credentials.userId,
        passwd: credentials.password,
        msisdn: params.to.replace(/^\+/, ''),
        message: params.message,
        sid: params.senderId || credentials.senderId || 'EduERP'
      });

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: bodyParams.toString(),
        signal: AbortSignal.timeout(8000)
      });

      const text = await res.text();
      const isOk = res.ok && (text.includes('SUCCESS') || text.includes('200') || text.includes('0'));

      return {
        success: isOk,
        status: isOk ? 'SUBMITTED' : 'FAILED',
        providerMessageId: `BL-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        rawResponse: text,
        error: isOk ? undefined : `Banglalink error: ${text}`
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
