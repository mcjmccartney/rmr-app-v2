# 🚀 Squarespace Integration - START HERE

## 👋 Welcome!

Your Squarespace integration is **ready to set up**! This will replace your n8n workflow and give you **real customer names** instead of email-based names.

---

## 🎯 What You'll Get

### Before
```
❌ tracey.heyworth71@gmail.com
❌ Paulsherwood154 Member
```

### After
```
✅ Tracey Heyworth
✅ Paul Sherwood
```

---

## ⚡ Quick Setup (10 Minutes)

### 1️⃣ Create Webhook (2 minutes)

Open your terminal and run:

```bash
./scripts/setup-squarespace-webhook.sh
```

**This will:**
- Create a webhook subscription in Squarespace
- Give you a webhook secret
- Tell you exactly what to do next

**Save the webhook secret!** You'll need it in step 2.

---

### 2️⃣ Add Secret to Vercel (3 minutes)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Click **"Add New"**
5. Name: `SQUARESPACE_WEBHOOK_SECRET`
6. Value: (paste the secret from step 1)
7. Environment: Select **all** (Production, Preview, Development)
8. Click **"Save"**
9. **Redeploy** your app

---

### 3️⃣ Test with Real Order (2 minutes)

1. Create a test order in Squarespace
2. Go to Vercel → Your Project → **Logs**
3. Look for:
   ```
   [SQUARESPACE] Webhook received
   [SQUARESPACE] Successfully created new client
   ```
4. Check your RMR app - new client should have real name!

---

### 4️⃣ Import Historical Orders (3 minutes)

**First, get your WEBHOOK_API_KEY:**
1. Go to Vercel → Settings → Environment Variables
2. Find `WEBHOOK_API_KEY` and copy its value
3. Add to `.env.local`:
   ```bash
   WEBHOOK_API_KEY=your_key_here
   ```

**Then run the import:**

```bash
./scripts/test-squarespace-import.sh
```

Choose:
- **Option 1** first (dry run - preview only)
- **Option 3** to import all historical orders

---

### 5️⃣ Disable n8n (After 1 Week)

Once everything is working for a week:
1. Disable your n8n workflow
2. Monitor for another week
3. Delete n8n workflow if all is well

---

## 📚 Documentation

- **[SQUARESPACE_SETUP_CHECKLIST.md](./SQUARESPACE_SETUP_CHECKLIST.md)** ← Use this to track your progress
- **[SQUARESPACE_QUICK_START.md](./SQUARESPACE_QUICK_START.md)** ← Quick reference guide
- **[SQUARESPACE_SETUP_GUIDE.md](./SQUARESPACE_SETUP_GUIDE.md)** ← Complete detailed guide
- **[SQUARESPACE_README.md](./SQUARESPACE_README.md)** ← Overview and architecture

---

## 🔧 What's Been Built

### API Endpoints
- ✅ `/api/squarespace/webhook` - Receives order.create webhooks
- ✅ `/api/squarespace/import-historical` - Imports past orders

### Scripts
- ✅ `setup-squarespace-webhook.sh` - Creates webhook subscription
- ✅ `test-squarespace-webhook.sh` - Tests webhook endpoint
- ✅ `test-squarespace-import.sh` - Imports historical orders

### Environment Variables
- ✅ `SQUARESPACE_API_KEY` - Already configured
- ⏳ `SQUARESPACE_WEBHOOK_SECRET` - You need to add this (from step 1)

---

## 🎯 Your Next Steps

1. **Right now:** Run `./scripts/setup-squarespace-webhook.sh`
2. **Then:** Add webhook secret to Vercel
3. **Then:** Test with a real order
4. **Then:** Import historical orders
5. **After 1 week:** Disable n8n

---

## 🆘 Need Help?

### Webhook not working?
Check [SQUARESPACE_SETUP_GUIDE.md](./SQUARESPACE_SETUP_GUIDE.md) → Troubleshooting section

### Import failing?
Make sure `WEBHOOK_API_KEY` is in `.env.local`

### Still seeing email-based names?
Verify webhook secret is set correctly in Vercel

---

## ✅ Success Checklist

Use [SQUARESPACE_SETUP_CHECKLIST.md](./SQUARESPACE_SETUP_CHECKLIST.md) to track your progress.

Quick check:
- [ ] Webhook subscription created
- [ ] Webhook secret added to Vercel
- [ ] Test order processed successfully
- [ ] Historical orders imported
- [ ] Clients have real names

---

## 🎉 Benefits

✅ Real customer names from Squarespace  
✅ No more email parsing  
✅ Simpler architecture (no n8n)  
✅ More reliable  
✅ Historical import capability  
✅ Better data quality  

---

## 🚀 Ready to Start?

**Run this command now:**

```bash
./scripts/setup-squarespace-webhook.sh
```

Then follow the instructions it gives you!

---

**Questions?** Check the documentation files listed above.  
**Stuck?** See the troubleshooting section in [SQUARESPACE_SETUP_GUIDE.md](./SQUARESPACE_SETUP_GUIDE.md)

---

**Good luck! 🎉**

