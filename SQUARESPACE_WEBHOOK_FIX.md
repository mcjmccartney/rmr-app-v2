# Squarespace Webhook Fix - January 21, 2026

## 🐛 Issue

When an existing client ordered a membership through Squarespace, the webhook would:
- ✅ Update the client's membership status
- ❌ **Fail to create the membership record**

This happened because the code tried to UPDATE a client record using `.eq('email', email)`, which would return an empty array if no client existed. The code then incorrectly assumed no client existed and tried to create a new one, but the logic was flawed.

### Example Case:
- **Emma Wolstencroft** (existing client) ordered membership on Jan 21, 2026
- Webhook received order from Squarespace
- Client record was updated (membership: true)
- **Membership record was NOT created** ❌
- Had to manually create membership record via Supabase REST API

---

## ✅ Fix

Simplified and fixed the client lookup and membership creation logic:

### New Flow:

1. **Find existing client:**
   - First check email aliases via `clientEmailAliasService.findClientByEmail()`
   - If not found, check direct email match via `SELECT` query
   - If found, store `foundClientId`

2. **Update or create client:**
   - **If client exists:** Update `membership: true` and `active: true`
   - **If client doesn't exist:** Create new client with membership data

3. **Always create membership record:**
   - Regardless of whether client existed or was created
   - This ensures every Squarespace order creates a membership payment record

### Code Changes:

**Before:**
```typescript
// Tried to UPDATE client that might not exist
const { data: directMatch } = await supabase
  .from('clients')
  .update({ membership: true })  // ❌ Returns empty array if no match
  .eq('email', email)
  .select();

if (directMatch && directMatch.length > 0) {
  // Client existed
} else {
  // Create new client
}
// Membership creation happened after this block
```

**After:**
```typescript
// First SELECT to check if client exists
const { data: directMatch } = await supabase
  .from('clients')
  .select('id, address')  // ✅ Check existence first
  .eq('email', email)
  .single();

if (directMatch) {
  foundClientId = directMatch.id;
  // Update existing client
} else {
  // Create new client
}

// ALWAYS create membership record (moved outside try-catch)
const { data: membership } = await supabase
  .from('memberships')
  .insert({ email, date, amount })
  .select();
```

---

## 🧪 Testing

### Test Case 1: Existing Client Orders Membership

**Setup:**
- Client exists: `test@example.com`
- Client has `membership: false`

**Expected Result:**
- ✅ Client updated: `membership: true`, `active: true`
- ✅ Membership record created with email, date, amount

### Test Case 2: New Customer Orders Membership

**Setup:**
- No client exists for `newcustomer@example.com`

**Expected Result:**
- ✅ New client created with name, email, postcode
- ✅ Client has `membership: true`, `active: true`
- ✅ Membership record created with email, date, amount

### Test Case 3: Client with Email Alias Orders Membership

**Setup:**
- Client exists with primary email `client@example.com`
- Email alias exists: `client+alias@example.com`
- Order comes from `client+alias@example.com`

**Expected Result:**
- ✅ Client found via email alias
- ✅ Client updated: `membership: true`, `active: true`
- ✅ Membership record created with `client+alias@example.com`

---

## 📝 Files Changed

- `src/app/api/squarespace/webhook/route.ts` - Fixed client lookup and membership creation logic

---

## 🔧 Manual Fix Applied

For Emma Wolstencroft's missed membership:

```bash
# Created membership record via Supabase REST API
curl -X POST "https://pfsbxbgvanifptpmobrr.supabase.co/rest/v1/memberships" \
  -H "Authorization: Bearer SERVICE_ROLE_KEY" \
  -d '{"email": "emma@thinkando.co.uk", "date": "2026-01-21", "amount": 8.00}'

# Updated client membership status
curl -X PATCH "https://pfsbxbgvanifptpmobrr.supabase.co/rest/v1/clients?email=eq.emma@thinkando.co.uk" \
  -H "Authorization: Bearer SERVICE_ROLE_KEY" \
  -d '{"membership": true, "active": true}'
```

---

## 🚀 Future Prevention

With this fix, all future Squarespace orders will:
1. ✅ Find or create the client
2. ✅ Update client membership status
3. ✅ **Always create the membership record**

No more missed membership records! 🎉

