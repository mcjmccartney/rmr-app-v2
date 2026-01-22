# Make.com Quick Reference - Stripe Membership Webhooks

## 🎯 Goal
Send customer names from Stripe to RMR app so new members are created with real names instead of email-based names.

## 📋 Current Webhook Payload (Basic)
```json
{
  "email": "{{customer.email}}",
  "date": "{{created}}",
  "amount": "{{amount_paid}}",
  "postcode": "{{customer.address.postal_code}}"
}
```

## ✨ Enhanced Webhook Payload (Recommended)
```json
{
  "email": "{{customer.email}}",
  "date": "{{created}}",
  "amount": "{{amount_paid}}",
  "postcode": "{{customer.address.postal_code}}",
  "name": "{{customer.name}}"
}
```

## 🔍 Where to Find Customer Name in Stripe

⚠️ **IMPORTANT:** `billing_details.name` is often EMPTY if customer didn't provide name during checkout!

### Best Approach: Fetch Customer Object

Since `billing_details.name` is frequently empty, you need to:

1. **Get the customer ID** from the charge: `{{customer}}`
2. **Add a Stripe API module** in Make.com to fetch the customer details
3. **Use the customer's name** from the API response

### Make.com Setup:

**Module 1: Stripe - Get a Customer**
- Customer ID: `{{customer}}` (from the charge/event)
- This returns the full customer object with name

**Module 2: HTTP Request to RMR**
- Use `{{customer.name}}` from Module 1

### Alternative Fields (Less Reliable):

| Event Type | Field to Use | Reliability |
|------------|--------------|-------------|
| `customer.subscription.created` | `{{customer.name}}` | ⭐⭐⭐ Good |
| `customer.subscription.updated` | `{{customer.name}}` | ⭐⭐⭐ Good |
| `invoice.payment_succeeded` | `{{customer.name}}` | ⭐⭐⭐ Good |
| `charge.succeeded` | `{{charge.billing_details.name}}` | ⭐ Often Empty |
| `payment_intent.succeeded` | `{{payment_method.billing_details.name}}` | ⭐ Often Empty |

## 🛠️ Make.com Scenario Setup

### Required Modules (3 Total)

**Module 1: Stripe Webhook Trigger**
- Event: `charge.succeeded`
- This receives the payment data

**Module 2: Stripe - Get a Customer** ⭐ **CRITICAL**
- Action: Get a Customer
- Customer ID: `{{1.customer}}`
- This fetches the customer name!

**Module 3: HTTP Request to RMR**
- URL: `https://rmrcms.vercel.app/api/stripe/webhook`
- Method: `POST`
- Headers:
  ```
  Content-Type: application/json
  x-api-key: [Ask for WEBHOOK_API_KEY]
  ```
- Body (JSON):
  ```json
  {
    "email": "{{1.billing_details.email}}",
    "date": "{{1.created}}",
    "amount": "{{1.amount}}",
    "postcode": "{{1.billing_details.address.postal_code}}",
    "name": "{{2.name}}"
  }
  ```

**Note:** Module numbers may vary. Adjust `{{1.xxx}}` and `{{2.xxx}}` based on your scenario.

## 📊 Before vs After

### Before (Without Name)
**Webhook sends:**
```json
{
  "email": "tracey.heyworth71@gmail.com",
  "date": "2026-01-19",
  "amount": 12.00
}
```

**Result in RMR App:**
- First Name: "Tracey"
- Last Name: "Heyworth71" ❌

### After (With Name)
**Webhook sends:**
```json
{
  "email": "tracey.heyworth71@gmail.com",
  "date": "2026-01-19",
  "amount": 12.00,
  "name": "Tracey Heyworth"
}
```

**Result in RMR App:**
- First Name: "Tracey"
- Last Name: "Heyworth" ✅

## ✅ Testing Checklist

1. [ ] Add `name` field to webhook payload
2. [ ] Map to `{{customer.name}}` or equivalent
3. [ ] Save Make.com scenario
4. [ ] Trigger test Stripe event
5. [ ] Check Make.com execution history
6. [ ] Verify `name` field is populated
7. [ ] Check RMR app for new client with correct name

## 🚨 Troubleshooting

### Name field is empty in Make.com
- Check if Stripe customer has a name set
- Try alternative fields: `{{charge.billing_details.name}}`
- Some test customers may not have names

### Client still created with email-based name
- Verify `name` field is being sent in webhook
- Check for typos in field name (must be exactly `name`)
- Check Make.com execution history for actual payload sent

### Webhook fails
- Verify `x-api-key` header is correct
- Check that URL is exactly `https://rmrcms.vercel.app/api/stripe/webhook`
- Ensure `Content-Type: application/json` header is set

## 🔗 Related Documentation

- Full setup guide: `STRIPE_WEBHOOK_MAKECOM_SETUP.md`
- Technical details: `MEMBERSHIP_CLIENT_CREATION_ENHANCEMENT.md`

## 💡 Pro Tips

1. **Use full name:** Sending `name` is simpler than splitting into `firstName` and `lastName`
2. **Fallback works:** If name is missing, app will parse from email (existing behavior)
3. **Test mode:** Use Stripe test mode to verify before going live
4. **Monitor:** Check first few real payments to ensure names are correct

## 📞 Support

If you need help:
1. Check Make.com execution history for errors
2. Review webhook logs in RMR app (if available)
3. Contact development team with:
   - Make.com scenario ID
   - Stripe event ID
   - Customer email
   - Screenshot of Make.com execution

