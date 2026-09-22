import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import db from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = verifyAuthToken(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { data: existing } = await db
      .from('published_animations')
      .select('likes_count')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    }

    const nextLikes = (existing.likes_count || 0) + 1;
    await db
      .from('published_animations')
      .update({ likes_count: nextLikes })
      .eq('id', id);

    return NextResponse.json({ success: true, likes_count: nextLikes });
  } catch (err: any) {
    console.error('Like error:', err);
    return NextResponse.json({ success: false, message: 'Failed to like' }, { status: 500 });
  }
}
