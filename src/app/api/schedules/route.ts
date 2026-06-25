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

    const schedules = await db.schedule.findMany({
      where: { userId },
      include: { contact: true },
      orderBy: { createdAt: 'desc' },
    });

    const enriched = schedules.map((s) => ({
      id: s.id,
      userId: s.userId,
      contactId: s.contactId,
      contactName: s.contact.name,
      contactPhone: s.contact.phone,
      messageStyles: JSON.parse(s.messageStyles),
      timesPerDay: s.timesPerDay,
      sendTimes: JSON.parse(s.sendTimes),
      recurring: s.recurring,
      selectedDates: JSON.parse(s.selectedDates),
      active: s.active,
      createdAt: s.createdAt,
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Schedules GET error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, contactId, messageStyles, timesPerDay, sendTimes, recurring, selectedDates } = body;

    if (!userId || !contactId || !messageStyles || !sendTimes) {
      return NextResponse.json(
        { error: 'userId, contactId, messageStyles e sendTimes são obrigatórios' },
        { status: 400 }
      );
    }

    const styles = typeof messageStyles === 'string'
      ? messageStyles
      : JSON.stringify(messageStyles);

    const times = typeof sendTimes === 'string'
      ? sendTimes
      : JSON.stringify(sendTimes);

    const isRecurring = recurring !== undefined ? recurring : true;
    const dates = selectedDates
      ? (typeof selectedDates === 'string' ? selectedDates : JSON.stringify(selectedDates))
      : '[]';

    const schedule = await db.schedule.create({
      data: {
        userId,
        contactId,
        messageStyles: styles,
        timesPerDay: timesPerDay || 1,
        sendTimes: times,
        recurring: isRecurring,
        selectedDates: dates,
        active: true,
      },
    });

    return NextResponse.json({
      ...schedule,
      messageStyles: JSON.parse(schedule.messageStyles),
      sendTimes: JSON.parse(schedule.sendTimes),
      selectedDates: JSON.parse(schedule.selectedDates),
    }, { status: 201 });
  } catch (error) {
    console.error('Schedules POST error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, userId, ...fields } = body;

    if (!id || !userId) {
      return NextResponse.json(
        { error: 'id e userId são obrigatórios' },
        { status: 400 }
      );
    }

    // Verify ownership
    const existing = await db.schedule.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Agendamento não encontrado' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (fields.messageStyles !== undefined) {
      updateData.messageStyles = typeof fields.messageStyles === 'string'
        ? fields.messageStyles
        : JSON.stringify(fields.messageStyles);
    }
    if (fields.timesPerDay !== undefined) {
      updateData.timesPerDay = fields.timesPerDay;
    }
    if (fields.sendTimes !== undefined) {
      updateData.sendTimes = typeof fields.sendTimes === 'string'
        ? fields.sendTimes
        : JSON.stringify(fields.sendTimes);
    }
    if (fields.recurring !== undefined) {
      updateData.recurring = fields.recurring;
    }
    if (fields.selectedDates !== undefined) {
      updateData.selectedDates = typeof fields.selectedDates === 'string'
        ? fields.selectedDates
        : JSON.stringify(fields.selectedDates);
    }
    if (fields.executionLog !== undefined) {
      updateData.executionLog = typeof fields.executionLog === 'string'
        ? fields.executionLog
        : JSON.stringify(fields.executionLog);
    }
    if (fields.active !== undefined) {
      updateData.active = fields.active;
    }

    const updated = await db.schedule.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      ...updated,
      messageStyles: JSON.parse(updated.messageStyles),
      sendTimes: JSON.parse(updated.sendTimes),
      selectedDates: JSON.parse(updated.selectedDates),
      executionLog: JSON.parse(updated.executionLog),
    });
  } catch (error) {
    console.error('Schedules PUT error:', error);
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
    const schedule = await db.schedule.findFirst({
      where: { id, userId },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: 'Agendamento não encontrado' },
        { status: 404 }
      );
    }

    await db.schedule.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Schedules DELETE error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}