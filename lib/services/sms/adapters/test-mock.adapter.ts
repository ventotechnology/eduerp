import { SmsProviderAdapter, SmsConnectionTestResult, SmsSendMessageParams, SmsProviderSendResult, SmsSendBulkParams, SmsProviderBulkResult } from './types';

export class TestMockAdapter implements SmsProviderAdapter {
  code = 'TEST_MOCK';
  name = 'EduERP Test Mock SMS Gateway';

  async testConnection(credentials: Record<string, any>): Promise<SmsConnectionTestResult> {
    if (credentials.simulateAuthFail) {
      return { status: 'AUTHENTICATION_FAILED', message: 'Mock provider simulated auth failure.' };
    }
    if (credentials.simulateUnavailable) {
      return { status: 'PROVIDER_UNAVAILABLE', message: 'Mock provider simulated network downtime.' };
    }

    return {
      status: 'CONNECTED',
      message: 'Test mock SMS gateway connected successfully.',
      balance: 10000,
      currency: 'BDT'
    };
  }

  async sendMessage(credentials: Record<string, any>, params: SmsSendMessageParams): Promise<SmsProviderSendResult> {
    if (credentials.simulateSendFail) {
      return {
        success: false,
        status: 'FAILED',
        error: 'Mock provider simulated transmission failure.'
      };
    }

    return {
      success: true,
      status: 'SUBMITTED',
      providerMessageId: `MOCK-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      rawResponse: { status: 'SUCCESS', to: params.to, segmentCount: params.message.length > 160 ? 2 : 1 }
    };
  }

  async sendBulk(credentials: Record<string, any>, params: SmsSendBulkParams): Promise<SmsProviderBulkResult> {
    const results = params.recipients.map((phone) => ({
      phone,
      success: true,
      providerMessageId: `MOCK-BULK-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    }));

    return {
      success: true,
      totalSent: params.recipients.length,
      totalFailed: 0,
      results
    };
  }

  async checkBalance(credentials: Record<string, any>): Promise<{ balance: number; currency: string } | null> {
    return { balance: 10000, currency: 'BDT' };
  }
}
