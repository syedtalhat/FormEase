-- ==============================================================================
-- FormAssist: Row Level Security (RLS) Verification Tests (NFR-SEC.1–3)
-- Validates:
-- 1. Anonymous role cannot write to reference tables (forms, fields, explanations, etc.)
-- 2. User A cannot read or write User B's chat sessions or messages
-- 3. User A can only read and update their own user profile row
-- ==============================================================================

BEGIN;

-- Setup test users
INSERT INTO auth.users (id, email)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'user_a@example.com'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'user_b@example.com')
ON CONFLICT (id) DO NOTHING;

-- Trigger creates public.users rows automatically
-- Verify User A profile created
DO $$
BEGIN
    ASSERT EXISTS (SELECT 1 FROM public.users WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid),
        'User A should exist in public.users';
END $$;

-- -----------------------------------------------------------------------------
-- TEST SUITE 1: Anonymous Role Cannot Write Reference Tables
-- -----------------------------------------------------------------------------

-- Switch to anon context
SET LOCAL ROLE anon;
SET LOCAL "request.jwt.claim.role" = 'anon';
RESET "request.jwt.claim.sub";

-- 1.1 Anon CAN read forms
DO $$
DECLARE
    f_count INT;
BEGIN
    SELECT count(*) INTO f_count FROM public.forms;
    ASSERT f_count >= 1, 'Anon should be able to SELECT from public.forms';
END $$;

-- 1.2 Anon CANNOT insert into forms
DO $$
BEGIN
    BEGIN
        INSERT INTO public.forms (domain, page_url_pattern, title)
        VALUES ('malicious.org', '/steal', 'Phishing Page');
        RAISE EXCEPTION 'RLS FAIL: Anon was able to INSERT into public.forms!';
    EXCEPTION
        WHEN insufficient_privilege THEN
            -- Expected error
            NULL;
    END;
END $$;

-- 1.3 Anon CANNOT insert into source_documents
DO $$
BEGIN
    BEGIN
        INSERT INTO public.source_documents (title, official_url, content)
        VALUES ('Fake Guideline', 'https://fake.org', 'Corrupt data');
        RAISE EXCEPTION 'RLS FAIL: Anon was able to INSERT into public.source_documents!';
    EXCEPTION
        WHEN insufficient_privilege THEN
            NULL;
    END;
END $$;

-- -----------------------------------------------------------------------------
-- TEST SUITE 2: User A Cannot Read or Write User B's Chats
-- -----------------------------------------------------------------------------

-- Switch to service_role to seed User B session
SET LOCAL ROLE service_role;
INSERT INTO public.chat_sessions (id, user_id, language)
VALUES ('b0000000-0000-0000-0000-000000000001'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'en')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.chat_messages (id, session_id, role, content)
VALUES ('b0000000-0000-0000-0000-000000000002'::uuid, 'b0000000-0000-0000-0000-000000000001'::uuid, 'user', 'Confidential query from User B')
ON CONFLICT (id) DO NOTHING;

-- Switch to authenticated User A
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.role" = 'authenticated';
SET LOCAL "request.jwt.claim.sub" = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- 2.1 User A CANNOT see User B's chat sessions
DO $$
DECLARE
    sess_count INT;
BEGIN
    SELECT count(*) INTO sess_count
    FROM public.chat_sessions
    WHERE id = 'b0000000-0000-0000-0000-000000000001'::uuid;

    ASSERT sess_count = 0, 'RLS FAIL: User A was able to read User B chat session!';
END $$;

-- 2.2 User A CANNOT see User B's chat messages
DO $$
DECLARE
    msg_count INT;
BEGIN
    SELECT count(*) INTO msg_count
    FROM public.chat_messages
    WHERE session_id = 'b0000000-0000-0000-0000-000000000001'::uuid;

    ASSERT msg_count = 0, 'RLS FAIL: User A was able to read User B chat messages!';
END $$;

-- 2.3 User A CANNOT insert a message into User B's session
DO $$
BEGIN
    BEGIN
        INSERT INTO public.chat_messages (session_id, role, content)
        VALUES ('b0000000-0000-0000-0000-000000000001'::uuid, 'user', 'Injected message from User A');
        RAISE EXCEPTION 'RLS FAIL: User A was able to inject a message into User B session!';
    EXCEPTION
        WHEN insufficient_privilege OR check_violation THEN
            NULL;
    END;
END $$;

-- 2.4 User A CAN create and read their OWN chat session
DO $$
DECLARE
    my_sess_id UUID := 'a0000000-0000-0000-0000-000000000001'::uuid;
    read_count INT;
BEGIN
    INSERT INTO public.chat_sessions (id, user_id, language)
    VALUES (my_sess_id, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'en');

    INSERT INTO public.chat_messages (session_id, role, content)
    VALUES (my_sess_id, 'user', 'Hello from User A');

    SELECT count(*) INTO read_count
    FROM public.chat_messages
    WHERE session_id = my_sess_id;

    ASSERT read_count = 1, 'User A should be able to read their own messages';
END $$;

-- -----------------------------------------------------------------------------
-- TEST SUITE 3: User Profile Isolation
-- -----------------------------------------------------------------------------

-- 3.1 User A cannot read User B profile
DO $$
DECLARE
    profile_count INT;
BEGIN
    SELECT count(*) INTO profile_count
    FROM public.users
    WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid;

    ASSERT profile_count = 0, 'RLS FAIL: User A was able to read User B profile!';
END $$;

-- 3.2 User A can read and update their own profile
DO $$
DECLARE
    my_lang TEXT;
BEGIN
    UPDATE public.users
    SET default_language = 'mr'
    WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid;

    SELECT default_language INTO my_lang
    FROM public.users
    WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid;

    ASSERT my_lang = 'mr', 'User A should be able to update their own language preference';
END $$;

ROLLBACK;
-- All tests passed without error!
