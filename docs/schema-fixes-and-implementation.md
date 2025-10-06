# 🔧 **Database Schema Fixes & Implementation Guide**

## 📋 **Overview**

This document explains the comprehensive database schema solution that addresses all current issues with the CrossEra platform. The new schema is designed to work seamlessly with the smart contract, API routes, and frontend components.

## 🚨 **Current Schema Issues & Fixes**

### **Issue 1: Missing `blockchain_tx_hash` Column**
**❌ Problem:**
- Projects table missing `blockchain_tx_hash` column
- Registration API fails with "Could not find the 'blockchain_tx_hash' column"
- Projects can't be marked as blockchain-registered

**✅ Fix:**
```sql
-- Added to projects table
blockchain_tx_hash VARCHAR(66),
registered_on_chain BOOLEAN GENERATED ALWAYS AS (blockchain_tx_hash IS NOT NULL) STORED,
```
- **Result**: Projects can now store blockchain transaction hashes
- **Compatibility**: `registered_on_chain` is computed automatically for frontend compatibility

### **Issue 2: Missing Database Functions**
**❌ Problem:**
- API routes call non-existent functions: `get_campaign_claims_data`, `get_user_total_rewards`
- Error: "structure of query does not match function result type"
- Profile claims page fails to load

**✅ Fix:**
```sql
-- Added comprehensive database functions
CREATE OR REPLACE FUNCTION get_campaign_claims_data(p_campaign_id INTEGER, p_user_address VARCHAR(42))
CREATE OR REPLACE FUNCTION get_user_total_rewards(p_user_address VARCHAR(42))
CREATE OR REPLACE FUNCTION increment_transaction_count(p_project_id UUID)
CREATE OR REPLACE FUNCTION get_project_stats(p_owner_address VARCHAR(42))
```
- **Result**: All API routes now have required database functions
- **Compatibility**: Functions return data in expected format

### **Issue 3: Campaign Stats Not Updating**
**❌ Problem:**
- `registered_apps_count` and `total_transactions` remain at 0
- Campaign details page shows incorrect statistics
- No mechanism to update stats when registrations/transactions occur

**✅ Fix:**
```sql
-- Added automatic triggers
CREATE TRIGGER increment_campaign_apps_count_trigger
CREATE TRIGGER increment_campaign_transactions_count_trigger

-- Added increment functions
CREATE OR REPLACE FUNCTION increment_campaign_apps_count()
CREATE OR REPLACE FUNCTION increment_campaign_transactions_count()
```
- **Result**: Campaign stats automatically update when apps register or transactions are processed
- **Compatibility**: Real-time statistics for frontend display

### **Issue 4: Inconsistent Table Names**
**❌ Problem:**
- Multiple schemas use different table names
- `project_campaigns` vs `project_campaign_registrations`
- API routes reference non-existent tables

**✅ Fix:**
- **Standardized table names**: `project_campaigns` (consistent across all references)
- **Proper foreign key relationships**: All tables properly linked
- **Result**: API routes work with consistent table structure

### **Issue 5: Wrong Data Types**
**❌ Problem:**
- API expects UUID but gets INTEGER
- Error: "Returned type integer does not match expected type uuid in column 1"
- Database function return types don't match API expectations

**✅ Fix:**
```sql
-- Proper data types for all columns
project_id UUID REFERENCES projects(id)
campaign_id INTEGER REFERENCES campaigns(campaign_id)
-- All function return types match API expectations
```
- **Result**: No more data type mismatches between database and API

### **Issue 6: Missing RLS Policies**
**❌ Problem:**
- Database operations fail due to restrictive Row Level Security
- Campaign activation, project updates fail
- Users can't access their own data

**✅ Fix:**
```sql
-- Comprehensive RLS policies for all tables
CREATE POLICY "Public read projects" ON projects FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated insert projects" ON projects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Owner update projects" ON projects FOR UPDATE TO authenticated...
```
- **Result**: Proper access control while allowing necessary operations

### **Issue 7: Playground Project Detection**
**❌ Problem:**
- Playground shows "No registered apps found" despite having blockchain-registered projects
- Frontend expects `registered_on_chain` field
- Filtering logic fails

**✅ Fix:**
```sql
-- Computed column for compatibility
registered_on_chain BOOLEAN GENERATED ALWAYS AS (blockchain_tx_hash IS NOT NULL) STORED
```
- **Result**: Playground correctly detects blockchain-registered projects
- **Compatibility**: Works with existing frontend filtering logic

### **Issue 8: Missing Image Upload Support**
**❌ Problem:**
- No Supabase storage bucket configuration
- Project logos and banners can't be uploaded
- Image URLs can't be stored properly

**✅ Fix:**
```sql
-- Storage bucket setup
INSERT INTO storage.buckets (id, name, public) VALUES ('project-assets', 'project-assets', true);

-- Storage policies
CREATE POLICY "Public read project assets" ON storage.objects FOR SELECT...
CREATE POLICY "Authenticated upload project assets" ON storage.objects FOR INSERT...
```
- **Result**: Full image upload and storage capabilities
- **Compatibility**: Works with existing image upload components

## 🏗️ **New Schema Architecture**

### **Core Tables**
1. **`projects`** - Project metadata with blockchain integration
2. **`campaigns`** - Campaign information with smart contract sync
3. **`project_campaigns`** - Many-to-many relationship between projects and campaigns
4. **`transactions`** - Transaction processing and tracking
5. **`campaign_claims`** - Reward claims tracking
6. **`project_unique_users`** - User tracking per project
7. **`project_user_stats`** - Aggregated user statistics
8. **`sdk_pending_transactions`** - SDK batch processing
9. **`sdk_batch_runs`** - Batch processing tracking

### **Smart Contract Integration**
- **Sync Endpoints**: Campaign data synced from smart contract
- **Blockchain Status**: Projects track blockchain registration status
- **Claim Tracking**: Database mirrors smart contract claim state
- **Real-time Updates**: Automatic stats updates via triggers

### **API Compatibility**
- **All Functions**: Database functions for every API route
- **Proper Types**: Return types match API expectations
- **Error Handling**: Comprehensive error handling and validation
- **Performance**: Optimized indexes for fast queries

## 🚀 **Implementation Steps**

### **Step 1: Backup Current Data**
```sql
-- Export current data before dropping tables
pg_dump -t projects -t campaigns -t transactions your_database > backup.sql
```

### **Step 2: Run New Schema**
```bash
# In Supabase SQL Editor, run the complete schema
psql -f docs/complete-database-schema.sql
```

### **Step 3: Verify Schema**
```sql
-- Check all tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check all functions exist
SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public';

-- Check RLS policies
SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public';
```

### **Step 4: Test API Routes**
```bash
# Test project registration
curl -X POST "http://localhost:3000/api/projects/register" -d '{"app_id":"test","owner_address":"0x123...","app_name":"Test App"}'

# Test campaign sync
curl -X POST "http://localhost:3000/api/campaigns/1/sync"

# Test claims data
curl "http://localhost:3000/api/profile/claims?userAddress=0x123..."
```

### **Step 5: Test Frontend Components**
- ✅ Playground should show registered projects
- ✅ Campaign details should show correct stats
- ✅ Profile page should load claims history
- ✅ Project registration should complete successfully

## 🔄 **Data Migration (If Needed)**

If you have existing data that needs to be preserved:

```sql
-- Migrate existing projects (if any)
INSERT INTO projects (app_id, owner_address, app_name, ...)
SELECT app_id, owner_address, app_name, ... FROM old_projects_table;

-- Migrate existing campaigns (if any)
INSERT INTO campaigns (campaign_id, name, description, ...)
SELECT campaign_id, name, description, ... FROM old_campaigns_table;

-- Update blockchain_tx_hash for existing projects
UPDATE projects SET blockchain_tx_hash = '0x...' WHERE app_id = 'existing_app_id';
```

## 📊 **Performance Optimizations**

### **Indexes Added**
- **Projects**: `app_id`, `owner_address`, `blockchain_tx_hash`
- **Campaigns**: `campaign_id`, `status`, `is_active`, `dates`
- **Transactions**: `tx_hash`, `app_id`, `project_id`, `timestamp`
- **Claims**: `campaign_id`, `app_id`, `claimed_by`

### **Triggers for Real-time Updates**
- **Campaign Stats**: Auto-increment `registered_apps_count` and `total_transactions`
- **Timestamps**: Auto-update `updated_at` fields
- **Computed Columns**: `registered_on_chain` computed automatically

### **Query Optimization**
- **Database Functions**: Pre-compiled queries for common operations
- **Proper Joins**: Optimized relationships between tables
- **Pagination Support**: Built-in support for large datasets

## 🛡️ **Security Features**

### **Row Level Security**
- **Public Read**: Campaigns and projects publicly readable
- **Authenticated Write**: Only authenticated users can create/update
- **Owner Restrictions**: Users can only update their own projects
- **Service Role**: Backend operations bypass RLS when needed

### **Data Validation**
- **Address Format**: Ethereum address validation
- **Hash Format**: Transaction hash validation
- **App ID Format**: Alphanumeric validation
- **Status Enums**: Restricted to valid values

### **Storage Security**
- **Bucket Policies**: Proper access control for file uploads
- **Public Assets**: Project logos/banners publicly accessible
- **Authenticated Upload**: Only authenticated users can upload

## 🎯 **Expected Outcomes**

After implementing this schema:

### **✅ Frontend Issues Fixed**
- Playground shows registered projects
- Campaign stats display correctly
- Profile claims history loads
- Project registration completes successfully

### **✅ API Issues Fixed**
- All API routes work without errors
- Database functions return correct data
- Transaction processing works
- Campaign sync functions properly

### **✅ Smart Contract Integration**
- Campaign data syncs from blockchain
- Claim status matches smart contract
- Project registration tracked on-chain
- Real-time statistics updates

### **✅ Performance Improvements**
- Fast queries with proper indexes
- Real-time stats updates via triggers
- Optimized database functions
- Efficient data relationships

### **✅ Security Enhancements**
- Proper RLS policies
- Data validation constraints
- Secure file upload capabilities
- Owner-based access control

## 📝 **Maintenance Notes**

### **Regular Tasks**
- Monitor campaign stats accuracy
- Check database function performance
- Verify RLS policies are working
- Update indexes as needed

### **Monitoring**
- Watch for slow queries
- Monitor trigger performance
- Check storage bucket usage
- Verify API response times

### **Backups**
- Regular database backups
- Export critical data
- Test restore procedures
- Monitor storage usage

---

**This comprehensive schema solution addresses all current issues and provides a solid foundation for the CrossEra platform to function properly with the smart contract, API routes, and frontend components.**

