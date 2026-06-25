import { NextResponse } from 'next/server';
import { logoutSession } from '@/lib/whatsapp';

export async function POST() {
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