# Make.com Calendar Integration

This document explains how to integrate your existing Make.com scenario with the RMR app for Google Calendar and Google Meet management.

## Overview

Your Make.com scenario already creates Google Calendar entries and Google Meet links. This integration allows you to:

1. **Session Creation**: App sends session data to Make.com → Make.com creates calendar event → Make.com sends Event ID back to app
2. **Session Deletion**: App sends Event ID to Make.com → Make.com deletes calendar event

## 1. Session Creation Flow

### App → Make.com (Existing)
Your app already sends session data to Make.com via webhook:
```
POST https://hook.eu1.make.com/lipggo8kcd8kwq2vp6j6mr3gnxbx12h7
```

The webhook includes:
- `sessionId` - The session ID from the app
- `clientName`, `clientEmail`, `dogName` - Client details
- `sessionType`, `bookingDate`, `bookingTime` - Session details
- `eventIdCallbackUrl` - Callback URL for Event ID

### Make.com → App (New)
After creating the Google Calendar event, your Make.com scenario should send the Event ID back:

```
POST https://your-domain.com/api/session/event-id
Content-Type: application/json

{
  "sessionId": "the-session-id-from-original-webhook",
  "eventId": "google-calendar-event-id",
  "googleMeetLink": "https://meet.google.com/xxx-xxxx-xxx" // optional
}
```

**Required fields:**
- `sessionId` - The session ID from the original webhook
- `eventId` - The Google Calendar Event ID

**Optional fields:**
- `googleMeetLink` - The Google Meet link (if created)

## 2. Session Deletion Flow

### App → Make.com
When a session is deleted, the app sends:

```
POST https://hook.eu1.make.com/5o6hoq9apeqrbaoqgo65nrmdic64bvds
Content-Type: application/json

{
  "sessionId": "session-id",
  "eventId": "google-calendar-event-id",
  "clientId": "client-id",
  "clientName": "John Doe",
  "clientEmail": "john@example.com",
  "dogName": "Buddy",
  "sessionType": "In-Person",
  "bookingDate": "2025-01-20",
  "bookingTime": "14:30",
  "notes": "Session notes",
  "quote": 75.00
}
```

Your Make.com scenario should use the `eventId` to delete the corresponding Google Calendar event.

## 3. Database Setup

Run this SQL in your Supabase SQL Editor:

```sql
-- Add event_id and google_meet_link columns to sessions table
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS event_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS google_meet_link TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_event_id ON sessions(event_id);
```

## 4. Make.com Scenario Updates

### For Session Creation Scenario:
1. **Receive webhook** from app with session data
2. **Create Google Calendar event** (you already do this)
3. **Create Google Meet link** (you already do this)
4. **NEW: Send Event ID back to app**:
   - Add HTTP module at the end
   - POST to: `https://your-domain.com/api/session/event-id`
   - Body: `{"sessionId": "{{sessionId}}", "eventId": "{{calendar_event_id}}", "googleMeetLink": "{{meet_link}}"}`

### For Session Deletion Scenario:
1. **Receive webhook** from app with Event ID
2. **Delete Google Calendar event** using the Event ID
3. **Optionally**: Send confirmation back to app

## 5. Benefits

✅ **Leverages existing Make.com setup** - No need to rebuild calendar logic
✅ **Automatic calendar cleanup** - Events deleted when sessions are deleted
✅ **Google Meet integration** - Meet links stored and accessible in app
✅ **Event ID tracking** - Full traceability between app sessions and calendar events
✅ **Reliable deletion** - Uses stored Event IDs for accurate calendar cleanup

## 6. Testing

1. **Create a session** in the app
2. **Check Make.com logs** - Verify webhook received and calendar event created
3. **Check session in app** - Should show Event ID after Make.com callback
4. **Delete the session** - Should trigger deletion webhook to Make.com
5. **Check Google Calendar** - Event should be removed

## 7. Troubleshooting

### Session not getting Event ID:
- Check Make.com logs for the callback HTTP request
- Verify the callback URL is correct: `https://your-domain.com/api/session/event-id`
- Check Vercel function logs for any errors

### Calendar event not being deleted:
- Verify the deletion webhook URL: `https://hook.eu1.make.com/5o6hoq9apeqrbaoqgo65nrmdic64bvds`
- Check that the session has an Event ID stored
- Check Make.com logs for the deletion webhook

### Event ID format:
- Google Calendar Event IDs are typically long strings like: `abc123def456ghi789_20250120T143000Z`
- Make sure you're sending the correct Event ID from the calendar creation response
