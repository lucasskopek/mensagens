import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkInstanceStatus } from '@/lib/zapi';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      );
    }

    // Fetch user's Z-API config
    const config = await db.userConfig.findUnique({ where: { userId } });

    if (!config?.whatsappApiUrl || !config?.whatsappApiToken || !config?.whatsappInstanceName) {
      return NextResponse.json({
        configured: false,
        connected: false,
        error: 'Z-API não configurada. Vá em Configurações para preencher as credenciais.',
      });
    }

    const status = await checkInstanceStatus({
      baseUrl: config.whatsappApiUrl,
      apiToken: config.whatsappApiToken,
      instanceId: config.whatsappInstanceName,
    });

    return NextResponse.json({
      configured: true,
      ...status,
      instanceId: config.whatsappInstanceName,
      apiUrl: config.whatsappApiUrl,
    });
  } catch (error) {
    console.error('WhatsApp status error:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar status da conexão' },
      { status: 500 }
    );
  }
}