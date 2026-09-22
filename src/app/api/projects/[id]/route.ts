import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import db from '@/lib/db';

async function checkOwnership(projectId: string, userId: string): Promise<boolean> {
  const { data, error } = await db
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', userId)
    .limit(1);

  if (error) return false;
  return Array.isArray(data) && data.length > 0;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = verifyAuthToken(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!(await checkOwnership(id, user.id))) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { data: project, error: projErr } = await db
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (projErr || !project) {
      return NextResponse.json({ success: false, message: 'Project not found' }, { status: 404 });
    }

    const { data: frames, error: frameErr } = await db
      .from('frames')
      .select('*')
      .eq('project_id', id)
      .order('frame_index', { ascending: true });

    if (frameErr) throw frameErr;

    return NextResponse.json({
      success: true,
      data: {
        ...project,
        frames: frames || [],
      },
    });
  } catch (err: any) {
    console.error('Fetch project details error:', err);
    return NextResponse.json({ success: false, message: 'Failed to load project' }, { status: 500 });
  }
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
    const { name, fps, thumbnail } = body;

    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = String(name).trim().slice(0, 100);
    if (fps !== undefined) updates.fps = Math.max(1, Math.min(60, Number(fps) || 12));
    if (thumbnail !== undefined) updates.thumbnail = thumbnail;

    if (Object.keys(updates).length > 0) {
      await db.from('projects').update(updates).eq('id', id);
    }

    return NextResponse.json({ success: true, message: 'Project updated' });
  } catch (err: any) {
    console.error('Update project error:', err);
    return NextResponse.json({ success: false, message: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = verifyAuthToken(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!(await checkOwnership(id, user.id))) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    await db.from('frames').delete().eq('project_id', id);
    await db.from('projects').delete().eq('id', id);

    return NextResponse.json({ success: true, message: 'Project deleted' });
  } catch (err: any) {
    console.error('Delete project error:', err);
    return NextResponse.json({ success: false, message: 'Failed to delete project' }, { status: 500 });
  }
}
