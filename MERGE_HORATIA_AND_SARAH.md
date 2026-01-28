# Quick Guide: Merge Horatia Wellsted and Sarah Cook Duplicates

## What Happened

On **January 27, 2026**, membership payments came in for Horatia Wellsted and Sarah Cook using **alias emails**. Instead of linking to their existing client records, the system created **new duplicate client records**.

## What We've Fixed

✅ **Prevention:** The system now checks email aliases before creating clients  
✅ **Detection:** Created scripts to find these duplicates  
✅ **Resolution:** Created scripts to merge them safely  

---

## How to Merge the Duplicates (3 Options)

### Option 1: Using the App UI (Easiest)

1. **Open your app** and go to: `/duplicates`
2. **Click "Scan for Duplicates"**
3. **Find Horatia Wellsted** in the list
   - Click **"Merge"**
   - Review the preview
   - Click **"Confirm Merge"**
4. **Find Sarah Cook** in the list
   - Click **"Merge"**
   - Review the preview
   - Click **"Confirm Merge"**
5. **Done!** ✅

---

### Option 2: Using SQL (Fastest)

1. **Open Supabase SQL Editor**
2. **First, find the duplicates:**
   ```sql
   -- Copy and paste from: scripts/find-alias-duplicates.sql
   ```
3. **Review the results** - make sure they're correct
4. **Then merge them:**
   ```sql
   -- Copy and paste from: scripts/merge-alias-duplicates.sql
   ```
5. **Done!** ✅

---

### Option 3: Using TypeScript Script

1. **Open your terminal** in the project directory
2. **First, see what will be merged:**
   ```bash
   npm run ts-node scripts/find-and-merge-alias-duplicates.ts --dry-run
   ```
3. **Review the output** - make sure it looks correct
4. **Then merge them:**
   ```bash
   npm run ts-node scripts/find-and-merge-alias-duplicates.ts
   ```
5. **Confirm when prompted** (type `y` and press Enter)
6. **Done!** ✅

---

## What the Merge Does

For each duplicate client, the script will:

1. ✅ **Transfer all sessions** to the primary client
2. ✅ **Transfer all memberships** to the primary client
3. ✅ **Transfer all forms** (behavioural briefs, questionnaires)
4. ✅ **Set up email aliases** properly
5. ✅ **Delete the duplicate client** record

---

## Verify the Merge Worked

After merging, check:

### 1. Duplicate clients are gone
```sql
SELECT COUNT(*) as duplicate_count
FROM clients c
INNER JOIN client_email_aliases cea ON c.email = cea.email
WHERE c.id != cea.client_id;
-- Should return 0
```

### 2. Primary clients have all the data
```sql
SELECT 
  c.first_name,
  c.last_name,
  c.email,
  (SELECT COUNT(*) FROM sessions WHERE client_id = c.id) as sessions,
  (SELECT COUNT(*) FROM memberships WHERE email = c.email) as memberships
FROM clients c
WHERE c.first_name IN ('Horatia', 'Sarah')
  AND c.last_name IN ('Wellsted', 'Cook');
```

---

## What If Something Goes Wrong?

Don't worry! The merge is safe:

- ✅ **No data is lost** - everything is transferred to the primary client
- ✅ **You can verify** before and after the merge
- ✅ **Supabase has backups** if you need to restore

If you're unsure:
1. Use **Option 1 (App UI)** - it shows a preview before merging
2. Or use **--dry-run** mode to see what will happen without making changes

---

## Need Help?

See the full documentation: `scripts/ALIAS_DUPLICATES_README.md`

---

## Summary

**Problem:** Duplicate clients created for Horatia Wellsted and Sarah Cook  
**Cause:** Membership payments used alias emails  
**Solution:** Merge duplicates into primary clients  
**Prevention:** System now checks aliases before creating clients ✅  

**Recommended:** Use **Option 1 (App UI)** - it's the easiest and safest!

