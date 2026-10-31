/**
 * IEEE CS UCET-IUB Automated Database Migration Runner
 * 
 * Automatically applies SQL migrations from supabase/migrations/
 * 
 * Usage:
 *   node scripts/migrate.js [PASSWORD]
 *   Or:
 *   $env:SUPABASE_DB_PASSWORD="your-password"; npm run db:migrate
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');

const PROJECT_REF = 'gbuafbcebcbwzvefqhcr';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || `https://${PROJECT_REF}.supabase.co`;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdidWFmYmNlYmNid3p2ZWZxaGNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzNjUxNjgsImV4cCI6MjEwODk0MTE2OH0.j1tB4mcsDnyRUYo36EQk90fz-xR0VT55L5kqomLgeDU';

// Command line argument or env var
const password = process.argv[2] || process.env.SUPABASE_DB_PASSWORD || process.env.DB_PASSWORD || '';
const databaseUrl = process.env.DATABASE_URL || (password ? `postgresql://postgres.${PROJECT_REF}:${encodeURIComponent(password)}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres` : '');

async function checkStatusWithRest() {
  console.log(`Checking REST API tables at ${SUPABASE_URL}...`);
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const tables = ['events', 'team_members', 'certificates', 'registrations', 'certificate_templates', 'event_teams'];
  for (const t of tables) {
    const { count, error } = await client.from(t).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`  ❌ Table '${t}': ${error.message}`);
    } else {
      console.log(`  ✅ Table '${t}': OK (${count ?? 0} records)`);
    }
  }
}

async function runDirectMigrations(connectionString) {
  console.log('Connecting directly to PostgreSQL...');
  const pgClient = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await pgClient.connect();
    console.log('Connected to PostgreSQL successfully!');

    // Create migrations history tracking table
    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS public._migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT UNIQUE NOT NULL,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      const { rows } = await pgClient.query('SELECT 1 FROM public._migrations WHERE filename = $1', [file]);
      if (rows.length > 0) {
        console.log(`⏩ Skipping already applied migration: ${file}`);
        continue;
      }

      console.log(`⚡ Applying migration: ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await pgClient.query(sql);
      await pgClient.query('INSERT INTO public._migrations (filename) VALUES ($1)', [file]);
      console.log(`✅ Applied migration: ${file}`);
    }

    console.log('All migrations applied successfully!');
  } finally {
    await pgClient.end();
  }
}

async function main() {
  console.log('====================================================');
  console.log('IEEE CS UCET-IUB Database Migration Tool');
  console.log(`Target Supabase Project: ${PROJECT_REF}`);
  console.log('====================================================');

  if (databaseUrl) {
    try {
      await runDirectMigrations(databaseUrl);
      console.log('----------------------------------------------------');
      await checkStatusWithRest();
    } catch (err) {
      console.error('Migration failed:', err.message);
    }
  } else {
    console.log('No database password provided.');
    console.log('\nTo run migrations automatically from your terminal:');
    console.log('  npm run db:migrate <YOUR_DATABASE_PASSWORD>');
    console.log('Or set the environment variable:');
    console.log('  $env:SUPABASE_DB_PASSWORD="your-password"; npm run db:migrate');
    console.log('\nTo run migrations automatically via GitHub Actions CI/CD on git push:');
    console.log('  Add secret SUPABASE_DB_PASSWORD in GitHub Settings -> Secrets -> Actions');
    console.log('----------------------------------------------------');
    await checkStatusWithRest();
  }

  console.log('====================================================');
}

main().catch(console.error);
