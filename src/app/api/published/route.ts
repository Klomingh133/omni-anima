import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { verifyAuthToken } from '@/lib/auth';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    const limit = Number(searchParams.get('limit')) || 24;
    const offset = Number(searchParams.get('offset')) || 0;

    let query = db
      .from('published_animations')
      .select(
        'id, project_id, user_id, author_name, author_avatar, title, description, fps, frame_count, thumbnail, video_data, likes_count, views_count, created_at, updated_at'
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (q && q.trim()) {
      const sanitized = q.trim().replace(/[,()"]/g, '');
      if (sanitized) {
        query = query.or(`title.ilike.%${sanitized}%,author_name.ilike.%${sanitized}%`);
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] });
  } catch (err: any) {
    console.error('Fetch published feed error:', err);
    return NextResponse.json({ success: false, message: 'Failed to load feed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = verifyAuthToken(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      projectId,
      title,
      description = '',
      fps = 12,
      frame_count = 1,
      thumbnail,
      video_data,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, message: 'Title is required.' }, { status: 400 });
    }

    if (!video_data || typeof video_data !== 'string' || !video_data.startsWith('data:video')) {
      return NextResponse.json(
        { success: false, message: 'Valid video data is required.' },
        { status: 400 }
      );
    }

    // Enforce 5-video limit per user
    const { data: userUploads } = await db
      .from('published_animations')
      .select('id')
      .eq('user_id', user.id);

    if (userUploads && userUploads.length >= 5) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Upload limit reached! You can publish a maximum of 5 videos to the community. Please delete an existing video before publishing a new one.',
        },
        { status: 403 }
      );
    }

    const { data: userRecord } = await db
      .from('users')
      .select('username, avatar_url')
      .eq('id', user.id)
      .single();

    const authorName = userRecord?.username || user.username || 'Anonymous Animator';
    const authorAvatar = userRecord?.avatar_url || user.avatar_url || null;

    let verifiedProjectId: string | null = null;
    if (projectId) {
      const { data: proj } = await db
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single();
      if (proj) verifiedProjectId = proj.id;
    }

    const publishId = crypto.randomUUID();

    const { data, error } = await db
      .from('published_animations')
      .insert([
        {
          id: publishId,
          project_id: verifiedProjectId,
          user_id: user.id,
          author_name: authorName,
          author_avatar: authorAvatar,
          title: title.trim().slice(0, 200),
          description: (description || '').trim().slice(0, 1000),
          fps: Math.max(1, Math.min(60, Number(fps) || 12)),
          frame_count: Math.max(1, Number(frame_count) || 1),
          thumbnail: thumbnail || null,
          video_data: video_data,
          likes_count: 0,
          views_count: 0,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      { success: true, message: 'Animation published successfully!', data },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Publish animation error:', err);
    return NextResponse.json(
      { success: false, message: 'Failed to publish animation' },
      { status: 500 }
    );
  }
}
