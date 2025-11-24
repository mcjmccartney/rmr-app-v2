-- Check RLS Status for All Tables
-- Run this in Supabase SQL Editor to see which tables have RLS enabled
-- and what policies are currently active

-- 1. Check which tables have RLS enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. List all active RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Check if specific tables have RLS enabled
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN (
        'clients',
        'sessions',
        'memberships',
        'behavioural_briefs',
        'behaviour_questionnaires',
        'booking_terms',
        'client_email_aliases',
        'action_points',
        'session_participants',
        'session_plans'
    )
ORDER BY tablename;

