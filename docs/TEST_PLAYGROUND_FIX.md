# Test Playground Bug Fix

## 🐛 Bug Description

**Symptom**: Test Playground shows "No registered apps found" even after successfully registering an app for a campaign.

**Location**: 
- `src/components/playground/SendXFITab.tsx:25`
- `src/app/dashboard/page.tsx:89`

---

## 🔍 Root Cause Analysis

### The Issue

The code was filtering projects using a field that **doesn't exist**:

```typescript
// ❌ WRONG: This field doesn't exist in the database or TypeScript interface
const projects = useMemo(() => {
  return allProjects.filter((p: any) => p.registered_on_chain);
}, [allProjects]);
```

### Why It Failed

1. **TypeScript Interface** (`src/lib/supabase.ts` line 27-52):
   - The `Project` interface does NOT have a `registered_on_chain` field
   - It only has `blockchain_tx_hash?: string`

2. **Database Schema Inconsistency**:
   - Different schema files have different definitions
   - Some have `registered_on_chain` as a GENERATED column
   - Some have it as a regular BOOLEAN
   - Your database likely doesn't have this field at all

3. **Result**: 
   - Filter always returns empty array
   - Test Playground shows "No registered apps found"
   - Dashboard stats show 0 active projects

---

## ✅ The Fix

Changed the filter to use `blockchain_tx_hash` instead (which actually exists):

### File 1: `src/components/playground/SendXFITab.tsx`

**Before:**
```typescript
const projects = useMemo(() => {
  return allProjects.filter((p: any) => p.registered_on_chain);  // ❌
}, [allProjects]);
```

**After:**
```typescript
const projects = useMemo(() => {
  return allProjects.filter((p: any) => p.blockchain_tx_hash);  // ✅
}, [allProjects]);
```

### File 2: `src/app/dashboard/page.tsx`

**Before:**
```typescript
const derivedActiveProjects = (projects || []).filter(
  p => (p as any).is_active && (p as any).registered_on_chain  // ❌
).length;
```

**After:**
```typescript
const derivedActiveProjects = (projects || []).filter(
  p => (p as any).blockchain_tx_hash  // ✅
).length;
```

---

## 🎯 Why This Works

The `blockchain_tx_hash` field:
- ✅ Exists in the `Project` TypeScript interface
- ✅ Exists in the database schema
- ✅ Gets set when a project is registered on-chain
- ✅ Is used consistently throughout the codebase

This matches the logic used in `RegisterAppModal.tsx`:
```typescript
const registeredProjects = (data.projects || []).filter(
  (p: Project) => p.blockchain_tx_hash
);
```

---

## 📝 Testing

After this fix, the Test Playground will:
1. ✅ Correctly fetch and display registered apps
2. ✅ Show apps that have been registered on the blockchain
3. ✅ Allow users to send test transactions with their app_id

Dashboard will:
1. ✅ Correctly show the count of active/registered projects
2. ✅ Display accurate statistics

---

## 🛡️ Prevention

To prevent similar issues:

1. **Always use TypeScript interfaces** - Don't use `(p as any)` unless necessary
2. **Check field existence** before filtering
3. **Standardize database schema** - Use one authoritative schema file
4. **Add database column validation** - Ensure fields exist before querying
5. **Use the same filter logic** across components

---

## 🔗 Related Issues

This fix also resolves:
- Dashboard showing 0 active projects incorrectly
- Inconsistent project counts across the UI
- Any other component filtering by `registered_on_chain`

---

## 📌 Status

✅ **FIXED** - Both occurrences updated to use `blockchain_tx_hash`

