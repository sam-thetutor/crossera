# How to Get Your Supabase Service Role Key

The API route `/api/submit` needs the **Service Role Key** to write transaction data to the database.

## 🔑 Getting the Service Role Key

### Step 1: Go to Supabase Dashboard
Visit: https://supabase.com/dashboard/project/kbayyomluildnyywnwvs

### Step 2: Navigate to API Settings
- Click **Settings** (gear icon) in the left sidebar
- Click **API**

### Step 3: Find the Service Role Key
- Scroll down to **Project API keys**
- Look for **service_role** key
- Click **Reveal** to show the key
- **⚠️ IMPORTANT:** This is a SECRET key - never expose it in frontend code!

### Step 4: Copy the Key
Copy the long string that looks like:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBh...
```

### Step 5: Add to .env.local
Open `.env.local` and replace the placeholder:

```bash
# Change this line:
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# To (paste your actual key):
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBh...
```

### Step 6: Restart Dev Server
```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

---

## ✅ After Adding the Key

The `/api/submit` route will work and be able to:
- Save transactions to the database
- Process transactions on-chain
- Return updated metrics

---

## 🔒 Security Notes

**DO:**
✅ Keep this key in `.env.local` (gitignored)  
✅ Use only in server-side code (API routes)  
✅ Keep it secret and secure  

**DON'T:**
❌ Never commit this key to git  
❌ Never use in frontend/client code  
❌ Never share publicly  

The service role key **bypasses Row Level Security** and has **full database access**, so treat it like a password!

---

## 📍 Your Supabase Project

- **URL:** https://kbayyomluildnyywnwvs.supabase.co
- **Dashboard:** https://supabase.com/dashboard/project/kbayyomluildnyywnwvs/settings/api

---

Once you add the key and restart the server, try submitting the transaction again!

