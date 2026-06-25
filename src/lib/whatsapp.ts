/**
 * WhatsApp Integration via Baileys Mini-Service
 *
 * The actual WhatsApp connection is managed by the Baileys mini-service.
 * This module provides typed functions that Next.js API routes call.
 *
 * Configure WA_SERVICE_URL env var to point to your Baileys service.
 * - Local dev:  http://127.0.0.1:3004
 * - Production: https://your-baileys-server.com
 *
 * Mini-service endpoints:
 *   GET  {WA_SERVICE_URL}/status
 *   GET  {WA_SERVICE_URL}/qr-code
 *   POST {WA_SERVICE_URL}/send-text
 *   POST {WA_SERVICE_URL}/logout
 */

const WA_SERVICE_BASE = process.env.WA_SERVICE_URL || 'http://127.0.0.1:3004';

/**
 * Whether the WhatsApp service is available.
 * - In production (Vercel): requires WA_SERVICE_URL to be explicitly set.
 * - In development: assumes the local Baileys service on port 3004 is available.
 */
export function isWaServiceConfigured(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return !!process.env.WA_SERVICE_URL;
  }
  // Development: always try the local service
  return true;
}

export interface WaSendResult {
  success: boolean;
  messageId?: string;
  remoteJid?: string;
  error?: string;
}

export interface WaStatusResult {
  connected: boolean;
  phone?: string | null;
  pushName?: string | null;
  battery?: number | null;
  error?: string | null;
  hasQrCode?: boolean;
}

/**
 * Send a text message via the Baileys WhatsApp service
 */
export async function sendTextMessage(
  phone: string,
  message: string,
): Promise<WaSendResult> {
  try {
    const response = await fetch(`${WA_SERVICE_BASE}/send-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message }),
    });

    const data = await response.json();

    if (!data.success) {
      return {
        success: false,
        error: data.error || 'Erro ao enviar mensagem',
      };
    }

    return {
      success: true,
      messageId: data.messageId,
      remoteJid: data.remoteJid,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Falha na conexão com o serviço WhatsApp',
    };
  }
}

/**
 * Check the WhatsApp connection status via the Baileys service
 */
export async function checkConnectionStatus(): Promise<WaStatusResult> {
  try {
    const response = await fetch(`${WA_SERVICE_BASE}/status`);
    const data = await response.json();

    return {
      connected: !!data.connected,
      phone: data.phone || null,
      pushName: data.pushName || null,
      battery: data.battery ?? null,
      error: data.error || null,
      hasQrCode: !!data.hasQrCode,
    };
  } catch (err) {
    return {
      connected: false,
      error: err instanceof Error ? err.message : 'Falha ao verificar status do WhatsApp',
    };
  }
}

/**
 * Get QR Code for WhatsApp connection
 */
export async function getQrCode(): Promise<{ qrCodeBase64?: string | null; connected?: boolean; error?: string }> {
  try {
    const response = await fetch(`${WA_SERVICE_BASE}/qr-code`);
    const data = await response.json();

    return {
      qrCodeBase64: data.qrCodeBase64 || null,
      connected: data.connected || false,
      error: data.error || null,
    };
  } catch (err) {
    return {
      qrCodeBase64: null,
      error: err instanceof Error ? err.message : 'Falha ao obter QR Code',
    };
  }
}

/**
 * Logout and clear WhatsApp session
 */
export async function logoutSession(): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${WA_SERVICE_BASE}/logout`, { method: 'POST' });
    const data = await response.json();

    return {
      success: !!data.success,
      error: data.error,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Falha ao desconectar',
    };
  }
}