import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = verifyAuthToken(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Access denied. Invalid or missing token.' },
        { status: 401 }
      );
    }

    const { data, error } = await db
      .from('users')
      .select('id, username, email, avatar_url')
      .eq('id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, message: 'User not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: { ...data, user: data } });
  } catch (err: any) {
    console.error('Get profile error:', err);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve profile.' },
      { status: 500 }
    );
  }
}
