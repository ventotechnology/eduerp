import { SmsProviderAdapter } from './types';
import { BanglalinkAdapter } from './banglalink.adapter';
import { GrameenphoneAdapter } from './grameenphone.adapter';
import { TeletalkAdapter } from './teletalk.adapter';
import { RobiAdapter } from './robi.adapter';
import { SslWirelessAdapter } from './ssl-wireless.adapter';
import { BulkSmsBdAdapter } from './bulksmsbd.adapter';
import { TwilioAdapter } from './twilio.adapter';
import { GenericHttpAdapter } from './generic-http.adapter';
import { TestMockAdapter } from './test-mock.adapter';

export * from './types';

const ADAPTER_MAP: Record<string, SmsProviderAdapter> = {
  BANGLALINK: new BanglalinkAdapter(),
  GRAMEENPHONE: new GrameenphoneAdapter(),
  GP: new GrameenphoneAdapter(),
  TELETALK: new TeletalkAdapter(),
  ROBI: new RobiAdapter(),
  AIRTEL: new RobiAdapter(),
  SSL_WIRELESS: new SslWirelessAdapter(),
  BULKSMSBD: new BulkSmsBdAdapter(),
  TWILIO: new TwilioAdapter(),
  GENERIC_HTTP: new GenericHttpAdapter(),
  TEST_MOCK: new TestMockAdapter()
};

export function getSmsAdapter(code: string): SmsProviderAdapter {
  const upper = (code || '').toUpperCase().trim();
  const adapter = ADAPTER_MAP[upper];
  if (!adapter) {
    // Fallback to Generic HTTP if unknown
    return ADAPTER_MAP.GENERIC_HTTP;
  }
  return adapter;
}

export function listSupportedSmsAdapters() {
  return [
    { code: 'BANGLALINK', name: 'Banglalink Corporate SMS', fields: ['userId', 'password', 'senderId'] },
    { code: 'GRAMEENPHONE', name: 'Grameenphone Corporate SMS', fields: ['username', 'password', 'apicode', 'senderId'] },
    { code: 'TELETALK', name: 'Teletalk Enterprise SMS', fields: ['userName', 'password', 'senderId'] },
    { code: 'ROBI', name: 'Robi / Airtel Gateway', fields: ['username', 'apiKey', 'senderId'] },
    { code: 'SSL_WIRELESS', name: 'SSL Wireless SMS', fields: ['apiToken', 'sid'] },
    { code: 'BULKSMSBD', name: 'BulkSMSBD Gateway', fields: ['apiKey', 'senderId'] },
    { code: 'TWILIO', name: 'Twilio SMS API', fields: ['accountSid', 'authToken', 'fromNumber'] },
    { code: 'GENERIC_HTTP', name: 'Generic HTTP REST API', fields: ['apiUrl', 'httpMethod', 'toParam', 'msgParam', 'senderParam'] },
    { code: 'TEST_MOCK', name: 'Test Mock Adapter (QA Isolated)', fields: ['mockName'] }
  ];
}
