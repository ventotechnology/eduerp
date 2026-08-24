import { SmsProviderAdapter, SmsConnectionTestResult, SmsSendMessageParams, SmsProviderSendResult, SmsSendBulkParams, SmsProviderBulkResult } from './types';

export class TwilioAdapter implements SmsProviderAdapter {
  code = 'TWILIO';
  name = 'Twilio SMS API';

  async testConnection(credentials: Record<string, any>): Promise<SmsConnectionTestResult> {
    if (!credentials.accountSid || !credentials.authToken) {
      return { status: 'INVALID_CONFIGURATION', message: 'Twilio requires accountSid and authToken.' };
    }

    try {
      const auth = Buffer.from(`${credentials.accountSid}:${credentials.authToken}`).toString('base64');
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${credentials.accountSid}.json`, {
        headers: { 'Authorization': `Basic ${auth}` },
        signal: AbortSignal.timeout(5000)
      }).catch(() => null);

      if (!res) {
        return { status: 'PROVIDER_UNAVAILABLE', message: 'Cannot reach Twilio servers.' };
      }

      if (res.status === 401 || res.status === 403) {
        return { status: 'AUTHENTICATION_FAILED', message: 'Twilio authentication failed. Check accountSid/authToken.' };
      }

      return { status: 'CONNECTED', message: 'Twilio account authenticated successfully.' };
    } catch (err: any) {
      return { status: 'PROVIDER_UNAVAILABLE', message: err.message };
    }
  }

  async sendMessage(credentials: Record<string, any>, params: SmsSendMessageParams): Promise<SmsProviderSendResult> {
    if (!credentials.accountSid || !credentials.authToken) {
      return { success: false, status: 'FAILED', error: 'Missing Twilio credentials.' };
    }

    try {
      const auth = Buffer.from(`${credentials.accountSid}:${credentials.authToken}`).toString('base64');
      const from = params.senderId || credentials.fromNumber || credentials.senderId;

      const bodyParams = new URLSearchParams({
        To: params.to.startsWith('+') ? params.to : `+${params.to}`,
        From: from,
        Body: params.message
      });

      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${credentials.accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: bodyParams.toString(),
        signal: AbortSignal.timeout(8000)
      });

      const data = await res.json().catch(() => ({}));
      const isOk = res.ok && data.sid;

      return {
        success: isOk,
        status: isOk ? 'SUBMITTED' : 'FAILED',
        providerMessageId: data.sid || `TW-${Date.now()}`,
        rawResponse: data,
        error: isOk ? undefined : (data.message || 'Twilio message submission failed.')
      };
    } catch (err: any) {
      return { success: false, status: 'FAILED', error: err.message };
    }
  }

  async sendBulk(credentials: Record<string, any>, params: SmsSendBulkParams): Promise<SmsProviderBulkResult> {
    const results = [];
    let totalSent = 0;
    let totalFailed = 0;

    for (const phone of params.recipients) {
      const res = await this.sendMessage(credentials, { ...params, to: phone });
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
