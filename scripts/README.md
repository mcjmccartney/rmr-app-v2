# Scripts

This directory contains utility scripts for managing the Raising My Rescue application.

## Update Membership Status

**File:** `update-membership-status.ts`

**Purpose:** Updates all client membership statuses based on the 1-month membership window.

### When to Use

Run this script when:
- You've changed the membership window logic
- You need to sync membership statuses with payment records
- You suspect membership statuses are out of sync

### How It Works

The script:
1. Fetches all clients from the database
2. Fetches all membership payment records
3. Checks each client's email (including aliases) for membership payments
4. Determines if they have a payment within the last 1 month
5. Updates the `membership` boolean field on the client record

### Membership Logic

A client is considered a **Member** if:
- They have at least one membership payment within the last 1 month
- The payment date is calculated from today backwards

A client is considered a **Non-Member** if:
- They have no membership payments, OR
- Their most recent payment is older than 1 month

### Usage

```bash
# Using npm script (recommended)
npm run update-memberships

# Or directly with tsx
npx tsx scripts/update-membership-status.ts
```

### Requirements

- `.env.local` file with:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

### Output

The script provides detailed output showing:
- ✅ Clients upgraded to Member status
- ❌ Clients downgraded to Non-Member status
- Summary statistics (total, updated, unchanged)

### Example Output

```
🔄 Starting membership status update...

📊 Processing 246 clients...

❌ Kate Killick: Member → Non-Member (no payments found)
✅ John Smith: Non-Member → Member (last payment: 2026-01-15)
❌ Jane Doe: Member → Non-Member (last payment: 2025-11-10)

============================================================
✅ Membership status update completed!
============================================================
📊 Total clients: 246
✏️  Updated: 71
➖ Unchanged: 175
============================================================
```

### Safety

- The script uses the service role key to bypass Row Level Security (RLS)
- It only updates the `membership` boolean field
- No data is deleted
- Changes can be manually reverted if needed

### Troubleshooting

**Error: Missing environment variables**
- Ensure `.env.local` exists in the project root
- Check that both `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set

**Error: Failed to fetch clients/memberships**
- Check your Supabase connection
- Verify the service role key has the correct permissions
- Ensure the tables exist in your database

**No clients updated**
- This is normal if all membership statuses are already correct
- The script only updates clients whose status has changed

