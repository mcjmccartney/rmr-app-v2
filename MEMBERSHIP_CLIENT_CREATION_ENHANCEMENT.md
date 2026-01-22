# Membership Client Creation Enhancement

## Summary

Enhanced the Stripe webhook handler to accept and use real customer names from Stripe instead of parsing names from email addresses.

## Problem

When membership payments came through, the app was creating clients with names parsed from email addresses:
- `tracey.heyworth71@gmail.com` → "Tracey Heyworth71"
- `jowheatley2@gmail.com` → "Jowheatley2 Member"

This looked unprofessional and made it hard to identify customers.

## Solution

Updated the webhook handler to accept customer names from Make.com/Stripe and use a priority system:

1. **Priority 1:** Use `firstName` and `lastName` if provided
2. **Priority 2:** Parse `name` field (e.g., "Tracey Heyworth")
3. **Priority 3:** Fall back to email parsing (existing behavior)

## Changes Made

### 1. Updated Webhook Handler
**File:** `src/app/api/stripe/webhook/route.ts`

**New fields accepted:**
- `firstName` or `first_name` - Customer's first name
- `lastName` or `last_name` - Customer's last name
- `name` - Full name (will be split into first/last)

**Logic:**
```typescript
// Priority 1: Use firstName and lastName if provided
if (firstName && lastName) {
  clientFirstName = firstName;
  clientLastName = lastName;
}
// Priority 2: Parse fullName if provided
else if (fullName) {
  const nameParts = fullName.trim().split(/\s+/);
  clientFirstName = nameParts[0] || 'New';
  clientLastName = nameParts.slice(1).join(' ') || 'Member';
}
// Priority 3: Extract from email as fallback
else {
  // ... existing email parsing logic
}
```

### 2. Updated Test Endpoint
**File:** `src/app/api/stripe/webhook/test/route.ts`

Added `name` field to test data to demonstrate the new functionality.

### 3. Created Documentation
**File:** `STRIPE_WEBHOOK_MAKECOM_SETUP.md`

Complete guide for configuring Make.com to extract and send customer names from Stripe.

## How It Works

### Current Behavior (No Changes Required)
The app still works with the existing webhook format:
```json
{
  "email": "test@example.com",
  "date": "2026-01-19",
  "amount": 12.00,
  "postcode": "SW1A 1AA"
}
```
Result: Name parsed from email (fallback behavior)

### Enhanced Behavior (After Make.com Update)
When Make.com sends customer name:
```json
{
  "email": "tracey.heyworth71@gmail.com",
  "date": "2026-01-19",
  "amount": 12.00,
  "postcode": "SW1A 1AA",
  "name": "Tracey Heyworth"
}
```
Result: Client created as "Tracey Heyworth" ✅

## Make.com Configuration Required

To enable this feature, update your Make.com scenario to:

1. Extract customer name from Stripe event:
   - `{{customer.name}}` OR
   - `{{payment_method.billing_details.name}}` OR
   - `{{charge.billing_details.name}}`

2. Add to webhook payload:
   ```json
   {
     "email": "{{customer.email}}",
     "date": "{{created}}",
     "amount": "{{amount_paid}}",
     "postcode": "{{customer.address.postal_code}}",
     "name": "{{customer.name}}"
   }
   ```

See `STRIPE_WEBHOOK_MAKECOM_SETUP.md` for detailed instructions.

## Benefits

✅ **Professional appearance** - Real names instead of email-based names  
✅ **Better customer identification** - Easy to recognize customers  
✅ **Backward compatible** - Still works without name fields  
✅ **Flexible** - Accepts multiple name formats  
✅ **Automatic** - No manual intervention needed once configured  

## Testing

### Test the webhook with name:
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

### Or use the built-in test endpoint:
Visit: `https://rmrcms.vercel.app/api/stripe/webhook/test`

## Next Steps

1. ✅ Code changes deployed
2. ⏳ Update Make.com scenario to send customer names
3. ⏳ Test with real Stripe payment
4. ⏳ Monitor new client creations

## Rollback Plan

If issues occur, the app will automatically fall back to email parsing. No rollback needed.

## Related Files

- `src/app/api/stripe/webhook/route.ts` - Main webhook handler
- `src/app/api/stripe/webhook/test/route.ts` - Test endpoint
- `STRIPE_WEBHOOK_MAKECOM_SETUP.md` - Make.com configuration guide

