-- =====================================================
-- DATABASE INDEXES FOR PERFORMANCE OPTIMIZATION
-- =====================================================
-- Run this in Supabase SQL Editor to add indexes
-- for frequently queried columns
-- =====================================================

-- Clients table indexes
-- These improve search and lookup performance
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_first_name ON clients(first_name);
CREATE INDEX IF NOT EXISTS idx_clients_last_name ON clients(last_name);
CREATE INDEX IF NOT EXISTS idx_clients_dog_name ON clients(dog_name);
CREATE INDEX IF NOT EXISTS idx_clients_membership ON clients(membership);
CREATE INDEX IF NOT EXISTS idx_clients_active ON clients(active);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);

-- Composite index for common search patterns
CREATE INDEX IF NOT EXISTS idx_clients_name_search ON clients(first_name, last_name);

-- Sessions table indexes
-- These improve calendar and session lookup performance
CREATE INDEX IF NOT EXISTS idx_sessions_client_id ON sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_sessions_booking_date ON sessions(booking_date DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_booking_time ON sessions(booking_time);
CREATE INDEX IF NOT EXISTS idx_sessions_session_type ON sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_sessions_event_id ON sessions(event_id);
CREATE INDEX IF NOT EXISTS idx_sessions_payment_status ON sessions(payment_status);

-- Composite index for date range queries (calendar view)
CREATE INDEX IF NOT EXISTS idx_sessions_date_time ON sessions(booking_date DESC, booking_time DESC);

-- Memberships table indexes
-- These improve membership lookup and matching
CREATE INDEX IF NOT EXISTS idx_memberships_email ON memberships(email);
CREATE INDEX IF NOT EXISTS idx_memberships_date ON memberships(date DESC);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);

-- Client Email Aliases table indexes
-- These improve email matching performance
CREATE INDEX IF NOT EXISTS idx_client_email_aliases_client_id ON client_email_aliases(client_id);
CREATE INDEX IF NOT EXISTS idx_client_email_aliases_email ON client_email_aliases(email);

-- Behaviour Questionnaires table indexes
CREATE INDEX IF NOT EXISTS idx_behaviour_questionnaires_client_id ON behaviour_questionnaires(client_id);
CREATE INDEX IF NOT EXISTS idx_behaviour_questionnaires_email ON behaviour_questionnaires(email);
CREATE INDEX IF NOT EXISTS idx_behaviour_questionnaires_dog_name ON behaviour_questionnaires(dog_name);
CREATE INDEX IF NOT EXISTS idx_behaviour_questionnaires_submitted_at ON behaviour_questionnaires(submitted_at DESC);

-- Behavioural Briefs table indexes
CREATE INDEX IF NOT EXISTS idx_behavioural_briefs_client_id ON behavioural_briefs(client_id);
CREATE INDEX IF NOT EXISTS idx_behavioural_briefs_email ON behavioural_briefs(email);
CREATE INDEX IF NOT EXISTS idx_behavioural_briefs_submitted_at ON behavioural_briefs(submitted_at DESC);

-- Booking Terms table indexes
CREATE INDEX IF NOT EXISTS idx_booking_terms_email ON booking_terms(email);
CREATE INDEX IF NOT EXISTS idx_booking_terms_submitted ON booking_terms(submitted DESC);

-- Action Points table indexes
CREATE INDEX IF NOT EXISTS idx_action_points_session_id ON action_points(session_id);
CREATE INDEX IF NOT EXISTS idx_action_points_completed ON action_points(completed);

-- Session Participants table indexes
CREATE INDEX IF NOT EXISTS idx_session_participants_session_id ON session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_client_id ON session_participants(client_id);

-- Session Plans table indexes
CREATE INDEX IF NOT EXISTS idx_session_plans_session_id ON session_plans(session_id);
CREATE INDEX IF NOT EXISTS idx_session_plans_created_at ON session_plans(created_at DESC);

-- Booking Terms Versions table indexes
CREATE INDEX IF NOT EXISTS idx_booking_terms_versions_is_active ON booking_terms_versions(is_active);
CREATE INDEX IF NOT EXISTS idx_booking_terms_versions_created_at ON booking_terms_versions(created_at DESC);

-- =====================================================
-- ANALYZE TABLES
-- =====================================================
-- Update table statistics for query planner
ANALYZE clients;
ANALYZE sessions;
ANALYZE memberships;
ANALYZE client_email_aliases;
ANALYZE behaviour_questionnaires;
ANALYZE behavioural_briefs;
ANALYZE booking_terms;
ANALYZE action_points;
ANALYZE session_participants;
ANALYZE session_plans;
ANALYZE booking_terms_versions;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Run this to verify indexes were created:
-- SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;

