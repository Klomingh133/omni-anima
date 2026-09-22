import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import db from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { data, error } = await db
      .from('published_animations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, message: 'Animation not found' }, { status: 404 });
    }

    // Increment views asynchronously
    db.from('published_animations')
      .update({ views_count: (data.views_count || 0) + 1 })
      .eq('id', id)
      .then(() => {})
      .catch(() => {});

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('Fetch animation error:', err);
    return NextResponse.json({ success: false, message: 'Failed to fetch animation' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = verifyAuthToken(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { data: existing } = await db
      .from('published_animations')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    }

    if (existing.user_id !== user.id) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    await db.from('published_animations').delete().eq('id', id);

    return NextResponse.json({ success: true, message: 'Animation deleted from community' });
  } catch (err: any) {
    console.error('Delete published animation error:', err);
    return NextResponse.json({ success: false, message: 'Failed to delete' }, { status: 500 });
  }
}
