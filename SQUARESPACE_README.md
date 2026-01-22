# 🎯 Squarespace Integration - Complete Solution

## What Problem Does This Solve?

**Before:** Clients were being created with email-based names like:
- ❌ `tracey.heyworth71@gmail.com`
- ❌ `Paulsherwood154 Member`

**After:** Clients are created with real names from Squarespace:
- ✅ `Tracey Heyworth`
- ✅ `Paul Sherwood`

---

## 🏗️ Architecture

### Old Flow (n8n)
```
Squarespace Payment
    ↓
Stripe Charge Created
    ↓
n8n Stripe Trigger
    ↓
n8n JavaScript (parse email for name)
    ↓
n8n HTTP Request
    ↓
RMR App (/api/stripe/webhook)
    ↓
Create Client with email-based name ❌
```

### New Flow (Direct)
```
Squarespace Payment
    ↓
Squarespace order.create webhook
    ↓
RMR App (/api/squarespace/webhook)
    ↓
Extract firstName, lastName from billingAddress
    ↓
Create Client with real name ✅
```

---

## 📦 What's Included

### 1. Real-Time Webhook Handler
**File:** `src/app/api/squarespace/webhook/route.ts`

Receives Squarespace `order.create` webhooks and:
- ✅ Extracts real customer names from `billingAddress`
- ✅ Creates or updates Client records
- ✅ Creates Membership records
- ✅ Verifies webhook signatures (HMAC-SHA256)
- ✅ Handles email aliases for existing clients

### 2. Historical Import Tool
**File:** `src/app/api/squarespace/import-historical/route.ts`

Imports all past orders from Squarespace:
- ✅ Fetches all historical orders via Squarespace API
- ✅ Creates missing Client records with real names
- ✅ Creates Membership records for all payments
- ✅ Supports dry-run mode (preview without changes)
- ✅ Batch processing for efficiency

### 3. Setup Scripts
- **`setup-squarespace-webhook.sh`** - Automates webhook subscription creation
- **`test-squarespace-webhook.sh`** - Tests webhook endpoint locally
- **`test-squarespace-import.sh`** - Interactive historical import tool

### 4. Documentation
- **`SQUARESPACE_QUICK_START.md`** - 5-minute setup guide
- **`SQUARESPACE_SETUP_GUIDE.md`** - Complete detailed guide
- **`SQUARESPACE_INTEGRATION_SUMMARY.md`** - Technical overview

---

## ⚡ Quick Start

### 1. Create Webhook (2 minutes)

```bash
./scripts/setup-squarespace-webhook.sh
```

This will give you a webhook secret. Save it!

### 2. Add Secret to Environment (1 minute)

Add to `.env.local`:
```bash
SQUARESPACE_WEBHOOK_SECRET=your_secret_here
```

Add to Vercel:
- Go to Settings → Environment Variables
- Add `SQUARESPACE_WEBHOOK_SECRET`
- Redeploy

### 3. Test (1 minute)

Create a test order in Squarespace or run:
```bash
./scripts/test-squarespace-webhook.sh
```

### 4. Import Historical Orders (Optional)

```bash
./scripts/test-squarespace-import.sh
```

Choose option 1 for dry-run, then option 3 for full import.

### 5. Disable n8n

After verifying everything works for a week, disable your n8n workflow.

---

## 🔑 Environment Variables

### Already Configured
- ✅ `SQUARESPACE_API_KEY=7a51a456-4ac3-40c7-80a9-380968b1e4ea`

### You Need to Add
- ⏳ `SQUARESPACE_WEBHOOK_SECRET` (get from webhook creation)

### For Local Testing
- ⏳ `WEBHOOK_API_KEY` (copy from Vercel for historical import)

---

## 📊 Data Extracted from Squarespace

From each order, we extract:

```javascript
{
  email: order.customerEmail,              // "paul@example.com"
  firstName: order.billingAddress.firstName, // "Paul"
  lastName: order.billingAddress.lastName,   // "Sherwood"
  postcode: order.billingAddress.postalCode, // "ME13 7JG"
  amount: order.grandTotal.value,           // "12.00"
  date: order.createdOn                     // "2026-01-19T12:00:00Z"
}
```

---

## 🎯 Success Checklist

- [x] API key configured (`SQUARESPACE_API_KEY`)
- [x] Webhook endpoint created (`/api/squarespace/webhook`)
- [x] Historical import endpoint created (`/api/squarespace/import-historical`)
- [x] Setup scripts created
- [x] Documentation written
- [ ] Webhook subscription created in Squarespace
- [ ] Webhook secret added to Vercel
- [ ] Test order processed successfully
- [ ] Historical orders imported
- [ ] Clients have real names (not email-based)
- [ ] n8n workflow disabled

---

## 🆘 Troubleshooting

### Webhook not receiving events?
```bash
# Check webhook subscription
curl https://api.squarespace.com/1.0/webhook_subscriptions \
  -H "Authorization: Bearer 7a51a456-4ac3-40c7-80a9-380968b1e4ea" \
  -H "User-Agent: RMR-CMS/1.0"
```

### Signature verification failing?
- Check `SQUARESPACE_WEBHOOK_SECRET` is set in Vercel
- Verify it matches the secret from webhook creation
- Check Vercel logs for detailed error messages

### Historical import not working?
- Ensure `WEBHOOK_API_KEY` is in `.env.local`
- Verify `SQUARESPACE_API_KEY` is correct
- Check you have "Orders" API permission enabled

### Still seeing email-based names?
- Verify webhook is active and receiving events
- Check Squarespace orders have complete billing information
- Some old orders may not have firstName/lastName

---

## 📚 Full Documentation

- **Quick Start:** [SQUARESPACE_QUICK_START.md](./SQUARESPACE_QUICK_START.md)
- **Complete Guide:** [SQUARESPACE_SETUP_GUIDE.md](./SQUARESPACE_SETUP_GUIDE.md)
- **Technical Summary:** [SQUARESPACE_INTEGRATION_SUMMARY.md](./SQUARESPACE_INTEGRATION_SUMMARY.md)

---

## 🎉 Benefits

✅ **Real customer names** - No more email parsing  
✅ **Simpler architecture** - No n8n middleman  
✅ **More reliable** - Direct integration  
✅ **Historical import** - Backfill past orders  
✅ **Better data quality** - firstName and lastName from source  
✅ **Easier maintenance** - One less system to manage  

---

**Ready to get started?** → [SQUARESPACE_QUICK_START.md](./SQUARESPACE_QUICK_START.md)

