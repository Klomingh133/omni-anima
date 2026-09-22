import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, email, password } = body;

    if (!username || username.length < 3 || username.length > 50) {
      return NextResponse.json(
        { success: false, message: 'Username must be between 3 and 50 characters.' },
        { status: 400 }
      );
    }

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email address format.' },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters.' },
        { status: 400 }
      );
    }

    const { data: existingUsers, error: existingError } = await db
      .from('users')
      .select('id')
      .or(`username.eq.${username},email.eq.${email}`);

    if (existingError) throw existingError;

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Username or email is already registered.' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    const { data, error } = await db
      .from('users')
      .insert([{ id: userId, username, email, password_hash: passwordHash }])
      .select('id, username, email, avatar_url')
      .single();

    if (error) throw error;

    const user = { id: data.id, username: data.username, email: data.email, avatar_url: data.avatar_url };
    const secret = process.env.JWT_SECRET || 'omnianima_jwt_secret_dev_key_blueprint';
    const token = jwt.sign({ id: data.id, username: data.username, email: data.email }, secret, {
      expiresIn: '7d',
    });

    return NextResponse.json({ success: true, data: { token, user } }, { status: 201 });
  } catch (err: any) {
    console.error('Registration error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error during registration.' },
      { status: 500 }
    );
  }
}
