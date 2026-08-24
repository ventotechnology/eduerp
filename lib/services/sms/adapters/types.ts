export interface SmsSendMessageParams {
  to: string; // E.164 or normalized 8801XXXXXXXXX
  message: string;
  senderId?: string;
  isUnicode?: boolean;
}

export interface SmsSendBulkParams {
  recipients: string[];
  message: string;
  senderId?: string;
  isUnicode?: boolean;
}

export interface SmsProviderSendResult {
  success: boolean;
  providerMessageId?: string;
  status: 'SUBMITTED' | 'SENT' | 'FAILED';
  rawResponse?: any;
  error?: string;
}

export interface SmsProviderBulkResult {
  success: boolean;
  totalSent: number;
  totalFailed: number;
  results: {
    phone: string;
    success: boolean;
    providerMessageId?: string;
    error?: string;
  }[];
  rawResponse?: any;
}

export interface SmsConnectionTestResult {
  status: 'CONNECTED' | 'AUTHENTICATION_FAILED' | 'PROVIDER_UNAVAILABLE' | 'INVALID_CONFIGURATION';
  message: string;
  balance?: number;
  currency?: string;
}

export interface SmsProviderAdapter {
  code: string;
  name: string;
  testConnection(credentials: Record<string, any>, baseUrl?: string): Promise<SmsConnectionTestResult>;
  sendMessage(credentials: Record<string, any>, params: SmsSendMessageParams, baseUrl?: string): Promise<SmsProviderSendResult>;
  sendBulk(credentials: Record<string, any>, params: SmsSendBulkParams, baseUrl?: string): Promise<SmsProviderBulkResult>;
  checkBalance?(credentials: Record<string, any>, baseUrl?: string): Promise<{ balance: number; currency: string } | null>;
}
