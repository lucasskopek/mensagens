/**
 * Z-API (z-api.io) WhatsApp Gateway Integration
 *
 * Docs: https://docs.z-api.io/
 *
 * Endpoint pattern:
 *   POST {baseUrl}/instances/{instanceId}/token/{apiToken}/send-text
 *   GET  {baseUrl}/instances/{instanceId}/token/{apiToken}/status
 */

export interface ZApiConfig {
  baseUrl: string;    // e.g. "https://api.z-api.io"
  apiToken: string;   // e.g. "A5952CF5C5A11E0654F91542"
  instanceId: string; // e.g. "3F5217F0ED99C172B0886272DDAD8C6F"
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: cleanPhone,
        message,
      }),
    });

    const data = await response.json();

    // Z-API returns { zaapId, id, messageId } on success
    // or { error: true, message: "..." } on failure
    if (data.error === true || data.error === 'true') {
      return {
        success: false,
        error: data.message || data.errorDescription || 'Erro retornado pela Z-API',
        raw: data,
      };
    }

    // Successful responses vary but typically include an id/zaapId
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
    const response = await fetch(url);
    const data = await response.json();

    // Z-API status response format:
    // { connected: true, session: false, smartphoneConnected: true, ... }
    const isConnected = data.connected === true || data.smartphoneConnected === true;

    return {
      connected: isConnected,
      raw: data,
    };
  } catch (err) {
    return {
      connected: false,
      error: err instanceof Error ? err.message : 'Falha ao verificar status',
    };
  }
}