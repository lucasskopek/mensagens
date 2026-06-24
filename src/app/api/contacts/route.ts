import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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

    const contacts = await db.contact.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(contacts);
  } catch (error) {
    console.error('Contacts GET error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, phone, nicknames } = body;

    if (!userId || !name || !phone) {
      return NextResponse.json(
        { error: 'userId, nome e telefone são obrigatórios' },
        { status: 400 }
      );
    }

    const contact = await db.contact.create({
      data: {
        userId,
        name,
        phone,
        nicknames: nicknames || null,
      },
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error('Contacts POST error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, userId } = body;

    if (!id || !userId) {
      return NextResponse.json(
        { error: 'id e userId são obrigatórios' },
        { status: 400 }
      );
    }

    // Verify ownership before deleting
    const contact = await db.contact.findFirst({
      where: { id, userId },
    });

    if (!contact) {
      return NextResponse.json(
        { error: 'Contato não encontrado' },
        { status: 404 }
      );
    }

    await db.contact.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contacts DELETE error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}