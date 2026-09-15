-- OmniAnima Studio - Complete Supabase PostgreSQL Database Schema
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'New Animation',
  fps INTEGER NOT NULL DEFAULT 12,
  thumbnail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Frames Table
CREATE TABLE IF NOT EXISTS frames (
  id BIGSERIAL PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  frame_index INTEGER NOT NULL DEFAULT 0,
  image_data TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, frame_index)
);

-- 4. Published Community Animations Table
CREATE TABLE IF NOT EXISTS published_animations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  author_name VARCHAR(100) NOT NULL,
  author_avatar TEXT,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  fps INTEGER DEFAULT 12,
  frame_count INTEGER DEFAULT 1,
  thumbnail TEXT,
  video_data TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for high-performance querying
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_frames_project_id ON frames(project_id);
CREATE INDEX IF NOT EXISTS idx_published_created_at ON published_animations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_published_user_id ON published_animations(user_id);

-- Automatic touch updated_at trigger function
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_touch_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER frames_touch_updated_at
BEFORE UPDATE ON frames
FOR EACH ROW
EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER published_touch_updated_at
BEFORE UPDATE ON published_animations
FOR EACH ROW
EXECUTE FUNCTION touch_updated_at();
