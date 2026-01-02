# Payment Links System - Complete Setup Guide

This document explains the comprehensive payment link system that automatically selects the correct Monzo payment link based on session type, membership status, session number, and travel zones.

## Overview

The app now intelligently calculates the correct payment link for each session and passes it to Make.com via webhooks. This eliminates the need for individual Outlook email drafts with hardcoded payment links.

## How It Works

The payment link is automatically selected based on **4 factors**:

1. **Session Type** - Online, In-Person, Training, etc.
2. **Membership Status** - Member vs Non-Member
3. **Session Number** - First session (Initial Consult) vs Follow-up sessions
4. **Travel Zone** - Zone 1, Zone 2, Zone 3, Zone 4, or No Travel (for In-Person only)

## Payment Link Structure

### Online Catchup
- **£30** - Same for everyone
- Link: `https://monzo.com/pay/r/raising-my-rescue_qeDXP5wJpnqGln`

### Training Sessions

| Session Type | Member | Non-Member |
|-------------|--------|------------|
| Training - 1hr | £50 | £60 |
| Training - 30mins | £25 | N/A (member only) |
| Training - The Mount | £50 | £60 |

### Behaviour Sessions - Online

| Session Type | Member | Non-Member |
|-------------|--------|------------|
| Initial Consult | £70 | £90 |
| Follow-up Session | £50 | £70 |

### Behaviour Sessions - In-Person

**Initial Consults:**

| Travel Zone | Member | Non-Member |
|------------|--------|------------|
| No Travel | £100 | £120 |
| Zone 1 | £105 | £125 |
| Zone 2 | £110 | £130 |
| Zone 3 | £115 | £135 |
| Zone 4 | £120 | £140 |

**Follow-up Sessions:**

| Travel Zone | Member | Non-Member |
|------------|--------|------------|
| No Travel | £75 | £95 |
| Zone 1 | £80 | £100 |
| Zone 2 | £85 | £105 |
| Zone 3 | £90 | £110 |
| Zone 4 | £95 | £115 |

## Travel Zones

| Zone | Cost | Description |
|------|------|-------------|
| Zone 1 | £5 | Nearby locations |
| Zone 2 | £10 | Medium distance |
| Zone 3 | £15 | Far locations |
| Zone 4 | £20 | Very far locations |

## Database Setup

### Step 1: Run the Zone 4 Migration

Run the SQL migration to add Zone 4 support:

```bash
# In Supabase SQL Editor, run:
migrations/20250102_add_zone_4_support.sql
```

This will:
- Update the database constraint to allow Zone 4
- Update the column comment with new pricing

## Webhook Integration

### Payment Link in Webhook Data

The app now includes a `paymentLink` field in all session webhooks sent to Make.com:

```json
{
  "sessionId": "...",
  "clientFirstName": "...",
  "clientLastName": "...",
  "clientEmail": "...",
  "sessionType": "In-Person",
  "bookingDate": "2025-01-15",
  "bookingTime": "10:00",
  "quote": 105,
  "travelExpense": "Zone 1",
  "membershipStatus": true,
  "paymentLink": "https://monzo.com/pay/r/raising-my-rescue_f24YjGV924ameM?description=RMR-In-Person-abc123&redirect_url=https://rmrcms.vercel.app/pay-confirm?id=abc123",
  ...
}
```

### Make.com Usage

In your Make.com scenarios, you can now use the `paymentLink` field directly in your email templates:

**Example:**
```
Hi {{clientFirstName}},

Your session is confirmed for {{bookingDate}} at {{bookingTime}}.

Please complete your payment using this link:
{{paymentLink}}

Thank you!
```

## How the App Calculates the Link

The `paymentService.generatePaymentLink()` function:

1. Checks the session type
2. Determines if it's the client's first session (`sessionNumber === 1`)
3. Checks membership status
4. For In-Person sessions, checks the travel zone
5. Selects the appropriate Monzo link from the configuration
6. Adds session ID and redirect URL as query parameters
7. Returns the complete payment link

## Benefits

✅ **No more manual email drafts** - Payment links are generated automatically  
✅ **Always accurate** - Links match the session type, membership, and travel zone  
✅ **Centralized management** - All payment links are in one place (`paymentService.ts`)  
✅ **Automatic updates** - Changes to links only need to be made in one location  
✅ **Consistent pricing** - Quote and payment link always match  

## Testing

To test the payment link generation:

1. Create a new session with different combinations:
   - Member vs Non-Member client
   - First session vs Follow-up session
   - Different session types
   - Different travel zones (for In-Person)

2. Check the webhook data in Make.com to verify the correct payment link is sent

3. Verify the payment link includes:
   - Correct base Monzo URL
   - Session description parameter
   - Redirect URL parameter

## Troubleshooting

**Issue:** Wrong payment link generated  
**Solution:** Check that the session has the correct:
- Session type
- Session number (should be 1 for first sessions)
- Travel zone (for In-Person sessions)

**Issue:** Payment link missing from webhook  
**Solution:** Ensure the session has a valid client with membership status

**Issue:** Zone 4 not available in dropdown  
**Solution:** Run the database migration to add Zone 4 support

