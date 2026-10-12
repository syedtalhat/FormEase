#!/usr/bin/env node

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const projectRoot = process.cwd();
const migrationsDir = path.join(projectRoot, 'supabase', 'migrations');
const manualSchemaFile = path.join(projectRoot, 'supabase', 'manual', 'schema_all_in_one.sql');

if (!fs.existsSync(manualSchemaFile)) {
  console.error(`❌ Error: Manual schema file not found at ${manualSchemaFile}`);
  process.exit(1);
}

if (!fs.existsSync(migrationsDir)) {
  console.error(`❌ Error: Migrations directory not found at ${migrationsDir}`);
  process.exit(1);
}

const migrationFiles = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

if (migrationFiles.length === 0) {
  console.error(`❌ Error: No SQL migration files found in ${migrationsDir}`);
  process.exit(1);
}

const concatenatedMigrations = migrationFiles
  .map((f) => fs.readFileSync(path.join(migrationsDir, f), 'utf-8').trim())
  .join('\n\n')
  .trim();

const manualSchema = fs.readFileSync(manualSchemaFile, 'utf-8').trim();

// Normalize line endings
const normalize = (str) => str.replace(/\r\n/g, '\n').trim();

if (normalize(concatenatedMigrations) !== normalize(manualSchema)) {
  console.error('❌ Schema Drift Detected!');
  console.error('The manual schema in supabase/manual/schema_all_in_one.sql differs from the migrations in supabase/migrations/');
  console.error('Please ensure both files are kept strictly identical so dashboard SQL paste matches CLI migrations.');
  process.exit(1);
}

console.log('✅ Schema verification passed: supabase/manual/schema_all_in_one.sql matches supabase/migrations/*.sql perfectly.');
process.exit(0);
