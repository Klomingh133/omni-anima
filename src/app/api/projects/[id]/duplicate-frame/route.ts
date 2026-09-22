import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import db from '@/lib/db';

async function checkOwnership(projectId: string, userId: string): Promise<boolean> {
  const { data } = await db
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', userId)
    .limit(1);
  return Array.isArray(data) && data.length > 0;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = verifyAuthToken(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!(await checkOwnership(id, user.id))) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const sourceIdx = parseInt(body.frame_index, 10);

    const { data: frames } = await db
      .from('frames')
      .select('*')
      .eq('project_id', id)
      .order('frame_index', { ascending: true });

    const existing = frames || [];
    const source = existing.find((f: any) => Number(f.frame_index) === sourceIdx);
    if (!source) {
      return NextResponse.json({ success: false, message: 'Frame not found' }, { status: 404 });
    }

    // Shift all frames after sourceIdx
    for (const f of existing) {
      if (Number(f.frame_index) > sourceIdx) {
        await db
          .from('frames')
          .update({ frame_index: Number(f.frame_index) + 1 })
          .eq('id', f.id);
      }
    }

    await db.from('frames').insert([
      {
        project_id: id,
        frame_index: sourceIdx + 1,
        image_data: source.image_data,
      },
    ]);

    return NextResponse.json({ success: true, message: 'Frame duplicated' }, { status: 201 });
  } catch (err: any) {
    console.error('Duplicate frame error:', err);
    return NextResponse.json({ success: false, message: 'Failed to duplicate frame' }, { status: 500 });
  }
}
