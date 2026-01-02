# Alternative Cron Setup Options

If you're having trouble with Supabase pg_cron + pg_net, here are alternative ways to trigger the periodic webhooks daily.

## Option 1: Vercel Cron Jobs (Recommended if on Pro Plan)

If you have a Vercel Pro plan, you can use Vercel's built-in cron jobs.

### Setup:

1. Create a file `vercel.json` in your project root (or update existing):

```json
{
  "crons": [
    {
      "path": "/api/daily-webhooks",
      "schedule": "0 8 * * *"
    }
  ]
}
```

2. Add authentication to the cron job by updating `src/app/api/daily-webhooks/route.ts`:

The endpoint already has API key authentication, so Vercel cron will need to pass it.

3. Set the `CRON_SECRET` environment variable in Vercel:
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Add `CRON_SECRET` with a secure random value

4. Deploy to Vercel

**Note:** Vercel Cron is only available on Pro plans ($20/month).

---

## Option 2: GitHub Actions (Free)

Use GitHub Actions to trigger the webhook daily.

### Setup:

1. Create `.github/workflows/daily-webhooks.yml`:

```yaml
name: Daily Session Webhooks

on:
  schedule:
    # Runs at 8:00 AM UTC every day
    - cron: '0 8 * * *'
  workflow_dispatch: # Allows manual triggering

jobs:
  trigger-webhooks:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Daily Webhooks
        run: |
          curl -X POST https://rmrcms.vercel.app/api/daily-webhooks \
            -H "Content-Type: application/json" \
            -H "x-api-key: ${{ secrets.WEBHOOK_API_KEY }}"
```

2. Add the secret to GitHub:
   - Go to GitHub Repository → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `WEBHOOK_API_KEY`
   - Value: Your webhook API key from Vercel

3. Commit and push the workflow file

4. Test it manually:
   - Go to GitHub → Actions → Daily Session Webhooks
   - Click "Run workflow"

**Pros:** Free, reliable, easy to set up
**Cons:** Requires GitHub repository

---

## Option 3: EasyCron or Cron-Job.org (Free External Service)

Use a free external cron service.

### Setup with EasyCron:

1. Go to https://www.easycron.com/
2. Sign up for a free account
3. Create a new cron job:
   - **URL:** `https://rmrcms.vercel.app/api/daily-webhooks`
   - **Cron Expression:** `0 8 * * *` (8:00 AM daily)
   - **HTTP Method:** POST
   - **HTTP Headers:** 
     ```
     Content-Type: application/json
     x-api-key: YOUR_WEBHOOK_API_KEY_HERE
     ```
4. Save and enable the cron job

### Setup with Cron-Job.org:

1. Go to https://cron-job.org/
2. Sign up for a free account
3. Create a new cron job:
   - **Title:** Daily Session Webhooks
   - **URL:** `https://rmrcms.vercel.app/api/daily-webhooks`
   - **Schedule:** Every day at 08:00
   - **Request Method:** POST
   - **Headers:**
     ```
     Content-Type: application/json
     x-api-key: YOUR_WEBHOOK_API_KEY_HERE
     ```
4. Save and enable

**Pros:** Free, no code changes needed
**Cons:** Depends on external service

---

## Option 4: Make.com Scheduled Scenario

Use Make.com itself to trigger the webhook daily.

### Setup:

1. Create a new Make.com scenario
2. Add a **Schedule** trigger:
   - Set to run daily at 8:00 AM UTC
3. Add an **HTTP** module:
   - **URL:** `https://rmrcms.vercel.app/api/daily-webhooks`
   - **Method:** POST
   - **Headers:**
     - `Content-Type`: `application/json`
     - `x-api-key`: `YOUR_WEBHOOK_API_KEY_HERE`
4. Activate the scenario

**Pros:** Already using Make.com, easy to set up
**Cons:** Uses Make.com operations

---

## Option 5: Supabase Edge Functions (If pg_net doesn't work)

Create a Supabase Edge Function and trigger it with a cron job.

### Setup:

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Create the edge function:
```bash
supabase functions new daily-webhooks
```

3. Edit `supabase/functions/daily-webhooks/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  try {
    const response = await fetch('https://rmrcms.vercel.app/api/daily-webhooks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('WEBHOOK_API_KEY') || '',
      },
    })

    const result = await response.json()

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

4. Deploy the function:
```bash
supabase functions deploy daily-webhooks --project-ref YOUR_PROJECT_REF
```

5. Set the environment variable:
```bash
supabase secrets set WEBHOOK_API_KEY=your_key_here --project-ref YOUR_PROJECT_REF
```

6. Schedule it in Supabase Dashboard:
   - Go to Edge Functions → daily-webhooks
   - Click "Add Cron Job"
   - Set schedule to `0 8 * * *`

---

## Recommendation

**Best options in order:**

1. **GitHub Actions** - Free, reliable, easy to set up if you have a GitHub repo
2. **Make.com Scheduled Scenario** - Easiest if you're already using Make.com
3. **Cron-Job.org** - Simple external service, no code needed
4. **Vercel Cron** - Best if you have Vercel Pro plan
5. **Supabase Edge Functions** - Good if you want everything in Supabase

Choose the one that fits your setup best!

