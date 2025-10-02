# 🗄️ Supabase Setup Guide

## Quick Setup (5 Minutes)

### **Step 1: Create Supabase Account**
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub (recommended) or Email

### **Step 2: Create New Project**
1. Click "New Project"
2. Fill in:
   - **Project Name:** `crossera` (or any name)
   - **Database Password:** Generate a strong password (save it!)
   - **Region:** Choose closest to you
   - **Pricing Plan:** Free tier is fine for development
3. Click "Create new project"
4. Wait ~2 minutes for setup

### **Step 3: Get API Credentials**
1. In your project dashboard, click "Settings" (gear icon)
2. Go to "API" section
3. Copy these values:
   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon public key:** `eyJhbG...` (long JWT token)

### **Step 4: Add to Environment Variables**
Update your `.env.local` file:

```bash
# Add these lines
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### **Step 5: Run Database Schema**
1. In Supabase dashboard, go to "SQL Editor"
2. Click "New query"
3. Copy entire content from `supabase-schema.sql` file
4. Paste into the editor
5. Click "Run" or press `Ctrl/Cmd + Enter`
6. You should see: ✅ "Success. No rows returned"

### **Step 6: Verify Tables Created**
1. Go to "Table Editor" in sidebar
2. You should see these tables:
   - ✅ `projects`
   - ✅ `project_campaigns`
   - ✅ `transactions`
   - ✅ `project_stats` (view)

---

## 🔍 Verify Setup

### **Test 1: Check Tables**
Run this in SQL Editor:
```sql
SELECT COUNT(*) FROM projects;
```
Should return: `0` (no projects yet)

### **Test 2: Insert Test Data**
```sql
INSERT INTO projects (
    app_id, 
    owner_address, 
    app_name, 
    description, 
    category, 
    created_by,
    blockchain_status,
    registered_on_chain
) VALUES (
    'test-app',
    '0x85A4b09fb0788f1C549a68dC2EdAe3F97aeb5Dd7',
    'Test Application',
    'This is a test',
    'DeFi',
    '0x85A4b09fb0788f1C549a68dC2EdAe3F97aeb5Dd7',
    'pending',
    false
);

SELECT * FROM projects;
```

### **Test 3: Test from Frontend**
```bash
# Start your dev server
npm run dev

# In another terminal, test the API
curl http://localhost:3000/api/projects/register
```

---

## 📊 Understanding Your Database

### **`projects` Table**
Stores all project metadata (name, description, links, etc.)
- Each project has unique `app_id`
- Tracks blockchain registration status
- Stores analytics (transactions, rewards, volume)

### **`project_campaigns` Table**
Links projects to campaigns (many-to-many)
- A project can join multiple campaigns
- Tracks registration transactions

### **`transactions` Table**
Records all processed transactions
- Linked to specific project
- Optionally linked to campaign
- Tracks gas, fees, rewards

### **`project_stats` View**
Aggregated statistics per project
- Campaign count
- Transaction count
- Total rewards & volume

---

## 🔐 Row Level Security (RLS)

Your database has RLS enabled with these policies:

### **Read Access (Everyone)**
```sql
-- Anyone can read projects
SELECT * FROM projects WHERE true;

-- Anyone can read campaigns
SELECT * FROM project_campaigns WHERE true;

-- Anyone can read transactions
SELECT * FROM transactions WHERE true;
```

### **Write Access (Everyone - for now)**
```sql
-- Anyone can insert their own projects
INSERT INTO projects (...)

-- Anyone can update projects
UPDATE projects SET ...
```

> **Note:** In production, you should restrict write access to authenticated users only.

---

## 🔄 Database Functions

### **Auto-Update Timestamp**
```sql
-- Automatically updates 'updated_at' on any project update
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### **Increment Transaction Count**
```sql
-- Called when a new transaction is recorded
SELECT increment_transaction_count('project-uuid-here');
```

---

## 📈 Sample Queries

### **Get all projects with stats**
```sql
SELECT * FROM project_stats
ORDER BY created_at DESC;
```

### **Get projects by owner**
```sql
SELECT * FROM projects
WHERE owner_address = '0x85A4b09fb0788f1C549a68dC2EdAe3F97aeb5Dd7';
```

### **Get projects by category**
```sql
SELECT * FROM projects
WHERE category = 'DeFi'
ORDER BY created_at DESC;
```

### **Search projects**
```sql
SELECT * FROM projects
WHERE app_name ILIKE '%defi%'
   OR description ILIKE '%defi%';
```

### **Get project with campaigns**
```sql
SELECT 
    p.*,
    json_agg(pc.*) as campaigns
FROM projects p
LEFT JOIN project_campaigns pc ON p.id = pc.project_id
GROUP BY p.id;
```

### **Platform statistics**
```sql
SELECT 
    COUNT(*) as total_projects,
    COUNT(*) FILTER (WHERE registered_on_chain) as registered_projects,
    COUNT(*) FILTER (WHERE is_active) as active_projects,
    COUNT(DISTINCT category) as total_categories
FROM projects;
```

---

## 🛠️ Troubleshooting

### **Issue: "Invalid API key"**
**Solution:** 
- Make sure you copied the `anon public` key, not the `service_role` key
- Check for extra spaces or line breaks

### **Issue: "relation does not exist"**
**Solution:**
- Run the schema SQL again
- Check if tables were created in "Table Editor"

### **Issue: "permission denied for table"**
**Solution:**
- Check RLS policies are enabled
- Verify you're using the correct Supabase client

### **Issue: "duplicate key value"**
**Solution:**
- `app_id` must be unique
- Check if the app_id already exists before inserting

---

## 📚 Useful Supabase Features

### **Real-time Subscriptions**
```typescript
// Listen for new projects
const channel = supabase
  .channel('projects-changes')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'projects'
  }, (payload) => {
    console.log('New project:', payload.new);
  })
  .subscribe();
```

### **Storage (for logos/images)**
```typescript
// Upload project logo
const { data, error } = await supabase.storage
  .from('project-logos')
  .upload('logo.png', file);
```

### **Edge Functions (serverless)**
- Write serverless functions in Supabase
- Can be used for webhooks, cron jobs, etc.

---

## 🔗 Resources

- **Supabase Docs:** https://supabase.com/docs
- **SQL Reference:** https://supabase.com/docs/guides/database
- **JavaScript Client:** https://supabase.com/docs/reference/javascript
- **RLS Guide:** https://supabase.com/docs/guides/auth/row-level-security

---

## ✅ Setup Checklist

- [ ] Supabase account created
- [ ] New project created
- [ ] Database password saved securely
- [ ] API credentials copied
- [ ] `.env.local` updated
- [ ] Schema SQL executed
- [ ] Tables verified in dashboard
- [ ] Test insert successful
- [ ] API endpoint tested

---

## 🎯 Next Steps

Once Supabase is setup:
1. ✅ Test API endpoints locally
2. ✅ Verify data is being saved
3. ✅ Check blockchain status updates
4. ⏭️ Build frontend components
5. ⏭️ Deploy to production

**Supabase is ready! 🚀**

