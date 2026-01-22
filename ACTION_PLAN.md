# Action Plan: Fix Membership Client Names

## 🎯 Objective
Get real customer names (e.g., "Paul Sherwood") instead of email-based names (e.g., "Paulsherwood154 Member") when membership payments create new clients.

## 📋 Status Overview

| Component | Status | Owner |
|-----------|--------|-------|
| RMR App Code | ✅ Complete | Development Team |
| Documentation | ✅ Complete | Development Team |
| Make.com Update | ⏳ Pending | Make.com Team |
| Testing | ⏳ Pending | Both Teams |
| Deployment | ⏳ Pending | Make.com Team |

## 🔧 What's Been Done (RMR App)

### Code Changes ✅
- [x] Enhanced webhook handler to accept name fields
- [x] Implemented 3-tier name priority system
- [x] Added comprehensive logging
- [x] Updated test endpoint
- [x] Deployed to production

### Documentation Created ✅
- [x] `MEMBERSHIP_NAME_FIX_SUMMARY.md` - Executive summary
- [x] `STRIPE_WEBHOOK_MAKECOM_SETUP.md` - Technical setup guide
- [x] `MAKECOM_QUICK_REFERENCE.md` - Quick reference
- [x] `REAL_WORLD_EXAMPLE.md` - Real-world example
- [x] `ACTION_PLAN.md` - This file

## 🎬 What Needs to Be Done (Make.com)

### Step 1: Access Make.com Scenario
1. Log into Make.com
2. Find the scenario that handles Stripe membership webhooks
3. Identify the current modules

### Step 2: Add "Get Customer" Module
1. After the Stripe webhook trigger, add a new module
2. Select: **Stripe > Get a Customer**
3. Configure:
   - **Customer ID:** `{{1.customer}}` (from webhook trigger)
   - This fetches the full customer object with name

### Step 3: Update HTTP Request Module
1. Find the HTTP request module that sends to RMR app
2. Update the JSON body to include:
   ```json
   {
     "email": "{{1.billing_details.email}}",
     "date": "{{formatDate(1.created; 'YYYY-MM-DDTHH:mm:ssZ')}}",
     "amount": "{{1.amount / 100}}",
     "postcode": "{{1.billing_details.address.postal_code}}",
     "name": "{{2.name}}"
   }
   ```
3. **Note:** Module numbers (1, 2) may vary - adjust based on your scenario

### Step 4: Test in Stripe Test Mode
1. Trigger a test charge in Stripe (test mode)
2. Check Make.com execution history
3. Verify:
   - Module 1: Charge received ✓
   - Module 2: Customer fetched with name ✓
   - Module 3: Name sent to RMR app ✓

### Step 5: Verify in RMR App
1. Check if test client was created
2. Verify name is correct (not parsed from email)
3. Check logs for `nameSource: 'webhook-full'`

### Step 6: Deploy to Production
1. Save the Make.com scenario
2. Activate the scenario
3. Monitor first few real payments

### Step 7: Monitor & Verify
1. Wait for next real membership payment
2. Check Make.com execution history
3. Verify client created in RMR app with correct name
4. Confirm no errors in logs

## 📊 Success Criteria

### Before Fix ❌
```
Payment from: paulsherwood154@hotmail.com
Client Created:
├─ First Name: "Paulsherwood154"
└─ Last Name: "Member"
```

### After Fix ✅
```
Payment from: paulsherwood154@hotmail.com
Customer Name: "Paul Sherwood"
Client Created:
├─ First Name: "Paul"
└─ Last Name: "Sherwood"
```

## 🧪 Testing Checklist

### Pre-Deployment Testing
- [ ] Make.com scenario updated with 3 modules
- [ ] Test charge triggered in Stripe test mode
- [ ] Make.com execution shows customer name fetched
- [ ] RMR app receives webhook with name field
- [ ] Test client created with correct name
- [ ] Logs show `nameSource: 'webhook-full'`

### Post-Deployment Monitoring
- [ ] First real payment processed successfully
- [ ] Client created with real name (not email-based)
- [ ] No errors in Make.com execution history
- [ ] No errors in RMR app logs
- [ ] Membership record created correctly

## 🚨 Troubleshooting Guide

### Issue: Customer name is empty in Make.com
**Cause:** Stripe customer doesn't have a name set  
**Solution:** 
- Check Stripe Dashboard > Customers
- Update customer name in Stripe
- Ensure Stripe Checkout collects name

### Issue: Webhook fails with 401 Unauthorized
**Cause:** Missing or incorrect API key  
**Solution:**
- Verify `x-api-key` header is set
- Get correct API key from environment variables
- Check for typos

### Issue: Client still created with email-based name
**Cause:** Name field not being sent or is empty  
**Solution:**
- Check Make.com execution history
- Verify `{{2.name}}` is populated
- Check for typos in field mapping

### Issue: Make.com scenario fails
**Cause:** Module configuration error  
**Solution:**
- Check module numbers ({{1.xxx}}, {{2.xxx}})
- Verify Stripe connection is active
- Test each module individually

## 📞 Support Contacts

### For Make.com Issues
- Review: `MAKECOM_QUICK_REFERENCE.md`
- Check: Make.com execution history
- Contact: Make.com support

### For RMR App Issues
- Review: `STRIPE_WEBHOOK_MAKECOM_SETUP.md`
- Check: Application logs
- Contact: Development team

## 📅 Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| RMR App Development | 2 hours | ✅ Complete |
| Documentation | 1 hour | ✅ Complete |
| Make.com Update | 30 mins | ⏳ Pending |
| Testing | 1 hour | ⏳ Pending |
| Deployment | 15 mins | ⏳ Pending |
| Monitoring | 1 week | ⏳ Pending |

**Estimated Total Time:** 30-60 minutes for Make.com team

## 🎉 Expected Benefits

Once complete, you'll see:
- ✅ Professional client names
- ✅ Easy customer identification
- ✅ Better data quality
- ✅ Improved user experience
- ✅ Automatic process (no manual intervention)

## 📝 Notes

- **Backward Compatible:** App still works if name is not provided
- **No Downtime:** Changes can be made without disrupting service
- **Easy Rollback:** Simply remove name field from Make.com if issues occur
- **Logged:** All name sources are logged for debugging

## ✅ Final Checklist

Before marking this complete:
- [ ] Make.com scenario updated
- [ ] Tested in Stripe test mode
- [ ] Deployed to production
- [ ] First real payment verified
- [ ] Documentation reviewed
- [ ] Team trained on new process
- [ ] Monitoring in place

---

**Last Updated:** 2026-01-19  
**Status:** Ready for Make.com Implementation

