import { SmsProviderAdapter, SmsConnectionTestResult, SmsSendMessageParams, SmsProviderSendResult, SmsSendBulkParams, SmsProviderBulkResult } from './types';

export class BulkSmsBdAdapter implements SmsProviderAdapter {
  code = 'BULKSMSBD';
  name = 'BulkSMSBD Gateway';

  async testConnection(credentials: Record<string, any>, baseUrl?: string): Promise<SmsConnectionTestResult> {
    if (!credentials.apiKey || !credentials.senderId) {
      return { status: 'INVALID_CONFIGURATION', message: 'BulkSMSBD requires apiKey and senderId.' };
    }

    try {
      const url = baseUrl || 'http://bulksmsbd.net/api/getBalanceApi';
      const res = await fetch(`${url}?api_key=${encodeURIComponent(credentials.apiKey)}`, {
        signal: AbortSignal.timeout(5000)
      }).catch(() => null);

      if (!res) {
        return { status: 'PROVIDER_UNAVAILABLE', message: 'BulkSMSBD server unreachable.' };
      }

      const data = await res.json().catch(() => ({}));
      if (data.response_code === 1002 || data.response_code === 200 || data.balance !== undefined) {
        return {
          status: 'CONNECTED',
          message: 'Connected to BulkSMSBD.',
          balance: parseFloat(data.balance) || 0,
          currency: 'BDT'
        };
      }

      return { status: 'AUTHENTICATION_FAILED', message: data.error_message || 'BulkSMSBD auth failed.' };
    } catch (err: any) {
      return { status: 'PROVIDER_UNAVAILABLE', message: err.message };
    }
  }

  async sendMessage(credentials: Record<string, any>, params: SmsSendMessageParams, baseUrl?: string): Promise<SmsProviderSendResult> {
    if (!credentials.apiKey || !credentials.senderId) {
      return { success: false, status: 'FAILED', error: 'Missing BulkSMSBD credentials.' };
    }

    try {
      const url = baseUrl || 'http://bulksmsbd.net/api/smsapi';
      const bodyParams = new URLSearchParams({
        api_key: credentials.apiKey,
        type: params.isUnicode ? 'unicode' : 'text',
        number: params.to.replace(/^\+/, ''),
        senderid: params.senderId || credentials.senderId,
        message: params.message
      });

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: bodyParams.toString(),
        signal: AbortSignal.timeout(8000)
      });

      const data = await res.json().catch(() => ({}));
      const isOk = res.ok && (data.response_code === 202 || data.response_code === 200 || data.success === true);

      return {
        success: isOk,
        status: isOk ? 'SUBMITTED' : 'FAILED',
        providerMessageId: data.message_id || `BDSMS-${Date.now()}`,
        rawResponse: data,
        error: isOk ? undefined : (data.error_message || 'BulkSMSBD message transmission failed.')
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
