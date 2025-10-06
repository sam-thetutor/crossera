# Error Analysis & Fixes

## 🔴 Error 1: PGRST116 - Project Not Found (updateBlockchainStatus)

### Error Details
```
Error updating blockchain status: {
  code: 'PGRST116',
  details: 'The result contains 0 rows',
  hint: null,
  message: 'Cannot coerce the result to a single JSON object'
}
```

**Stack Trace**: `projectService.ts:238` → `/api/projects/update-status`

### Root Cause
The registration flow in `src/app/register/page.tsx` was trying to **update the blockchain status** of a project that **doesn't exist in the database yet**.

**Incorrect Flow**:
1. User fills out form
2. Blockchain transaction is sent ✅
3. **Tries to update status to 'pending'** ❌ (project doesn't exist)
4. Wait for confirmation
5. **Tries to update status to 'confirmed'** ❌ (project still doesn't exist)

**Correct Flow**:
1. User fills out form
2. **Save project to database via `/api/projects/register`** ✅
3. Blockchain transaction is sent ✅
4. Update status to 'pending' ✅
5. Wait for confirmation
6. Update status to 'confirmed' ✅

### Fix Applied
✅ Added validation in `projectService.updateBlockchainStatus()` to check if project exists first:

```typescript
// First check if project exists
const { data: existingProject, error: checkError } = await supabaseAdmin
  .from('projects')
  .select('app_id')
  .eq('app_id', appId)
  .maybeSingle();

if (!existingProject) {
  throw new Error(`Project with app_id '${appId}' not found. Please create the project first.`);
}
```

### What You Need To Do
**Fix the registration flow in `src/app/register/page.tsx`**:

Add a step to save the project to the database BEFORE sending the blockchain transaction:

```typescript
const handleSubmit = async () => {
  try {
    // Step 1: Save project to database
    const saveResponse = await fetch('/api/projects/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    if (!saveResponse.ok) {
      throw new Error('Failed to save project to database');
    }
    
    // Step 2: Send blockchain transaction
    const tx = await contract.registerApp(...);
    setTxHash(tx.hash);
    
    // Step 3: Update status to pending
    await fetch('/api/projects/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: formData.app_id,
        tx_hash: tx.hash,
        status: 'pending'
      })
    });
    
    // Step 4: Wait for confirmation
    await tx.wait();
    
    // Step 5: Update status to confirmed
    await fetch('/api/projects/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: formData.app_id,
        tx_hash: tx.hash,
        status: 'confirmed'
      })
    });
  } catch (err) {
    console.error('Registration error:', err);
  }
};
```

---

## 🔴 Error 2: PGRST204 - Missing Database Column

### Error Details
```
Register app for campaign error: {
  code: 'PGRST204',
  details: null,
  hint: null,
  message: "Could not find the 'is_active' column of 'project_campaigns' in the schema cache"
}
```

**API Endpoint**: `POST /api/projects/o35pqzk2u7wg64k3eclh/campaigns`

### Root Cause
Your database's `project_campaigns` table is **missing required columns**:
- ❌ `is_active` column
- ❌ `registration_tx_hash` column

The code was trying to insert with `is_active: true`, but the column doesn't exist in your database.

### Schema Mismatch

**Expected Schema** (from code):
```sql
CREATE TABLE project_campaigns (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id),
    campaign_id INTEGER,
    registered_at TIMESTAMP,
    registration_tx_hash VARCHAR(66),    ← MISSING
    registration_fee VARCHAR(78),
    is_active BOOLEAN DEFAULT TRUE,      ← MISSING
    UNIQUE(project_id, campaign_id)
);
```

**Your Current Schema**:
```sql
CREATE TABLE project_campaigns (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id),
    campaign_id INTEGER,
    registration_fee VARCHAR(78),
    registered_at TIMESTAMP,
    UNIQUE(project_id, campaign_id)
);
```

### Fixes Applied

#### ✅ Fix 1: Database Migration Script
Created `docs/add-missing-columns-project-campaigns.sql` to add missing columns.

**Run this in Supabase SQL Editor**:
```sql
-- Add registration_tx_hash column
ALTER TABLE project_campaigns 
ADD COLUMN IF NOT EXISTS registration_tx_hash VARCHAR(66);

-- Add is_active column
ALTER TABLE project_campaigns 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Set default value for existing rows
UPDATE project_campaigns 
SET is_active = TRUE 
WHERE is_active IS NULL;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
```

#### ✅ Fix 2: Code Made Defensive
Updated API routes to not require `is_active` in insert statements:

**Files Changed**:
- `src/app/api/projects/[appId]/campaigns/route.ts`
- `src/app/api/projects/campaigns/route.ts`

The code now lets the database default handle `is_active` instead of explicitly setting it.

---

## 🎯 Action Items

### Immediate Actions

1. **Run the database migration**:
   - Open Supabase SQL Editor
   - Run `docs/add-missing-columns-project-campaigns.sql`
   - Verify columns were added successfully

2. **Fix the registration flow**:
   - Update `src/app/register/page.tsx`
   - Add database save step BEFORE blockchain transaction
   - Test the complete flow

### Testing Checklist

- [ ] Create a new project through the registration page
- [ ] Verify project is saved to database
- [ ] Verify blockchain transaction completes
- [ ] Verify status updates to 'confirmed'
- [ ] Register project for a campaign
- [ ] Verify campaign registration succeeds

---

## 📝 Root Cause Summary

Both errors stem from **database schema inconsistencies**:

1. **Error 1**: Application logic issue - trying to update a non-existent project
2. **Error 2**: Database schema issue - missing required columns

These issues occurred because:
- Different schema files were used at different times
- Database wasn't migrated when code was updated
- Schema cache wasn't refreshed after manual changes

---

## 🛡️ Prevention

To prevent similar issues:

1. ✅ Always use `supabaseAdmin` for server-side operations (already fixed)
2. ✅ Add existence checks before updates (already fixed)
3. ⚠️ Keep schema files in sync with actual database
4. ⚠️ Use migration scripts for schema changes
5. ⚠️ Test registration flow end-to-end before production

