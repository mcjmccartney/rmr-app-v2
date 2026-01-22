# Stripe Webhook Setup for Make.com

## Overview

This document explains how to configure Make.com to extract customer name and billing details from Stripe webhooks and send them to the RMR app.

## Current vs. Enhanced Setup

### Current Setup (Basic)
Make.com currently sends:
- ✅ `email` - Customer email
- ✅ `date` - Payment date
- ✅ `amount` - Payment amount
- ✅ `postcode` - Billing postcode (optional)

### Enhanced Setup (Recommended)
Make.com should also send:
- ⭐ `firstName` - Customer's first name
- ⭐ `lastName` - Customer's last name
- ⭐ `name` - Full name (alternative to firstName/lastName)

## Why This Matters

**Without customer names:**
- New members appear as "Tracey.Heyworth71" and "Heyworth71" (parsed from email)
- Looks unprofessional
- Hard to identify customers

**With customer names:**
- New members appear as "Tracey Heyworth" (real name from Stripe)
- Professional appearance
- Easy to identify customers

## Stripe Data Available

⚠️ **IMPORTANT DISCOVERY:** In real-world testing, `billing_details.name` is often **EMPTY**!

Example from actual charge:
```json
{
  "billing_details": {
    "name": "",  // ← EMPTY!
    "email": "paulsherwood154@hotmail.com",
    "address": {
      "postal_code": "Me137JG"
    }
  },
  "customer": "cus_RbnW3Gjb68Dmou"
}
```

### Solution: Fetch Customer Object

The customer's name is stored in the **Customer object**, not in billing_details.

You need to make a **second API call** to Stripe to get the customer details:

**Step 1:** Get customer ID from charge
```
customer: "cus_RbnW3Gjb68Dmou"
```

**Step 2:** Fetch customer object from Stripe API
```json
{
  "id": "cus_RbnW3Gjb68Dmou",
  "email": "paulsherwood154@hotmail.com",
  "name": "Paul Sherwood",  // ← This is what we need!
  "phone": "+44...",
  "address": {
    "line1": "123 Main Street",
    "city": "London",
    "postal_code": "Me137JG",
    "country": "GB"
  }
}
```

## Make.com Scenario Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Module 1: Stripe Webhook Trigger                            │
│ Event: charge.succeeded                                     │
│ Output: charge object (with customer ID)                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Module 2: Stripe - Get a Customer                           │
│ Customer ID: {{1.customer}}                                 │
│ Output: customer object (with name!)                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Module 3: HTTP Request to RMR App                           │
│ URL: https://rmrcms.vercel.app/api/stripe/webhook          │
│ Body: {                                                     │
│   "email": "{{1.billing_details.email}}",                  │
│   "date": "{{1.created}}",                                 │
│   "amount": "{{1.amount}}",                                │
│   "postcode": "{{1.billing_details.address.postal_code}}", │
│   "name": "{{2.name}}"  ← From customer object!            │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
```

## Make.com Configuration

### Step 1: Identify the Stripe Event

Your Make.com scenario should be listening for one of these events:
- `customer.subscription.created` - New subscription
- `customer.subscription.updated` - Subscription renewed
- `invoice.payment_succeeded` - Payment completed
- `charge.succeeded` - One-time payment ⭐ **Most Common**

### Step 2: Add Stripe "Get a Customer" Module

Since `billing_details.name` is usually empty, you need to fetch the customer object:

**Add Module:** Stripe > Get a Customer

**Configuration:**
- **Customer ID:** `{{customer}}` (from the webhook trigger)
- This will fetch the full customer object including the name

### Step 3: Extract Customer Name

Use the customer name from the "Get a Customer" module:

```
{{2.name}}
```
(Where `2` is the module number of your "Get a Customer" module)

### Step 4: Handle Missing Names (Optional)

Add a filter or condition to check if name exists:

```
{{if(2.name; 2.name; "")}}
```

This will send the name if it exists, or empty string if not (app will fall back to email parsing).

### Step 5: Split Name (Optional)

If you want to send `firstName` and `lastName` separately, use Make.com's text functions:

**First Name:**
```
{{split(2.name; " "; 1)}}
```

**Last Name:**
```
{{trim(replace(2.name; split(2.name; " "; 1); ""))}}
```

Or use a simpler approach and just send the full name as `name`.

### Step 6: Update Webhook Payload

Update your HTTP request to the RMR app to include the customer name from the "Get a Customer" module:

**Recommended (Simple):**
```json
{
  "email": "{{1.billing_details.email}}",
  "date": "{{1.created}}",
  "amount": "{{1.amount}}",
  "postcode": "{{1.billing_details.address.postal_code}}",
  "name": "{{2.name}}"
}
```

**OR** if you split the name:

```json
{
  "email": "{{1.billing_details.email}}",
  "date": "{{1.created}}",
  "amount": "{{1.amount}}",
  "postcode": "{{1.billing_details.address.postal_code}}",
  "firstName": "{{split(2.name; ' '; 1)}}",
  "lastName": "{{trim(replace(2.name; split(2.name; ' '; 1); ''))}}"
}
```

**Note:** Module numbers (1, 2) may vary based on your scenario. Adjust accordingly.

## App Webhook Endpoint

**URL:** `https://rmrcms.vercel.app/api/stripe/webhook`

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
x-api-key: [Your WEBHOOK_API_KEY from environment variables]
```

**Payload (Enhanced):**
```json
{
  "email": "tracey.heyworth71@gmail.com",
  "date": "2026-01-19T10:30:00Z",
  "amount": 12.00,
  "postcode": "SW1A 1AA",
  "name": "Tracey Heyworth"
}
```

## How the App Handles Names

The app now uses a **priority system** for determining customer names:

1. **Priority 1:** Use `firstName` and `lastName` if both provided
2. **Priority 2:** Parse `name` field (e.g., "Tracey Heyworth" → "Tracey" + "Heyworth")
3. **Priority 3:** Extract from email as fallback (e.g., "tracey.heyworth71@gmail.com" → "Tracey" + "Heyworth71")

## Testing

### Test with Make.com

1. Trigger a test Stripe event (use Stripe's test mode)
2. Check Make.com execution history
3. Verify the webhook payload includes `name` or `firstName`/`lastName`
4. Check the RMR app to see if the client was created with the correct name

### Test Directly

You can test the webhook endpoint directly:

```bash
curl -X POST https://rmrcms.vercel.app/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "email": "test@example.com",
    "date": "2026-01-19",
    "amount": 12.00,
    "name": "Test User"
  }'
```

## Troubleshooting

### Name not appearing in app

1. Check Make.com execution history - is `name` being extracted?
2. Check webhook logs in the app (if available)
3. Verify the field name is exactly `name`, `firstName`, or `lastName`

### Name still parsed from email

- The app falls back to email parsing if no name is provided
- Make sure Make.com is sending the `name` field
- Check for typos in field names

### Partial names

- If only first name appears, check that the full name is being sent
- Stripe sometimes only has partial information if customer didn't provide it

## Next Steps

After configuring Make.com:

1. ✅ Update Make.com scenario to extract customer name
2. ✅ Test with a real Stripe payment
3. ✅ Verify new clients are created with proper names
4. ✅ Monitor for a few days to ensure it's working consistently

