import { NextResponse } from 'next/server';
import { checkConnectionStatus, isWaServiceConfigured } from '@/lib/whatsapp';

export async function GET() {
  const configured = isWaServiceConfigured();

  if (!configured) {
    return NextResponse.json({
      configured: false,
      connected: false,
      phone: null,
      pushName: null,
      battery: null,
      error: null,
      hasQrCode: false,
      serviceUnavailable: true,
    });
  }

  try {
    const status = await checkConnectionStatus();

    return NextResponse.json({
      configured: true,
      ...status,
    });
  } catch (error) {
    console.error('WhatsApp status error:', error);
    return NextResponse.json(
      {
        configured: true,
        connected: false,
        error: 'Erro ao verificar status da conexão',
        phone: null,
        pushName: null,
        battery: null,
        hasQrCode: false,
      },
      { status: 500 }
    );
  }
}