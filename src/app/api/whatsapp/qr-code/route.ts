import { NextResponse } from 'next/server';
import { getQrCode } from '@/lib/whatsapp';

export async function GET() {
  try {
    const result = await getQrCode();

    if (result.qrCodeBase64) {
      return NextResponse.json({ qrCodeBase64: result.qrCodeBase64 });
    }

    return NextResponse.json({
      qrCodeBase64: null,
      connected: result.connected || false,
      error: result.error || 'Não foi possível gerar o QR Code. O WhatsApp pode já estar conectado.',
    });
  } catch (error) {
    console.error('QR Code error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao buscar QR Code' },
      { status: 500 },
    );
  }
}