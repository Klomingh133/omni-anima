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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; index: string }> }
) {
  try {
    const user = verifyAuthToken(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id, index } = await params;
    const frameIndex = parseInt(index, 10);

    if (!(await checkOwnership(id, user.id))) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { image_data } = body;

    const { data: frames } = await db
      .from('frames')
      .select('id, frame_index')
      .eq('project_id', id);

    const existing = (frames || []).find((f: any) => Number(f.frame_index) === frameIndex);

    if (existing) {
      await db
        .from('frames')
        .update({ image_data })
        .eq('project_id', id)
        .eq('frame_index', frameIndex);
    } else {
      await db
        .from('frames')
        .insert([{ project_id: id, frame_index: frameIndex, image_data }]);
    }

    if (frameIndex === 0) {
      await db.from('projects').update({ thumbnail: image_data }).eq('id', id);
    }

    return NextResponse.json({ success: true, message: 'Frame saved successfully' });
  } catch (err: any) {
    console.error('Save frame error:', err);
    return NextResponse.json({ success: false, message: 'Failed to save frame' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; index: string }> }
) {
  try {
    const user = verifyAuthToken(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id, index } = await params;
    const delIndex = parseInt(index, 10);

    if (!(await checkOwnership(id, user.id))) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { data: frames } = await db
      .from('frames')
      .select('*')
      .eq('project_id', id)
      .order('frame_index', { ascending: true });

    if (!frames || frames.length <= 1) {
      return NextResponse.json(
        { success: false, message: 'Project must contain at least 1 frame' },
        { status: 400 }
      );
    }

    const nextFrames = frames.filter((f: any) => Number(f.frame_index) !== delIndex);

    // Delete frame
    await db
      .from('frames')
      .delete()
      .eq('project_id', id)
      .eq('frame_index', delIndex);

    // Reindex remaining frames
    for (let i = 0; i < nextFrames.length; i++) {
      await db
        .from('frames')
        .update({ frame_index: i })
        .eq('id', nextFrames[i].id);
    }

    if (delIndex === 0 && nextFrames.length > 0) {
      await db
        .from('projects')
        .update({ thumbnail: nextFrames[0].image_data })
        .eq('id', id);
    }

    return NextResponse.json({ success: true, message: 'Frame deleted' });
  } catch (err: any) {
    console.error('Delete frame error:', err);
    return NextResponse.json({ success: false, message: 'Failed to delete frame' }, { status: 500 });
  }
}
