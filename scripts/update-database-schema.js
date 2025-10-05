const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

async function updateDatabaseSchema() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase configuration');
    console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🔧 Updating database schema...');
  console.log('Supabase URL:', supabaseUrl);
  console.log('');

  try {
    // Read the SQL file
    const fs = require('fs');
    const path = require('path');
    const sqlFile = path.join(__dirname, '../docs/comprehensive-schema-update.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');

    console.log('📄 SQL file loaded successfully');
    console.log('Executing schema update...');
    console.log('');

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });

    if (error) {
      console.error('❌ Error executing schema update:', error);
      return;
    }

    console.log('✅ Schema update completed successfully!');
    console.log('Response:', data);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('');
    console.log('📋 Manual Instructions:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of docs/comprehensive-schema-update.sql');
    console.log('4. Execute the SQL script');
  }
}

updateDatabaseSchema();
