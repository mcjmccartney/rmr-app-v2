# ✅ Squarespace Integration Setup Checklist

Use this checklist to track your setup progress.

---

## 📋 Pre-Setup (Already Done)

- [x] Squarespace API Key obtained: `7a51a456-4ac3-40c7-80a9-380968b1e4ea`
- [x] Orders API permission enabled (Read Only)
- [x] Webhook endpoint created: `/api/squarespace/webhook`
- [x] Historical import endpoint created: `/api/squarespace/import-historical`
- [x] Setup scripts created
- [x] Documentation written

---

## 🔧 Setup Steps (Do These Now)

### Step 1: Create Webhook Subscription

- [ ] Run: `./scripts/setup-squarespace-webhook.sh`
- [ ] Copy the webhook secret from the output
- [ ] Save the secret somewhere safe (you'll need it in Step 2)

**Expected Output:**
```
✅ Webhook subscription created successfully!

🔑 IMPORTANT: Save this webhook secret!
======================================

SQUARESPACE_WEBHOOK_SECRET=abc123...
```

---

### Step 2: Configure Environment Variables

#### Local Development

- [ ] Open `.env.local` file
- [ ] Find the line: `SQUARESPACE_WEBHOOK_SECRET=`
- [ ] Paste your webhook secret after the `=`
- [ ] Save the file

**Should look like:**
```bash
SQUARESPACE_WEBHOOK_SECRET=abc123def456...
```

#### Production (Vercel)

- [ ] Go to [Vercel Dashboard](https://vercel.com/dashboard)
- [ ] Select your project
- [ ] Go to Settings → Environment Variables
- [ ] Click "Add New"
- [ ] Name: `SQUARESPACE_WEBHOOK_SECRET`
- [ ] Value: (paste your webhook secret)
- [ ] Environment: Select all (Production, Preview, Development)
- [ ] Click "Save"

---

### Step 3: Deploy to Production

- [ ] Commit your changes:
  ```bash
  git add .
  git commit -m "Add Squarespace integration"
  git push
  ```

- [ ] Wait for Vercel to deploy (or manually redeploy)
- [ ] Verify deployment succeeded

---

### Step 4: Test the Webhook

#### Option A: Test with Real Order (Recommended)

- [ ] Create a test order in Squarespace
- [ ] Go to Vercel → Your Project → Logs
- [ ] Look for webhook processing logs:
  ```
  [SQUARESPACE] Webhook received
  [SQUARESPACE] Processing order
  [SQUARESPACE] Successfully created new client
  [SQUARESPACE] Membership created successfully
  ```
- [ ] Check your RMR app for the new client
- [ ] Verify client has real first and last name (not email-based)

#### Option B: Manual Test (Development)

- [ ] Start local dev server: `npm run dev`
- [ ] Run: `./scripts/test-squarespace-webhook.sh`
- [ ] Check response for success
- [ ] Verify test client created in database

---

### Step 5: Import Historical Orders (Optional but Recommended)

#### 5.1: Get WEBHOOK_API_KEY

- [ ] Go to Vercel → Settings → Environment Variables
- [ ] Find `WEBHOOK_API_KEY`
- [ ] Copy its value
- [ ] Add to `.env.local`:
  ```bash
  WEBHOOK_API_KEY=your_key_here
  ```

#### 5.2: Preview Import (Dry Run)

- [ ] Run: `./scripts/test-squarespace-import.sh`
- [ ] Choose option 1: Dry run
- [ ] Review the preview:
  - How many clients will be created?
  - How many memberships will be created?
  - Any errors?

#### 5.3: Test Import (Limited)

- [ ] Run: `./scripts/test-squarespace-import.sh`
- [ ] Choose option 2: Import first 50 orders
- [ ] Verify results in your app
- [ ] Check that clients have real names

#### 5.4: Full Import

- [ ] Run: `./scripts/test-squarespace-import.sh`
- [ ] Choose option 3: Import ALL historical orders
- [ ] Wait for completion (may take several minutes)
- [ ] Review the results:
  - Total orders processed
  - Clients created
  - Memberships created
  - Any errors

---

### Step 6: Verify Everything Works

- [ ] Go to Clients page in your app
- [ ] Check recent clients have real names:
  - ✅ "Paul Sherwood" (not "Paulsherwood154 Member")
  - ✅ "Tracey Heyworth" (not "tracey.heyworth71@gmail.com")
- [ ] Check Memberships page
- [ ] Verify membership records exist for imported orders
- [ ] Check dates and amounts are correct

---

### Step 7: Monitor for a Week

- [ ] Keep n8n workflow running (as backup)
- [ ] Monitor Vercel logs for webhook processing
- [ ] Check that new orders create clients correctly
- [ ] Verify no errors in logs

**Things to watch for:**
- Webhook delivery failures
- Signature verification errors
- Client creation errors
- Missing data

---

### Step 8: Disable n8n Workflow

**Only do this after 1 week of successful operation!**

- [ ] Verify Squarespace webhooks working for 7+ days
- [ ] No errors in Vercel logs
- [ ] All new clients have real names
- [ ] Disable (don't delete) n8n workflow
- [ ] Monitor for another week

---

### Step 9: Clean Up (After 2 Weeks)

**Only if everything is working perfectly!**

- [ ] Delete n8n workflow
- [ ] Remove old Stripe webhook configuration (if not used elsewhere)
- [ ] Update any documentation that references n8n
- [ ] Celebrate! 🎉

---

## 🆘 Troubleshooting

### Webhook Not Working?

- [ ] Check webhook subscription exists:
  ```bash
  curl https://api.squarespace.com/1.0/webhook_subscriptions \
    -H "Authorization: Bearer 7a51a456-4ac3-40c7-80a9-380968b1e4ea" \
    -H "User-Agent: RMR-CMS/1.0"
  ```
- [ ] Verify `SQUARESPACE_WEBHOOK_SECRET` is set in Vercel
- [ ] Check Vercel logs for errors
- [ ] Test with `./scripts/test-squarespace-webhook.sh`

### Historical Import Failing?

- [ ] Verify `WEBHOOK_API_KEY` is in `.env.local`
- [ ] Check `SQUARESPACE_API_KEY` is correct
- [ ] Ensure Orders API permission is enabled
- [ ] Check Vercel logs for specific errors

### Still Seeing Email-Based Names?

- [ ] Verify webhook is receiving events (check Vercel logs)
- [ ] Check Squarespace orders have complete billing information
- [ ] Verify `SQUARESPACE_WEBHOOK_SECRET` matches
- [ ] Test with a new order

---

## 📊 Success Metrics

After setup, you should see:

- ✅ **100% of new clients** have real first and last names
- ✅ **Zero webhook delivery failures** in Squarespace
- ✅ **Zero signature verification errors** in Vercel logs
- ✅ **All historical orders** imported successfully
- ✅ **n8n workflow** disabled and deleted

---

## 📞 Need Help?

See detailed documentation:
- [SQUARESPACE_QUICK_START.md](./SQUARESPACE_QUICK_START.md)
- [SQUARESPACE_SETUP_GUIDE.md](./SQUARESPACE_SETUP_GUIDE.md)
- [SQUARESPACE_INTEGRATION_SUMMARY.md](./SQUARESPACE_INTEGRATION_SUMMARY.md)

---

**Current Status:** Ready for Setup  
**Next Action:** Run `./scripts/setup-squarespace-webhook.sh`  
**Estimated Time:** 10-15 minutes for complete setup

