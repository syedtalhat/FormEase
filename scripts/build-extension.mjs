#!/usr/bin/env node

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const rootDir = process.cwd();
const distExtensionDir = path.join(rootDir, 'dist-extension');

async function buildExtension() {
  console.log('🚀 Starting FormAssist Chrome Extension Build (Manifest V3)...');

  // 1. Ensure icons are generated
  execSync('node scripts/generate-icons.mjs', { stdio: 'inherit' });

  // 2. Clean out destination
  if (fs.existsSync(distExtensionDir)) {
    fs.rmSync(distExtensionDir, { recursive: true, force: true });
  }

  // 3. Run Vite build with vite.extension.config.ts
  console.log('📦 Running Vite build producing dist-extension/...');
  execSync('npx vite build --config vite.extension.config.ts', { stdio: 'inherit' });

  console.log('🎉 Extension build complete! Output located at: dist-extension/');
  console.log('👉 Load unpacked in Chrome via: chrome://extensions -> Developer mode -> Load unpacked');
}

buildExtension().catch((err) => {
  console.error('❌ Extension build failed:', err);
  process.exit(1);
});
