import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendTextMessage } from '@/lib/whatsapp';

export async function POST(request: NextRequest) {
  try {
    const { contactName, phoneNumber, message, style, userId, contactId } = await request.json();

    if (!contactName || !phoneNumber || !message || !userId) {
      return NextResponse.json(
        { error: 'contactName, phoneNumber, message e userId são obrigatórios' },
        { status: 400 }
      );
    }

    // Check user exists and has credits
    const user = await db.user.findUnique({ where: { id: userId } });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    if (!user.isDev && user.credits < 1) {
      return NextResponse.json(
        { error: 'Créditos insuficientes. Adquira mais créditos para continuar enviando mensagens.' },
        { status: 403 }
      );
    }

    // ── Send via Baileys WhatsApp service ──
    let deliveryStatus: 'sent' | 'delivered' | 'failed' = 'sent';
    let statusDetail = '';
    let messageId: string | undefined;

    const waResult = await sendTextMessage(phoneNumber, message);

    if (waResult.success) {
      deliveryStatus = 'delivered';
      messageId = waResult.messageId;
      statusDetail = `WhatsApp messageId: ${messageId || 'N/A'}`;
    } else {
      deliveryStatus = 'failed';
      statusDetail = waResult.error || 'Erro ao enviar via WhatsApp';
    }

    // Save to message history
    const history = await db.messageHistory.create({
      data: {
        userId,
        contactId: contactId || 'unknown',
        contactName,
        phoneNumber,
        message,
        style: style || 'romantic',
        status: deliveryStatus,
        sentAt: new Date(),
        deliveredAt: deliveryStatus === 'delivered' ? new Date() : null,
      },
    });

    // Deduct credit (unless dev user)
    if (!user.isDev) {
      await db.user.update({
        where: { id: userId },
        data: { credits: { decrement: 1 } },
      });
    }

    // Build response
    if (deliveryStatus === 'delivered') {
      return NextResponse.json({
        success: true,
        message: 'Mensagem entregue via WhatsApp! 💕',
        history,
        wa: { messageId },
      });
    }

    return NextResponse.json({
      success: false,
      message: `Falha ao enviar: ${statusDetail}`,
      history,
      error: statusDetail,
    });
  } catch (error) {
    console.error('Message send error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}