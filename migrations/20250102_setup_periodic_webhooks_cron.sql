-- Setup Periodic Webhooks Cron Job
-- This migration sets up the daily cron job for 4-day session reminders
-- Run this in your Supabase SQL Editor

-- Step 1: Enable required extensions
-- Enable pg_cron for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net for making HTTP requests
-- Note: pg_net might need to be enabled in Supabase Dashboard first
-- Go to Database → Extensions and enable "pg_net"
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Step 2: Grant permissions to use pg_net
-- This allows the cron job to make HTTP requests
GRANT USAGE ON SCHEMA net TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA net TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA net TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA net TO postgres;

-- Step 3: Create the cron job
-- This will run daily at 8:00 AM UTC
-- IMPORTANT: Replace 'YOUR_WEBHOOK_API_KEY_HERE' with your actual WEBHOOK_API_KEY from Vercel

-- First, unschedule any existing job with the same name (in case you're re-running this)
SELECT cron.unschedule('daily-session-webhooks') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'daily-session-webhooks'
);

-- Create the new cron job
SELECT cron.schedule(
  'daily-session-webhooks',           -- Job name
  '0 8 * * *',                        -- Cron schedule (8:00 AM UTC daily)
  $$
  SELECT
    net.http_post(
      url := 'https://rmrcms.vercel.app/api/daily-webhooks',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-api-key', 'YOUR_WEBHOOK_API_KEY_HERE'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- Step 4: Verify the cron job was created
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname = 'daily-session-webhooks';

-- Step 5: Check if pg_net extension is available
-- If this returns no rows, you need to enable pg_net in Supabase Dashboard
SELECT * FROM pg_available_extensions WHERE name = 'pg_net';

-- Step 6: Verify pg_net is installed
-- This should return a row if pg_net is properly installed
SELECT * FROM pg_extension WHERE extname = 'pg_net';

-- TROUBLESHOOTING:
-- If you get "schema net does not exist":
-- 1. Go to Supabase Dashboard → Database → Extensions
-- 2. Search for "pg_net" or "http"
-- 3. Enable the extension
-- 4. Re-run this migration

-- MANUAL TEST:
-- To test the cron job immediately, create a temporary job that runs every minute:
/*
SELECT cron.schedule(
  'test-webhook-now',
  '* * * * *',  -- Run every minute
  $$
  SELECT
    net.http_post(
      url := 'https://rmrcms.vercel.app/api/daily-webhooks',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-api-key', 'YOUR_WEBHOOK_API_KEY_HERE'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
*/

-- Wait 1-2 minutes, then check Make.com for webhooks
-- Then delete the test job:
-- SELECT cron.unschedule('test-webhook-now');

-- VIEW CRON JOB HISTORY:
-- To see when the cron job last ran and if it succeeded:
/*
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-session-webhooks')
ORDER BY start_time DESC
LIMIT 10;
*/

