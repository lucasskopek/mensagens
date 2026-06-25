import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendTextMessage } from '@/lib/zapi';

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

    // ── Try real Z-API send ──
    let zapiResult = null;
    let deliveryStatus: 'sent' | 'delivered' | 'failed' = 'sent';
    let statusDetail = '';

    const config = await db.userConfig.findUnique({ where: { userId } });

    if (config?.whatsappApiUrl && config?.whatsappApiToken && config?.whatsappInstanceName) {
      zapiResult = await sendTextMessage(
        {
          baseUrl: config.whatsappApiUrl,
          apiToken: config.whatsappApiToken,
          instanceId: config.whatsappInstanceName,
          clientToken: config.whatsappClientToken || undefined,
        },
        phoneNumber,
        message,
      );

      if (zapiResult.success) {
        deliveryStatus = 'delivered';
        statusDetail = `Z-API messageId: ${zapiResult.messageId || 'N/A'}`;
      } else {
        deliveryStatus = 'failed';
        statusDetail = zapiResult.error || 'Erro desconhecido na Z-API';
      }
    } else {
      // No Z-API configured → simulate (demo mode)
      deliveryStatus = 'sent';
      statusDetail = 'Modo demonstração (Z-API não configurada)';
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
        zapi: { messageId: zapiResult?.messageId, zapId: zapiResult?.zapId },
      });
    }

    if (deliveryStatus === 'failed') {
      return NextResponse.json({
        success: false,
        message: `Falha ao enviar via Z-API: ${statusDetail}`,
        history,
        error: statusDetail,
      });
    }

    // Demo mode
    return NextResponse.json({
      success: true,
      message: 'Mensagem enviada (modo demonstração) 💕',
      history,
      demo: true,
    });
  } catch (error) {
    console.error('Message send error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}