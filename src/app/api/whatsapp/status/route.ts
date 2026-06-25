import { NextResponse } from 'next/server';
import { checkConnectionStatus } from '@/lib/whatsapp';

export async function GET() {
  try {
    const status = await checkConnectionStatus();

    return NextResponse.json({
      configured: true, // Always configured now (Baileys service is always available)
      ...status,
    });
  } catch (error) {
    console.error('WhatsApp status error:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar status da conexão' },
      { status: 500 }
    );
  }
}