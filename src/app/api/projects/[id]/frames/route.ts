import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import db from '@/lib/db';

const BLANK_FRAME =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"><rect width="960" height="540" fill="#ffffff"/></svg>'
  );

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
    const { frame_index, image_data } = body;
    const targetIdx = parseInt(frame_index, 10);

    const { data: frames } = await db
      .from('frames')
      .select('*')
      .eq('project_id', id)
      .order('frame_index', { ascending: true });

    const existing = frames || [];
    // Shift indices
    for (const f of existing) {
      if (Number(f.frame_index) >= targetIdx) {
        await db
          .from('frames')
          .update({ frame_index: Number(f.frame_index) + 1 })
          .eq('id', f.id);
      }
    }

    await db.from('frames').insert([
      {
        project_id: id,
        frame_index: targetIdx,
        image_data: image_data || BLANK_FRAME,
      },
    ]);

    return NextResponse.json({ success: true, message: 'Frame added' }, { status: 201 });
  } catch (err: any) {
    console.error('Add frame error:', err);
    return NextResponse.json({ success: false, message: 'Failed to add frame' }, { status: 500 });
  }
}
