require('dotenv').config();
const { Client } = require('pg');

async function migrate() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL database.');

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS published_animations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        author_name VARCHAR(100) NOT NULL,
        author_avatar TEXT,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        fps INT DEFAULT 12,
        frame_count INT DEFAULT 1,
        thumbnail TEXT,
        video_data TEXT NOT NULL,
        likes_count INT DEFAULT 0,
        views_count INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_published_created_at ON published_animations (created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_published_user_id ON published_animations (user_id);
    `;

    await client.query(createTableQuery);
    console.log('Successfully created published_animations table and indexes!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
