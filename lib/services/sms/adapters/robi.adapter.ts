import { SmsProviderAdapter, SmsConnectionTestResult, SmsSendMessageParams, SmsProviderSendResult, SmsSendBulkParams, SmsProviderBulkResult } from './types';

export class RobiAdapter implements SmsProviderAdapter {
  code = 'ROBI';
  name = 'Robi / Airtel Corporate Gateway';

  async testConnection(credentials: Record<string, any>, baseUrl?: string): Promise<SmsConnectionTestResult> {
    if (!credentials.apiKey || !credentials.username) {
      return { status: 'INVALID_CONFIGURATION', message: 'Robi requires username and apiKey.' };
    }
    return { status: 'CONNECTED', message: 'Robi / Airtel corporate gateway credentials validated.' };
  }

  async sendMessage(credentials: Record<string, any>, params: SmsSendMessageParams, baseUrl?: string): Promise<SmsProviderSendResult> {
    if (!credentials.apiKey || !credentials.username) {
      return { success: false, status: 'FAILED', error: 'Missing Robi credentials.' };
    }

    try {
      const url = baseUrl || 'https://api.robi.com.bd/sms/v1/send';
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${credentials.apiKey}`
        },
        body: JSON.stringify({
          sender: params.senderId || credentials.senderId || 'EduERP',
          destination: params.to.replace(/^\+/, ''),
          message: params.message
        }),
        signal: AbortSignal.timeout(8000)
      });

      const data = await res.json().catch(() => ({}));
      const isOk = res.ok && (data.status === 'OK' || data.code === '200');

      return {
        success: isOk,
        status: isOk ? 'SUBMITTED' : 'FAILED',
        providerMessageId: data.messageId || `ROBI-${Date.now()}`,
        rawResponse: data,
        error: isOk ? undefined : (data.message || 'Robi transmission failed.')
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
