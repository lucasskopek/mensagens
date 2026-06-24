import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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

    // Save to message history with "sent" status (simulated WhatsApp send)
    const history = await db.messageHistory.create({
      data: {
        userId,
        contactId: contactId || 'unknown',
        contactName,
        phoneNumber,
        message,
        style: style || 'romantic',
        status: 'sent',
        sentAt: new Date(),
      },
    });

    // Deduct credit (unless dev user)
    if (!user.isDev) {
      await db.user.update({
        where: { id: userId },
        data: { credits: { decrement: 1 } },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Mensagem enviada com sucesso! 💕',
      history,
    });
  } catch (error) {
    console.error('Message send error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}