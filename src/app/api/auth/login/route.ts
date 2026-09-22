import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { login, password } = body;

    if (!login || !password) {
      return NextResponse.json(
        { success: false, message: 'Please provide both username/email and password.' },
        { status: 400 }
      );
    }

    const { data: users, error } = await db
      .from('users')
      .select('id, username, email, password_hash, avatar_url')
      .or(`username.eq.${login},email.eq.${login}`);

    if (error) throw error;
    if (!users || users.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials.' },
        { status: 401 }
      );
    }

    const userRecord = users[0];
    const match = await bcrypt.compare(password, userRecord.password_hash);

    if (!match) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials.' },
        { status: 401 }
      );
    }

    const user = {
      id: userRecord.id,
      username: userRecord.username,
      email: userRecord.email,
      avatar_url: userRecord.avatar_url,
    };

    const secret = process.env.JWT_SECRET || 'omnianima_jwt_secret_dev_key_blueprint';
    const token = jwt.sign(
      { id: userRecord.id, username: userRecord.username, email: userRecord.email },
      secret,
      { expiresIn: '7d' }
    );

    return NextResponse.json({ success: true, data: { token, user } });
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error during login.' },
      { status: 500 }
    );
  }
}
