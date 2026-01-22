# Squarespace Manual Webhook Setup

## 🔍 Issue: Developer API Keys Don't Support Webhook API

Your API key (`7a51a456-4ac3-40c7-80a9-380968b1e4ea`) is a **Developer API Key** with Orders (Read Only) permission. This is perfect for reading orders, but Squarespace doesn't allow webhook creation via API with these keys.

**Solution:** Create the webhook manually through Squarespace's dashboard.

---

## 📋 Manual Webhook Setup Steps

### Step 1: Find Webhook Settings

Log into your Squarespace dashboard and look for webhooks in one of these locations:

**Option A: Commerce Settings**
1. Go to **Commerce** → **Advanced** → **Webhooks**

**Option B: Developer Tools**
1. Go to **Settings** → **Advanced** → **Developer Tools**
2. Look for **Webhooks** section

**Option C: API Settings**
1. Go to **Settings** → **Advanced** → **API Keys**
2. Look for a **Webhooks** tab or section

---

### Step 2: Create New Webhook

Once you find the Webhooks section:

1. Click **"Add Webhook"** or **"Create Webhook Subscription"**

2. Fill in the form:
   - **Name/Description:** `RMR CMS Order Webhook`
   - **Endpoint URL:** `https://rmrcms.vercel.app/api/squarespace/webhook`
   - **Event Type:** Select **"Order Created"** or **"order.create"**
   - **Status:** **Active** or **Enabled**

3. Click **Save** or **Create**

---

### Step 3: Copy the Webhook Secret

After creating the webhook, Squarespace will display a **webhook secret** (also called signing secret).

**IMPORTANT:** Copy this secret immediately! You may not be able to see it again.

It will look something like:
```
whsec_abc123def456ghi789...
```

Or just a random string like:
```
a1b2c3d4e5f6g7h8i9j0...
```

---

### Step 4: Add Secret to Environment Variables

#### Local Development (.env.local)

1. Open `.env.local` in your project
2. Find the line: `SQUARESPACE_WEBHOOK_SECRET=`
3. Paste your webhook secret:
   ```bash
   SQUARESPACE_WEBHOOK_SECRET=whsec_abc123def456ghi789...
   ```
4. Save the file

#### Production (Vercel)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Click **"Add New"**
5. Fill in:
   - **Name:** `SQUARESPACE_WEBHOOK_SECRET`
   - **Value:** (paste your webhook secret)
   - **Environment:** Select all (Production, Preview, Development)
6. Click **Save**
7. **Redeploy** your application

---

### Step 5: Test the Webhook

#### Test with Real Order

1. Create a test order in Squarespace
2. Go to Vercel → Your Project → **Logs**
3. Look for webhook processing:
   ```
   [SQUARESPACE] Webhook received: { topic: 'order.create', ... }
   [SQUARESPACE] Processing order: { orderNumber: '123', ... }
   [SQUARESPACE] Successfully created new client
   [SQUARESPACE] Membership created successfully
   ```

#### Check Webhook Delivery

In Squarespace, go back to your webhook settings:
- You should see a **delivery history** or **recent deliveries**
- Check if the webhook was sent successfully
- Look for any error messages

---

## 🔧 If You Can't Find Webhook Settings

If you can't find webhook settings in your Squarespace dashboard, it might be because:

### Reason 1: Plan Limitation
Some Squarespace plans don't include webhook functionality. Check if your plan supports webhooks:
- **Commerce Advanced** plan usually includes webhooks
- **Commerce Basic** might not have webhooks

### Reason 2: Feature Not Available
Squarespace might not expose webhook UI for Developer API Keys.

### Alternative Solution: Use Zapier/Make.com as Bridge

If webhooks aren't available in your Squarespace plan:

1. Keep using n8n/Make.com as a bridge
2. But update it to fetch customer names from Squarespace Orders API
3. Use the historical import to backfill existing clients

---

## 📞 Contact Squarespace Support

If you can't find webhook settings, contact Squarespace support and ask:

1. **"Does my plan support webhooks for order.create events?"**
2. **"Where can I configure webhooks in my dashboard?"**
3. **"Can I use webhooks with Developer API Keys?"**

---

## ✅ What You Have Working

Even without webhooks, you can still:

### ✅ Historical Import Works!

Your existing API key (`7a51a456-4ac3-40c7-80a9-380968b1e4ea`) with **Orders (Read Only)** permission is **perfect** for the historical import!

You can run:
```bash
./scripts/test-squarespace-import.sh
```

This will:
- Fetch all past orders from Squarespace
- Extract real customer names
- Update existing clients (like `traceya71@hotmail.com` → `Tracey Heyworth`)
- Create membership records

**This alone will fix your existing clients!**

---

## 🎯 Recommended Next Steps

### Option 1: Find Webhook Settings (Best)
1. Search your Squarespace dashboard for "webhooks"
2. Create webhook manually
3. Get webhook secret
4. Add to Vercel
5. Test with real order

### Option 2: Use Historical Import Only (Quick Fix)
1. Run historical import to fix existing clients
2. Keep n8n for new orders (but update it to use Squarespace data)
3. Manually update new clients as needed

### Option 3: Contact Squarespace Support
1. Ask about webhook availability
2. Get help finding webhook settings
3. Confirm your plan supports webhooks

---

## 📝 Summary

- ✅ Your API key is correct for reading orders
- ❌ Can't create webhooks via API with Developer API Keys
- ✅ Historical import will work perfectly
- ⏳ Need to create webhook manually in Squarespace UI
- ❓ Check if your plan supports webhooks

---

**Next Action:** Search your Squarespace dashboard for "webhooks" or contact Squarespace support to ask where webhook settings are located.

