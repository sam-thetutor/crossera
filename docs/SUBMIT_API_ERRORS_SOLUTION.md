# Submit API Errors - Complete Diagnosis & Solution

## 🐛 Error Summary

You have **2 critical database errors** preventing the `/api/submit` endpoint from working:

### Error 1: PGRST202 - Missing Database Function
```
Error inserting new unique user: {
  code: 'PGRST202',
  message: 'Could not find the function public.insert_new_unique_user(...) in the schema cache'
}
```

### Error 2: PGRST204 - Missing Database Column
```
Database error: {
  code: 'PGRST204',
  message: "Could not find the 'fee_generated' column of 'transactions' in the schema cache"
}
```

---

## 🔍 Root Cause Analysis

### Error 1: Missing Database Functions

**Location**: `src/app/api/submit/route.ts:160` and `route.ts:180`

The submit API calls two database functions that **don't exist** in your database:
1. `insert_new_unique_user()` - Called at line 160
2. `update_existing_user_stats()` - Called at line 180

These functions are supposed to track unique users and their transaction statistics per project.

**Why it's missing**: These are custom PostgreSQL functions that need to be created separately. They're not created by default.

---

### Error 2: Missing 'fee_generated' Column

**Location**: `src/app/api/submit/route.ts:263`

The code tries to insert a transaction with a `fee_generated` field:

```typescript
const transactionInserts = registeredCampaigns.map((campaignId: number) => ({
  // ...other fields...
  fee_generated: feeGenerated.toString(),  // ❌ Column doesn't exist
  // ...
}));
```

**Why it's missing**: Your `transactions` table schema is incomplete and missing several columns required by the submit API.

---

## ✅ Complete Solution

### Step 1: Run the Database Migration

**File**: `docs/fix-submit-api-errors.sql`

This script will:
1. ✅ Add the missing `fee_generated` column to `transactions` table
2. ✅ Add other missing columns needed by submit API
3. ✅ Create `project_unique_users` table (if doesn't exist)
4. ✅ Create `project_user_stats` table (if doesn't exist)  
5. ✅ Create `insert_new_unique_user()` function
6. ✅ Create `update_existing_user_stats()` function
7. ✅ Add indexes for performance
8. ✅ Setup RLS policies
9. ✅ Verify everything was created successfully

**How to run**:
1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the entire `fix-submit-api-errors.sql` file
4. Click "Run"
5. Check the output for success messages

---

## 📋 What Each Function Does

### `insert_new_unique_user()`

**Called when**: A user makes their **first transaction** for a project

**What it does**:
1. Inserts a new record in `project_unique_users` table
2. Updates `project_user_stats` to increment unique user count
3. Tracks volume, fees, and rewards

### `update_existing_user_stats()`

**Called when**: A user makes **additional transactions** for a project (not their first)

**What it does**:
1. Updates the user's stats in `project_unique_users`
2. Updates the project's aggregate stats in `project_user_stats`
3. Increments transaction counters

---

## 🔗 Related Tables

### `transactions` Table
Stores every processed transaction with details:
- `fee_generated` - Gas fees from the transaction
- `app_id` - Which app the transaction belongs to
- `user_address` - Who made the transaction
- `is_unique_user` - Whether this was their first tx for this project
- `reward_calculated` - How much reward they earned

### `project_unique_users` Table
Tracks each unique user per project:
- How many transactions they've made
- Total volume/fees/rewards
- First and last transaction timestamps

### `project_user_stats` Table
Aggregated statistics per project:
- Total unique users count
- Total transactions by all users
- Total volume/fees/rewards across all users

---

## 🧪 Testing After Fix

After running the SQL migration, test the submit API:

1. **Send a test transaction** using the Test Playground
2. **Check the logs** - you should see:
   ```
   ✅ New unique user tracked: { projectId, userAddress, isNewUser: true }
   ✅ Transaction processed on-chain
   ✅ No database errors
   ```

3. **Verify database records**:
   - Check `transactions` table for new row
   - Check `project_unique_users` for user entry
   - Check `project_user_stats` for updated counts

---

## 📊 Expected Behavior After Fix

When submitting a transaction:

1. Transaction is verified on blockchain ✅
2. User tracking is recorded (new or existing) ✅
3. Transaction is processed on-chain ✅
4. Transaction is saved to database with `fee_generated` ✅
5. Unique user stats are updated ✅
6. Campaign metrics are calculated ✅
7. Response includes user tracking info ✅

---

## 🛡️ Prevention

To prevent similar issues:

1. **Always use the complete schema file** when setting up database
2. **Run migrations in order** - don't skip steps
3. **Verify all tables and functions exist** after migration
4. **Test API endpoints** after schema changes
5. **Keep docs/complete-database-schema.sql as source of truth**

---

## 📝 Summary

| Error | Type | Location | Fix |
|-------|------|----------|-----|
| PGRST202 | Missing Function | `insert_new_unique_user()` | Create function in SQL |
| PGRST202 | Missing Function | `update_existing_user_stats()` | Create function in SQL |
| PGRST204 | Missing Column | `transactions.fee_generated` | Add column via ALTER TABLE |

**Status**: ✅ Fix script created at `docs/fix-submit-api-errors.sql`

**Action Required**: Run the SQL script in Supabase SQL Editor

---

## 🎯 After Applying Fix

Your submit API will:
- ✅ Track unique users per project
- ✅ Store transaction details with fees
- ✅ Update user statistics automatically
- ✅ No more PGRST202 or PGRST204 errors
- ✅ Full user tracking analytics available

Run the fix now and your Test Playground will work perfectly! 🚀

