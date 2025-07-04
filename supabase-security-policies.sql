-- Secure RLS Policies for Production
-- Run this SQL in your Supabase SQL Editor to implement secure Row Level Security

-- WARNING: This will replace existing permissive policies with secure ones
-- Make sure your application authentication is working before applying

-- 1. Drop existing permissive policies
DROP POLICY IF EXISTS "Allow all operations on clients" ON clients;
DROP POLICY IF EXISTS "Allow all operations on sessions" ON sessions;
DROP POLICY IF EXISTS "Allow all operations on memberships" ON memberships;
DROP POLICY IF EXISTS "Allow all operations on behavioural_briefs" ON behavioural_briefs;
DROP POLICY IF EXISTS "Allow all operations on behaviour_questionnaires" ON behaviour_questionnaires;
DROP POLICY IF EXISTS "Allow all operations on booking_terms" ON booking_terms;
DROP POLICY IF EXISTS "Allow all operations on client_email_aliases" ON client_email_aliases;
DROP POLICY IF EXISTS "Allow all operations on action_points" ON action_points;
DROP POLICY IF EXISTS "Allow all operations on session_participants" ON session_participants;
DROP POLICY IF EXISTS "Allow all operations on session_plans" ON session_plans;

-- 2. Create secure policies for authenticated users only

-- Clients table - authenticated users only
CREATE POLICY "Authenticated users can manage clients" ON clients
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Sessions table - authenticated users only
CREATE POLICY "Authenticated users can manage sessions" ON sessions
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Memberships table - authenticated users only
CREATE POLICY "Authenticated users can manage memberships" ON memberships
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Behavioural briefs - allow public insert (for forms), authenticated read/update
CREATE POLICY "Public can insert behavioural briefs" ON behavioural_briefs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can read/update behavioural briefs" ON behavioural_briefs
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update behavioural briefs" ON behavioural_briefs
    FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Behaviour questionnaires - allow public insert (for forms), authenticated read/update
CREATE POLICY "Public can insert behaviour questionnaires" ON behaviour_questionnaires
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can read/update behaviour questionnaires" ON behaviour_questionnaires
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update behaviour questionnaires" ON behaviour_questionnaires
    FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Booking terms - allow public insert (for forms), authenticated read/update
CREATE POLICY "Public can insert booking terms" ON booking_terms
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can read/update booking terms" ON booking_terms
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update booking terms" ON booking_terms
    FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Client email aliases - authenticated users only
CREATE POLICY "Authenticated users can manage client email aliases" ON client_email_aliases
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Action points - authenticated users only
CREATE POLICY "Authenticated users can manage action points" ON action_points
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Session participants - authenticated users only
CREATE POLICY "Authenticated users can manage session participants" ON session_participants
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Session plans - authenticated users only
CREATE POLICY "Authenticated users can manage session plans" ON session_plans
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 3. Ensure RLS is enabled on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavioural_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE behaviour_questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_email_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_plans ENABLE ROW LEVEL SECURITY;

-- 4. Create function to check if user is admin (optional - for future use)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.jwt() ->> 'email' IN (
    'raisingmyrescue@outlook.com',
    'your-admin-email@domain.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: After applying these policies, make sure:
-- 1. Your application properly authenticates users
-- 2. Public forms (behavioural briefs, questionnaires, booking terms) still work
-- 3. Webhook endpoints can still insert data (you may need service role for webhooks)
-- 4. Test all functionality thoroughly before deploying to production
