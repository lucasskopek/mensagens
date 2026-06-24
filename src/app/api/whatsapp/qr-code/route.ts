import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    const config = await db.userConfig.findUnique({ where: { userId } });

    if (!config?.whatsappApiUrl || !config?.whatsappApiToken || !config?.whatsappInstanceName) {
      return NextResponse.json({ error: 'Z-API não configurada' }, { status: 400 });
    }

    const base = config.whatsappApiUrl.replace(/\/+$/, '');
    const url = `${base}/instances/${config.whatsappInstanceName}/token/${config.whatsappApiToken}/qr-code`;

    const res = await fetch(url);
    const data = await res.json();

    // Z-API returns { value: "base64_image_string" } on success
    if (data.value) {
      return NextResponse.json({ qrCodeBase64: data.value });
    }

    // If already connected, qr-code may return an error or empty
    return NextResponse.json({
      qrCodeBase64: null,
      error: data.error || data.message || 'Não foi possível gerar o QR Code',
      raw: data,
    });
  } catch (error) {
    console.error('QR Code error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao buscar QR Code' },
      { status: 500 },
    );
  }
}