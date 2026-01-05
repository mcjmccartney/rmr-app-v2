# Supabase Cron Quick Setup Guide

## 🚀 Easiest Method: HTTP Request (Recommended)

This is the **simplest way** to set up the daily 4-day session reminder webhooks in Supabase.

### Step 1: Get Your API Key

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Find `WEBHOOK_API_KEY` and copy its value
3. Example: `184cff5e3ca07cb7d4bcd5546745b018e6faea9bc6f5f72c8bef51c794a7952f`

### Step 2: Create the Cron Job in Supabase

1. Go to **Supabase Dashboard** → **Database** → **Cron Jobs**
2. Click **"Create a new cron job"** (or edit existing `daily-session-webhooks`)
3. Fill in the form:

   **Name:** `daily-session-webhooks`
   
   **Schedule:** `0 8 * * *`
   - This means: Run at 8:00 AM UTC every day
   
   **Type:** Select **"HTTP Request"** ⭐
   
   **Method:** `POST`
   
   **URL:** `https://rmrcms.vercel.app/api/daily-webhooks`
   
   **Headers:** Click "Add header" twice:
   - Header 1:
     - Name: `Content-Type`
     - Value: `application/json`
   - Header 2:
     - Name: `x-api-key`
     - Value: `YOUR_WEBHOOK_API_KEY_HERE` (paste from Step 1)
   
   **Body:** `{}`
   - Just an empty JSON object

4. Click **"Save cron job"**

### Step 3: Test It

You can test the endpoint manually using curl:

```bash
curl -X POST https://rmrcms.vercel.app/api/daily-webhooks \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_WEBHOOK_API_KEY_HERE"
```

Or visit the preview endpoint in your browser:
```
https://rmrcms.vercel.app/api/daily-webhooks
```

This will show you which sessions would be processed (without actually sending webhooks).

---

## ✅ What Happens

When the cron runs at 8:00 AM UTC every day:

1. **Fetches all sessions** from your Supabase database
2. **Filters sessions** that are exactly 4 calendar days away
3. **For each matching session:**
   - Generates payment link
   - Builds complete webhook data
   - Sends to Make.com webhook URL
4. **Returns summary** of processed sessions

### Example

**Today:** January 5th, 2026
**Cron runs at:** 8:00 AM UTC

**Result:**
- ✅ **All sessions on January 9th** → Webhooks sent
- ❌ Sessions on January 8th (3 days) → Skipped
- ❌ Sessions on January 10th (5 days) → Skipped

**Note:** The system uses calendar days (midnight-to-midnight), so all sessions on the target date will be triggered regardless of what time during the day the cron runs.

---

## 🔍 Monitoring

### Check Cron Job Status

In Supabase Dashboard → **Database** → **Cron Jobs**, you can:
- See when the job last ran
- View execution history
- Check for errors

### Check Webhook Logs

In Vercel Dashboard → Your Project → **Logs**, filter by:
- Function: `/api/daily-webhooks`
- Look for `[DAILY-WEBHOOKS]` log entries

---

## 🐛 Troubleshooting

### "Unauthorized" Error
- Check that your `x-api-key` header matches the `WEBHOOK_API_KEY` in Vercel

### No Sessions Processed
- Check the preview endpoint to see if there are any sessions 4 days away
- Verify sessions have `client_id` and are not "Group" or "RMR Live" types

### Webhooks Not Arriving in Make.com
- Check Make.com scenario is active
- Verify webhook URL is correct: `https://hook.eu1.make.com/lipggo8kcd8kwq2vp6j6mr3gnxbx12h7`
- Check Vercel logs for webhook send errors

---

## 📚 Additional Resources

- Full setup guide: `PERIODIC_WEBHOOKS_SETUP.md`
- Alternative cron options: `ALTERNATIVE_CRON_SETUP.md`
- GitHub Actions setup (alternative to Supabase cron)
- Make.com scheduled scenario setup

---

## 🎯 Summary

**You're done!** The cron job will now run automatically every day at 8:00 AM UTC and send webhooks for all sessions exactly 4 days away.

No database extensions needed. No SQL required. Just a simple HTTP request configuration in Supabase.

