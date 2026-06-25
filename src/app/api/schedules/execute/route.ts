import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendTextMessage } from '@/lib/zapi';
import ZAI from 'z-ai-web-dev-sdk';

const STYLE_INSTRUCTIONS: Record<string, string> = {
  romantic: 'romântica — profunda, poética, cheia de sentimento. Use metáforas de amor, natureza e eternidade.',
  spicy: 'apimentada — ousada, provocante, com duplo sentido sutil. Crie tensão e desejo.',
  playful: 'brincalhona — divertida, leve, com humor e jogo de palavras.',
  serious: 'séria — focada em gratidão, companheirismo e parceria.',
};

const SYSTEM_PROMPT = `Você é uma especialista em relacionamentos amorosos. Sua missão é criar mensagens únicas para WhatsApp.
REGRAS:
- Escreva TODAS as mensagens em português brasileiro
- NUNCA repita clichês como "você é minha luz"
- Mensagens curtas: 1 a 3 parágrafos, adequadas para WhatsApp
- Use emojis de forma natural
- Pareça pessoal e genuína
- Escreva apenas a mensagem, sem aspas, sem título, sem explicações.`;

function getNowSaoPaulo(): { dateStr: string; timeStr: string } {
  const now = new Date();
  // Use Intl to get America/Sao_Paulo timezone components
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const get = (type: string) => parts.find(p => p.type === type)?.value || '';
  const dateStr = `${get('year')}-${get('month')}-${get('day')}`;
  const timeStr = `${get('hour')}:${get('minute')}`;
  return { dateStr, timeStr };
}

async function generateMessage(
  contactName: string,
  senderName: string,
  style: string,
  userId: string,
  contactId: string,
): Promise<string> {
  // Fetch recent messages for anti-duplication
  const recentHistory = await db.messageHistory.findMany({
    where: { userId, contactId, style },
    orderBy: { sentAt: 'desc' },
    take: 10,
    select: { message: true },
  });

  const recentMessages = recentHistory.map(h => h.message);
  const styleInstruction = STYLE_INSTRUCTIONS[style] || STYLE_INSTRUCTIONS.romantic;

  const userPrompt = `Gere uma mensagem ${styleInstruction}

Remetente: ${senderName}
Destinatário: ${contactName}
Estilo: ${style}

${recentMessages.length > 0 ? `MENSAGENS RECENTES (NÃO repita ideias similares):
${recentMessages.map((m, i) => `${i + 1}. ${m}`).join('\n')}` : ''}

Escreva apenas a mensagem.`;

  const zai = await ZAI.create();
  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    thinking: { type: 'disabled' },
  });

  return completion.choices?.[0]?.message?.content?.trim() || '';
}

export async function GET() {
  const results: { scheduleId: string; status: string; error?: string }[] = [];
  const { dateStr, timeStr } = getNowSaoPaulo();

  console.log(`[Scheduler] Checking at ${dateStr} ${timeStr}`);

  try {
    // Get all active schedules
    const schedules = await db.schedule.findMany({
      where: { active: true },
      include: { contact: true, user: true },
    });

    for (const schedule of schedules) {
      try {
        const sendTimes: string[] = JSON.parse(schedule.sendTimes);
        const styles: string[] = JSON.parse(schedule.messageStyles);
        const executionLog: string[] = JSON.parse(schedule.executionLog);

        // Check if current time matches any configured time
        if (!sendTimes.includes(timeStr)) continue;

        // Check if this is a valid date for the schedule
        if (!schedule.recurring) {
          const selectedDates: string[] = JSON.parse(schedule.selectedDates);
          if (!selectedDates.includes(dateStr)) continue;
        }

        // Check if already executed this slot
        const slot = `${dateStr}|${timeStr}`;
        if (executionLog.includes(slot)) continue;

        console.log(`[Scheduler] Executing schedule ${schedule.id} for ${schedule.contact.name} at ${slot}`);

        // Pick a random style from the configured ones
        const style = styles[Math.floor(Math.random() * styles.length)];

        // Generate AI message
        const message = await generateMessage(
          schedule.contact.name,
          schedule.user.name,
          style,
          schedule.userId,
          schedule.contactId,
        );

        if (!message) {
          results.push({ scheduleId: schedule.id, status: 'failed', error: 'IA não gerou mensagem' });
          continue;
        }

        // Send via Z-API
        let deliveryStatus: 'sent' | 'delivered' | 'failed' = 'sent';
        let statusDetail = '';

        const config = await db.userConfig.findUnique({ where: { userId: schedule.userId } });

        if (config?.whatsappApiUrl && config?.whatsappApiToken && config?.whatsappInstanceName) {
          const zapiResult = await sendTextMessage(
            {
              baseUrl: config.whatsappApiUrl,
              apiToken: config.whatsappApiToken,
              instanceId: config.whatsappInstanceName,
              clientToken: config.whatsappClientToken || undefined,
            },
            schedule.contact.phone,
            message,
          );

          if (zapiResult.success) {
            deliveryStatus = 'delivered';
            statusDetail = `Z-API messageId: ${zapiResult.messageId || 'N/A'}`;
          } else {
            deliveryStatus = 'failed';
            statusDetail = zapiResult.error || 'Erro na Z-API';
          }
        } else {
          deliveryStatus = 'sent';
          statusDetail = 'Modo demonstração (Z-API não configurada)';
        }

        // Save to message history
        await db.messageHistory.create({
          data: {
            userId: schedule.userId,
            contactId: schedule.contactId,
            contactName: schedule.contact.name,
            phoneNumber: schedule.contact.phone,
            message,
            style,
            status: deliveryStatus,
            sentAt: new Date(),
            deliveredAt: deliveryStatus === 'delivered' ? new Date() : null,
          },
        });

        // Update execution log
        executionLog.push(slot);
        await db.schedule.update({
          where: { id: schedule.id },
          data: { executionLog: JSON.stringify(executionLog) },
        });

        // Deduct credit (unless dev)
        if (!schedule.user.isDev) {
          await db.user.update({
            where: { id: schedule.userId },
            data: { credits: { decrement: 1 } },
          });
        }

        results.push({
          scheduleId: schedule.id,
          status: deliveryStatus,
          error: deliveryStatus === 'failed' ? statusDetail : undefined,
        });

        console.log(`[Scheduler] ✓ Sent to ${schedule.contact.name}: ${deliveryStatus}`);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[Scheduler] Error on schedule ${schedule.id}:`, errMsg);
        results.push({ scheduleId: schedule.id, status: 'failed', error: errMsg });
      }
    }

    return NextResponse.json({
      timestamp: `${dateStr} ${timeStr}`,
      checked: schedules.length,
      results,
    });
  } catch (error) {
    console.error('[Scheduler] Fatal error:', error);
    return NextResponse.json(
      { error: 'Erro interno do scheduler' },
      { status: 500 }
    );
  }
}