# Database Index Setup Guide

## 🎯 Quick Start (5 Minutes)

This guide will help you verify and apply database indexes for maximum performance.

---

## Step 1: Verify Current Indexes

1. **Open Supabase Dashboard**
   - Go to https://supabase.com
   - Select your project
   - Click "SQL Editor" in the left sidebar

2. **Run Verification Script**
   - Click "New Query"
   - Copy the contents of `scripts/verify-database-indexes.sql`
   - Paste into the SQL Editor
   - Click "Run" or press `Ctrl+Enter`

3. **Check Results**
   - Look for the "Missing Indexes" section
   - Any row with "❌ MISSING" needs to be created
   - Rows with "✅ EXISTS" are already optimized

---

## Step 2: Apply Missing Indexes (If Any)

If you see any "❌ MISSING" indexes:

1. **Open New Query**
   - Click "New Query" in Supabase SQL Editor

2. **Run Index Creation Script**
   - Copy the contents of `supabase-indexes.sql`
   - Paste into the SQL Editor
   - Click "Run" or press `Ctrl+Enter`

3. **Wait for Completion**
   - Should take 10-30 seconds depending on data size
   - You'll see "Success" messages for each index created

4. **Verify Again**
   - Re-run `scripts/verify-database-indexes.sql`
   - All indexes should now show "✅ EXISTS"

---

## Step 3: Analyze Tables (Optional but Recommended)

After creating indexes, update table statistics:

```sql
ANALYZE clients;
ANALYZE sessions;
ANALYZE memberships;
ANALYZE client_email_aliases;
ANALYZE behaviour_questionnaires;
ANALYZE behavioural_briefs;
ANALYZE booking_terms;
ANALYZE action_points;
ANALYZE session_participants;
ANALYZE session_plans;
```

This helps PostgreSQL's query planner make better decisions.

---

## Expected Performance Improvements

### Before Indexes
- Calendar load: 2-3 seconds
- Client search: 500-1000ms
- Session queries: 300-500ms

### After Indexes
- Calendar load: 500ms-1s (**60-70% faster**)
- Client search: 100-200ms (**80% faster**)
- Session queries: 50-100ms (**80-90% faster**)

---

## Troubleshooting

### "Index already exists" Error
- **Cause:** Index was already created
- **Solution:** This is fine! Skip to next index

### "Permission denied" Error
- **Cause:** Insufficient database permissions
- **Solution:** Make sure you're logged in as the project owner

### "Relation does not exist" Error
- **Cause:** Table hasn't been created yet
- **Solution:** Run the table creation scripts first (e.g., `supabase-schema.sql`)

---

## Maintenance

### When to Re-run
- After adding 1000+ new records
- Monthly (to update statistics)
- After major schema changes

### How to Monitor Performance
```sql
-- Check slow queries
SELECT 
    query,
    calls,
    total_time,
    mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

---

## Quick Reference

### Files
- `scripts/verify-database-indexes.sql` - Check which indexes exist
- `supabase-indexes.sql` - Create all indexes
- `PERFORMANCE_IMPROVEMENTS_APPLIED.md` - Full optimization guide

### Commands
```sql
-- List all indexes
SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public';

-- Check table sizes
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Update statistics
ANALYZE;
```

---

## ✅ Checklist

- [ ] Run `verify-database-indexes.sql` in Supabase
- [ ] Check for "❌ MISSING" indexes
- [ ] Run `supabase-indexes.sql` if needed
- [ ] Verify all indexes show "✅ EXISTS"
- [ ] Run `ANALYZE` on all tables
- [ ] Test app performance (should feel noticeably faster)

---

## Need Help?

If you encounter issues:
1. Check the Supabase logs for error details
2. Verify you have the correct permissions
3. Make sure all tables exist before creating indexes
4. Contact support if errors persist

---

## Next Steps After Indexes

Once indexes are applied, consider:
1. ✅ Virtual scrolling for large lists (if 100+ clients)
2. ✅ Optimize AppContext data loading
3. ✅ Add image lazy loading
4. ✅ Monitor performance with Chrome DevTools

See `PERFORMANCE_IMPROVEMENTS_APPLIED.md` for full roadmap.

