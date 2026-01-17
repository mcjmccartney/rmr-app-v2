# Online Session Calendar Event Logic

## 🎯 Overview

Calendar events for **Online sessions** are now created with conditional Google Meet link generation based on how far away the session is.

## ✅ How It Works

### For Online Sessions Created >7 Days Away

When an Online session is created **more than 7 days** in advance:

1. ✅ Calendar event is created **immediately**
2. ❌ **NO Google Meet link** is generated
3. 📅 Event appears on calendar without video conferencing details
4. ⏰ At 7 days before session, this event will be **deleted and replaced**

**Why?** This prevents Google Meet links from being generated too early, while still blocking out the calendar time.

### For Online Sessions Created ≤7 Days Away

When an Online session is created **7 days or less** in advance:

1. ✅ Calendar event is created **immediately**
2. ✅ **WITH Google Meet link** generated
3. 📧 Session email webhook sent with Meet link
4. 🔗 Meet link stored in session record

**Why?** The session is close enough that the Meet link should be available immediately.

### At 7 Days Before Session (Daily Webhook)

When the daily webhook runs and finds an Online session **exactly 7 days away**:

1. 🗑️ **Deletes** the existing calendar event (without Meet link)
2. 📧 Sends webhook to Make.com with `sendSessionEmail: true`
3. 🆕 Make.com creates **new calendar event WITH Google Meet link**
4. 📨 Make.com sends session email with all details including Meet link

**Why?** This ensures the Meet link is fresh and the email is sent at the right time.

### For Non-Online Sessions

All other session types (In-Person, Training, etc.):

1. ✅ Calendar event created immediately
2. ❌ No Google Meet link (not needed)
3. 📅 Event appears on calendar with location/details

## 🔧 Technical Implementation

### API Changes

**`/api/calendar/create`**
- Added `includeMeetLink` parameter (default: `true`)
- When `false`, skips Google Meet conference data creation
- When `true` and session is Online, creates Meet link

### Frontend Changes

**`src/context/AppContext.tsx`**

#### `createCalendarEvent` function:
```typescript
const createCalendarEvent = async (
  session: Session, 
  includeMeetLink: boolean = true
): Promise<{ eventId: string; meetLink?: string } | null>
```

#### Session Creation Logic:
```typescript
// Calculate days until session
const daysUntilSession = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

// For Online sessions, only include Meet link if ≤7 days away
const includeMeetLink = session.sessionType !== 'Online' || daysUntilSession <= 7;

// Create calendar event
const calendarResult = await createCalendarEvent(session, includeMeetLink);
```

### Backend Changes

**`/api/daily-webhooks`**
- Already deletes calendar event for Online sessions at 7 days
- Clears `event_id` from session record
- Make.com receives webhook and creates new event with Meet link

## 📊 Flow Diagram

### Scenario 1: Online Session Created 10 Days Away

```
Day 0 (Creation):
  ✅ Create calendar event WITHOUT Meet link
  ✅ eventId stored in session
  ❌ No Meet link generated

Day 3 (7 days before):
  🗑️ Delete existing calendar event
  ❌ Clear eventId from session
  📧 Send webhook to Make.com
  🆕 Make.com creates NEW event WITH Meet link
  📨 Make.com sends session email
```

### Scenario 2: Online Session Created 5 Days Away

```
Day 0 (Creation):
  ✅ Create calendar event WITH Meet link
  ✅ eventId stored in session
  ✅ Meet link generated and stored
  📧 Session webhook sent (email sent immediately)
```

### Scenario 3: Online Session Created 7 Days Away

```
Day 0 (Creation):
  ✅ Create calendar event WITH Meet link
  ✅ eventId stored in session
  ✅ Meet link generated and stored
  📧 Session webhook sent (email sent immediately)
```

## 🧪 Testing

### Test Case 1: Create Online Session >7 Days Away

1. Create Online session 10 days in future
2. ✅ Verify calendar event created
3. ❌ Verify NO Google Meet link in event
4. ✅ Verify eventId stored in session

### Test Case 2: Create Online Session ≤7 Days Away

1. Create Online session 5 days in future
2. ✅ Verify calendar event created
3. ✅ Verify Google Meet link in event
4. ✅ Verify Meet link stored in session

### Test Case 3: Daily Webhook at 7 Days

1. Create Online session 10 days away (no Meet link)
2. Wait until 7 days before (or simulate)
3. Run daily webhook
4. ✅ Verify old event deleted
5. ✅ Verify eventId cleared
6. ✅ Verify webhook sent to Make.com

## 📝 Important Notes

1. **Non-Online Sessions**: Always create calendar events immediately (no Meet link needed)

2. **Meet Link Generation**: Only happens for Online sessions ≤7 days away

3. **Event Deletion**: Only happens at exactly 7 days for Online sessions

4. **Make.com Integration**: Make.com creates the final event with Meet link at 7 days

5. **Email Timing**: Session emails sent at 7 days (or immediately if created ≤7 days away)

## 🔄 Membership Alias Emails

**Already Implemented**: Membership payments are matched using both:
- Primary client email
- Email aliases from `client_email_aliases` table
- Case-insensitive matching

This ensures clients who purchase memberships with different email addresses are correctly identified as members.

## 🚨 Troubleshooting

### Online Session Has No Meet Link (>7 Days)

**Expected behavior** - Meet link will be generated at 7 days before session.

### Online Session Created ≤7 Days Has No Meet Link

1. Check browser console for calendar creation errors
2. Verify Google Calendar API credentials
3. Check session record for `googleMeetLink` field

### Calendar Event Not Deleted at 7 Days

1. Check Supabase cron job is running
2. Verify daily webhook endpoint is accessible
3. Check Vercel logs for deletion errors

## 📚 Related Files

- `src/app/api/calendar/create/route.ts` - Calendar creation API
- `src/context/AppContext.tsx` - Session creation logic
- `src/app/api/daily-webhooks/route.ts` - 7-day webhook processing
- `AUTOMATED_MEMBERSHIP_UPDATES.md` - Membership automation docs

