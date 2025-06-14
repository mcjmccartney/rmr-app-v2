# Payment Confirmation System Setup

This document explains how to set up and use the payment confirmation system for tracking Monzo payments.

## Overview

The payment system allows you to:
- Generate payment links with session IDs
- Track payment status for each session
- Automatically confirm payments when clients visit confirmation URLs
- Display payment status in the session UI

## Database Setup

1. **Run the SQL migration** to add payment fields to your sessions table:
   ```sql
   -- Run this in your Supabase SQL Editor
   ALTER TABLE sessions 
   ADD COLUMN IF NOT EXISTS session_paid BOOLEAN DEFAULT false,
   ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMP WITH TIME ZONE;
   ```

2. **Create indexes** for better performance:
   ```sql
   CREATE INDEX IF NOT EXISTS idx_sessions_paid ON sessions(session_paid);
   CREATE INDEX IF NOT EXISTS idx_sessions_payment_confirmed ON sessions(payment_confirmed_at);
   ```

## Monzo Payment Links Configuration

1. **Update your Monzo payment links** in `src/services/paymentService.ts`:
   ```typescript
   const PAYMENT_CONFIG: PaymentLinkConfig = {
     memberMonzoLink: 'https://monzo.me/your-actual-member-link',
     nonMemberMonzoLink: 'https://monzo.me/your-actual-non-member-link',
     appBaseUrl: 'https://your-actual-app-domain.com'
   };
   ```

2. **Set environment variable** (optional):
   ```bash
   NEXT_PUBLIC_APP_URL=https://your-app-domain.com
   ```

## How It Works

### 1. Generate Payment Links
- In the session modal, click "Copy Payment Link" or "Copy Instructions"
- The system generates a Monzo payment link with:
  - Correct amount (member vs non-member pricing)
  - Session description with ID
  - Redirect URL to confirmation page

### 2. Client Payment Flow
1. Client receives payment link via email/text
2. Client clicks link and pays through Monzo
3. After payment, Monzo redirects to: `https://yourapp.com/payment-confirmed/[SESSION_ID]`
4. Confirmation page automatically marks session as paid
5. Client sees confirmation message

### 3. Payment Tracking
- Sessions show payment status (Paid/Pending) with colored indicators
- Session modal displays payment status and confirmation date
- Manual "Mark as Paid" option for cash/other payments

## Usage Instructions

### For New Sessions
1. Create session in the app
2. Open session modal
3. Click "Copy Payment Instructions" 
4. Send the copied text to client via email/WhatsApp
5. Client pays and visits confirmation link
6. Session automatically marked as paid

### For Existing Sessions
1. Open session modal
2. If unpaid, you'll see payment buttons
3. Use "Copy Payment Link" for just the URL
4. Use "Copy Instructions" for full email template
5. Use "Mark as Paid" for manual confirmation

### Payment Link Format
The generated Monzo links include:
- `amount`: Session quote in pence (£75.00 = 7500)
- `description`: "RMR-SessionType-SessionID"
- `redirect_url`: Confirmation page URL

### Example Payment Link
```
https://monzo.me/your-link?amount=7500&description=RMR-In-Person-abc12345&redirect_url=https://yourapp.com/payment-confirmed/abc12345-def6-7890-ghij-klmnopqrstuv
```

## Troubleshooting

### Payment Not Confirmed
- Check if client visited the confirmation URL
- Manually mark as paid using "Mark as Paid" button
- Verify the session ID in the URL matches

### Link Generation Issues
- Ensure Monzo links are correctly configured
- Check that client information exists
- Verify app base URL is correct

### Client Can't Access Confirmation Page
- Ensure the confirmation URL is publicly accessible
- Check that the session ID is valid
- Verify no authentication is required for the confirmation page

## Security Notes

- Confirmation pages are publicly accessible (no auth required)
- Session IDs are UUIDs (hard to guess)
- Only marks sessions as paid (no sensitive operations)
- No payment processing happens in the app (Monzo handles payments)

## Future Enhancements

Possible improvements:
- Email notifications when payments are confirmed
- Payment reminders for overdue sessions
- Integration with accounting software
- Bulk payment link generation
- Payment analytics and reporting
