import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { verifyAuthToken } from '@/lib/auth';
import db from '@/lib/db';

const BLANK_FRAME =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"><rect width="960" height="540" fill="#ffffff"/></svg>'
  );

function normalizeBlankFrame(imageData: any): string {
  const candidate = typeof imageData === 'string' ? imageData : '';
  if (!candidate || !candidate.startsWith('data:image')) return BLANK_FRAME;
  return candidate;
}

export async function GET(req: NextRequest) {
  try {
    const user = verifyAuthToken(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { data: projects, error } = await db
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    const result = await Promise.all(
      (projects || []).map(async (proj: any) => {
        const { data: frames } = await db
          .from('frames')
          .select('id')
          .eq('project_id', proj.id);
        return {
          ...proj,
          frame_count: frames ? frames.length : 0,
        };
      })
    );

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    console.error('Fetch projects error:', err);
    return NextResponse.json({ success: false, message: 'Failed to load projects' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = verifyAuthToken(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const requestedName = typeof body.name === 'string' ? body.name.trim() : '';
    const name = requestedName.slice(0, 100) || 'New Animation';
    const fps = Math.max(1, Math.min(60, Number(body.fps) || 12));
    const initialFrames = Array.isArray(body.frames) && body.frames.length > 0 ? body.frames : null;
    const thumbnail = body.thumbnail || (initialFrames ? (initialFrames[0]?.image_data || initialFrames[0]) : BLANK_FRAME);
    const projectId = crypto.randomUUID();
    // Default 8 frames as requested in user feedback
    const frameCount = Math.max(1, Math.min(60, Number(body.frameCount || body.frame_count) || (initialFrames ? initialFrames.length : 8)));

    const { error: projectError } = await db
      .from('projects')
      .insert([{ id: projectId, user_id: user.id, name, fps, thumbnail }]);

    if (projectError) throw projectError;

    if (initialFrames) {
      const frameRows = initialFrames.map((img: any, idx: number) => ({
        project_id: projectId,
        frame_index: idx,
        image_data: normalizeBlankFrame(img?.image_data || img),
      }));
      for (let i = 0; i < frameRows.length; i += 50) {
        const chunk = frameRows.slice(i, i + 50);
        await db.from('frames').insert(chunk);
      }
    } else {
      const frameRows = Array.from({ length: frameCount }, (_, idx) => ({
        project_id: projectId,
        frame_index: idx,
        image_data: BLANK_FRAME,
      }));
      await db.from('frames').insert(frameRows);
    }

    const { data: project, error: getErr } = await db
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (getErr) throw getErr;

    return NextResponse.json({ success: true, data: project }, { status: 201 });
  } catch (err: any) {
    console.error('Create project error:', err);
    return NextResponse.json({ success: false, message: 'Failed to create project' }, { status: 500 });
  }
}
