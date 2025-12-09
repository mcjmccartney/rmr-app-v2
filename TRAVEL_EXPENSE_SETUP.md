# Travel Expense Feature Setup

## Overview

The travel expense feature allows you to track travel costs for sessions by selecting a zone when creating or editing sessions. The travel expense data is automatically sent to Make.com webhooks for processing.

## Features

- ✅ **Zone Selection**: Choose from Zone 1 (£10), Zone 2 (£15), or Zone 3 (£20)
- ✅ **Optional Field**: Travel expense is optional - sessions can have no travel expense
- ✅ **In-Person Only**: Travel expense dropdown only appears for In-Person sessions
- ✅ **Auto-Clear**: Travel expense is automatically cleared when changing session type away from In-Person
- ✅ **Auto-Calculate Quote**: Travel expense cost is automatically added to the session quote
- ✅ **Create & Edit**: Available in both session creation and editing forms
- ✅ **Webhook Integration**: Travel expense data is automatically sent to Make.com
- ✅ **Database Storage**: Stored in sessions table with validation

## Database Setup

### Step 1: Run the Migration

Execute the SQL migration in your Supabase SQL Editor:

```bash
migrations/20251209_add_travel_expense.sql
```

This creates:
- `travel_expense` column in sessions table (VARCHAR(10))
- Check constraint to ensure only valid values ('Zone 1', 'Zone 2', 'Zone 3', or NULL)
- Column comment for documentation

### Step 2: Verify the Column

After running the migration, verify the column was created:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sessions' AND column_name = 'travel_expense';
```

## Using the Feature

### Creating a Session with Travel Expense

1. Click the "+" button to create a new session
2. Fill in the required fields (Client, Date, Time)
3. **Select "In-Person" as the Session Type** (travel expense is only available for In-Person sessions)
4. The "Travel Expense (Optional)" dropdown will appear
5. Select the appropriate zone:
   - **Zone 1 - £10**: For nearby locations
   - **Zone 2 - £15**: For medium distance locations
   - **Zone 3 - £20**: For far locations
   - **No travel expense**: Leave blank or select "No travel expense"
6. **The quote will automatically update** to include the base session cost + travel expense cost
7. Click "Create Session"

**Example:**
- In-Person session (member, follow-up): £75
- Zone 2 travel expense: £15
- **Total quote: £90** (automatically calculated)

**Note:** If you change the session type from "In-Person" to any other type, the travel expense will be automatically cleared and the quote will be recalculated.

### Editing a Session's Travel Expense

1. Click on any session to open the session details
2. Click "Edit Session"
3. **Ensure the Session Type is "In-Person"** (travel expense is only available for In-Person sessions)
4. The "Travel Expense (Optional)" dropdown will appear
5. Change the zone or remove the travel expense
6. **The quote will automatically update** to reflect the new travel expense
7. Click "Save Changes"

**Example:**
- Original: In-Person session (£75) + Zone 1 (£10) = £85
- Change to Zone 3: In-Person session (£75) + Zone 3 (£20) = £95
- **Quote automatically updates to £95**

**Note:** If you change the session type from "In-Person" to any other type, the travel expense will be automatically cleared and the quote will be recalculated without the travel cost.

## Travel Expense Zones

| Zone | Cost | Description |
|------|------|-------------|
| Zone 1 | £10 | Nearby locations |
| Zone 2 | £15 | Medium distance locations |
| Zone 3 | £20 | Far locations |
| None | £0 | No travel expense |

## Webhook Integration

The travel expense data is automatically included in all session webhooks sent to Make.com:

### Webhook Payload

```json
{
  "sessionId": "...",
  "clientId": "...",
  "clientFirstName": "...",
  "clientLastName": "...",
  "clientEmail": "...",
  "sessionType": "...",
  "bookingDate": "...",
  "bookingTime": "...",
  "quote": 50,
  "travelExpense": "Zone 1",  // ← New field
  "membershipStatus": true,
  ...
}
```

### Webhooks Updated

The following webhooks now include `travelExpense`:

1. **Session Creation Webhook** (`triggerSessionWebhook`)
   - URL: `https://hook.eu1.make.com/lipggo8kcd8kwq2vp6j6mr3gnxbx12h7`
   - Triggered when: New session is created

2. **Booking Terms Webhook** (`triggerBookingTermsWebhookForUpdate`)
   - URL: `https://hook.eu1.make.com/yaoalfe77uqtw4xv9fbh5atf4okq14wm`
   - Triggered when: Session date/time is updated

3. **Session Update Webhook** (`triggerSessionWebhookForUpdate`)
   - URL: `https://hook.eu1.make.com/lipggo8kcd8kwq2vp6j6mr3gnxbx12h7`
   - Triggered when: Session is updated

4. **Daily Webhooks** (`/api/daily-webhooks`)
   - Scheduled webhooks for sessions 4 and 12 days ahead

5. **Combined Scheduled Webhooks** (`/api/scheduled-webhooks-combined`)
   - Combined cron job for scheduled webhooks

## Make.com Integration

To use the travel expense data in Make.com:

1. **Update your Make.com scenarios** to handle the new `travelExpense` field
2. **Add logic** to calculate total costs including travel expenses
3. **Include travel expense** in emails, invoices, or reports

### Example Make.com Logic

```javascript
// Calculate total cost including travel expense
let travelCost = 0;
if (travelExpense === 'Zone 1') travelCost = 10;
else if (travelExpense === 'Zone 2') travelCost = 15;
else if (travelExpense === 'Zone 3') travelCost = 20;

const totalCost = quote + travelCost;
```

## Data Structure

### TypeScript Type

```typescript
export interface Session {
  // ... other fields
  travelExpense?: 'Zone 1' | 'Zone 2' | 'Zone 3' | null;
}
```

### Database Column

```sql
travel_expense VARCHAR(10) NULL
CHECK (travel_expense IS NULL OR travel_expense IN ('Zone 1', 'Zone 2', 'Zone 3'))
```

## Testing

To test the travel expense feature:

1. ✅ Create a new session with Zone 1 travel expense
2. ✅ Verify the session is saved with the correct travel expense
3. ✅ Edit the session and change to Zone 2
4. ✅ Verify the update is saved correctly
5. ✅ Check Make.com webhook logs to confirm `travelExpense` is included
6. ✅ Create a session without travel expense (should be null)
7. ✅ Verify existing sessions without travel expense still work

## Troubleshooting

### Travel Expense Not Saving

1. Check that the migration was run successfully
2. Verify the column exists in the sessions table
3. Check browser console for errors

### Travel Expense Not in Webhooks

1. Check Make.com webhook logs
2. Verify the session has a travel expense set
3. Check that the webhook URL is correct

### Invalid Travel Expense Value

The database constraint only allows:
- `'Zone 1'`
- `'Zone 2'`
- `'Zone 3'`
- `NULL`

Any other value will be rejected by the database.

## Future Enhancements

- [ ] Add travel expense to session list view
- [ ] Include travel expense in finance calculations
- [ ] Add travel expense reports
- [ ] Allow custom travel expense amounts
- [ ] Add travel expense to session plan PDFs

