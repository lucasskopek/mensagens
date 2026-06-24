import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { userId, amount, planName } = await request.json();

    if (!userId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'userId e amount (positivo) são obrigatórios' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, credits: true, isDev: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { credits: { increment: amount } },
      select: { credits: true, isDev: true },
    });

    return NextResponse.json({
      success: true,
      credits: updatedUser.credits,
      isDev: updatedUser.isDev,
      planName: planName || 'Recarga avulsa',
      added: amount,
    });
  } catch (error) {
    console.error('Credits add error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}