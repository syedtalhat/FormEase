-- ==============================================================================
-- FormAssist: Smart Civic & Banking Form Assistant
-- Database Schema & Initial Migrations (0001_init.sql)
-- Supabase Postgres + pgvector (768 dimensions) + Row Level Security (RLS)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Compatible schema stub for auth if running in standalone Postgres / testing
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CORE TABLES (ERD Figure 3)

-- Users Table (Preferences & profile linked to auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    default_language TEXT NOT NULL DEFAULT 'en' CHECK (default_language IN ('en', 'hi', 'mr')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Forms Table
CREATE TABLE IF NOT EXISTS public.forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain TEXT NOT NULL,
    page_url_pattern TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    last_indexed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT forms_domain_pattern_unique UNIQUE (domain, page_url_pattern)
);

-- Official Regulatory & Guideline Source Documents (pgvector 768 dimensions)
CREATE TABLE IF NOT EXISTS public.source_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    official_url TEXT NOT NULL,
    doc_type TEXT NOT NULL DEFAULT 'guideline',
    content TEXT NOT NULL,
    embedding VECTOR(768),
    meta JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Form Fields Table
CREATE TABLE IF NOT EXISTS public.fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
    field_key TEXT NOT NULL,
    label TEXT NOT NULL,
    input_type TEXT NOT NULL DEFAULT 'text',
    required BOOLEAN NOT NULL DEFAULT false,
    placeholder TEXT,
    options JSONB,
    page_help TEXT,
    risk_tag TEXT NOT NULL DEFAULT 'required' CHECK (risk_tag IN ('required', 'optional', 'unusual')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fields_form_field_unique UNIQUE (form_id, field_key)
);

-- Explanations (3-tier Provenance Cache: page, official, ai)
CREATE TABLE IF NOT EXISTS public.explanations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
    language TEXT NOT NULL CHECK (language IN ('en', 'hi', 'mr')),
    summary TEXT NOT NULL,
    text TEXT NOT NULL,
    source_label TEXT NOT NULL CHECK (source_label IN ('page', 'official', 'ai')),
    source_url TEXT,
    source_excerpt TEXT,
    confidence NUMERIC NOT NULL DEFAULT 1.0,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT explanations_field_lang_unique UNIQUE (field_id, language)
);

-- Chat Assistant Sessions (Scoped to user owner)
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    form_id UUID REFERENCES public.forms(id) ON DELETE SET NULL,
    language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'hi', 'mr')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chat Messages (Strictly context-bounded / no typed PII values stored)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    focused_field_id UUID REFERENCES public.fields(id) ON DELETE SET NULL,
    provenance TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Risk Flags Logged per Form
CREATE TABLE IF NOT EXISTS public.risk_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
    field_id UUID REFERENCES public.fields(id) ON DELETE SET NULL,
    flag_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
    description_key TEXT NOT NULL,
    meta JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_forms_domain ON public.forms(domain);
CREATE INDEX IF NOT EXISTS idx_fields_form_id ON public.fields(form_id);
CREATE INDEX IF NOT EXISTS idx_fields_lookup ON public.fields(form_id, field_key);
CREATE INDEX IF NOT EXISTS idx_explanations_field_lang ON public.explanations(field_id, language);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_risk_flags_form ON public.risk_flags(form_id);

-- Vector Cosine Index for Semantic Search (HNSW)
CREATE INDEX IF NOT EXISTS idx_source_documents_embedding
    ON public.source_documents
    USING hnsw (embedding vector_cosine_ops);

-- 4. DATABASE TRIGGERS & PROCEDURES

-- Auto-provision public.users record when a new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO public.users (id, default_language)
    VALUES (NEW.id, 'en')
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Vector Similarity Search RPC for Source Documents
CREATE OR REPLACE FUNCTION public.match_source_documents (
    query_embedding VECTOR(768),
    match_form_id UUID DEFAULT NULL,
    match_count INT DEFAULT 5,
    min_similarity FLOAT DEFAULT 0.65
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    official_url TEXT,
    content TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT
        sd.id,
        sd.title,
        sd.official_url,
        sd.content,
        (1 - (sd.embedding <=> query_embedding))::FLOAT AS similarity
    FROM public.source_documents sd
    WHERE sd.embedding IS NOT NULL
      AND (match_form_id IS NULL OR sd.form_id IS NULL OR sd.form_id = match_form_id)
      AND (1 - (sd.embedding <=> query_embedding)) >= min_similarity
    ORDER BY sd.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- 5. ROW LEVEL SECURITY (RLS) POLICIES (NFR-SEC.1–3)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.explanations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_flags ENABLE ROW LEVEL SECURITY;

-- 5.1 USERS: User can only read and write their own row
DROP POLICY IF EXISTS "Users can read own record" ON public.users;
CREATE POLICY "Users can read own record"
    ON public.users
    FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own record" ON public.users;
CREATE POLICY "Users can update own record"
    ON public.users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own record" ON public.users;
CREATE POLICY "Users can insert own record"
    ON public.users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 5.2 REFERENCE CATALOGS: Publicly readable; writeable strictly by service role
-- Note: In Supabase, service_role bypasses RLS by default.
-- Having only SELECT policies for public ensures anon/authenticated cannot write.

DROP POLICY IF EXISTS "Public can view forms" ON public.forms;
CREATE POLICY "Public can view forms"
    ON public.forms
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Public can view fields" ON public.fields;
CREATE POLICY "Public can view fields"
    ON public.fields
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Public can view source documents" ON public.source_documents;
CREATE POLICY "Public can view source documents"
    ON public.source_documents
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Public can view explanations" ON public.explanations;
CREATE POLICY "Public can view explanations"
    ON public.explanations
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Public can view risk flags" ON public.risk_flags;
CREATE POLICY "Public can view risk flags"
    ON public.risk_flags
    FOR SELECT
    USING (true);

-- 5.3 CHAT SESSIONS & MESSAGES: Isolated strictly to auth.uid() owner
DROP POLICY IF EXISTS "Users can manage own chat sessions" ON public.chat_sessions;
CREATE POLICY "Users can manage own chat sessions"
    ON public.chat_sessions
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage messages in own sessions" ON public.chat_messages;
CREATE POLICY "Users can manage messages in own sessions"
    ON public.chat_messages
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_sessions s
            WHERE s.id = public.chat_messages.session_id
              AND s.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chat_sessions s
            WHERE s.id = public.chat_messages.session_id
              AND s.user_id = auth.uid()
        )
    );

-- 6. SEED REFERENCE DATA
INSERT INTO public.forms (id, domain, page_url_pattern, title, description)
VALUES
    (
        '10000000-0000-0000-0000-000000000001'::uuid,
        'scholarships.gov.in',
        '/apply',
        'Post-Matric Scholarship Application',
        'Official state scholarship portal application for post-matric students.'
    ),
    (
        '10000000-0000-0000-0000-000000000002'::uuid,
        'nationalbank.in',
        '/rekyc',
        'Customer Periodic Re-KYC Update',
        'RBI mandated customer re-verification portal for banking account holders.'
    )
ON CONFLICT (domain, page_url_pattern) DO UPDATE
SET title = EXCLUDED.title, description = EXCLUDED.description, updated_at = now();

INSERT INTO public.source_documents (id, form_id, title, official_url, doc_type, content, meta)
VALUES
    (
        '20000000-0000-0000-0000-000000000001'::uuid,
        '10000000-0000-0000-0000-000000000002'::uuid,
        'RBI Master Direction – Know Your Customer (KYC) Direction, 2016 (Updated 2024)',
        'https://rbi.org.in/Scripts/BS_ViewMasDirections.aspx?id=11566',
        'regulation',
        'Section 38: Periodic Updation of KYC requires customers to furnish Officially Valid Documents (OVD). Banks shall not demand submission of physical debit cards, PINs, or net banking passwords for periodic KYC updation. Updation can be done via Aadhaar OTP-based authentication, Video KYC, or document upload.',
        '{"jurisdiction": "IN", "authority": "Reserve Bank of India"}'::jsonb
    ),
    (
        '20000000-0000-0000-0000-000000000002'::uuid,
        '10000000-0000-0000-0000-000000000001'::uuid,
        'National Scholarship Portal User Manual & Eligibility Guidelines',
        'https://scholarships.gov.in/public/manual.pdf',
        'guideline',
        'Applicants must provide their 12-digit Aadhaar number for direct benefit transfer (DBT). Annual Family Income Certificate issued by the designated competent revenue authority (Tehsildar/Sub-Divisional Magistrate) is mandatory for means-tested scholarship schemes.',
        '{"jurisdiction": "IN", "authority": "Ministry of Electronics and Information Technology"}'::jsonb
    )
ON CONFLICT DO NOTHING;
