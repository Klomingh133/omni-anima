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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const { old_index, new_index } = body;
    const oldIdx = parseInt(old_index, 10);
    const newIdx = parseInt(new_index, 10);

    if (oldIdx === newIdx) {
      return NextResponse.json({ success: true, message: 'No change' });
    }

    const { data: frames } = await db
      .from('frames')
      .select('*')
      .eq('project_id', id)
      .order('frame_index', { ascending: true });

    if (!frames) {
      return NextResponse.json({ success: false, message: 'Frames not found' }, { status: 404 });
    }

    const nextFrames = [...frames];
    const [moved] = nextFrames.splice(oldIdx, 1);
    nextFrames.splice(newIdx, 0, moved);

    // Pass 1: negative indices to avoid uniqueness conflicts
    for (let i = 0; i < nextFrames.length; i++) {
      await db
        .from('frames')
        .update({ frame_index: -(i + 1) })
        .eq('id', nextFrames[i].id);
    }

    // Pass 2: positive indices
    for (let i = 0; i < nextFrames.length; i++) {
      await db
        .from('frames')
        .update({ frame_index: i })
        .eq('id', nextFrames[i].id);
    }

    if (oldIdx === 0 || newIdx === 0) {
      await db
        .from('projects')
        .update({ thumbnail: nextFrames[0].image_data })
        .eq('id', id);
    }

    return NextResponse.json({ success: true, message: 'Frames reordered' });
  } catch (err: any) {
    console.error('Reorder error:', err);
    return NextResponse.json({ success: false, message: 'Failed to reorder' }, { status: 500 });
  }
}
