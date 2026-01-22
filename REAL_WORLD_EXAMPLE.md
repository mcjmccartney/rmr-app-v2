# Real-World Example: Paul Sherwood Payment

## Actual Stripe Charge Data Received

Based on the real charge object you provided:

```json
{
  "id": "ch_3Squ6hGUZGHAqj3a2Tb1LbM8",
  "amount": 1200,
  "billing_details": {
    "address": {
      "postal_code": "Me137JG",
      "country": "GB"
    },
    "email": "paulsherwood154@hotmail.com",
    "name": "",  // ← EMPTY! This is the problem!
    "phone": null
  },
  "customer": "cus_RbnW3Gjb68Dmou",
  "created": 1768735523
}
```

## The Problem

**`billing_details.name` is EMPTY!**

This is why the current system would create a client like:
- First Name: "Paulsherwood154"
- Last Name: "Member"

## The Solution

### Step 1: Make.com Receives Charge Webhook

```
Module 1: Stripe Webhook Trigger
├─ Event: charge.succeeded
├─ Charge ID: ch_3Squ6hGUZGHAqj3a2Tb1LbM8
├─ Customer ID: cus_RbnW3Gjb68Dmou
├─ Email: paulsherwood154@hotmail.com
├─ Amount: 1200 (£12.00)
└─ billing_details.name: "" ← Empty!
```

### Step 2: Fetch Customer Object from Stripe

```
Module 2: Stripe - Get a Customer
├─ Input: cus_RbnW3Gjb68Dmou
└─ Output: Customer object with name!
```

**Customer Object Response:**
```json
{
  "id": "cus_RbnW3Gjb68Dmou",
  "email": "paulsherwood154@hotmail.com",
  "name": "Paul Sherwood",  // ← This is what we need!
  "address": {
    "postal_code": "Me137JG",
    "country": "GB"
  }
}
```

### Step 3: Send to RMR App

```
Module 3: HTTP Request
├─ URL: https://rmrcms.vercel.app/api/stripe/webhook
├─ Method: POST
└─ Body:
    {
      "email": "paulsherwood154@hotmail.com",
      "date": "2025-01-17T15:45:23Z",
      "amount": 12.00,
      "postcode": "Me137JG",
      "name": "Paul Sherwood"  ← From customer object!
    }
```

### Step 4: RMR App Creates Client

```
Client Created:
├─ First Name: "Paul"
├─ Last Name: "Sherwood"
├─ Email: "paulsherwood154@hotmail.com"
├─ Address: "Me137JG"
├─ Membership: true
└─ Active: true
```

## Make.com Configuration

### Module 1: Webhook Trigger
- **Type:** Stripe Webhook
- **Event:** `charge.succeeded`
- **Output:** Charge object

### Module 2: Get Customer
- **Type:** Stripe > Get a Customer
- **Customer ID:** `{{1.customer}}`
- **Output:** Customer object with name

### Module 3: HTTP Request
- **URL:** `https://rmrcms.vercel.app/api/stripe/webhook`
- **Method:** `POST`
- **Headers:**
  ```
  Content-Type: application/json
  x-api-key: [Your WEBHOOK_API_KEY]
  ```
- **Body:**
  ```json
  {
    "email": "{{1.billing_details.email}}",
    "date": "{{formatDate(1.created; 'YYYY-MM-DDTHH:mm:ssZ')}}",
    "amount": "{{1.amount / 100}}",
    "postcode": "{{1.billing_details.address.postal_code}}",
    "name": "{{2.name}}"
  }
  ```

## Before vs After

### ❌ Before (Without Customer Fetch)

**What Make.com sends:**
```json
{
  "email": "paulsherwood154@hotmail.com",
  "date": "2025-01-17T15:45:23Z",
  "amount": 12.00,
  "postcode": "Me137JG"
  // No name field!
}
```

**Result in RMR App:**
- First Name: "Paulsherwood154" 😞
- Last Name: "Member" 😞

### ✅ After (With Customer Fetch)

**What Make.com sends:**
```json
{
  "email": "paulsherwood154@hotmail.com",
  "date": "2025-01-17T15:45:23Z",
  "amount": 12.00,
  "postcode": "Me137JG",
  "name": "Paul Sherwood"
}
```

**Result in RMR App:**
- First Name: "Paul" ✅
- Last Name: "Sherwood" ✅

## Testing

1. **Create test scenario in Make.com** with the 3 modules above
2. **Trigger a test charge** in Stripe (test mode)
3. **Check Make.com execution history:**
   - Module 1 should show the charge
   - Module 2 should show customer with name
   - Module 3 should send name to RMR app
4. **Check RMR app** for new client with correct name

## Troubleshooting

### Customer name is still empty
- Check if the Stripe customer actually has a name set
- Go to Stripe Dashboard > Customers > Search for email
- If name is empty in Stripe, you'll need to update it

### How to ensure customers have names in Stripe
- Use Stripe Checkout with name field required
- Update customer name via Stripe API when they sign up
- Import existing customer names to Stripe

## Next Steps

1. ✅ Add "Get a Customer" module to Make.com scenario
2. ✅ Update HTTP request body to include `{{2.name}}`
3. ✅ Test with a real payment
4. ✅ Verify client is created with correct name in RMR app

