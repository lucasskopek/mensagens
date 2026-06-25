import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getQrCode } from '@/lib/zapi';

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

    const result = await getQrCode({
      baseUrl: config.whatsappApiUrl,
      apiToken: config.whatsappApiToken,
      instanceId: config.whatsappInstanceName,
      clientToken: config.whatsappClientToken || undefined,
    });

    if (result.qrCodeBase64) {
      return NextResponse.json({ qrCodeBase64: result.qrCodeBase64 });
    }

    return NextResponse.json({
      qrCodeBase64: null,
      error: result.error || 'Não foi possível gerar o QR Code',
    });
  } catch (error) {
    console.error('QR Code error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao buscar QR Code' },
      { status: 500 },
    );
  }
}