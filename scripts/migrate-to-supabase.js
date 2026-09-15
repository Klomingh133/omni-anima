const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const connectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('Missing SUPABASE_DATABASE_URL or DATABASE_URL in .env');
    process.exit(1);
  }

  const sql = fs.readFileSync(path.join(__dirname, '..', 'db', 'supabase-schema.sql'), 'utf8');
  const client = new Client({ connectionString });

  try {
    await client.connect();
    await client.query(sql);
    console.log('Supabase schema migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
