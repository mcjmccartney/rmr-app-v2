# Setup Document URL Feature

## 1. Database Setup

Run this SQL in your Supabase SQL editor:

```sql
-- Add document_edit_url column to session_plans table
ALTER TABLE session_plans 
ADD COLUMN document_edit_url TEXT;

-- Add an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_session_plans_document_url 
ON session_plans(document_edit_url) 
WHERE document_edit_url IS NOT NULL;
```

## 2. Make.com Webhook Configuration

### Update your Make.com scenario to:

1. **Include sessionId in the webhook data** - The app now sends `sessionId` in the webhook payload
2. **Send document URL back to the app** - After creating the Google Doc, Make.com should send a POST request to:

```
POST https://your-domain.com/api/session-plan/document-url
Content-Type: application/json

{
  "sessionId": "the-session-id-from-webhook",
  "documentUrl": "https://docs.google.com/document/d/DOCUMENT_ID/edit",
  "sessionNumber": "1",
  "clientName": "John Doe",
  "dogName": "Buddy"
}
```

### Required fields:
- `sessionId` (required) - The session ID from the original webhook
- `documentUrl` (required) - The Google Doc edit URL

### Optional fields:
- `sessionNumber`, `clientName`, `dogName` - For logging/verification

## 3. How It Works

1. **User clicks "Generate Google Doc"**
   - App sends data to Make.com webhook (including `sessionId` and `callbackUrl`)
   - Button shows "Generating Document..."

2. **Make.com processes the request**
   - Creates Google Doc from template
   - Sends document URL back to the callback endpoint

3. **App receives document URL**
   - Stores URL in database (`session_plans.document_edit_url`)
   - Auto-opens the document for editing
   - Button changes to green "Edit Google Doc"

4. **Future visits**
   - If document URL exists, button shows "Edit Google Doc"
   - Clicking opens the existing document

## 4. API Endpoints

### POST /api/session-plan/document-url
- Receives document URL from Make.com
- Updates session plan with document URL

### GET /api/session-plan/document-url?sessionId=xxx
- Returns document URL for a session
- Used for polling if needed

## 5. Benefits

- ✅ **Auto-redirect** - Document opens automatically when ready
- ✅ **Persistent URLs** - Document URL saved in database
- ✅ **Smart button states** - Clear indication of status
- ✅ **No error popups** - Graceful error handling
- ✅ **Polling fallback** - Checks for document URL every 2 seconds
- ✅ **Future access** - Easy access to previously generated documents
