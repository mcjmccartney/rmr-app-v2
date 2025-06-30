-- Supabase CORS and RLS Fix
-- Run this SQL in your Supabase SQL Editor to fix CORS and access issues

-- 1. Ensure RLS policies allow public access for your app
-- Note: These are permissive policies for development. Restrict them in production.

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations on clients" ON clients;
DROP POLICY IF EXISTS "Allow all operations on sessions" ON sessions;
DROP POLICY IF EXISTS "Allow all operations on memberships" ON memberships;
DROP POLICY IF EXISTS "Allow all operations on behavioural_briefs" ON behavioural_briefs;
DROP POLICY IF EXISTS "Allow all operations on behaviour_questionnaires" ON behaviour_questionnaires;
DROP POLICY IF EXISTS "Allow all operations on booking_terms" ON booking_terms;
DROP POLICY IF EXISTS "Allow all operations on client_email_aliases" ON client_email_aliases;
DROP POLICY IF EXISTS "Allow all operations on action_points" ON action_points;
DROP POLICY IF EXISTS "Allow all operations on session_participants" ON session_participants;

-- Create permissive policies for all tables
CREATE POLICY "Allow all operations on clients" ON clients
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on sessions" ON sessions
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on memberships" ON memberships
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on behavioural_briefs" ON behavioural_briefs
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on behaviour_questionnaires" ON behaviour_questionnaires
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on booking_terms" ON booking_terms
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on client_email_aliases" ON client_email_aliases
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on action_points" ON action_points
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on session_participants" ON session_participants
    FOR ALL USING (true) WITH CHECK (true);

-- Ensure RLS is enabled on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavioural_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE behaviour_questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_email_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;

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
