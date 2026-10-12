#!/usr/bin/env node

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import * as esbuild from 'esbuild';

const projectRoot = process.cwd();
const functionsSrcDir = path.join(projectRoot, 'supabase', 'functions');
const manualFunctionsDir = path.join(projectRoot, 'supabase', 'manual', 'functions');

if (!fs.existsSync(manualFunctionsDir)) {
  fs.mkdirSync(manualFunctionsDir, { recursive: true });
}

const functions = ['health', 'analyze-form', 'explain-field', 'chat', 'preferences'];

async function buildAll() {
  console.log('📦 Inlining Supabase Edge Functions for manual dashboard copy-paste fallback...');

  for (const funcName of functions) {
    const entryFile = path.join(functionsSrcDir, funcName, 'index.ts');
    const outFile = path.join(manualFunctionsDir, `${funcName}.ts`);

    if (!fs.existsSync(entryFile)) {
      console.warn(`⚠️ Warning: Entry file ${entryFile} does not exist. Skipping.`);
      continue;
    }

    try {
      await esbuild.build({
        entryPoints: [entryFile],
        outfile: outFile,
        bundle: true,
        format: 'esm',
        target: 'esnext',
        platform: 'neutral',
        banner: {
          js: `// ==============================================================================
// Self-Contained Edge Function: ${funcName}
// Generated for direct copy-paste into the Supabase Dashboard Edge Functions Editor.
// All shared helpers (CORS, Gemini, Database) are bundled in this single file.
// ==============================================================================`,
        },
      });

      console.log(`✅ Bundled: ${funcName} -> supabase/manual/functions/${funcName}.ts`);
    } catch (err) {
      console.error(`❌ Failed to bundle function ${funcName}:`, err);
      process.exit(1);
    }
  }

  console.log('🎉 All Edge Functions successfully bundled into self-contained files!');
}

buildAll();
