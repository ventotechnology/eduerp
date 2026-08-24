import { SmsProviderAdapter, SmsConnectionTestResult, SmsSendMessageParams, SmsProviderSendResult, SmsSendBulkParams, SmsProviderBulkResult } from './types';

export class TeletalkAdapter implements SmsProviderAdapter {
  code = 'TELETALK';
  name = 'Teletalk Enterprise SMS';

  async testConnection(credentials: Record<string, any>, baseUrl?: string): Promise<SmsConnectionTestResult> {
    if (!credentials.userName || !credentials.password) {
      return { status: 'INVALID_CONFIGURATION', message: 'Teletalk requires userName and password.' };
    }
    return { status: 'CONNECTED', message: 'Teletalk credentials configured.' };
  }

  async sendMessage(credentials: Record<string, any>, params: SmsSendMessageParams, baseUrl?: string): Promise<SmsProviderSendResult> {
    if (!credentials.userName || !credentials.password) {
      return { success: false, status: 'FAILED', error: 'Missing Teletalk credentials.' };
    }

    try {
      const url = baseUrl || 'https://bulk.teletalk.com.bd/api/send-sms';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auth: { username: credentials.userName, password: credentials.password },
          sms: {
            sender: params.senderId || credentials.senderId || 'EduERP',
            recipient: params.to.replace(/^\+/, ''),
            message: params.message
          }
        }),
        signal: AbortSignal.timeout(8000)
      });

      const data = await res.json().catch(() => ({}));
      const isOk = res.ok && (data.status === 'SUCCESS' || data.statusCode === 200);

      return {
        success: isOk,
        status: isOk ? 'SUBMITTED' : 'FAILED',
        providerMessageId: data.transactionId || `TT-${Date.now()}`,
        rawResponse: data,
        error: isOk ? undefined : (data.message || 'Teletalk transmission failed.')
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
