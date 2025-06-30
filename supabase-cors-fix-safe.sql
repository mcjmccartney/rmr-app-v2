-- Supabase CORS and RLS Fix (Safe Version)
-- Run this SQL in your Supabase SQL Editor to fix CORS and access issues
-- IMPORTANT: Also add https://raising-my-rescue.vercel.app to your Supabase CORS origins in the dashboard

-- This version only operates on tables that exist and handles errors gracefully

-- Core tables that should exist
DO $$
BEGIN
    -- Enable RLS on core tables if they exist
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clients') THEN
        ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all operations on clients" ON clients;
        CREATE POLICY "Allow all operations on clients" ON clients FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sessions') THEN
        ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all operations on sessions" ON sessions;
        CREATE POLICY "Allow all operations on sessions" ON sessions FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'memberships') THEN
        ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all operations on memberships" ON memberships;
        CREATE POLICY "Allow all operations on memberships" ON memberships FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'behavioural_briefs') THEN
        ALTER TABLE behavioural_briefs ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all operations on behavioural_briefs" ON behavioural_briefs;
        CREATE POLICY "Allow all operations on behavioural_briefs" ON behavioural_briefs FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'behaviour_questionnaires') THEN
        ALTER TABLE behaviour_questionnaires ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all operations on behaviour_questionnaires" ON behaviour_questionnaires;
        CREATE POLICY "Allow all operations on behaviour_questionnaires" ON behaviour_questionnaires FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'booking_terms') THEN
        ALTER TABLE booking_terms ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all operations on booking_terms" ON booking_terms;
        CREATE POLICY "Allow all operations on booking_terms" ON booking_terms FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'client_email_aliases') THEN
        ALTER TABLE client_email_aliases ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all operations on client_email_aliases" ON client_email_aliases;
        CREATE POLICY "Allow all operations on client_email_aliases" ON client_email_aliases FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'action_points') THEN
        ALTER TABLE action_points ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all operations on action_points" ON action_points;
        CREATE POLICY "Allow all operations on action_points" ON action_points FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'session_participants') THEN
        ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all operations on session_participants" ON session_participants;
        CREATE POLICY "Allow all operations on session_participants" ON session_participants FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'session_plans') THEN
        ALTER TABLE session_plans ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all operations on session_plans" ON session_plans;
        CREATE POLICY "Allow all operations on session_plans" ON session_plans FOR ALL USING (true) WITH CHECK (true);
    END IF;

END $$;

-- Grant necessary permissions to anon role
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Also grant to authenticated role
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
