# Fixing Duplicate Clients Created from Alias Emails

## Problem

Client records were created for email addresses that are actually **alias emails** linked to existing clients. This happened because:

1. A client exists with their primary email (e.g., `horatia@example.com`)
2. That email was added to the `client_email_aliases` table as an alias
3. A membership payment came in using that alias email
4. The system created a **new client record** instead of linking to the existing client

## Example

- **Primary Client:** Horatia Wellsted (`horatia.wellsted@gmail.com`)
- **Alias Email:** `horatia@example.com` (linked to Horatia Wellsted)
- **Problem:** A new client record was created for `horatia@example.com` instead of using the existing Horatia Wellsted record

## Solution

We've created tools to:
1. **Find** duplicate clients created from alias emails
2. **Merge** them into the primary client records
3. **Prevent** this from happening in the future

---

## Step 1: Find Duplicate Clients

### Option A: Using SQL (Recommended)

Run this query in your **Supabase SQL Editor**:

```bash
# Open the file
scripts/find-alias-duplicates.sql
```

This will show you:
- All duplicate client records
- Which primary client they should be merged into
- How many sessions/memberships each duplicate has

### Option B: Using TypeScript Script

```bash
npm run ts-node scripts/find-and-merge-alias-duplicates.ts --dry-run
```

---

## Step 2: Review the Duplicates

**IMPORTANT:** Carefully review the list of duplicates before merging!

For each duplicate, verify:
- ✅ The duplicate client is indeed the same person as the primary client
- ✅ The email is correctly linked in the `client_email_aliases` table
- ✅ You want to transfer all sessions/memberships to the primary client

---

## Step 3: Merge the Duplicates

### Option A: Using SQL (Fastest for multiple duplicates)

Run this script in your **Supabase SQL Editor**:

```bash
# Open the file
scripts/merge-alias-duplicates.sql
```

This will:
1. Transfer all sessions to the primary client
2. Transfer all memberships to the primary client
3. Transfer all forms (behavioural briefs, questionnaires)
4. Delete the duplicate client records
5. Show a summary of what was merged

### Option B: Using TypeScript Script

```bash
# Interactive mode (prompts for confirmation)
npm run ts-node scripts/find-and-merge-alias-duplicates.ts

# Auto-merge mode (no prompts - use with caution!)
npm run ts-node scripts/find-and-merge-alias-duplicates.ts --auto-merge
```

### Option C: Using the App UI

1. Go to `/duplicates` in your app
2. Click **"Scan for Duplicates"**
3. Find the duplicate clients in the list
4. Click **"Merge"** for each one
5. Review the merge preview
6. Confirm the merge

---

## Step 4: Verify the Merge

After merging, verify that:

1. **Duplicate clients are deleted:**
   ```sql
   SELECT COUNT(*) FROM clients WHERE email IN ('horatia@example.com', 'sarah@example.com');
   -- Should return 0 if those were alias emails
   ```

2. **Primary clients have all the data:**
   ```sql
   SELECT 
     c.first_name,
     c.last_name,
     c.email,
     (SELECT COUNT(*) FROM sessions WHERE client_id = c.id) as session_count,
     (SELECT COUNT(*) FROM memberships WHERE email = c.email) as membership_count
   FROM clients c
   WHERE c.first_name IN ('Horatia', 'Sarah');
   ```

3. **No duplicates remain:**
   ```sql
   -- Run find-alias-duplicates.sql again
   -- Should return 0 results
   ```

---

## Prevention (Already Implemented)

We've updated the system to prevent this from happening again:

### 1. ✅ Squarespace Webhook Enhanced
- **File:** `src/app/api/squarespace/webhook/route.ts`
- **Changes:**
  - Better logging to track alias lookups
  - Automatically sets up email aliases for new clients
  - Warns when creating new clients (to catch potential duplicates)

### 2. ✅ Manual Client Creation Protected
- **File:** `src/components/AddModal.tsx`
- **Changes:**
  - Checks if email exists as an alias before creating
  - Shows error message with existing client details
  - Prevents accidental duplicate creation

### 3. ✅ Form Submissions Already Protected
- **Files:** 
  - `src/app/api/behavioural-brief/route.ts`
  - `src/app/api/behaviour-questionnaire/route.ts`
- **Status:** Already check aliases before creating clients ✅

---

## For Horatia Wellsted and Sarah Cook Specifically

To merge these two specific duplicates:

```sql
-- Find the exact duplicates
SELECT * FROM clients 
WHERE (first_name = 'Horatia' AND last_name = 'Wellsted')
   OR (first_name = 'Sarah' AND last_name = 'Cook')
ORDER BY first_name, created_at;

-- Then run the merge script
-- scripts/merge-alias-duplicates.sql
```

Or use the app UI at `/duplicates` and search for "Horatia" and "Sarah".

---

## Questions?

If you encounter any issues:
1. Check the Supabase logs for errors
2. Verify the `client_email_aliases` table has the correct data
3. Run the find script again to see if duplicates remain
4. Contact support if you need help

---

## Summary

✅ **Prevention:** Updated all client creation points to check aliases  
✅ **Detection:** Created scripts to find duplicate clients  
✅ **Resolution:** Created scripts to merge duplicates safely  
✅ **Verification:** Added queries to verify the merge worked  

Your system is now protected against future duplicate client creation from alias emails!

