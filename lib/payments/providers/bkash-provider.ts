export interface BkashCredentials {
  appKey: string;
  appSecret: string;
  username: string;
  password: string;
  baseUrl: string;
  isSandbox: boolean;
}

export interface BkashCreatePaymentInput {
  amount: number;
  currency?: string;
  merchantInvoiceNumber: string;
  callbackUrl: string;
  payerReference?: string;
  intent?: 'sale' | 'authorization';
}

export interface BkashCreatePaymentResult {
  success: boolean;
  paymentId?: string;
  bkashUrl?: string; // Redirect URL
  statusCode?: string;
  statusMessage?: string;
  rawResponse?: any;
}

export interface BkashExecutePaymentResult {
  success: boolean;
  paymentId?: string;
  trxId?: string;
  transactionStatus?: string;
  amount?: number;
  currency?: string;
  merchantInvoiceNumber?: string;
  statusCode?: string;
  statusMessage?: string;
  rawResponse?: any;
}

export interface BkashQueryPaymentResult {
  success: boolean;
  paymentId?: string;
  trxId?: string;
  transactionStatus?: string;
  amount?: number;
  currency?: string;
  merchantInvoiceNumber?: string;
  statusCode?: string;
  statusMessage?: string;
  rawResponse?: any;
}

// In-memory token cache
let cachedToken: {
  idToken: string;
  expiresAt: number;
  baseUrl: string;
} | null = null;

let inFlightTokenPromise: Promise<{ idToken: string; expiresAt: number; baseUrl: string }> | null = null;

export class BkashPaymentProvider {
  /**
   * Resolves bKash credentials from environment variables safely
   */
  public static getCredentials(): BkashCredentials | null {
    const appKey = process.env.BKASH_APP_KEY;
    const appSecret = process.env.BKASH_APP_SECRET;
    const username = process.env.BKASH_USERNAME;
    const password = process.env.BKASH_PASSWORD;
    const isSandbox = process.env.BKASH_IS_SANDBOX === 'true' || process.env.BKASH_MODE === 'sandbox' || !process.env.BKASH_APP_KEY;
    const baseUrl =
      process.env.BKASH_BASE_URL ||
      (isSandbox ? 'https://checkout.sandbox.bka.sh/v1.2.0-beta' : 'https://checkout.pay.bka.sh/v1.2.0-beta');

    if (appKey && appSecret && username && password) {
      return {
        appKey: appKey.trim(),
        appSecret: appSecret.trim(),
        username: username.trim(),
        password: password.trim(),
        baseUrl: baseUrl.trim(),
        isSandbox,
      };
    }

    return null;
  }

  /**
   * Fetches or reuses cached bKash grant token with in-flight deduplication
   */
  public static async getGrantToken(customCreds?: BkashCredentials): Promise<{ idToken: string; expiresAt: number; baseUrl: string }> {
    const now = Date.now();
    if (!customCreds && cachedToken && cachedToken.expiresAt > now + 60000) {
      return cachedToken;
    }

    if (!customCreds && inFlightTokenPromise) {
      return inFlightTokenPromise;
    }

    const creds = customCreds || this.getCredentials();
    if (!creds) {
      throw new Error('bKash gateway credentials not configured.');
    }

    const fetchToken = async () => {
      const candidateUrls = [
        `${creds.baseUrl}/tokenized/checkout/token/grant`,
        `${creds.baseUrl}/checkout/token/grant`,
      ];

      let lastError = 'Authentication failed';

      for (const url of candidateUrls) {
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              username: creds.username,
              password: creds.password,
            },
            body: JSON.stringify({
              app_key: creds.appKey,
              app_secret: creds.appSecret,
            }),
          });

          if (!res.ok && res.status === 404) continue;

          const data = await res.json();

          if (res.ok && (data.statusCode === '0000' || data.id_token) && data.id_token) {
            const expiresInSec = Number(data.expires_in) || 3600;
            const tokenResult = {
              idToken: data.id_token,
              expiresAt: Date.now() + expiresInSec * 1000,
              baseUrl: creds.baseUrl,
            };

            if (!customCreds) {
              cachedToken = tokenResult;
            }

            return tokenResult;
          }

          if (data.statusMessage) {
            lastError = data.statusMessage;
          }
        } catch (err: any) {
          lastError = err.message;
        }
      }

      throw new Error(`bKash Token Grant Error: ${lastError}`);
    };

    if (!customCreds) {
      inFlightTokenPromise = fetchToken().finally(() => {
        inFlightTokenPromise = null;
      });
      return inFlightTokenPromise;
    }

    return fetchToken();
  }

  /**
   * Tests the connection to bKash API without exposing credentials
   */
  public static async testConnection(customCreds?: BkashCredentials): Promise<{
    status: 'CONNECTED' | 'AUTHENTICATION_FAILED' | 'NETWORK_ERROR' | 'NOT_CONFIGURED';
    latencyMs: number;
    message: string;
    isSandbox: boolean;
  }> {
    const startTime = Date.now();
    const creds = customCreds || this.getCredentials();
    if (!creds) {
      return {
        status: 'NOT_CONFIGURED',
        latencyMs: 0,
        message: 'bKash credentials are not configured in environment.',
        isSandbox: false,
      };
    }

    try {
      const token = await this.getGrantToken(creds);
      const latencyMs = Date.now() - startTime;

      if (token.idToken) {
        return {
          status: 'CONNECTED',
          latencyMs,
          message: `Connected successfully to bKash ${creds.isSandbox ? 'Sandbox' : 'Production'} API (${latencyMs}ms)`,
          isSandbox: creds.isSandbox,
        };
      } else {
        return {
          status: 'AUTHENTICATION_FAILED',
          latencyMs,
          message: 'Failed to obtain authorization token from bKash.',
          isSandbox: creds.isSandbox,
        };
      }
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      return {
        status: 'AUTHENTICATION_FAILED',
        latencyMs,
        message: err.message || 'bKash connection error',
        isSandbox: creds.isSandbox,
      };
    }
  }

  /**
   * Creates a bKash checkout payment request
   */
  public static async createPayment(input: BkashCreatePaymentInput, customCreds?: BkashCredentials): Promise<BkashCreatePaymentResult> {
    const creds = customCreds || this.getCredentials();
    if (!creds) {
      throw new Error('bKash credentials not configured.');
    }

    const { idToken, baseUrl } = await this.getGrantToken(creds);
    const candidateUrls = [
      `${baseUrl}/tokenized/checkout/create`,
      `${baseUrl}/checkout/payment/create`,
      `${baseUrl}/checkout/create`,
    ];

    let lastError = 'bKash create payment failed';
    let lastData: any = null;

    for (const url of candidateUrls) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: idToken,
            'X-App-Key': creds.appKey,
          },
          body: JSON.stringify({
            mode: '0011',
            payerReference: input.payerReference || '01700000000',
            callbackURL: input.callbackUrl,
            amount: input.amount.toFixed(2),
            currency: input.currency || 'BDT',
            intent: input.intent || 'sale',
            merchantInvoiceNumber: input.merchantInvoiceNumber,
          }),
        });

        if (!res.ok && res.status === 404) continue;

        const data = await res.json();
        lastData = data;

        const redirectUrl =
          (typeof data.bkashURL === 'string' && data.bkashURL.startsWith('http'))
            ? data.bkashURL
            : (typeof data.bkashUrl === 'string' && data.bkashUrl.startsWith('http'))
              ? data.bkashUrl
              : (typeof data.redirectURL === 'string' && data.redirectURL.startsWith('http'))
                ? data.redirectURL
                : (typeof data.paymentURL === 'string' && data.paymentURL.startsWith('http'))
                  ? data.paymentURL
                  : undefined;

        if ((data.statusCode === '0000' || data.paymentID) && (redirectUrl || data.transactionStatus === 'Initiated' || data.paymentID)) {
          return {
            success: true,
            paymentId: data.paymentID,
            bkashUrl: redirectUrl,
            statusCode: data.statusCode || '0000',
            statusMessage: data.statusMessage || 'Success',
            rawResponse: data,
          };
        }

        if (data.statusMessage || data.errorMessage) {
          lastError = data.statusMessage || data.errorMessage;
        }
      } catch (err: any) {
        lastError = err.message;
      }
    }

    return {
      success: false,
      statusCode: lastData?.statusCode || lastData?.errorCode || 'FAILED',
      statusMessage: lastError || 'bKash create payment failed',
      rawResponse: lastData,
    };
  }

  /**
   * Executes and verifies a payment after customer approval
   */
  public static async executePayment(paymentId: string, customCreds?: BkashCredentials): Promise<BkashExecutePaymentResult> {
    const creds = customCreds || this.getCredentials();
    if (!creds) {
      throw new Error('bKash credentials not configured.');
    }

    const { idToken, baseUrl } = await this.getGrantToken(creds);
    const candidates = [
      { url: `${baseUrl}/tokenized/checkout/execute`, body: JSON.stringify({ paymentID: paymentId }) },
      { url: `${baseUrl}/checkout/payment/execute/${paymentId}`, body: undefined },
      { url: `${baseUrl}/checkout/execute`, body: JSON.stringify({ paymentID: paymentId }) },
    ];

    let lastError = 'Payment execution failed';
    let lastData: any = null;

    for (const cand of candidates) {
      try {
        const res = await fetch(cand.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: idToken,
            'X-App-Key': creds.appKey,
          },
          ...(cand.body ? { body: cand.body } : {}),
        });

        if (!res.ok && res.status === 404) continue;

        const data = await res.json();
        lastData = data;

        const isSuccess =
          (data.statusCode === '0000' || !data.errorCode) &&
          (data.transactionStatus === 'Completed' || data.trxID || data.trxId);

        if (isSuccess) {
          return {
            success: true,
            paymentId: data.paymentID || paymentId,
            trxId: data.trxID || data.trxId,
            transactionStatus: data.transactionStatus || 'Completed',
            amount: Number(data.amount),
            currency: data.currency || 'BDT',
            merchantInvoiceNumber: data.merchantInvoiceNumber,
            statusCode: data.statusCode || '0000',
            statusMessage: data.statusMessage || 'Payment executed successfully',
            rawResponse: data,
          };
        }

        if (data.statusMessage || data.errorMessage) {
          lastError = data.statusMessage || data.errorMessage;
        }
      } catch (err: any) {
        lastError = err.message;
      }
    }

    return {
      success: false,
      paymentId,
      statusCode: lastData?.statusCode || lastData?.errorCode || 'FAILED',
      statusMessage: lastError || 'Payment execution failed or declined by customer',
      rawResponse: lastData,
    };
  }

  /**
   * Queries the status of a bKash payment
   */
  public static async queryPayment(paymentId: string, customCreds?: BkashCredentials): Promise<BkashQueryPaymentResult> {
    const creds = customCreds || this.getCredentials();
    if (!creds) {
      throw new Error('bKash credentials not configured.');
    }

    const { idToken, baseUrl } = await this.getGrantToken(creds);
    const candidates = [
      { url: `${baseUrl}/tokenized/checkout/payment/query`, body: JSON.stringify({ paymentID: paymentId }) },
      { url: `${baseUrl}/checkout/payment/query/${paymentId}`, body: undefined },
    ];

    let lastError = 'Payment query failed';
    let lastData: any = null;

    for (const cand of candidates) {
      try {
        const res = await fetch(cand.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: idToken,
            'X-App-Key': creds.appKey,
          },
          ...(cand.body ? { body: cand.body } : {}),
        });

        if (!res.ok && res.status === 404) continue;

        const data = await res.json();
        lastData = data;

        if (data.statusCode === '0000' || data.paymentID) {
          return {
            success: true,
            paymentId: data.paymentID,
            trxId: data.trxID || data.trxId,
            transactionStatus: data.transactionStatus,
            amount: Number(data.amount),
            currency: data.currency || 'BDT',
            merchantInvoiceNumber: data.merchantInvoiceNumber,
            statusCode: data.statusCode || '0000',
            statusMessage: data.statusMessage,
            rawResponse: data,
          };
        }
      } catch (err: any) {
        lastError = err.message;
      }
    }

    return {
      success: false,
      paymentId,
      statusCode: lastData?.statusCode || 'FAILED',
      statusMessage: lastError || 'Query payment failed',
      rawResponse: lastData,
    };
  }

  /**
   * Initiates a refund for an executed bKash payment
   */
  public static async refundPayment(params: {
    paymentId: string;
    trxId: string;
    amount: number;
    reason?: string;
    sku?: string;
  }, customCreds?: BkashCredentials): Promise<{
    success: boolean;
    refundTrxId?: string;
    statusCode?: string;
    statusMessage?: string;
    rawResponse?: any;
  }> {
    const creds = customCreds || this.getCredentials();
    if (!creds) {
      throw new Error('bKash credentials not configured.');
    }

    const { idToken, baseUrl } = await this.getGrantToken(creds);
    const url = `${baseUrl}/tokenized/checkout/payment/refund`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: idToken,
          'X-App-Key': creds.appKey,
        },
        body: JSON.stringify({
          paymentID: params.paymentId,
          trxID: params.trxId,
          amount: params.amount.toFixed(2),
          reason: params.reason || 'Requested refund',
          sku: params.sku || 'REFUND'
        }),
      });

      const data = await res.json();
      if (data.statusCode === '0000' || data.refundTrxID) {
        return {
          success: true,
          refundTrxId: data.refundTrxID || data.refundTrxId,
          statusCode: data.statusCode,
          statusMessage: data.statusMessage || 'Refund successful',
          rawResponse: data
        };
      }

      return {
        success: false,
        statusCode: data.statusCode || 'FAILED',
        statusMessage: data.statusMessage || 'bKash refund failed',
        rawResponse: data
      };
    } catch (err: any) {
      return {
        success: false,
        statusCode: 'EXCEPTION',
        statusMessage: err.message || 'Refund exception',
      };
    }
  }
}
