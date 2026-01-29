-- =====================================================
-- VERIFY DATABASE INDEXES
-- =====================================================
-- Run this in Supabase SQL Editor to check which indexes exist
-- =====================================================

-- Check all indexes in the public schema
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;

-- =====================================================
-- CHECK FOR MISSING INDEXES
-- =====================================================

-- Expected indexes that should exist:
-- This query will show which expected indexes are missing

WITH expected_indexes AS (
    SELECT 'clients' as table_name, 'idx_clients_email' as index_name UNION ALL
    SELECT 'clients', 'idx_clients_first_name' UNION ALL
    SELECT 'clients', 'idx_clients_last_name' UNION ALL
    SELECT 'clients', 'idx_clients_dog_name' UNION ALL
    SELECT 'clients', 'idx_clients_membership' UNION ALL
    SELECT 'clients', 'idx_clients_active' UNION ALL
    SELECT 'clients', 'idx_clients_created_at' UNION ALL
    SELECT 'clients', 'idx_clients_name_search' UNION ALL
    SELECT 'sessions', 'idx_sessions_client_id' UNION ALL
    SELECT 'sessions', 'idx_sessions_booking_date' UNION ALL
    SELECT 'sessions', 'idx_sessions_booking_time' UNION ALL
    SELECT 'sessions', 'idx_sessions_session_type' UNION ALL
    SELECT 'sessions', 'idx_sessions_event_id' UNION ALL
    SELECT 'sessions', 'idx_sessions_payment_status' UNION ALL
    SELECT 'sessions', 'idx_sessions_date_time' UNION ALL
    SELECT 'memberships', 'idx_memberships_email' UNION ALL
    SELECT 'memberships', 'idx_memberships_date' UNION ALL
    SELECT 'memberships', 'idx_memberships_status' UNION ALL
    SELECT 'client_email_aliases', 'idx_client_email_aliases_client_id' UNION ALL
    SELECT 'client_email_aliases', 'idx_client_email_aliases_email' UNION ALL
    SELECT 'behaviour_questionnaires', 'idx_behaviour_questionnaires_client_id' UNION ALL
    SELECT 'behaviour_questionnaires', 'idx_behaviour_questionnaires_email' UNION ALL
    SELECT 'behaviour_questionnaires', 'idx_behaviour_questionnaires_dog_name' UNION ALL
    SELECT 'behaviour_questionnaires', 'idx_behaviour_questionnaires_submitted_at' UNION ALL
    SELECT 'behavioural_briefs', 'idx_behavioural_briefs_client_id' UNION ALL
    SELECT 'behavioural_briefs', 'idx_behavioural_briefs_email' UNION ALL
    SELECT 'behavioural_briefs', 'idx_behavioural_briefs_submitted_at' UNION ALL
    SELECT 'booking_terms', 'idx_booking_terms_email' UNION ALL
    SELECT 'booking_terms', 'idx_booking_terms_submitted' UNION ALL
    SELECT 'action_points', 'idx_action_points_session_id' UNION ALL
    SELECT 'action_points', 'idx_action_points_completed' UNION ALL
    SELECT 'session_participants', 'idx_session_participants_session_id' UNION ALL
    SELECT 'session_participants', 'idx_session_participants_client_id' UNION ALL
    SELECT 'session_plans', 'idx_session_plans_session_id' UNION ALL
    SELECT 'session_plans', 'idx_session_plans_created_at' UNION ALL
    SELECT 'booking_terms_versions', 'idx_booking_terms_versions_is_active' UNION ALL
    SELECT 'booking_terms_versions', 'idx_booking_terms_versions_created_at'
)
SELECT 
    e.table_name,
    e.index_name,
    CASE 
        WHEN i.indexname IS NULL THEN '❌ MISSING'
        ELSE '✅ EXISTS'
    END as status
FROM expected_indexes e
LEFT JOIN pg_indexes i 
    ON i.tablename = e.table_name 
    AND i.indexname = e.index_name
    AND i.schemaname = 'public'
ORDER BY 
    CASE WHEN i.indexname IS NULL THEN 0 ELSE 1 END,
    e.table_name, 
    e.index_name;

-- =====================================================
-- PERFORMANCE STATISTICS
-- =====================================================

-- Show table sizes and row counts
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

