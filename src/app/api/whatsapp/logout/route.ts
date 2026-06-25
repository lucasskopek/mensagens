import { NextResponse } from 'next/server';
import { logoutSession, isWaServiceConfigured } from '@/lib/whatsapp';

export async function POST() {
  if (!isWaServiceConfigured()) {
    return NextResponse.json({
      success: false,
      error: 'Serviço WhatsApp não configurado. Defina WA_SERVICE_URL no ambiente.',
    }, { status: 503 });
  }

  try {
    const result = await logoutSession();
    return NextResponse.json(result);
  } catch (error) {
    console.error('WhatsApp logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao desconectar' },
      { status: 500 }
    );
  }
}