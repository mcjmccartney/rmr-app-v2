# Squarespace Integration - Quick Start

## 🎯 What This Does

Replaces your n8n workflow with a direct Squarespace integration that:
- ✅ Gets **real customer names** from Squarespace orders
- ✅ Automatically creates Client records for new members
- ✅ Creates Membership records for all payments
- ✅ Can import all historical orders to backfill missing clients

---

## ⚡ Quick Setup (5 Minutes)

### 1. Create Webhook Subscription

Run this command:

```bash
./scripts/setup-squarespace-webhook.sh
```

This will:
- Check your existing webhooks
- Create a new webhook subscription for `order.create` events
- Give you a **webhook secret** to save

**Save the webhook secret!** You'll need it in the next step.

---

### 2. Add Webhook Secret to Environment

#### Local (.env.local)

Add this line to `.env.local`:
```bash
SQUARESPACE_WEBHOOK_SECRET=your_secret_from_step_1
```

#### Production (Vercel)

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add new variable:
   - **Name:** `SQUARESPACE_WEBHOOK_SECRET`
   - **Value:** (paste the secret from step 1)
   - **Environment:** Production, Preview, Development
3. Click "Save"
4. Redeploy your app (or wait for auto-deploy)

---

### 3. Test with a Real Order

1. Create a test order in Squarespace (or wait for a real one)
2. Check Vercel logs to see the webhook processing
3. Verify in your app:
   - New client created with **real first and last name**
   - Membership record created

---

### 4. Import Historical Orders (Optional)

To create clients for past orders:

```bash
# First, preview what would be imported (no changes made)
./scripts/test-squarespace-import.sh
# Choose option 1: Dry run

# Then import (choose option 2 or 3)
./scripts/test-squarespace-import.sh
```

**Note:** You'll need to add `WEBHOOK_API_KEY` to `.env.local` first. Check your Vercel environment variables for this value.

---

### 5. Disable n8n Workflow

Once everything is working:
1. Disable (don't delete) your n8n workflow
2. Monitor for a few days
3. After 1 week of successful operation, delete the n8n workflow

---

## 🔍 Verification

### Check Clients Have Real Names

Before:
```
❌ tracey.heyworth71@gmail.com
❌ Paulsherwood154 Member
```

After:
```
✅ Tracey Heyworth
✅ Paul Sherwood
```

### Check Webhook is Working

Vercel logs should show:
```
[SQUARESPACE] Webhook received: { topic: 'order.create', ... }
[SQUARESPACE] Processing order: { orderNumber: '123', ... }
[SQUARESPACE] Successfully created new client: { firstName: 'Paul', lastName: 'Sherwood', ... }
[SQUARESPACE] Membership created successfully
```

---

## 📚 Full Documentation

For detailed setup, troubleshooting, and advanced options, see:
- **[SQUARESPACE_SETUP_GUIDE.md](./SQUARESPACE_SETUP_GUIDE.md)** - Complete setup guide

---

## 🆘 Troubleshooting

### Webhook not receiving events?

Check webhook subscription:
```bash
curl https://api.squarespace.com/1.0/webhook_subscriptions \
  -H "Authorization: Bearer 7a51a456-4ac3-40c7-80a9-380968b1e4ea" \
  -H "User-Agent: RMR-CMS/1.0"
```

### Historical import failing?

Make sure you have `WEBHOOK_API_KEY` in `.env.local`. Get it from Vercel environment variables.

### Still seeing email-based names?

- Check that webhook secret is set correctly in Vercel
- Verify webhook subscription is active
- Check Vercel logs for errors

---

## ✅ Success Checklist

- [ ] Webhook subscription created
- [ ] Webhook secret added to `.env.local` and Vercel
- [ ] Test order processed successfully
- [ ] Client created with real name (not email-based)
- [ ] Historical orders imported (optional)
- [ ] n8n workflow disabled

---

**Need Help?** Check the full guide: [SQUARESPACE_SETUP_GUIDE.md](./SQUARESPACE_SETUP_GUIDE.md)

