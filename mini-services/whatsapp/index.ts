/**
 * WhatsRomance — Baileys WhatsApp Service
 *
 * A lightweight REST API wrapping @whiskeysockets/baileys for
 * sending WhatsApp messages, QR code authentication, and status monitoring.
 *
 * Endpoints:
 *   GET  /status          — connection status
 *   GET  /qr-code         — get QR code as base64 PNG (or null if connected)
 *   POST /send-text       — send a text message { phone, message }
 *   POST /logout          — disconnect and clear session
 */

import makeWASocket, {
  type WASocket,
  type ConnectionState,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import pino from 'pino';
import { rm } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PORT = 3004;
const AUTH_DIR = join(__dirname, 'auth_state');

// ─── State ────────────────────────────────────────────────
let sock: WASocket | null = null;
let isConnected = false;
let connectionError = '';
let qrCodeBase64: string | null = null;
let savedCreds: ((data: unknown) => void) | null = null;
let phoneInfo: { phone?: string; pushName?: string; battery?: number } = {};

// ─── Helpers ──────────────────────────────────────────────
function cleanPhone(phone: string): string {
  let digits = phone.replace(/\D/g, '');
  // If doesn't start with country code, assume Brazil (55)
  if (!digits.startsWith('55') && digits.length <= 11) {
    digits = '55' + digits;
  }
  return digits + '@s.whatsapp.net';
}

function log(level: string, msg: string, ...args: unknown[]) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [${level}] ${msg}`, ...args.length ? args : '');
}

// ─── QR Code Generation ──────────────────────────────────
async function generateQrImage(qrString: string): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(qrString, {
      width: 512,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    });
    // Return just the base64 part (strip data:image/png;base64, prefix)
    return dataUrl.replace(/^data:image\/png;base64,/, '');
  } catch (err) {
    log('ERROR', 'Failed to generate QR image:', err);
    return '';
  }
}

// ─── Connection ──────────────────────────────────────────
async function connectToWhatsApp() {
  log('INFO', 'Starting WhatsApp connection...');

  // Clean up old socket if exists
  if (sock) {
    try { sock.end(new Error('reconnecting')); } catch {}
    sock = null;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks -- Baileys function, not a React hook
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  savedCreds = saveCreds as (data: unknown) => void;

  try {
    const { version } = await fetchLatestBaileysVersion();
    log('INFO', `Using Baileys v${version.join('.')}`);
  } catch {
    log('WARN', 'Could not fetch latest Baileys version, using default');
  }

  const silentLogger = pino({ level: 'silent' });

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: false, // We handle QR ourselves
    logger: silentLogger,
    shouldSyncHistoryMessage: () => false,
    generateHighQualityLinkPreview: false,
  });

  sock.ev.on('creds.update', (update) => {
    if (savedCreds) savedCreds(update);
  });

  sock.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      log('INFO', 'QR Code received, generating image...');
      qrCodeBase64 = await generateQrImage(qr);
      if (qrCodeBase64) {
        log('INFO', 'QR Code image generated successfully');
      } else {
        log('ERROR', 'QR Code image generation failed');
      }
    }

    if (connection === 'close') {
      const boom = lastDisconnect?.error as Boom | undefined;
      const statusCode = boom?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      isConnected = false;

      if (statusCode === DisconnectReason.loggedOut) {
        connectionError = 'Sessão desconectada. Escaneie o QR Code novamente.';
        qrCodeBase64 = null;
        log('WARN', 'Logged out, session cleared');
        // Clear auth state
        try {
          await rm(AUTH_DIR, { recursive: true, force: true });
          log('INFO', 'Auth state cleared');
        } catch {}
        // Restart fresh connection
        setTimeout(() => connectToWhatsApp(), 2000);
      } else if (statusCode === 405) {
        // 405 = Connection failure (often IP blocked by WhatsApp in cloud/sandbox envs)
        connectionError = 'WhatsApp bloqueou a conexão (405). Isso pode ocorrer em ambientes de nuvem/sandbox. Em um servidor real, funciona normalmente.';
        log('WARN', '405 Connection Failure — likely sandbox/cloud IP restriction');
        // Still try to reconnect in case it's transient
        if (shouldReconnect) setTimeout(() => connectToWhatsApp(), 30000);
      } else if (statusCode === DisconnectReason.connectionClosed) {
        connectionError = 'Conexão fechada. Reconectando...';
        log('WARN', 'Connection closed, reconnecting...');
        if (shouldReconnect) setTimeout(() => connectToWhatsApp(), 5000);
      } else if (statusCode === DisconnectReason.connectionLost) {
        connectionError = 'Conexão perdida. Reconectando...';
        log('WARN', 'Connection lost, reconnecting...');
        if (shouldReconnect) setTimeout(() => connectToWhatsApp(), 5000);
      } else {
        connectionError = `Desconectado (${statusCode || 'unknown'}). Reconectando...`;
        log('WARN', 'Disconnected:', statusCode, boom?.message || '');
        if (shouldReconnect) setTimeout(() => connectToWhatsApp(), 5000);
      }
    }

    if (connection === 'open') {
      isConnected = true;
      connectionError = '';
      qrCodeBase64 = null; // No longer needed once connected

      // Try to get phone info
      if (sock?.user) {
        const jid = sock.user.id;
        const phone = jid.replace(/:.*@/, '').replace('@s.whatsapp.net', '');
        phoneInfo = {
          phone,
          pushName: sock.user.name || undefined,
        };
        log('INFO', `Connected as ${phone} (${phoneInfo.pushName || 'no name'})`);
      } else {
        log('INFO', 'Connected to WhatsApp');
      }
    }
  });

  // Handle incoming messages (just log, don't process)
  sock.ev.on('messages.upsert', ({ messages }) => {
    for (const msg of messages) {
      if (!msg.key.fromMe) {
        log('DEBUG', `Received message from ${msg.key.remoteJid}`);
      }
    }
  });
}

// ─── HTTP Server ─────────────────────────────────────────
import { createServer } from 'http';

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  const path = url.pathname;

  // CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    return res.end();
  }

  const sendJson = (data: unknown, status = 200) => {
    res.writeHead(status, { 'Content-Type': 'application/json', ...corsHeaders });
    res.end(JSON.stringify(data));
  };

  try {
    // ── GET /status ──
    if (path === '/status' && req.method === 'GET') {
      return sendJson({
        connected: isConnected,
        phone: phoneInfo.phone || null,
        pushName: phoneInfo.pushName || null,
        battery: phoneInfo.battery || null,
        error: connectionError || null,
        hasQrCode: !!qrCodeBase64,
      });
    }

    // ── GET /qr-code ──
    if (path === '/qr-code' && req.method === 'GET') {
      if (isConnected) {
        return sendJson({
          qrCodeBase64: null,
          connected: true,
          message: 'WhatsApp já está conectado',
        });
      }
      return sendJson({
        qrCodeBase64: qrCodeBase64 || null,
        connected: false,
        error: !qrCodeBase64 ? connectionError || 'Aguardando QR Code...' : null,
      });
    }

    // ── POST /send-text ──
    if (path === '/send-text' && req.method === 'POST') {
      if (!isConnected || !sock) {
        return sendJson({
          success: false,
          error: 'WhatsApp não está conectado. Escaneie o QR Code primeiro.',
        }, 400);
      }

      const body = await new Promise<any>((resolve, reject) => {
        let data = '';
        req.on('data', chunk => { data += chunk; });
        req.on('end', () => {
          try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
        });
        req.on('error', reject);
      });
      const { phone, message } = body;

      if (!phone || !message) {
        return sendJson({
          success: false,
          error: 'phone e message são obrigatórios',
        }, 400);
      }

      const jid = cleanPhone(phone);
      log('INFO', `Sending message to ${jid}`);

      try {
        const result = await sock.sendMessage(jid, { text: message });
        return sendJson({
          success: true,
          messageId: result.key.id,
          remoteJid: result.key.remoteJid,
          status: 'sent',
        });
      } catch (err: any) {
        log('ERROR', 'Send failed:', err?.message || err);
        return sendJson({
          success: false,
          error: err?.message || 'Falha ao enviar mensagem',
        }, 500);
      }
    }

    // ── POST /logout ──
    if (path === '/logout' && req.method === 'POST') {
      if (sock) {
        try { sock.end(new Error('logout')); } catch {}
        sock = null;
      }
      isConnected = false;
      phoneInfo = {};
      qrCodeBase64 = null;
      connectionError = 'Desconectado manualmente';

      // Clear auth state
      try {
        await rm(AUTH_DIR, { recursive: true, force: true });
      } catch {}

      // Reconnect for new QR
      setTimeout(() => connectToWhatsApp(), 2000);

      return sendJson({
        success: true,
        message: 'Sessão encerrada. Escaneie um novo QR Code.',
      });
    }

    // ── 404 ──
    return sendJson({ error: 'Endpoint not found' }, 404);

  } catch (err: any) {
    log('ERROR', 'Request error:', err?.message || err);
    return sendJson({ error: 'Internal server error' }, 500);
  }
});

server.listen(PORT, () => {
  log('INFO', `🚀 WhatsApp Baileys Service running on port ${PORT}`);
});

// Start the connection
connectToWhatsApp().catch(err => {
  log('ERROR', 'Failed to start WhatsApp connection:', err);
});