# Squarespace Integration - Simplified Approach

## 🎉 Good News!

Your API key (`7a51a456-4ac3-40c7-80a9-380968b1e4ea`) **WORKS PERFECTLY** for reading orders!

I just tested it and successfully retrieved all your orders with real customer names:
- ✅ Katy Suckling
- ✅ Tracey Prosser  
- ✅ Rachael Spencer
- ✅ Paul Sherwood

## ❌ The Webhook Problem

Unfortunately, **creating webhooks via API requires OAuth**, which your Developer API Key doesn't support.

**Options:**
1. Create webhooks manually in Squarespace UI (if available in your plan)
2. Use the historical import + keep n8n for new orders
3. Run historical import periodically to catch new orders

---

## ✅ Recommended Solution: Historical Import

Since the historical import works perfectly, here's the best approach:

### Option 1: One-Time Import (Recommended)

**Fix all existing clients right now:**

```bash
./scripts/test-squarespace-import.sh
```

Choose option 3 to import ALL historical orders.

**Result:**
- All existing clients get real names
- `traceya71@hotmail.com` → `Tracey Heyworth`
- `rachaelspencer.rs@gmail.com` → `Rachael Spencer`
- `paulsherwood154@hotmail.com` → `Paul Sherwood`

**For new orders:**
- Keep using n8n (but it's already working)
- OR manually update new clients as needed

---

### Option 2: Periodic Import

Run the import script weekly/monthly to catch new orders:

```bash
# Add to cron or run manually
./scripts/test-squarespace-import.sh
```

This will:
- Import any new orders since last run
- Update existing clients
- Skip duplicates automatically

---

### Option 3: Manual Webhook Setup (If Available)

Check if your Squarespace plan has webhook UI:

1. Go to Squarespace Dashboard
2. Look for: **Settings** → **Advanced** → **Webhooks**
3. If you find it:
   - Create webhook for `order.create`
   - URL: `https://rmrcms.vercel.app/api/squarespace/webhook`
   - Copy the webhook secret
   - Add to Vercel environment variables

If you **don't** find webhook settings, your plan probably doesn't support them.

---

## 🚀 Quick Start: Import Historical Orders NOW

### Step 1: Preview What Will Be Imported

```bash
./scripts/test-squarespace-import.sh
```

Choose **option 1** (Dry run)

This will show you:
- How many clients will be created
- How many memberships will be created
- Preview of the data

### Step 2: Import Everything

```bash
./scripts/test-squarespace-import.sh
```

Choose **option 3** (Import ALL)

This will:
- Fetch all orders from Squarespace
- Create missing clients with real names
- Create membership records
- Update existing clients

### Step 3: Verify Results

1. Go to your RMR app
2. Check Clients page
3. Verify names are now real:
   - ✅ "Tracey Heyworth" (not "traceya71@hotmail.com")
   - ✅ "Rachael Spencer" (not "rachaelspencer.rs@gmail.com")

---

## 📊 What You'll Get

Based on the test, I can see you have **many orders** with complete customer data:

**Recent Orders (all have real names):**
- Katy Suckling - ME13 8YQ
- Tracey Prosser - CF45 3RB
- Suki Bergg - CT196DB
- Rachael Spencer - NG19 9BS
- Paul Sherwood - Me137JG
- Lara Sams - ME13 8SQ
- And many more...

All of these will be imported with their **real first and last names**!

---

## ⚠️ Important Notes

### About Webhooks

- **Developer API Keys** don't support webhook creation via API
- **OAuth tokens** are required for webhook management
- You may need to upgrade your Squarespace plan for webhook UI access
- OR contact Squarespace support to enable webhooks

### About n8n

- You can **keep using n8n** for new orders
- The historical import will fix existing clients
- n8n will continue to work for future orders

### About the Historical Import

- ✅ Works perfectly with your current API key
- ✅ Gets real customer names from Squarespace
- ✅ Handles duplicates automatically
- ✅ Can be run multiple times safely
- ✅ Batch processes for efficiency

---

## 🎯 My Recommendation

**Do this RIGHT NOW:**

1. Run the historical import to fix all existing clients
2. Keep n8n running for new orders (it's already working)
3. Optionally: Check if your Squarespace plan supports manual webhook creation

**This will immediately solve your problem** of clients having email-based names!

---

## 🚀 Ready to Import?

Run this command:

```bash
./scripts/test-squarespace-import.sh
```

Choose option 1 first (dry run), then option 3 (full import).

**Estimated time:** 2-5 minutes depending on how many orders you have.

---

## 📞 Questions?

- **"Will this break anything?"** No, it only creates/updates clients and memberships
- **"Can I run it multiple times?"** Yes, it skips duplicates
- **"What about new orders?"** Keep using n8n or run import periodically
- **"Do I need webhooks?"** No, the import works without webhooks

---

**Bottom line:** Your API key works great for importing historical data. Let's use that to fix your existing clients right now!

