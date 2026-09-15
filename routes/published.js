const express = require('express');
const crypto = require('crypto');
const supabase = require('../db/connection');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/published
 * Public endpoint to fetch published animations feed
 */
router.get('/', async (req, res) => {
  try {
    const { q, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('published_animations')
      .select('id, project_id, user_id, author_name, author_avatar, title, description, fps, frame_count, thumbnail, video_data, likes_count, views_count, created_at, updated_at')
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (q && typeof q === 'string' && q.trim()) {
      const sanitized = q.trim().replace(/[,()"]/g, '');
      if (sanitized) {
        query = query.or(`title.ilike.%${sanitized}%,author_name.ilike.%${sanitized}%`);
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error fetching published animations:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch published animations.' });
  }
});

/**
 * GET /api/published/:id
 * Public endpoint to get a single published animation detail & increment view count
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('published_animations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Animation not found.' });
    }

    // Increment view count asynchronously in background
    supabase
      .from('published_animations')
      .update({ views_count: (data.views_count || 0) + 1 })
      .eq('id', id)
      .then(() => {})
      .catch(() => {});

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching published animation:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch animation.' });
  }
});

/**
 * POST /api/published
 * Authenticated endpoint to publish an animation project to the public community feed
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      projectId,
      title,
      description = '',
      fps = 12,
      frame_count = 1,
      thumbnail,
      video_data
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Animation title is required.' });
    }

    if (!video_data || typeof video_data !== 'string' || !video_data.startsWith('data:video')) {
      return res.status(400).json({ success: false, message: 'Valid video data is required.' });
    }

    // Get author details
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('username, avatar_url')
      .eq('id', userId)
      .single();

    const authorName = userRecord?.username || req.user.username || 'Anonymous Animator';
    const authorAvatar = userRecord?.avatar_url || req.user.avatar_url || null;

    // Verify project ownership if projectId is provided
    let verifiedProjectId = null;
    if (projectId) {
      const { data: proj, error: projErr } = await supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('user_id', userId)
        .single();
      if (!projErr && proj) {
        verifiedProjectId = proj.id;
      }
    }

    const { data, error } = await supabase
      .from('published_animations')
      .insert([{
        project_id: verifiedProjectId,
        user_id: userId,
        author_name: authorName,
        author_avatar: authorAvatar,
        title: title.trim().slice(0, 200),
        description: (description || '').trim().slice(0, 1000),
        fps: Math.max(1, Math.min(60, Number(fps) || 12)),
        frame_count: Math.max(1, Number(frame_count) || 1),
        thumbnail: thumbnail || null,
        video_data: video_data
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Animation published successfully!',
      data
    });
  } catch (error) {
    console.error('Error publishing animation:', error);
    res.status(500).json({ success: false, message: 'Failed to publish animation.' });
  }
});

/**
 * DELETE /api/published/:id
 * Authenticated endpoint to delete a published animation by author
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data: existing, error: findError } = await supabase
      .from('published_animations')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (findError || !existing) {
      return res.status(404).json({ success: false, message: 'Animation not found.' });
    }

    if (existing.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this animation.' });
    }

    const { error: delError } = await supabase
      .from('published_animations')
      .delete()
      .eq('id', id);

    if (delError) throw delError;

    res.json({ success: true, message: 'Animation removed from community.' });
  } catch (error) {
    console.error('Error deleting published animation:', error);
    res.status(500).json({ success: false, message: 'Failed to delete animation.' });
  }
});

/**
 * POST /api/published/:id/like
 * Increment like count for a published animation
 */
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('published_animations')
      .select('likes_count')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Animation not found.' });
    }

    const nextLikes = (data.likes_count || 0) + 1;
    const { error: updateError } = await supabase
      .from('published_animations')
      .update({ likes_count: nextLikes })
      .eq('id', id);

    if (updateError) throw updateError;

    res.json({ success: true, likes_count: nextLikes });
  } catch (error) {
    console.error('Error liking animation:', error);
    res.status(500).json({ success: false, message: 'Failed to like animation.' });
  }
});

module.exports = router;
