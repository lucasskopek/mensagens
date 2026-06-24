/**
 * Z-API WhatsApp Integration Service
 * Docs: https://developer.z-api.io/
 *
 * Endpoint pattern:
 *   {baseUrl}/instances/{instanceId}/token/{apiToken}/{action}
 *
 * Supported actions:
 *   - send-text        → POST  Send plain text message
 *   - status           → GET   Check instance connection status
 *   - fetch-messages   → GET   Get received messages
 */

export interface ZApiConfig {
  baseUrl: string;       // e.g. "https://api.z-api.io"
  apiToken: string;      // Instance API Token
  instanceId: string;    // Instance name/ID
}

export interface ZApiSendResult {
  success: boolean;
  messageId?: string;
  zapId?: string;
  error?: string;
  details?: string;
}

export interface ZApiStatusResult {
  connected: boolean;
  phone?: string;
  battery?: number;
  pushName?: string;
  error?: string;
}

function buildUrl(config: ZApiConfig, action: string): string {
  const base = config.baseUrl.replace(/\/+$/, '');
  return `${base}/instances/${config.instanceId}/token/${config.apiToken}/${action}`;
}

/**
 * Send a text message via Z-API
 */
export async function sendTextMessage(
  config: ZApiConfig,
  phone: string,
  message: string
): Promise<ZApiSendResult> {
  // Clean phone: remove non-digits, ensure country code
  const cleanPhone = phone.replace(/\D/g, '');

  const url = buildUrl(config, 'send-text');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        phone: cleanPhone,
        message,
      }),
    });

    const data = await response.json();

    // Z-API returns { zaapId, messageId, error, ... }
    if (data.error) {
      return {
        success: false,
        error: data.error,
        details: `Z-API error code: ${data.error}`,
      };
    }

    return {
      success: true,
      messageId: data.messageId || data.id,
      zapId: data.zaapId,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    return {
      success: false,
      error: msg,
      details: `Falha ao conectar com Z-API em ${config.baseUrl}`,
    };
  }
}

/**
 * Check WhatsApp instance connection status
 */
export async function checkInstanceStatus(
  config: ZApiConfig
): Promise<ZApiStatusResult> {
  const url = buildUrl(config, 'status');

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return {
        connected: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();

    // Z-API status response: { connected: true, phone, battery, pushName, ... }
    return {
      connected: data.connected === true || data.connected === 'true',
      phone: data.phone,
      battery: data.battery,
      pushName: data.pushName,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    return {
      connected: false,
      error: msg,
    };
  }
}