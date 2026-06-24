import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const DEV_NAME = 'Lucas Skopek';
const DEV_PASSWORD = 'Skopek231165';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, whatsapp } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Auto-fill name for dev login
    const isDevCheck = (name === DEV_NAME || email === DEV_NAME) && password === DEV_PASSWORD;
    const finalName = name || (isDevCheck ? DEV_NAME : email.split('@')[0]);

    const isDev = isDevCheck;

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Login: verify password
      if (existingUser.password !== password) {
        return NextResponse.json(
          { error: 'Senha incorreta' },
          { status: 401 }
        );
      }

      // If dev credentials used on login, ensure dev status
      let user = existingUser;
      if (isDev && !existingUser.isDev) {
        user = await db.user.update({
          where: { id: existingUser.id },
          data: { isDev: true, credits: 999999 },
        });
      }

      return NextResponse.json({
        id: user.id,
        name: user.name,
        email: user.email,
        whatsapp: user.whatsapp,
        isDev: user.isDev,
        credits: user.credits,
        createdAt: user.createdAt,
      });
    }

    // Register new user
    const newUser = await db.user.create({
      data: {
        name: finalName,
        email,
        password,
        whatsapp: whatsapp || null,
        isDev,
        credits: isDev ? 999999 : 0,
      },
    });

    return NextResponse.json({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      whatsapp: newUser.whatsapp,
      isDev: newUser.isDev,
      credits: newUser.credits,
      createdAt: newUser.createdAt,
    });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}