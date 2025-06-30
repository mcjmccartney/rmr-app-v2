# Make.com Session Update Integration

## Problem
When editing sessions and changing date/time, we need to update Google Calendar without triggering email notifications that are meant only for new session creation.

## Solution
Create a separate Make.com scenario specifically for session updates that only handles calendar changes.

## Current Webhooks
- **Session Creation**: `https://hook.eu1.make.com/lipggo8kcd8kwq2vp6j6mr3gnxbx12h7` (sends emails + creates calendar)
- **Session Deletion**: `https://hook.eu1.make.com/5o6hoq9apeqrbaoqgo65nrmdic64bvds` (deletes calendar)
- **Session Update**: *NEEDED* - Should only update calendar, no emails

## Required: New Make.com Scenario for Session Updates

### Scenario Purpose
Handle session date/time changes by updating Google Calendar without sending any emails.

### Webhook Data Received
```json
{
  "sessionId": "session-uuid",
  "clientId": "client-uuid", 
  "clientName": "John Doe",
  "clientEmail": "john@example.com",
  "dogName": "Buddy",
  "sessionType": "In-Person",
  "bookingDate": "2025-01-22",
  "bookingTime": "16:00",
  "notes": "Updated session notes",
  "quote": 75.00,
  "eventIdCallbackUrl": "https://your-domain.com/api/session/event-id",
  "isUpdate": true
}
```

### Scenario Steps
1. **Receive Webhook** - Get session update data
2. **Create Google Calendar Event** - For the new date/time
3. **Create Google Meet Link** (optional) - If needed
4. **Send Event ID Back** - POST to eventIdCallbackUrl with new eventId
5. **NO EMAIL STEPS** - Skip all email notifications

### Required Webhook URL
Please create a new Make.com scenario and provide the webhook URL. It should follow this pattern:
```
https://hook.eu1.make.com/[new-scenario-id]
```

## Implementation Options

### Option 1: New Webhook URL (Recommended)
Create separate scenario for updates, use new webhook URL in the app.

### Option 2: Use Flag in Existing Webhook
Modify existing scenario to check `isUpdate` flag and skip emails when true.

### Option 3: Separate Calendar-Only Webhook
Create a calendar-only webhook that never sends emails.

## Current App Implementation
The app now sends `isUpdate: true` flag to distinguish session updates from new session creation.

## Next Steps
1. Create new Make.com scenario for session updates
2. Provide new webhook URL
3. Update app configuration with new URL
4. Test session date/time changes

## Testing
1. Edit a session and change date/time
2. Verify old calendar event is deleted
3. Verify new calendar event is created
4. Verify NO emails are sent
5. Verify new eventId is stored in app
