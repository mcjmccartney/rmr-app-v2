# Webhook Structure Documentation

This document describes the complete webhook structure sent to Make.com for all session-related events.

## Webhook Types

All webhooks now send **identical data structure** with the following fields:

### 1. New Session Creation Webhook
- **Trigger:** When a new session is created in the app
- **URL:** `https://hook.eu1.make.com/lipggo8kcd8kwq2vp6j6mr3gnxbx12h7`
- **Flags:** `createCalendarEvent: true` (unless disabled)

### 2. Session Update Webhook
- **Trigger:** When a session is updated
- **URL:** `https://hook.eu1.make.com/lipggo8kcd8kwq2vp6j6mr3gnxbx12h7`
- **Flags:** `isUpdate: true`, `sendSessionEmail: true` (if ≤4 days away), `createCalendarEvent: false`

### 3. Booking Terms Webhook
- **Trigger:** When booking terms are signed
- **URL:** `https://hook.eu1.make.com/yaoalfe77uqtw4xv9fbh5atf4okq14wm`
- **Flags:** `isUpdate: true`

### 4. 4-Day Periodic Reminder Webhook
- **Trigger:** Daily cron job for sessions exactly 4 days away
- **URL:** `https://hook.eu1.make.com/lipggo8kcd8kwq2vp6j6mr3gnxbx12h7`
- **Flags:** `sendSessionEmail: true`, `createCalendarEvent: false`

### 5. 12-Day Periodic Reminder Webhook (Currently Disabled)
- **Trigger:** Daily cron job for sessions exactly 12 days away
- **URL:** Would use the same webhook URL
- **Status:** Currently disabled in the codebase

## Complete Webhook Data Structure

```json
{
  // Session Information
  "sessionId": "uuid-string",
  "clientId": "uuid-string",
  "sessionType": "In-Person | Online | Training - 1hr | Training - 30mins | Training - The Mount | Online Catchup | Group | RMR Live | Phone Call | Coaching",
  "bookingDate": "2025-01-15",
  "bookingTime": "10:00",
  "quote": 105,
  "notes": "Optional session notes",
  "travelExpense": "Zone 1 | Zone 2 | Zone 3 | Zone 4 | null",
  
  // Client Information
  "clientName": "John Smith",
  "clientFirstName": "John",
  "clientLastName": "Smith",
  "clientEmail": "john@example.com",
  "address": "123 Main St, City",
  "dogName": "Buddy",
  "membershipStatus": true,
  
  // Timestamps
  "createdAt": "2025-01-02T12:00:00.000Z",
  
  // Form URLs (with email prefilled)
  "bookingTermsUrl": "https://rmrcms.vercel.app/booking-terms?email=john@example.com",
  "questionnaireUrl": "https://rmrcms.vercel.app/behaviour-questionnaire?email=john@example.com",
  
  // Payment Link (NEW - dynamically generated)
  "paymentLink": "https://monzo.com/pay/r/raising-my-rescue_xxxxx?description=RMR-In-Person-abc123&redirect_url=https://rmrcms.vercel.app/pay-confirm?id=abc123",
  
  // Webhook Control Flags (conditional)
  "sendSessionEmail": true,        // Only for 4-day reminders and session updates ≤4 days away
  "createCalendarEvent": false,    // Only for new sessions (true) or updates (false)
  "isUpdate": true,                // Only for update webhooks
  
  // Callback URL (only for new sessions)
  "eventIdCallbackUrl": "https://rmrcms.vercel.app/api/session/event-id",
  
  // Form Completion Status (only for new sessions and updates)
  "hasSignedBookingTerms": true,
  "hasFilledQuestionnaire": false
}
```

## Payment Link Generation

The `paymentLink` field is **automatically generated** for every webhook based on:

1. **Session Type** - Different links for Online, In-Person, Training, etc.
2. **Membership Status** - Member vs Non-Member pricing
3. **Session Number** - First session (Initial Consult) vs Follow-up
4. **Travel Zone** - For In-Person sessions: Zone 1, 2, 3, 4, or No Travel

The payment link includes:
- Correct Monzo payment URL for the specific price
- Session description: `RMR-{SessionType}-{SessionID}`
- Redirect URL: `https://rmrcms.vercel.app/pay-confirm?id={SessionID}`

## Usage in Make.com

All webhooks can now use the same template structure:

```
Hi {{clientFirstName}},

Your {{sessionType}} session is confirmed for {{bookingDate}} at {{bookingTime}}.

Please complete your payment using this link:
{{paymentLink}}

After payment, you'll be redirected to a confirmation page.

Thank you!
```

## Key Benefits

✅ **Consistent Structure** - All webhooks have the same fields  
✅ **Automatic Payment Links** - No manual link selection needed  
✅ **Accurate Pricing** - Payment link always matches the quote  
✅ **Session Tracking** - Payment links include session ID for automatic confirmation  
✅ **Simplified Make.com Scenarios** - One template works for all webhook types  

## Validation

All webhooks validate the following before sending:
- Client first name, last name, and email are not empty
- Session type, booking date, and booking time are valid
- Quote is present (for 4-day reminders)
- Payment link is successfully generated

If validation fails, the webhook is skipped and logged.

## Cron Job Schedule

- **4-Day Reminders:** Daily at 8:00 AM UTC via `/api/daily-webhooks`
- **Combined Webhooks:** Alternative endpoint at `/api/scheduled-webhooks-combined`

Both endpoints now include the complete webhook structure with payment links.

