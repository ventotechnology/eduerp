import { SmsProviderAdapter, SmsConnectionTestResult, SmsSendMessageParams, SmsProviderSendResult, SmsSendBulkParams, SmsProviderBulkResult } from './types';

export class GrameenphoneAdapter implements SmsProviderAdapter {
  code = 'GRAMEENPHONE';
  name = 'Grameenphone Corporate SMS';

  async testConnection(credentials: Record<string, any>, baseUrl?: string): Promise<SmsConnectionTestResult> {
    if (!credentials.username || !credentials.password) {
      return { status: 'INVALID_CONFIGURATION', message: 'GP SMS requires username and password.' };
    }

    try {
      const url = baseUrl || 'https://gpcmp.grameenphone.com/gpcmpapi/messagecontent';
      const res = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      }).catch(() => null);

      if (!res) {
        return { status: 'PROVIDER_UNAVAILABLE', message: 'Cannot reach Grameenphone CMP server.' };
      }

      return { status: 'CONNECTED', message: 'Grameenphone CMP gateway online and reachable.' };
    } catch (err: any) {
      return { status: 'PROVIDER_UNAVAILABLE', message: err.message };
    }
  }

  async sendMessage(credentials: Record<string, any>, params: SmsSendMessageParams, baseUrl?: string): Promise<SmsProviderSendResult> {
    if (!credentials.username || !credentials.password) {
      return { success: false, status: 'FAILED', error: 'Missing GP credentials.' };
    }

    try {
      const url = baseUrl || 'https://gpcmp.grameenphone.com/gpcmpapi/messagecontent';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
          msisdn: params.to.replace(/^\+/, ''),
          message: params.message,
          apicode: credentials.apicode || '1',
          cli: params.senderId || credentials.senderId || 'EduERP'
        }),
        signal: AbortSignal.timeout(8000)
      });

      const data = await res.json().catch(() => ({}));
      const isOk = res.ok && (data.status === 'SUCCESS' || data.statusCode === '200' || data.status === '200');

      return {
        success: isOk,
        status: isOk ? 'SUBMITTED' : 'FAILED',
        providerMessageId: data.messageId || `GP-${Date.now()}`,
        rawResponse: data,
        error: isOk ? undefined : (data.message || 'GP Gateway rejected message.')
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
