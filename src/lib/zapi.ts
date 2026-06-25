/**
 * Z-API (z-api.io) WhatsApp Gateway Integration
 *
 * Docs: https://docs.z-api.io/
 *
 * Endpoint pattern:
 *   POST {baseUrl}/instances/{instanceId}/token/{apiToken}/{endpoint}
 *   Header: Client-Token: {clientToken}
 *
 * The Client-Token is an account-level security token configured in
 * panel.z-api.io → Security → Account Security Token.
 */

export interface ZApiConfig {
  baseUrl: string;      // e.g. "https://api.z-api.io"
  apiToken: string;     // Instance API token
  instanceId: string;   // Instance ID
  clientToken?: string; // Account security token (header)
}

export interface ZApiSendResult {
  success: boolean;
  messageId?: string;
  zapId?: string;
  error?: string;
  raw?: unknown;
}

export interface ZApiStatusResult {
  connected: boolean;
  phone?: string;
  battery?: number;
  pushName?: string;
  error?: string;
  raw?: unknown;
}

function buildUrl(config: ZApiConfig, endpoint: string): string {
  const base = config.baseUrl.replace(/\/+$/, '');
  return `${base}/instances/${config.instanceId}/token/${config.apiToken}/${endpoint}`;
}

function buildHeaders(config: ZApiConfig, json = true): Record<string, string> {
  const headers: Record<string, string> = {};
  if (json) headers['Content-Type'] = 'application/json';
  if (config.clientToken) headers['Client-Token'] = config.clientToken;
  return headers;
}

/**
 * Send a text message via Z-API
 */
export async function sendTextMessage(
  config: ZApiConfig,
  phone: string,
  message: string,
): Promise<ZApiSendResult> {
  // Clean phone: remove non-digits and ensure country code
  let cleanPhone = phone.replace(/\D/g, '');
  // If doesn't start with country code, assume Brazil (55)
  if (!cleanPhone.startsWith('55') && cleanPhone.length <= 11) {
    cleanPhone = '55' + cleanPhone;
  }

  const url = buildUrl(config, 'send-text');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: buildHeaders(config),
      body: JSON.stringify({
        phone: cleanPhone,
        message,
      }),
    });

    const data = await response.json();

    // Z-API returns various error formats
    if (data.error === true || data.error === 'true' || (typeof data.error === 'string' && data.error !== 'false')) {
      return {
        success: false,
        error: data.message || data.errorDescription || String(data.error) || 'Erro retornado pela Z-API',
        raw: data,
      };
    }

    const success = response.ok;
    return {
      success,
      messageId: data.id || data.messageId || String(data.zaapId || ''),
      zapId: data.zaapId || data.readOnly?.zaapId,
      error: success ? undefined : `HTTP ${response.status}: ${JSON.stringify(data)}`,
      raw: data,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Falha na conexão com Z-API',
    };
  }
}

/**
 * Check the WhatsApp instance connection status
 */
export async function checkInstanceStatus(
  config: ZApiConfig,
): Promise<ZApiStatusResult> {
  const url = buildUrl(config, 'status');

  try {
    const response = await fetch(url, {
      headers: buildHeaders(config, false),
    });
    const data = await response.json();

    // Check for error responses
    if (data.error) {
      return {
        connected: false,
        error: typeof data.error === 'string' ? data.error : JSON.stringify(data.error),
        raw: data,
      };
    }

    const isConnected = data.connected === true || data.smartphoneConnected === true;

    return {
      connected: isConnected,
      phone: data.phone || data.number,
      battery: data.battery,
      pushName: data.pushName,
      raw: data,
    };
  } catch (err) {
    return {
      connected: false,
      error: err instanceof Error ? err.message : 'Falha ao verificar status',
    };
  }
}

/**
 * Get QR Code for WhatsApp connection
 */
export async function getQrCode(
  config: ZApiConfig,
): Promise<{ qrCodeBase64?: string; error?: string }> {
  const url = buildUrl(config, 'qr-code');

  try {
    const response = await fetch(url, {
      headers: buildHeaders(config, false),
    });
    const data = await response.json();

    if (data.error) {
      return { error: typeof data.error === 'string' ? data.error : JSON.stringify(data.error) };
    }

    // Z-API returns the QR code as a base64 string in various formats
    const qrCode = data.value || data.qrCode || data.base64 || data.data;

    if (!qrCode) {
      return { error: 'QR Code não retornado pela Z-API' };
    }

    return { qrCodeBase64: qrCode };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Falha ao obter QR Code',
    };
  }
}