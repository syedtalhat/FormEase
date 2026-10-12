# FormAssist Backend & Database Deployment Guide

This guide describes how to deploy the FormAssist backend, database schema, pgvector semantic search, and Edge Functions to Supabase Postgres.

FormAssist provides **TWO deployment paths**:
- **Path A: Automated GitHub Actions Workflow** (CI/CD via Supabase CLI)
- **Path B: Dashboard-Only Manual Path** (No CLI or local tools required, using `supabase/manual/*`)

---

## Architecture Overview

1. **PostgreSQL Database (`supabase/migrations/0001_init.sql`)**:
   - `pgcrypto`, `vector` (768 dimensions), `uuid-ossp`
   - Tables: `users`, `forms`, `source_documents`, `fields`, `explanations`, `chat_sessions`, `chat_messages`, `risk_flags`
   - Row Level Security (RLS) on all 8 tables per NFR-SEC.1–3
   - HNSW cosine similarity index on `source_documents.embedding`
   - Procedure: `match_source_documents(query_embedding, match_form_id, match_count, min_similarity)`
   - Auto-provisioning trigger: `on_auth_user_created` creates `public.users` profile on user signup.

2. **Supabase Edge Functions (`supabase/functions/`)**:
   - `/functions/v1/health`: Diagnostics for DB reachability, document count, and Gemini API.
   - `/functions/v1/analyze-form`: Form DOM analysis, risk classification (`classifyRisk`), caching, and 3-tier grounding hierarchy (`page` → `official` pgvector → `ai`).
   - `/functions/v1/explain-field`: On-demand field explanation.
   - `/functions/v1/chat`: Multi-turn context-aware assistant with strict prompt-injection defense.
   - `/functions/v1/preferences`: User preference store (`default_language`) with JWT auth.

3. **Backend Secrets (NFR-SEC.3)**:
   - `GEMINI_API_KEY`: Google Gemini API key for structured output and vector embeddings.
   - `SUPABASE_SERVICE_ROLE_KEY`: Secret service role key for database writes and RLS bypass.
   - **CRITICAL**: Never expose service role or Gemini API keys to the browser. Only the public `anon` key is permitted in client environments.

---

## Path A: Automated GitHub Actions Workflow

### 1. Create GitHub Secrets
In your GitHub repository, navigate to **Settings** → **Secrets and variables** → **Actions** and create the following repository secrets:

| Secret Name | Description | Where to Find |
| :--- | :--- | :--- |
| `SUPABASE_ACCESS_TOKEN` | Personal Access Token for Supabase CLI | Supabase Dashboard → Account → Access Tokens |
| `SUPABASE_PROJECT_REF` | 20-character reference ID of your project | Supabase Dashboard → Project Settings → General |
| `SUPABASE_DB_PASSWORD` | Postgres database password | Set during project creation |
| `GEMINI_API_KEY` | Google AI Studio Gemini API key | Google AI Studio → Get API Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key | Supabase Dashboard → Project Settings → API |

### 2. Set Edge Function Secrets in Supabase
Run via Supabase CLI or configure in Supabase Dashboard (Project Settings → Edge Functions → Secrets):
```bash
supabase secrets set GEMINI_API_KEY="<your-gemini-key>"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="<your-service-role-key>"
```

### 3. Run the Deploy Workflow
1. Go to the **Actions** tab in GitHub.
2. Select **Deploy Supabase (Database & Edge Functions)** (`.github/workflows/deploy-supabase.yml`).
3. Click **Run workflow**, choose branch `main`, and select:
   - `deploy_db`: `true`
   - `deploy_functions`: `true`
4. The workflow will link your project, apply schema migrations, and deploy all 5 edge functions.

---

## Path B: Dashboard-Only Manual Path (Using `supabase/manual/*`)

If you do not have CLI tools installed or prefer deploying directly in your web browser, follow these steps:

### 1. Apply Database Schema & RLS
1. In the Supabase Dashboard, select your project and click **SQL Editor** in the left sidebar.
2. Click **New query**.
3. Open [`supabase/manual/schema_all_in_one.sql`](./manual/schema_all_in_one.sql) in this repository and copy its entire content.
4. Paste the SQL into the editor and click **Run**.
5. Verify in **Table Editor** that all 8 tables (`forms`, `fields`, `source_documents`, `explanations`, `chat_sessions`, `chat_messages`, `risk_flags`, `users`) are created with Row Level Security enabled.

### 2. Configure Edge Function Secrets
1. In the Supabase Dashboard, navigate to **Project Settings** (gear icon) → **Edge Functions**.
2. Click **Add new secret** and add:
   - `GEMINI_API_KEY`: `<your-gemini-api-key>`
   - `SUPABASE_SERVICE_ROLE_KEY`: `<your-supabase-service-role-key>`

### 3. Deploy Standalone Bundled Edge Functions
Pre-bundled, self-contained single-file functions with all imports inlined are available in `supabase/manual/functions/`:

1. In the Supabase Dashboard, click **Edge Functions** in the left sidebar.
2. Click **Create function** for each of the following:

| Function Name | Source File to Copy & Paste | Verify JWT Setting |
| :--- | :--- | :--- |
| `health` | [`supabase/manual/functions/health.ts`](./manual/functions/health.ts) | Unchecked (Public) |
| `analyze-form` | [`supabase/manual/functions/analyze-form.ts`](./manual/functions/analyze-form.ts) | Unchecked (Rate-limited public) |
| `explain-field` | [`supabase/manual/functions/explain-field.ts`](./manual/functions/explain-field.ts) | Unchecked (Rate-limited public) |
| `chat` | [`supabase/manual/functions/chat.ts`](./manual/functions/chat.ts) | Unchecked (Verified inside handler) |
| `preferences` | [`supabase/manual/functions/preferences.ts`](./manual/functions/preferences.ts) | Unchecked (Verified inside handler) |

3. Click **Deploy** for each function.

---

## Indexing Official Documents into `pgvector`

To chunk and index demo regulatory guidelines into `source_documents`:

1. Ensure environment variables are set in `.env.local`:
   ```bash
   SUPABASE_URL="https://your-project.supabase.co"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   GEMINI_API_KEY="your-gemini-key"
   ```
2. Run the local ingestion script:
   ```bash
   npm run ingest:docs
   ```
   This will chunk files in `data/source-documents/` (~800 characters with 100 character overlap), compute L2-normalized embeddings using `gemini-embedding-2-preview` (768 dimensions), upsert them to `source_documents`, and update `forms.last_indexed_at`.

---

## Verification & Health Check

### 1. Test the `/health` Endpoint
Send a GET request to the deployed health function:
```bash
curl https://<your-project-ref>.supabase.co/functions/v1/health
```
Expected response:
```json
{
  "ok": true,
  "timestamp": "2026-03-08T00:00:00.000Z",
  "database": {
    "reachable": true,
    "indexed_documents": 11,
    "latency_ms": 35
  },
  "gemini": {
    "reachable": true,
    "model": "gemini-3.8-flash"
  },
  "embedding": {
    "reachable": true,
    "model": "gemini-embedding-2-preview"
  }
}
```

### 2. Testing Developer Workbench in Live Mode
1. In the root directory, create or edit `.env.local`:
   ```bash
   VITE_API_MODE="live"
   VITE_SUPABASE_URL="https://<your-project-ref>.supabase.co"
   VITE_SUPABASE_ANON_KEY="<your-public-anon-key>"
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```
3. Open the Workbench in your browser at `http://localhost:3000`.
4. Check the **Backend Health** panel at the top right to verify green status indicators.
5. In **Page Simulator**, test form analysis and field tooltips; all requests will flow directly to your live Supabase Edge Functions.
