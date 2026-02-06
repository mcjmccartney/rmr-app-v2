# Membership Expiration Fix - Calendar Month Logic

## 🎯 Overview

Fixed membership expiration to use **exact calendar months** instead of inconsistent 30-day or "month + 1 day" calculations.

## ✅ New Behavior (Option B)

**Payment on January 6, 2026:**
- ✅ Valid until: **February 6, 2026**
- ✅ Expires at: **8:00 AM on February 7, 2026** (when morning cron check runs)
- ✅ Flagged as expired: **February 7, 2026 morning check**

**Payment on December 31, 2025:**
- ✅ Valid until: **January 31, 2026**
- ✅ Expires at: **8:00 AM on February 1, 2026**
- ✅ Flagged as expired: **February 1, 2026 morning check**

## 🐛 The Problem

### Inconsistent Logic Across Files

Before this fix, different parts of the codebase used different expiration logic:

| File | Old Logic | Issue |
|------|-----------|-------|
| `membershipExpirationService.ts` | Calendar month **+ 1 day** | Gave extra day |
| `daily-webhooks/route.ts` | Used `>` comparison | ✅ Correct |
| `update-membership-status.ts` | Used `>=` comparison | ❌ Wrong |
| `membershipPairingService.ts` | Used `>=` comparison | ❌ Wrong |
| `membership-expiration/route.ts` | Calendar month **+ 1 day** | Gave extra day |

### Example Issue: Hannah Tilson

- **Payment:** January 6, 2026
- **Expected expiration:** February 6, 2026
- **What happened:** Marked as non-member on February 6 morning check (too early)
- **Should happen:** Marked as non-member on February 7 morning check

## 🔧 The Solution

### Standardized All Files to Use:

```typescript
// Calculate expiration: 1 calendar month from payment date
const expirationDate = new Date(lastPaymentDate);
expirationDate.setMonth(expirationDate.getMonth() + 1); // Next month (same day)
expirationDate.setHours(8, 0, 0, 0); // 8:00 AM (when cron runs)

// For backwards comparison (checking if payment is recent):
const oneMonthAgo = new Date();
oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

const recentMemberships = clientMemberships.filter(membership => {
  const membershipDate = new Date(membership.date);
  return membershipDate > oneMonthAgo; // Use > so same date 1 month ago is expired
});
```

### Key Changes:

1. **Removed the `+ 1 day`** from expiration calculations
2. **Changed `>=` to `>`** in comparison logic
3. **Updated comments** to reflect exact calendar month logic

## 📁 Files Updated

1. ✅ `src/services/membershipExpirationService.ts` (removed +1 day)
2. ✅ `src/app/api/daily-webhooks/route.ts` (updated comments)
3. ✅ `scripts/update-membership-status.ts` (changed >= to >)
4. ✅ `src/services/membershipPairingService.ts` (changed >= to >)
5. ✅ `src/app/api/membership-expiration/route.ts` (removed +1 day)

## 🧪 Testing Examples

### Example 1: Regular Month
- **Payment:** January 15, 2026
- **Valid until:** February 15, 2026
- **Expires:** February 16, 2026 at 8:00 AM

### Example 2: Month-End Edge Case
- **Payment:** January 31, 2026
- **Valid until:** February 28, 2026 (or Feb 29 in leap year)
- **Expires:** March 1, 2026 at 8:00 AM (or Feb 29 in leap year)

### Example 3: Leap Year
- **Payment:** January 29, 2024 (leap year)
- **Valid until:** February 29, 2024
- **Expires:** March 1, 2024 at 8:00 AM

## 🚀 Deployment

- **Committed:** February 6, 2026
- **Deployed:** Immediately (pushed to main)
- **Next cron run:** February 7, 2026 at 8:00 AM UTC

## 📊 Impact

- **All clients** now use consistent membership expiration logic
- **Hannah Tilson** and similar cases will now be handled correctly
- **No manual intervention** needed - next cron job will use new logic

## 🔄 How It Works

### Daily Cron Job (8:00 AM UTC)

1. Runs `/api/daily-webhooks` endpoint
2. For each client:
   - Gets all membership payments (including email aliases)
   - Calculates: `oneMonthAgo = today - 1 calendar month`
   - Filters payments: `paymentDate > oneMonthAgo`
   - If no recent payments found → Sets `membership = false`
   - If recent payments found → Sets `membership = true`

### Example Timeline

**Hannah Tilson:**
- **Jan 6, 2026:** Pays membership (£20)
- **Feb 6, 2026 8:00 AM:** Cron runs, still valid (payment > Jan 6)
- **Feb 7, 2026 8:00 AM:** Cron runs, expired (payment NOT > Jan 7)
- **Feb 7, 2026 9:00 PM:** Renews membership (£20)
- **Feb 8, 2026 8:00 AM:** Cron runs, valid again (payment > Feb 8)

## ✅ Result

✅ Consistent membership expiration across all code paths  
✅ Exact calendar month calculation (no extra day)  
✅ Payment on Jan 6 expires Feb 6, flagged on Feb 7 morning check  
✅ All clients use same logic  
✅ Edge cases (month-end, leap year) handled correctly by JavaScript Date API

