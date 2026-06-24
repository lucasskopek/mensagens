import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

const STYLE_INSTRUCTIONS: Record<string, string> = {
  romantic: 'romântica — profunda, poética, cheia de sentimento. Use metáforas de amor, natureza e eternidade. Seja vulnerável e sincero(a).',
  spicy: 'apimentada — ousada, provocante, com duplo sentido sutil. Crie tensão e desejo. Seja confiante e sedutor(a) sem ser vulgar.',
  playful: 'brincalhona — divertida, leve, com humor e jogo de palavras. Faça a pessoa sorrir, use referências do dia a dia do casal.',
  serious: 'séria — focada em gratidão, companheirismo e parceria. Expresse reconhecimento, admiração e o valor da presença da pessoa na sua vida.',
};

const SYSTEM_PROMPT = `Você é uma especialista em relacionamentos amorosos, dinâmica de casais e escrita de mensagens românticas para WhatsApp. Sua missão é criar mensagens únicas e autênticas que fortaleçam o vínculo amoroso.

REGRAS IMPORTANTES:
- Escreva TODAS as mensagens em português brasileiro
- Seja criativa e NUNCA repita frases clichês como "você é minha luz" ou "meu coração é seu"
- Adapte perfeitamente o estilo solicitado
- Mensagens adequadas para WhatsApp: 1 a 3 parágrafos no máximo, não muito longas
- Use emojis de forma natural e contextual (não exagere)
- Faça a mensagem parecer pessoal e genuína, como se fosse escrita de verdade pela pessoa
- Varie a estrutura: às vezes comece com saudação carinhosa, às vezes vá direto ao ponto
- Considere o contexto de um relacionamento real: seja natural, não robótico`;

export async function POST(request: NextRequest) {
  try {
    const { contactName, senderName, style, userId, contactId } = await request.json();

    if (!contactName || !senderName || !style || !userId) {
      return NextResponse.json(
        { error: 'contactName, senderName, style e userId são obrigatórios' },
        { status: 400 }
      );
    }

    // Fetch recent messages to avoid duplicates
    const recentHistory = await db.messageHistory.findMany({
      where: {
        userId,
        contactId: contactId || undefined,
        style,
      },
      orderBy: { sentAt: 'desc' },
      take: 10,
      select: { message: true },
    });

    const recentMessages = recentHistory.map((h) => h.message);

    const styleInstruction = STYLE_INSTRUCTIONS[style] || STYLE_INSTRUCTIONS.romantic;

    const userPrompt = `Gere uma mensagem ${styleInstruction}

Remetente: ${senderName}
Destinatário: ${contactName}
Estilo: ${style}

${recentMessages.length > 0 ? `MENSAGENS RECENTES ENVIADAS (NÃO repita ideias similares):
${recentMessages.map((m, i) => `${i + 1}. ${m}`).join('\n')}` : ''}

Escreva apenas a mensagem, sem aspas, sem título, sem explicações. Apenas o texto que será enviado pelo WhatsApp.`;

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      thinking: { type: 'disabled' },
    });

    const message = completion.choices?.[0]?.message?.content?.trim();
    if (!message) {
      throw new Error('A IA não gerou uma mensagem válida');
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Message generate error:', error);
    const msg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}