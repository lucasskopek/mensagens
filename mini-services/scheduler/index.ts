/**
 * WhatsRomance Scheduler Service
 * 
 * Runs every 60 seconds, checks all active schedules,
 * and sends AI-generated messages via Z-API at configured times.
 * 
 * Port: 3002
 */

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();
const PORT = 3002;
const CHECK_INTERVAL_MS = 60_000; // 1 minute
const TIMEZONE = 'America/Sao_Paulo';

// ── Z-API Send ──
async function sendViaZApi(
  config: { baseUrl: string; apiToken: string; instanceId: string },
  phone: string,
  message: string,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  let cleanPhone = phone.replace(/\D/g, '');
  if (!cleanPhone.startsWith('55') && cleanPhone.length <= 11) {
    cleanPhone = '55' + cleanPhone;
  }

  const base = config.baseUrl.replace(/\/+$/, '');
  const url = `${base}/instances/${config.instanceId}/token/${config.apiToken}/send-text`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: cleanPhone, message }),
    });
    const data = await res.json();

    if (data.error === true || data.error === 'true') {
      return { success: false, error: data.message || 'Erro Z-API' };
    }
    return {
      success: res.ok,
      messageId: data.id || data.messageId || String(data.zaapId || ''),
      error: res.ok ? undefined : `HTTP ${res.status}`,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Falha Z-API' };
  }
}

// ── AI Message Generation (inline, using fetch to localhost) ──
async function generateMessage(
  contactName: string,
  senderName: string,
  style: string,
  userId: string,
  contactId: string,
): Promise<string> {
  const res = await fetch(`http://localhost:3000/api/messages/generate?XTransformPort=3000`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contactName, senderName, style, userId, contactId }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.message;
}

// ── Main scheduler tick ──
async function tick() {
  const now = new Date();
  const currentTime = now.toLocaleTimeString('pt-BR', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }); // "08:00"

  const todayStr = now.toLocaleDateString('sv-SE', { timeZone: TIMEZONE }); // "2026-06-25"

  console.log(`[${new Date().toISOString()}] Tick — checking schedules at ${currentTime} (${TIMEZONE})`);

  // Get all active schedules
  const schedules = await db.schedule.findMany({
    where: { active: true },
    include: {
      user: true,
      contact: true,
    },
  });

  if (schedules.length === 0) {
    console.log('  No active schedules found.');
    return;
  }

  let sentCount = 0;

  for (const schedule of schedules) {
    const sendTimes: string[] = JSON.parse(schedule.sendTimes);
    const styles: string[] = JSON.parse(schedule.messageStyles);

    // Check if current time matches any of the schedule's times
    if (!sendTimes.includes(currentTime)) continue;

    // Check if a message was already sent today for this schedule+contact
    // (look for messages sent in the last 5 minutes for this contact to prevent duplicates)
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const recentMsg = await db.messageHistory.findFirst({
      where: {
        userId: schedule.userId,
        contactId: schedule.contactId,
        sentAt: { gte: fiveMinAgo },
      },
    });

    if (recentMsg) {
      console.log(`  ⏭️  Skipping ${schedule.contact.name} — message already sent at ${recentMsg.sentAt.toISOString()}`);
      continue;
    }

    // Get user's Z-API config
    const config = await db.userConfig.findUnique({ where: { userId: schedule.userId } });
    if (!config?.whatsappApiToken || !config?.whatsappInstanceName) {
      console.log(`  ⚠️  No Z-API config for user ${schedule.user.email}, skipping`);
      continue;
    }

    // Pick a random style from the schedule's styles
    const chosenStyle = styles[Math.floor(Math.random() * styles.length)];

    try {
      // Generate AI message
      console.log(`  🤖 Generating ${chosenStyle} message for ${schedule.contact.name}...`);
      const message = await generateMessage(
        schedule.contact.name,
        schedule.user.name,
        chosenStyle,
        schedule.userId,
        schedule.contactId,
      );

      // Send via Z-API
      console.log(`  📤 Sending to ${schedule.contact.phone}...`);
      const result = await sendViaZApi(
        {
          baseUrl: config.whatsappApiUrl,
          apiToken: config.whatsappApiToken,
          instanceId: config.whatsappInstanceName,
        },
        schedule.contact.phone,
        message,
      );

      // Save to history
      const status = result.success ? 'delivered' : 'failed';
      await db.messageHistory.create({
        data: {
          userId: schedule.userId,
          contactId: schedule.contactId,
          contactName: schedule.contact.name,
          phoneNumber: schedule.contact.phone,
          message,
          style: chosenStyle,
          status,
          sentAt: now,
          deliveredAt: result.success ? now : null,
        },
      });

      if (result.success) {
        console.log(`  ✅ Sent to ${schedule.contact.name} (${chosenStyle}) — messageId: ${result.messageId}`);
        sentCount++;
      } else {
        console.log(`  ❌ Failed for ${schedule.contact.name}: ${result.error}`);
      }
    } catch (err) {
      console.error(`  💥 Error processing schedule for ${schedule.contact.name}:`, err);
    }
  }

  if (sentCount > 0) {
    console.log(`[${new Date().toISOString()}] ✅ Sent ${sentCount} scheduled message(s)`);
  }
}

// ── Health check endpoint ──
const server = Bun.serve({
  port: PORT,
  fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === '/health') {
      return Response.json({ status: 'ok', scheduler: 'running', timezone: TIMEZONE });
    }
    if (url.pathname === '/trigger') {
      // Manual trigger endpoint
      tick().catch(console.error);
      return Response.json({ triggered: true });
    }
    return Response.json({ error: 'not found' }, { status: 404 });
  },
});

console.log(`🚀 WhatsRomance Scheduler running on port ${PORT}`);
console.log(`   Timezone: ${TIMEZONE}`);
console.log(`   Check interval: ${CHECK_INTERVAL_MS / 1000}s`);
console.log(`   Health: http://localhost:${PORT}/health`);
console.log(`   Manual trigger: http://localhost:${PORT}/trigger`);
console.log('');

// Run immediately on startup
tick().catch(console.error);

// Then run every minute
setInterval(() => {
  tick().catch(console.error);
}, CHECK_INTERVAL_MS);