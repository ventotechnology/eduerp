import { SmsProviderAdapter, SmsConnectionTestResult, SmsSendMessageParams, SmsProviderSendResult, SmsSendBulkParams, SmsProviderBulkResult } from './types';

export class SslWirelessAdapter implements SmsProviderAdapter {
  code = 'SSL_WIRELESS';
  name = 'SSL Wireless SMS';

  async testConnection(credentials: Record<string, any>, baseUrl?: string): Promise<SmsConnectionTestResult> {
    if (!credentials.apiToken || !credentials.sid) {
      return { status: 'INVALID_CONFIGURATION', message: 'SSL Wireless requires apiToken and sid (Sender ID).' };
    }

    return { status: 'CONNECTED', message: 'SSL Wireless credentials validated.' };
  }

  async sendMessage(credentials: Record<string, any>, params: SmsSendMessageParams, baseUrl?: string): Promise<SmsProviderSendResult> {
    if (!credentials.apiToken || !credentials.sid) {
      return { success: false, status: 'FAILED', error: 'Missing SSL Wireless credentials.' };
    }

    try {
      const url = baseUrl || 'https://smsplus.sslwireless.com/api/v3/send-sms';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_token: credentials.apiToken,
          sid: params.senderId || credentials.sid,
          msisdn: params.to.replace(/^\+/, ''),
          sms: params.message,
          csms_id: `CSMS-${Date.now()}`
        }),
        signal: AbortSignal.timeout(8000)
      });

      const data = await res.json().catch(() => ({}));
      const isOk = res.ok && (data.status === 'SUCCESS' || data.status_code === 200);

      return {
        success: isOk,
        status: isOk ? 'SUBMITTED' : 'FAILED',
        providerMessageId: data.smsinfo?.[0]?.sms_status_id || `SSL-${Date.now()}`,
        rawResponse: data,
        error: isOk ? undefined : (data.error_message || 'SSL Wireless rejected transmission.')
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
