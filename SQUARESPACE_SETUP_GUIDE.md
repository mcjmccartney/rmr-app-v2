# Squarespace Integration Setup Guide

## 🎯 Overview

This integration replaces the n8n workflow with a direct Squarespace → RMR App connection for membership payments.

**Benefits:**
- ✅ Real customer names (firstName, lastName) from Squarespace
- ✅ No middleman (n8n) - simpler and more reliable
- ✅ Automatic client creation for new members
- ✅ Historical import to backfill past orders

---

## 📋 Prerequisites

- [x] Squarespace API Key: `7a51a456-4ac3-40c7-80a9-380968b1e4ea`
- [x] Orders API permission enabled (Read Only)
- [ ] Webhook subscription created in Squarespace
- [ ] Webhook secret generated

---

## 🔧 Step 1: Configure Environment Variables

### Local Development (.env.local)

Already configured:
```bash
SQUARESPACE_API_KEY=7a51a456-4ac3-40c7-80a9-380968b1e4ea
SQUARESPACE_WEBHOOK_SECRET=  # Will be generated in Step 2
```

### Production (Vercel)

Add these to Vercel Dashboard → Settings → Environment Variables:

1. **SQUARESPACE_API_KEY**
   - Value: `7a51a456-4ac3-40c7-80a9-380968b1e4ea`
   - Environment: Production, Preview, Development

2. **SQUARESPACE_WEBHOOK_SECRET**
   - Value: (will be generated in Step 2)
   - Environment: Production, Preview, Development

---

## 🔗 Step 2: Create Squarespace Webhook Subscription

### Option A: Using Squarespace API (Recommended)

Run this command to create the webhook subscription:

```bash
curl -X POST https://api.squarespace.com/1.0/webhook_subscriptions \
  -H "Authorization: Bearer 7a51a456-4ac3-40c7-80a9-380968b1e4ea" \
  -H "Content-Type: application/json" \
  -H "User-Agent: RMR-CMS/1.0" \
  -d '{
    "endpointUrl": "https://rmrcms.vercel.app/api/squarespace/webhook",
    "topics": ["order.create"]
  }'
```

**Response will include:**
```json
{
  "id": "subscription-id",
  "endpointUrl": "https://rmrcms.vercel.app/api/squarespace/webhook",
  "topics": ["order.create"],
  "secret": "YOUR_WEBHOOK_SECRET_HERE",  // ← Save this!
  "createdOn": "2026-01-19T..."
}
```

**IMPORTANT:** Copy the `secret` value and add it to your environment variables:
- Update `.env.local`: `SQUARESPACE_WEBHOOK_SECRET=YOUR_SECRET_HERE`
- Update Vercel: Add `SQUARESPACE_WEBHOOK_SECRET` environment variable

### Option B: Using Squarespace Dashboard

If your Squarespace plan supports it:
1. Go to Squarespace Dashboard → Settings → Advanced → Webhooks
2. Click "Add Webhook"
3. Configure:
   - **URL:** `https://rmrcms.vercel.app/api/squarespace/webhook`
   - **Events:** Select "Order Created"
   - **Secret:** Will be auto-generated - copy it!
4. Save and copy the secret to your environment variables

---

## 🧪 Step 3: Test the Webhook

### Test with a Real Order (Recommended)

1. Create a test order in Squarespace (use test mode if available)
2. Check Vercel logs for webhook processing:
   ```
   [SQUARESPACE] Webhook received: { topic: 'order.create', ... }
   [SQUARESPACE] Processing order: { orderNumber: '123', email: '...', ... }
   [SQUARESPACE] Successfully created new client: { email: '...', firstName: '...', ... }
   [SQUARESPACE] Membership created successfully
   ```
3. Verify in your app:
   - New client created with correct name
   - Membership record created

### Manual Test (Alternative)

You can manually trigger the webhook endpoint for testing:

```bash
curl -X POST https://rmrcms.vercel.app/api/squarespace/webhook \
  -H "Content-Type: application/json" \
  -H "Squarespace-Signature: test" \
  -d '{
    "id": "test-notification-id",
    "topic": "order.create",
    "websiteId": "test-website-id",
    "createdOn": "2026-01-19T12:00:00Z",
    "data": {
      "id": "test-order-id",
      "orderNumber": "TEST-123",
      "customerEmail": "test@example.com",
      "billingAddress": {
        "firstName": "Test",
        "lastName": "Customer",
        "postalCode": "SW1A 1AA"
      },
      "grandTotal": {
        "value": "12.00",
        "currency": "GBP"
      },
      "createdOn": "2026-01-19T12:00:00Z"
    }
  }'
```

**Note:** This will only work in development mode without signature verification.

---

## 📚 Step 4: Import Historical Orders

To create clients and memberships for past orders:

### 4.1 Preview (Dry Run)

First, run a dry run to see what would be imported:

```bash
curl -X POST "https://rmrcms.vercel.app/api/squarespace/import-historical?dryRun=true" \
  -H "x-api-key: YOUR_WEBHOOK_API_KEY"
```

Response will show:
- How many clients would be created
- How many memberships would be created
- Preview of first 5 clients and memberships
- Any errors encountered

### 4.2 Limited Import (Test)

Import just the first 50 orders to test:

```bash
curl -X POST "https://rmrcms.vercel.app/api/squarespace/import-historical?limit=50" \
  -H "x-api-key: YOUR_WEBHOOK_API_KEY"
```

### 4.3 Full Import

Once you're confident, import all historical orders:

```bash
curl -X POST "https://rmrcms.vercel.app/api/squarespace/import-historical" \
  -H "x-api-key: YOUR_WEBHOOK_API_KEY"
```

**Note:** This may take several minutes depending on how many orders you have.

---

## 🔍 Step 5: Verify Everything Works

### Check Clients
1. Go to your RMR app
2. Navigate to Clients page
3. Verify new clients have:
   - ✅ Real first and last names (not email-based)
   - ✅ Email addresses
   - ✅ Membership status = true
   - ✅ Postcodes (if provided)

### Check Memberships
1. Go to Memberships page (or database)
2. Verify membership records exist for all imported orders
3. Check dates and amounts are correct

---

## 🗑️ Step 6: Remove n8n Workflow (Optional)

Once everything is working:

1. **Disable the n8n workflow** (don't delete yet - keep as backup)
2. **Monitor for a few days** to ensure Squarespace webhooks are working
3. **After 1 week of successful operation**, delete the n8n workflow

---

## 🔧 Troubleshooting

### Webhook Not Receiving Events

**Check webhook subscription:**
```bash
curl https://api.squarespace.com/1.0/webhook_subscriptions \
  -H "Authorization: Bearer 7a51a456-4ac3-40c7-80a9-380968b1e4ea" \
  -H "User-Agent: RMR-CMS/1.0"
```

**Test webhook manually** (see Step 3)

### Signature Verification Failing

- Ensure `SQUARESPACE_WEBHOOK_SECRET` is set correctly in Vercel
- Check Vercel logs for signature mismatch errors
- Verify the secret matches what Squarespace provided

### Historical Import Failing

- Check `SQUARESPACE_API_KEY` is correct
- Verify API key has "Orders" permission (Read Only)
- Check Vercel logs for specific error messages

### Clients Created with Wrong Names

- Check Squarespace order data has `billingAddress.firstName` and `lastName`
- Some old orders may not have complete billing information
- These will fall back to email parsing (same as before)

---

## 📊 Monitoring

### Vercel Logs

Monitor webhook processing in Vercel logs:
```
[SQUARESPACE] Webhook received
[SQUARESPACE] Processing order
[SQUARESPACE] Created new client / Updated existing client
[SQUARESPACE] Membership created successfully
```

### Squarespace Webhook Logs

Check webhook delivery status in Squarespace:
1. Go to webhook subscription details
2. View delivery history
3. Check for failed deliveries

---

## 🎉 Success Criteria

- [x] Webhook endpoint created
- [x] Environment variables configured
- [ ] Webhook subscription created in Squarespace
- [ ] Test order processed successfully
- [ ] Historical orders imported
- [ ] Clients have real names (not email-based)
- [ ] n8n workflow disabled

---

## 📞 Support

If you encounter issues:
1. Check Vercel logs for errors
2. Verify environment variables are set
3. Test webhook with manual curl command
4. Check Squarespace webhook delivery logs

---

## 🔐 Security Notes

- Webhook endpoint uses HMAC-SHA256 signature verification
- API key is never exposed in responses
- All inputs are sanitized and validated
- Service role key bypasses RLS for automated operations

---

**Last Updated:** 2026-01-19  
**Status:** Ready for Setup

