# Automated Membership Updates

## 🎯 Overview

Membership statuses are now **automatically updated daily** at **8:00 AM UTC** via the existing Supabase cron job that handles session webhooks.

## ✅ How It Works

### Daily Automation

Every day at 8:00 AM UTC, the Supabase cron job:

1. **Calls** `/api/daily-webhooks` endpoint
2. **Processes** 7-day session reminder webhooks
3. **Updates** all client membership statuses automatically
4. **Returns** summary including number of memberships updated

### Membership Logic

A client is considered a **Member** if:
- They have at least one membership payment within the **last 1 month** (30 days)
- The payment date is calculated from today backwards

A client is considered a **Non-Member** if:
- They have no membership payments, OR
- Their most recent payment is older than 1 month

### Email Matching

The system matches membership payments to clients using:
- **Primary email** from the client record
- **Email aliases** from the `client_email_aliases` table
- **Case-insensitive** matching with trimming

## 🔧 Technical Details

### Files Modified

1. **`/api/daily-webhooks/route.ts`**
   - Added membership update logic after webhook processing
   - Fetches all memberships with proper ordering
   - Processes each client and updates status if changed
   - Includes membership update count in response

2. **`/api/membership-expiration/route.ts`**
   - Fixed to use same `.order()` and email matching improvements
   - Can be called manually if needed
   - Uses same 1-month window logic

### Cron Job Configuration

The existing Supabase cron job is already configured:

```
Name: daily-session-webhooks
Schedule: 0 8 * * * (8:00 AM UTC daily)
Type: HTTP Request
Method: POST
URL: https://rmrcms.vercel.app/api/daily-webhooks
Headers:
  - Content-Type: application/json
  - x-api-key: YOUR_WEBHOOK_API_KEY
Body: {}
```

**No additional setup required!** The membership updates are now part of this existing job.

## 📊 Monitoring

### Check Logs

In **Vercel Dashboard** → Your Project → **Logs**, search for:
- `[DAILY-WEBHOOKS] Starting membership status update...`
- `[DAILY-WEBHOOKS] Membership update completed: X clients updated`
- `[DAILY-WEBHOOKS] Member → Non-Member` or `Non-Member → Member`

### API Response

The `/api/daily-webhooks` endpoint now returns:

```json
{
  "success": true,
  "message": "Daily webhooks completed: X sessions processed, Y memberships updated",
  "summary": {
    "sevenDaySessionsProcessed": 5,
    "totalProcessed": 5,
    "successCount": 5,
    "failureCount": 0,
    "membershipUpdated": 3  // ← New field
  },
  "timestamp": "2026-01-17T08:00:00.000Z"
}
```

## 🧪 Testing

### Manual Test

You can manually trigger the membership update using the script:

```bash
npx tsx scripts/update-membership-status.ts
```

This will show you:
- How many clients have recent memberships
- How many would be updated
- Detailed log of each change

### Preview Endpoint

Check what would be processed (without authentication):

```bash
curl https://raising-my-rescue.vercel.app/api/daily-webhooks
```

### Test Scripts

Three test scripts are available:

1. **`scripts/update-membership-status.ts`** - Manual membership update
2. **`scripts/check-memberships.ts`** - View membership payment statistics
3. **`scripts/diagnose-pairing.ts`** - Diagnose email matching issues

## 📅 Schedule

- **Runs:** Every day at 8:00 AM UTC
- **Timezone:** UTC (Universal Coordinated Time)
- **Frequency:** Daily (365 days/year)

### Time Conversions

- **8:00 AM UTC** = 8:00 AM GMT (London, winter)
- **8:00 AM UTC** = 9:00 AM BST (London, summer)
- **8:00 AM UTC** = 3:00 AM EST (New York, winter)
- **8:00 AM UTC** = 4:00 AM EDT (New York, summer)

## 🔄 What Happens Daily

### Example Scenario

**Today:** January 17, 2026 at 8:00 AM UTC

**Membership Window:** December 17, 2025 → January 17, 2026

**Actions:**
1. ✅ Client with payment on **Jan 10, 2026** → Stays/Becomes Member
2. ✅ Client with payment on **Dec 20, 2025** → Stays/Becomes Member
3. ❌ Client with payment on **Dec 15, 2025** → Becomes Non-Member (32 days old)
4. ❌ Client with payment on **Nov 30, 2025** → Becomes Non-Member (48 days old)

## 🚨 Important Notes

1. **Automatic Updates Only**
   - Memberships are updated automatically daily
   - No manual intervention required
   - Changes are logged in Vercel

2. **1-Month Window**
   - Uses a rolling 30-day window
   - Calculated from current date backwards
   - Updates happen before most users are active (8 AM UTC)

3. **Email Aliases**
   - System checks both primary email and aliases
   - Case-insensitive matching
   - Properly handles multiple emails per client

4. **No Downtime**
   - Updates run alongside session webhooks
   - If membership update fails, webhooks still process
   - Errors are logged but don't stop the cron job

## 🛠️ Troubleshooting

### No Updates Happening

1. Check Supabase cron job is running:
   - Go to Supabase Dashboard → Database → Cron Jobs
   - Verify `daily-session-webhooks` is active
   - Check execution history

2. Check Vercel logs:
   - Look for `[DAILY-WEBHOOKS]` entries
   - Verify no errors in membership update section

3. Run manual test:
   ```bash
   npx tsx scripts/update-membership-status.ts
   ```

### Incorrect Membership Status

1. Run diagnostic script:
   ```bash
   npx tsx scripts/diagnose-pairing.ts
   ```

2. Check for:
   - Email mismatches
   - Missing email aliases
   - Payment date issues

3. Verify membership payments in database:
   ```bash
   npx tsx scripts/check-memberships.ts
   ```

## 📚 Related Documentation

- `MEMBERSHIP_FIX_SUMMARY.md` - Details of the membership pairing fix
- `SUPABASE_CRON_QUICK_SETUP.md` - Cron job setup guide
- `PERIODIC_WEBHOOKS_SETUP.md` - Full webhook setup documentation
- `scripts/README.md` - Script usage documentation

