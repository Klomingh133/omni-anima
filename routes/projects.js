const express = require('express');
const crypto = require('crypto');
const supabase = require('../db/connection');
const authenticateToken = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

const BLANK_FRAME = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"><rect width="960" height="540" fill="#ffffff"/></svg>');

function normalizeBlankFrame(imageData) {
  const candidate = typeof imageData === 'string' ? imageData : '';
  if (!candidate || !candidate.startsWith('data:image')) return BLANK_FRAME;
  if (/fill=["']?#?(ffd43b|ffd95a|f5d70a|ffdc2e|f7d53b)|yellow/i.test(candidate)) {
    return BLANK_FRAME;
  }
  return candidate;
}

async function readProjectFrames(projectId) {
  const { data, error } = await supabase
    .from('frames')
    .select('*')
    .eq('project_id', projectId)
    .order('frame_index', { ascending: true });

  if (error) throw error;
  return data || [];
}

async function syncFrames(projectId, frames) {
  // Fetch existing minimal metadata to calculate diff
  const { data: existingDbFrames, error: fetchErr } = await supabase
    .from('frames')
    .select('id, frame_index')
    .eq('project_id', projectId);
  
  if (fetchErr) throw fetchErr;

  const dbMap = new Map((existingDbFrames || []).map(f => [f.id, f.frame_index]));
  const toInsert = [];
  const toUpdate = [];
  const idsToKeep = new Set();

  frames.forEach((frame, index) => {
    if (frame.id && dbMap.has(frame.id)) {
      idsToKeep.add(frame.id);
      if (dbMap.get(frame.id) !== index) {
        // Only update frame_index, do not send image_data
        toUpdate.push({ id: frame.id, frame_index: index });
      }
    } else {
      // New frame - do not specify ID, let database auto-increment
      toInsert.push({
        project_id: projectId,
        frame_index: index,
        image_data: normalizeBlankFrame(frame.image_data || frame)
      });
    }
  });

  const idsToDelete = (existingDbFrames || []).filter(f => !idsToKeep.has(f.id)).map(f => f.id);

  // Execute delete first to free up indices
  if (idsToDelete.length > 0) {
    const { error } = await supabase.from('frames').delete().in('id', idsToDelete);
    if (error) throw error;
  }

  if (toUpdate.length > 0) {
    // Pass 1: Set to temporary negative index to completely avoid UNIQUE constraint collisions
    const pass1 = toUpdate.map(up => 
      supabase.from('frames').update({ frame_index: -up.id }).eq('id', up.id)
    );
    await Promise.all(pass1);

    // Pass 2: Set to final correct index
    const pass2 = toUpdate.map(up => 
      supabase.from('frames').update({ frame_index: up.frame_index }).eq('id', up.id)
    );
    await Promise.all(pass2);
  }

  // Finally insert new frames
  if (toInsert.length > 0) {
    const { error } = await supabase.from('frames').insert(toInsert);
    if (error) throw error;
  }
}

async function checkOwnership(projectId, userId) {
  const { data, error } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', userId)
    .limit(1);

  if (error) throw error;
  return Array.isArray(data) && data.length > 0;
}

router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    const result = await Promise.all((projects || []).map(async (project) => {
      const { data: frames, error: frameError } = await supabase
        .from('frames')
        .select('id')
        .eq('project_id', project.id);

      if (frameError) throw frameError;

      return { ...project, frame_count: frames ? frames.length : 0 };
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching projects list:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch projects list.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const requestedName = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const name = requestedName.slice(0, 100) || 'New Animation';
    const fps = Math.max(1, Math.min(60, Number(req.body.fps) || 12));
    const initialFrames = Array.isArray(req.body.frames) && req.body.frames.length > 0 ? req.body.frames : null;
    const thumbnail = req.body.thumbnail || (initialFrames ? (initialFrames[0]?.image_data || initialFrames[0]) : BLANK_FRAME);
    const projectId = crypto.randomUUID();

    const { error: projectError } = await supabase
      .from('projects')
      .insert([{ id: projectId, user_id: userId, name, fps, thumbnail }]);

    if (projectError) throw projectError;

    if (initialFrames) {
      const frameRows = initialFrames.map((img, idx) => ({
        project_id: projectId,
        frame_index: idx,
        image_data: normalizeBlankFrame(img?.image_data || img)
      }));
      for (let i = 0; i < frameRows.length; i += 50) {
        const chunk = frameRows.slice(i, i + 50);
        const { error: frameError } = await supabase.from('frames').insert(chunk);
        if (frameError) throw frameError;
      }
    } else {
      const { error: frameError } = await supabase
        .from('frames')
        .insert([{ project_id: projectId, frame_index: 0, image_data: BLANK_FRAME }]);

      if (frameError) throw frameError;
    }

    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ success: false, message: 'Failed to create new project.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;

    if (!(await checkOwnership(projectId, userId))) {
      return res.status(403).json({ success: false, message: 'You do not have access to this project.' });
    }

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError) throw projectError;

    const frames = await readProjectFrames(projectId);
    const projectData = { ...project, frames };

    res.json({ success: true, data: projectData });
  } catch (error) {
    console.error('Error fetching project details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch project data.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;
    const { name, fps, thumbnail } = req.body;

    if (!(await checkOwnership(projectId, userId))) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const updates = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) return res.status(400).json({ success: false, message: 'Invalid project name.' });
      updates.name = name.trim().slice(0, 100);
    }
    if (fps !== undefined) {
      const normalizedFps = Number(fps);
      if (!Number.isInteger(normalizedFps) || normalizedFps < 1 || normalizedFps > 30) return res.status(400).json({ success: false, message: 'FPS must be between 1 and 30.' });
      updates.fps = normalizedFps;
    }
    if (thumbnail !== undefined) updates.thumbnail = thumbnail;

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase.from('projects').update(updates).eq('id', projectId);
      if (error) throw error;
    }

    res.json({ success: true, message: 'Project updated successfully.' });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ success: false, message: 'Failed to update project.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;

    if (!(await checkOwnership(projectId, userId))) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const { error } = await supabase.from('projects').delete().eq('id', projectId);
    if (error) throw error;

    res.json({ success: true, message: 'Project deleted successfully.' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ success: false, message: 'Failed to delete project.' });
  }
});

router.put('/:id/frames/:index', async (req, res) => {
  try {
    const projectId = req.params.id;
    const frameIndex = parseInt(req.params.index, 10);
    const userId = req.user.id;
    const { image_data } = req.body;

    if (!(await checkOwnership(projectId, userId))) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const frames = await readProjectFrames(projectId);
    const existing = frames.find(frame => Number(frame.frame_index) === frameIndex);

    if (existing) {
      const { error } = await supabase
        .from('frames')
        .update({ image_data })
        .eq('project_id', projectId)
        .eq('frame_index', frameIndex);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('frames')
        .insert([{ project_id: projectId, frame_index: frameIndex, image_data }]);
      if (error) throw error;
    }

    if (frameIndex === 0) {
      const { error: thumbnailError } = await supabase
        .from('projects')
        .update({ thumbnail: image_data })
        .eq('id', projectId);
      if (thumbnailError) throw thumbnailError;
    }

    res.json({ success: true, message: 'Frame saved successfully.' });
  } catch (error) {
    console.error('Error saving frame:', error);
    res.status(500).json({ success: false, message: 'Failed to save frame.' });
  }
});

router.post('/:id/frames', async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;
    const { frame_index, image_data } = req.body;
    const newIndex = parseInt(frame_index, 10);

    if (!(await checkOwnership(projectId, userId))) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const frames = await readProjectFrames(projectId);
    const nextFrames = [...frames];
    nextFrames.splice(newIndex, 0, { project_id: projectId, frame_index: newIndex, image_data: image_data || BLANK_FRAME });
    await syncFrames(projectId, nextFrames);

    res.json({ success: true, message: 'Frame added successfully.' });
  } catch (error) {
    console.error('Error adding frame:', error);
    res.status(500).json({ success: false, message: 'Failed to add frame.' });
  }
});

router.delete('/:id/frames/:index', async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;
    const delIndex = parseInt(req.params.index, 10);

    if (!(await checkOwnership(projectId, userId))) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const frames = await readProjectFrames(projectId);
    if (frames.length <= 1) {
      return res.status(400).json({ success: false, message: 'Project must have at least 1 frame.' });
    }

    const nextFrames = frames.filter(frame => Number(frame.frame_index) !== delIndex);
    await syncFrames(projectId, nextFrames);

    if (delIndex === 0 && nextFrames.length > 0) {
      const { error } = await supabase
        .from('projects')
        .update({ thumbnail: nextFrames[0].image_data || BLANK_FRAME })
        .eq('id', projectId);
      if (error) throw error;
    }

    res.json({ success: true, message: 'Frame deleted successfully.' });
  } catch (error) {
    console.error('Error deleting frame:', error);
    res.status(500).json({ success: false, message: 'Failed to delete frame.' });
  }
});

router.put('/:id/frames/reorder', async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;
    const { old_index, new_index } = req.body;
    const oldIdx = parseInt(old_index, 10);
    const newIdx = parseInt(new_index, 10);

    if (!(await checkOwnership(projectId, userId))) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (oldIdx === newIdx) {
      return res.json({ success: true, message: 'No changes in frame order.' });
    }

    const frames = await readProjectFrames(projectId);
    const nextFrames = [...frames];
    const [moved] = nextFrames.splice(oldIdx, 1);
    nextFrames.splice(newIdx, 0, moved);
    await syncFrames(projectId, nextFrames);

    if (oldIdx === 0 || newIdx === 0) {
      const firstFrame = nextFrames.find(frame => Number(frame.frame_index) === 0) || nextFrames[0];
      const { error } = await supabase
        .from('projects')
        .update({ thumbnail: firstFrame?.image_data || BLANK_FRAME })
        .eq('id', projectId);
      if (error) throw error;
    }

    res.json({ success: true, message: 'Frame order updated successfully.' });
  } catch (error) {
    console.error('Error reordering frames:', error);
    res.status(500).json({ success: false, message: 'Failed to update frame order.' });
  }
});

router.post('/:id/duplicate-frame', async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;
    const { frame_index } = req.body;
    const sourceIdx = parseInt(frame_index, 10);

    if (!(await checkOwnership(projectId, userId))) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const frames = await readProjectFrames(projectId);
    const sourceFrame = frames.find(frame => Number(frame.frame_index) === sourceIdx);
    if (!sourceFrame) {
      return res.status(404).json({ success: false, message: 'Source frame not found.' });
    }

    const nextFrames = [...frames];
    nextFrames.splice(sourceIdx + 1, 0, {
      project_id: projectId,
      frame_index: sourceIdx + 1,
      image_data: sourceFrame.image_data
    });

    await syncFrames(projectId, nextFrames);
    res.json({ success: true, message: 'Frame duplicated successfully.' });
  } catch (error) {
    console.error('Error duplicating frame:', error);
    res.status(500).json({ success: false, message: 'Failed to duplicate frame.' });
  }
});

module.exports = router;
