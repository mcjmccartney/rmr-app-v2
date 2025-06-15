# Google Calendar Integration Setup

This guide will help you set up direct Google Calendar integration to automatically create and delete calendar events when sessions are created or deleted.

## 1. Create a Google Service Account

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Calendar API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click on it and press "Enable"

4. Create a Service Account:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Fill in the service account details
   - Click "Create and Continue"
   - Skip the optional steps and click "Done"

5. Generate a Private Key:
   - Click on your newly created service account
   - Go to the "Keys" tab
   - Click "Add Key" > "Create New Key"
   - Choose "JSON" format
   - Download the JSON file (keep it secure!)

## 2. Share Your Google Calendar

1. Open Google Calendar
2. Find the calendar you want to use for sessions
3. Click the three dots next to the calendar name
4. Select "Settings and sharing"
5. In the "Share with specific people" section:
   - Click "Add people"
   - Enter your service account email (from the JSON file: `client_email`)
   - Set permission to "Make changes to events"
   - Click "Send"

## 3. Get Your Calendar ID

1. In the same "Settings and sharing" page
2. Scroll down to "Calendar ID"
3. Copy the Calendar ID (it looks like: `your-email@gmail.com` or `random-string@group.calendar.google.com`)

## 4. Configure Environment Variables

Add these to your `.env.local` file:

```env
# Google Calendar API Configuration
GOOGLE_CALENDAR_ID=your_calendar_id_here
GOOGLE_CLIENT_EMAIL=your_service_account_email_from_json_file
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
your_private_key_from_json_file_here
-----END PRIVATE KEY-----"
```

**Important Notes:**
- The `GOOGLE_CLIENT_EMAIL` is the `client_email` field from your JSON file
- The `GOOGLE_PRIVATE_KEY` is the `private_key` field from your JSON file
- Keep the quotes around the private key and preserve the line breaks
- Never commit your `.env.local` file to version control

## 5. Deploy to Vercel

1. In your Vercel dashboard, go to your project settings
2. Go to "Environment Variables"
3. Add the three Google Calendar variables:
   - `GOOGLE_CALENDAR_ID`
   - `GOOGLE_CLIENT_EMAIL` 
   - `GOOGLE_PRIVATE_KEY`

**For the private key in Vercel:**
- Copy the entire private key including the BEGIN/END lines
- Replace all actual line breaks with `\n`
- The value should look like: `-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----`

## 6. Test the Integration

1. Create a new session in your app
2. Check your Google Calendar - you should see the event appear
3. Delete the session - the calendar event should be removed

## 7. How It Works

### Session Creation:
1. User creates a session in the app
2. Session is saved to Supabase
3. App calls Google Calendar API to create calendar event
4. Event ID is stored in the session record
5. Make.com webhooks still trigger for other integrations

### Session Deletion:
1. User deletes a session
2. App calls Google Calendar API to delete the event (using stored Event ID)
3. Session is deleted from Supabase

## 8. Troubleshooting

### Common Issues:

**"Calendar not found" error:**
- Check that your Calendar ID is correct
- Ensure the service account has access to the calendar

**"Forbidden" error:**
- Make sure you shared the calendar with your service account email
- Check that the service account has "Make changes to events" permission

**"Invalid credentials" error:**
- Verify your private key is correctly formatted
- Check that the client email matches your service account

**Events not appearing:**
- Check the timezone settings in the code (currently set to 'Europe/London')
- Verify the date/time format is correct

### Debug Mode:
Check your Vercel function logs or local console for detailed error messages.

## 9. Benefits of Direct Integration

✅ **Faster**: No dependency on Make.com for calendar operations
✅ **More reliable**: Direct API calls with better error handling  
✅ **Cost effective**: No Make.com operations used for calendar management
✅ **Better control**: Full control over calendar event formatting and timing
✅ **Immediate feedback**: Instant success/failure feedback
