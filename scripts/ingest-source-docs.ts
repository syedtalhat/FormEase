/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

// Load environment variables from .env or .env.local
dotenv.config();
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-2-preview';
const EMBEDDING_DIMENSIONALITY = 768;

const CHUNK_SIZE = 800; // ~800 chars per chunk
const CHUNK_OVERLAP = 100; // 100 chars overlap

interface FormMeta {
  domain: string;
  page_url_pattern: string;
  title: string;
  official_url: string;
  description?: string;
}

/**
 * Normalizes vector with L2 norm to unit length 1.0.
 */
function l2Normalize(vec: number[]): number[] {
  const norm = Math.hypot(...vec);
  return norm > 0 ? vec.map((v) => v / norm) : vec;
}

/**
 * Splits text into overlapping chunks.
 */
export function chunkText(text: string, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  const cleaned = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (cleaned.length <= chunkSize) {
    return [cleaned];
  }

  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < cleaned.length) {
    let endIndex = startIndex + chunkSize;

    if (endIndex < cleaned.length) {
      // Try to break at paragraph, sentence, or whitespace
      const naturalBreak = cleaned.lastIndexOf('\n\n', endIndex);
      const sentenceBreak = cleaned.lastIndexOf('. ', endIndex);
      const spaceBreak = cleaned.lastIndexOf(' ', endIndex);

      if (naturalBreak > startIndex + chunkSize / 2) {
        endIndex = naturalBreak + 2;
      } else if (sentenceBreak > startIndex + chunkSize / 2) {
        endIndex = sentenceBreak + 2;
      } else if (spaceBreak > startIndex + chunkSize / 2) {
        endIndex = spaceBreak + 1;
      }
    }

    const chunk = cleaned.slice(startIndex, endIndex).trim();
    if (chunk.length > 50) {
      chunks.push(chunk);
    }

    startIndex = endIndex - overlap;
    if (startIndex >= cleaned.length - overlap) {
      break;
    }
  }

  return chunks;
}

/**
 * Strips HTML tags and script/style contents.
 */
function cleanHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Embeds text using Gemini embedding API with RETRIEVAL_DOCUMENT.
 */
async function embedDocumentText(text: string, apiKey: string): Promise<number[]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_EMBEDDING_MODEL}:embedContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: `models/${GEMINI_EMBEDDING_MODEL}`,
      content: { parts: [{ text: text.slice(0, 2048) }] },
      taskType: 'RETRIEVAL_DOCUMENT',
      outputDimensionality: EMBEDDING_DIMENSIONALITY,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini embed error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const values = data?.embedding?.values || [];
  return l2Normalize(values);
}

/**
 * Main ingestion routine.
 */
export async function ingestDirectory(baseDir: string) {
  console.log(`\n======================================================`);
  console.log(`[FormAssist Ingest] Starting document ingestion pipeline`);
  console.log(`Source directory: ${path.resolve(baseDir)}`);
  console.log(`Supabase URL: ${SUPABASE_URL || '(Not set - dry run / simulation)'}`);
  console.log(`Embedding Model: ${GEMINI_EMBEDDING_MODEL}`);
  console.log(`======================================================\n`);

  if (!fs.existsSync(baseDir)) {
    throw new Error(`Directory not found: ${baseDir}`);
  }

  const formEntries = fs.readdirSync(baseDir, { withFileTypes: true });
  const formFolders = formEntries.filter((e) => e.isDirectory() && !e.name.startsWith('.'));

  if (formFolders.length === 0) {
    console.log(`No form subdirectories found in ${baseDir}`);
    return;
  }

  for (const folder of formFolders) {
    const folderPath = path.join(baseDir, folder.name);
    console.log(`\n📁 Processing form folder: ${folder.name}`);

    // Read meta.json
    const metaPath = path.join(folderPath, 'meta.json');
    let meta: FormMeta = {
      domain: folder.name.replace(/-/g, '.'),
      page_url_pattern: '/apply',
      title: folder.name,
      official_url: `https://${folder.name.replace(/-/g, '.')}`,
    };

    if (fs.existsSync(metaPath)) {
      try {
        meta = { ...meta, ...JSON.parse(fs.readFileSync(metaPath, 'utf-8')) };
      } catch (e) {
        console.warn(`Failed to parse meta.json in ${folder.name}:`, e);
      }
    }

    console.log(`   Domain: ${meta.domain} | Pattern: ${meta.page_url_pattern} | Title: "${meta.title}"`);

    // Upsert Form into database
    let formId: string | null = null;
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const formUpsertRes = await fetch(
          `${SUPABASE_URL}/rest/v1/forms?on_conflict=domain,page_url_pattern&select=id`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: SUPABASE_SERVICE_ROLE_KEY,
              Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              Prefer: 'resolution=merge-duplicates,return=representation',
            },
            body: JSON.stringify({
              domain: meta.domain,
              page_url_pattern: meta.page_url_pattern,
              title: meta.title,
              description: meta.description || `Official documents for ${meta.domain}`,
              updated_at: new Date().toISOString(),
            }),
          }
        );

        if (formUpsertRes.ok) {
          const rows = await formUpsertRes.json();
          if (Array.isArray(rows) && rows.length > 0) {
            formId = rows[0].id;
            console.log(`   Linked form ID in Supabase: ${formId}`);
          }
        } else {
          console.warn(`   Supabase form upsert failed: ${await formUpsertRes.text()}`);
        }
      } catch (err) {
        console.warn(`   Supabase network error during form upsert:`, err);
      }
    }

    // Process all files in folder
    const files = fs.readdirSync(folderPath).filter((f) => !f.startsWith('.') && f !== 'meta.json');
    let totalChunksIndexed = 0;

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const ext = path.extname(file).toLowerCase();
      let rawContent = '';

      if (ext === '.html' || ext === '.htm') {
        rawContent = cleanHtml(fs.readFileSync(filePath, 'utf-8'));
      } else if (ext === '.txt' || ext === '.md' || ext === '.json') {
        rawContent = fs.readFileSync(filePath, 'utf-8');
      } else {
        console.log(`   Skipping unsupported file extension: ${file}`);
        continue;
      }

      const chunks = chunkText(rawContent);
      console.log(`   📄 File "${file}": split into ${chunks.length} chunks (~${CHUNK_SIZE} chars)`);

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        let embedding: number[] | null = null;

        if (GEMINI_API_KEY) {
          try {
            embedding = await embedDocumentText(chunk, GEMINI_API_KEY);
          } catch (e) {
            console.warn(`      Failed to generate embedding for chunk ${i}:`, e);
          }
        }

        if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
          try {
            const docRes = await fetch(`${SUPABASE_URL}/rest/v1/source_documents`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                apikey: SUPABASE_SERVICE_ROLE_KEY,
                Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                Prefer: 'resolution=ignore-duplicates',
              },
              body: JSON.stringify({
                form_id: formId,
                title: `${meta.title} — Part ${i + 1} (${file})`,
                official_url: meta.official_url,
                doc_type: ext === '.html' ? 'guideline_web' : 'regulatory_manual',
                content: chunk,
                embedding: embedding || null,
                meta: {
                  filename: file,
                  chunk_index: i,
                  total_chunks: chunks.length,
                  ingested_at: new Date().toISOString(),
                },
              }),
            });

            if (!docRes.ok) {
              console.warn(`      Document insert error: ${await docRes.text()}`);
            }
          } catch (err) {
            console.warn(`      Supabase insert network error:`, err);
          }
        }

        totalChunksIndexed++;
      }
    }

    // Set forms.last_indexed_at
    if (formId && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/forms?id=eq.${formId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            last_indexed_at: new Date().toISOString(),
          }),
        });

        if (updateRes.ok) {
          console.log(`   ✅ Successfully updated forms.last_indexed_at for ${formId}`);
        }
      } catch (err) {
        console.warn(`   Failed to update last_indexed_at:`, err);
      }
    }

    console.log(`   ✨ Completed folder ${folder.name}: ${totalChunksIndexed} total chunks processed.`);
  }

  console.log(`\n======================================================`);
  console.log(`[FormAssist Ingest] Pipeline complete!`);
  console.log(`======================================================\n`);
}

// Standalone CLI execution
if (process.argv[1] && process.argv[1].endsWith('ingest-source-docs.ts')) {
  const args = process.argv.slice(2);
  let targetDir = 'data/source-documents';

  const dirIndex = args.indexOf('--dir');
  if (dirIndex !== -1 && args[dirIndex + 1]) {
    targetDir = args[dirIndex + 1];
  }

  ingestDirectory(targetDir).catch((err) => {
    console.error('Ingest script encountered fatal error:', err);
    process.exit(1);
  });
}
