# Database Reset Guide

## 🔄 How to Reset the Database

Follow these steps to completely reset your database and start fresh.

---

## ⚠️ WARNING

**This will delete ALL data:**
- ❌ All projects
- ❌ All campaigns
- ❌ All app registrations
- ❌ All transaction records

**This will NOT affect:**
- ✅ On-chain data (smart contract state)
- ✅ Your wallet
- ✅ Deployed contracts

---

## 📋 Step-by-Step Instructions

### **Step 1: Open Supabase SQL Editor**

1. Go to: https://supabase.com/dashboard/project/kbayyomluildnyywnwvs
2. Click **SQL Editor** in the left sidebar
3. Click **New query** button

### **Step 2: Copy the Reset Script**

Open the file: `reset-database.sql`

Or copy this:

```sql
-- =====================================================
-- RESET DATABASE - Clear all data
-- =====================================================

BEGIN;

-- Disable triggers temporarily
SET session_replication_role = replica;

-- Delete all data
TRUNCATE TABLE transactions CASCADE;
TRUNCATE TABLE project_campaigns CASCADE;
TRUNCATE TABLE campaigns CASCADE;
TRUNCATE TABLE projects CASCADE;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

COMMIT;

-- Verify all tables are empty
SELECT 'projects' as table_name, COUNT(*) as count FROM projects
UNION ALL
SELECT 'campaigns', COUNT(*) FROM campaigns
UNION ALL
SELECT 'project_campaigns', COUNT(*) FROM project_campaigns
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions;

-- Show summary
SELECT 
  '✅ Database reset complete!' as status,
  'All tables cleared. Ready for fresh data!' as message;
```

### **Step 3: Paste and Run**

1. Paste the script into the SQL Editor
2. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`)
3. Wait for confirmation

### **Step 4: Verify Reset**

You should see output like:

```
table_name          | count
--------------------|------
projects            | 0
campaigns           | 0
project_campaigns   | 0
transactions        | 0

status                          | message
--------------------------------|----------------------------------
✅ Database reset complete!     | All tables cleared. Ready for fresh data!
```

---

## 🎯 What Gets Deleted

### **Projects Table**
- All registered projects
- Project metadata (name, description, logo, etc.)
- Developer information

### **Campaigns Table**
- All campaign data
- Campaign metadata (title, description, rules, etc.)
- Campaign settings and budgets

### **Project_Campaigns Table**
- All app registrations to campaigns
- Registration metadata

### **Transactions Table**
- All processed transaction records
- Transaction metrics
- Process transaction hashes

---

## 🔗 On-Chain Data Status

**Important:** The database reset does **NOT** affect on-chain data!

**On-chain data remains:**
- ✅ Registered apps (`appOwners`, `registeredApps`)
- ✅ Campaign data (`campaigns` mapping)
- ✅ App registrations (`appCampaignRegistrations`)
- ✅ Accumulated metrics (`appCampaignFees`, `appCampaignVolume`)
- ✅ Processed transactions (`processedTransactions`)

**To fully reset everything, you would need to:**
1. Reset database (this script)
2. Deploy a fresh contract (redeploy smart contract)

---

## 🔄 After Reset

### **What to Do Next:**

1. **Register Projects Again**
   - Go to `/register`
   - Create projects with the same or new app IDs
   - They will be saved to database AND blockchain

2. **Create Campaigns**
   - Go to `/campaigns/create`
   - Set up new campaigns
   - Fund them with XFI

3. **Register Apps to Campaigns**
   - Visit campaign detail pages
   - Click "Register Your App"
   - Select your projects

4. **Test Transactions**
   - Use playground to send test transactions
   - Verify and submit for rewards

---

## 🛠️ Troubleshooting

### **Error: "relation does not exist"**

**Cause:** The table hasn't been created yet.

**Solution:** Run the table creation scripts first:
1. `supabase-projects-schema.sql`
2. `supabase-campaigns-schema.sql`
3. `supabase-transactions-schema.sql`

### **Error: "permission denied"**

**Cause:** You don't have admin access.

**Solution:** 
- Make sure you're logged into Supabase
- Use the SQL Editor (not a direct database connection)
- Contact your database admin if you're not the owner

### **Nothing Happens**

**Cause:** The query might not have executed.

**Solution:**
- Make sure you clicked "Run"
- Check for error messages in the SQL Editor
- Try refreshing the page and running again

---

## 📊 Quick Check: Is My Database Empty?

Run this query to check:

```sql
SELECT 
  (SELECT COUNT(*) FROM projects) as projects_count,
  (SELECT COUNT(*) FROM campaigns) as campaigns_count,
  (SELECT COUNT(*) FROM project_campaigns) as registrations_count,
  (SELECT COUNT(*) FROM transactions) as transactions_count;
```

**Expected after reset:**
```
projects_count | campaigns_count | registrations_count | transactions_count
---------------|-----------------|---------------------|-------------------
0              | 0               | 0                   | 0
```

---

## 🔐 Safety Tips

**Before resetting:**
- ✅ Make sure you want to delete all data
- ✅ Export important data if needed
- ✅ Take screenshots of current state

**Good practices:**
- 🔄 Reset during development/testing only
- 📝 Document why you're resetting
- 💾 Keep backups of production data

---

## 🚀 Alternative: Selective Deletion

If you only want to delete specific data:

**Delete one project:**
```sql
DELETE FROM projects WHERE app_id = 'your-app-id';
```

**Delete one campaign:**
```sql
DELETE FROM campaigns WHERE campaign_id = 1;
```

**Delete all transactions:**
```sql
TRUNCATE TABLE transactions;
```

**Delete all campaigns but keep projects:**
```sql
TRUNCATE TABLE project_campaigns CASCADE;
TRUNCATE TABLE campaigns CASCADE;
```

---

## 📝 Summary

1. Open Supabase SQL Editor
2. Copy and paste `reset-database.sql`
3. Click **Run**
4. Verify all counts are 0
5. Start fresh with new data!

**File:** `reset-database.sql` (in your project root)
**Dashboard:** https://supabase.com/dashboard/project/kbayyomluildnyywnwvs/editor

---

**Ready to reset? Follow the steps above!** 🔄

