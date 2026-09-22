import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import db from '@/lib/db';

export async function PUT(req: NextRequest) {
  try {
    const user = verifyAuthToken(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Access denied. Invalid or missing token.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { avatar_url } = body;

    if (!avatar_url) {
      return NextResponse.json(
        { success: false, message: 'Invalid avatar data.' },
        { status: 400 }
      );
    }

    const { error } = await db
      .from('users')
      .update({ avatar_url })
      .eq('id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true, avatar_url });
  } catch (err: any) {
    console.error('Update avatar error:', err);
    return NextResponse.json(
      { success: false, message: 'Failed to update avatar.' },
      { status: 500 }
    );
  }
}
