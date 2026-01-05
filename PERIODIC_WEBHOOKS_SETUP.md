# Periodic Webhooks Setup Guide

This guide will help you set up the 4-day periodic reminder webhooks using Supabase cron jobs.

## ✅ What's Been Done

The periodic webhook endpoints have been **re-enabled** and are ready to use:

- ✅ `/api/daily-webhooks` - Processes 4-day reminders
- ✅ `/api/scheduled-webhooks-combined` - Alternative endpoint (same functionality)
- ✅ Payment links automatically generated for each session
- ✅ Complete webhook data structure (client info, session details, payment link)
- ✅ **Fixed date calculation** - Now uses calendar days (midnight-to-midnight) for accurate matching

## 🎯 How It Works

### Automatic Filtering
When the cron job runs daily at 8:00 AM UTC:

1. Fetches all sessions from Supabase
2. Fetches all clients from Supabase
3. **Filters sessions that are exactly 4 calendar days away**
4. For each matching session:
   - Generates payment link based on session type, membership, travel zone
   - Builds complete webhook data
   - Sends to Make.com webhook URL
5. Returns summary of processed sessions

### Example
If cron runs on **January 5th** (any time during the day):
- ✅ **All sessions on January 9th** → 4 days away → **WEBHOOKS SENT**
- ❌ Sessions on January 8th → 3 days away → **SKIPPED**
- ❌ Sessions on January 10th → 5 days away → **SKIPPED**

**Note:** The system now uses calendar days (midnight-to-midnight), so all sessions scheduled for the target date will be triggered regardless of what time the cron runs.

## 🔧 Setup Instructions

### Option A: HTTP Request (Recommended - Easiest)

This is the **simplest method** and doesn't require any database extensions.

#### Step 1: Get Your WEBHOOK_API_KEY

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Find `WEBHOOK_API_KEY` and copy its value
3. Keep this handy for the next step

#### Step 2: Create Supabase Cron Job with HTTP Request

1. Go to Supabase Dashboard → **Database** → **Cron Jobs**
2. Click **"Create a new cron job"** or edit existing `daily-session-webhooks`
3. Configure the cron job:
   - **Name:** `daily-session-webhooks`
   - **Schedule:** `0 8 * * *` (runs at 8:00 AM UTC daily)
   - **Type:** Select **"HTTP Request"**
   - **Method:** `POST`
   - **URL:** `https://rmrcms.vercel.app/api/daily-webhooks`
   - **Headers:** Click "Add header" twice and add:
     - Header 1: `Content-Type` = `application/json`
     - Header 2: `x-api-key` = `YOUR_WEBHOOK_API_KEY_HERE` (paste the key from Step 1)
   - **Body:** `{}` (empty JSON object)
4. Click **"Save cron job"**

✅ **Done!** The cron will now run daily at 8:00 AM UTC and trigger webhooks for all sessions exactly 4 days away.

---

### Option B: Database Function with pg_net (Advanced)

Only use this if the HTTP Request option is not available in your Supabase plan.

#### Step 1: Get Your WEBHOOK_API_KEY

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Find `WEBHOOK_API_KEY` and copy its value
3. Keep this handy for the next steps

#### Step 2: Enable Required Extensions in Supabase

##### Enable pg_net (for HTTP requests)

1. Go to Supabase Dashboard → **Database** → **Extensions**
2. Search for **"pg_net"** or **"http"**
3. Click **Enable** on the pg_net extension
4. Wait for it to activate (should take a few seconds)

##### Enable pg_cron (for scheduled jobs)

In Supabase Dashboard → SQL Editor, run:

```sql
-- Enable the pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable the pg_net extension (if not done via UI)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant permissions
GRANT USAGE ON SCHEMA net TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA net TO postgres;
```

#### Step 3: Run the Setup Migration

In Supabase SQL Editor, you can either:

**Option A: Run the migration file**
1. Open `migrations/20250102_setup_periodic_webhooks_cron.sql`
2. Replace `YOUR_WEBHOOK_API_KEY_HERE` with your actual key
3. Copy and paste the entire file into Supabase SQL Editor
4. Run it

**Option B: Run this command directly** (replace `YOUR_WEBHOOK_API_KEY_HERE` with your actual key):

```sql
-- Schedule daily webhook trigger at 8:00 AM UTC
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
```

#### Step 4: Verify the Cron Job

Check that it was created successfully:

```sql
-- List all cron jobs
SELECT * FROM cron.job;
```

You should see `daily-session-webhooks` in the list.

---

## 📧 Make.com Scenario Setup

**IMPORTANT:** Your Make.com scenario needs to use the webhook data directly!

**IMPORTANT:** Your Make.com scenario needs to use the webhook data directly!

#### Current (Wrong) Setup:
```
Webhook Trigger → Search Sessions → Search Clients → Send Email
```

#### Correct Setup:
```
Webhook Trigger → Send Email (using trigger data)
```

#### In Your Email Template, Use:
- `{{trigger.paymentLink}}` - Payment link
- `{{trigger.clientFirstName}}` - Client first name
- `{{trigger.clientLastName}}` - Client last name
- `{{trigger.clientEmail}}` - Client email
- `{{trigger.sessionType}}` - Session type
- `{{trigger.bookingDate}}` - Booking date
- `{{trigger.bookingTime}}` - Booking time
- `{{trigger.quote}}` - Quote amount
- `{{trigger.dogName}}` - Dog name
- `{{trigger.address}}` - Client address
- `{{trigger.bookingTermsUrl}}` - Booking terms URL (email prefilled)
- `{{trigger.questionnaireUrl}}` - Questionnaire URL (email prefilled)

**All the data is in the webhook - no need to search Supabase!**

## 🧪 Testing

### Test the Endpoint Manually

You can test the webhook endpoint manually to see what sessions would be processed:

```bash
# Test the endpoint (replace with your actual WEBHOOK_API_KEY)
curl -X POST https://rmrcms.vercel.app/api/daily-webhooks \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_WEBHOOK_API_KEY_HERE"
```

### Preview Sessions Without Sending Webhooks

Use the GET endpoint to see which sessions would be processed:

```bash
curl https://rmrcms.vercel.app/api/daily-webhooks
```

This shows you which sessions are 4 days away without actually sending webhooks.

### Test the Cron Job Immediately

To test the cron job right now (instead of waiting until 8 AM):

```sql
-- Create a temporary test job that runs every minute
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
```

**Wait 1-2 minutes**, then check your Make.com scenario to see if webhooks were received.

**Delete the test job after testing:**

```sql
SELECT cron.unschedule('test-webhook-now');
```

## 📊 Monitoring

### Check Cron Job History

```sql
-- View recent cron job executions
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-session-webhooks')
ORDER BY start_time DESC
LIMIT 10;
```

### Check Application Logs

In Vercel Dashboard → Your Project → Logs, search for:
- `[DAILY-WEBHOOKS]` - Daily webhook processing logs
- `[WEBHOOK-PROCESSING]` - Session filtering logs
- `[CLIENT-VALIDATION]` - Client validation logs

## 🎉 What You'll Get

Every day at 8:00 AM UTC, for each session exactly 4 days away, Make.com will receive:

```json
{
  "sessionId": "...",
  "clientId": "...",
  "clientName": "John Smith",
  "clientFirstName": "John",
  "clientLastName": "Smith",
  "clientEmail": "john@example.com",
  "address": "123 Main St",
  "dogName": "Buddy",
  "sessionType": "In-Person",
  "bookingDate": "2025-01-06",
  "bookingTime": "10:00",
  "quote": 105,
  "notes": "",
  "travelExpense": "Zone 1",
  "membershipStatus": true,
  "createdAt": "2025-01-02T08:00:00.000Z",
  "bookingTermsUrl": "https://rmrcms.vercel.app/booking-terms?email=john@example.com",
  "questionnaireUrl": "https://rmrcms.vercel.app/behaviour-questionnaire?email=john@example.com",
  "paymentLink": "https://monzo.com/pay/r/raising-my-rescue_xxxxx?description=RMR-In-Person-abc123&redirect_url=https://rmrcms.vercel.app/pay-confirm?id=abc123",
  "sendSessionEmail": true,
  "createCalendarEvent": false
}
```

## 🔒 Security

The webhook endpoints are protected with API key authentication. Only requests with the correct `x-api-key` header will be processed.

## ❓ Troubleshooting

**Webhooks not being sent?**
- Check that the cron job is running: `SELECT * FROM cron.job_run_details`
- Verify your WEBHOOK_API_KEY is correct
- Check Vercel logs for errors

**Make.com not receiving payment links?**
- Make sure you're using `{{trigger.paymentLink}}` not searching Supabase
- Remove the Supabase search modules from your scenario
- Use the webhook trigger data directly

**Sessions being skipped?**
- Check that sessions have a valid `client_id`
- Ensure clients have email addresses
- Verify session type is not "Group" or "RMR Live"
- Check that the session is exactly 4 days away (not 3 or 5)

