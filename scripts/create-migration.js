#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function createMigration(name) {
  if (!name) {
    console.error('Usage: node scripts/create-migration.js <migration_name>');
    process.exit(1);
  }

  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '');
  const fileName = `${timestamp}_${name.toLowerCase().replace(/\s+/g, '_')}.sql`;
  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  const filePath = path.join(migrationsDir, fileName);

  // Ensure migrations directory exists
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
  }

  const template = `/*
  # ${name}

  1. New Tables
    - Add description of new tables here

  2. Changes
    - Add description of changes here

  3. Security
    - Add description of security changes here
*/

-- Add your migration SQL here
-- Example:
-- CREATE TABLE IF NOT EXISTS example_table (
--   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--   name text NOT NULL,
--   created_at timestamptz DEFAULT now()
-- );

-- Enable RLS if needed
-- ALTER TABLE example_table ENABLE ROW LEVEL SECURITY;

-- Add policies if needed
-- CREATE POLICY "Example policy" ON example_table FOR SELECT TO authenticated USING (true);
`;

  fs.writeFileSync(filePath, template);
  console.log(`✅ Created migration: ${fileName}`);
  console.log(`📝 Edit the file at: ${filePath}`);
}

// Get migration name from command line arguments
const migrationName = process.argv[2];
createMigration(migrationName);