const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Connection...\n');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'Missing');
console.log('');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('1. Testing database connection...');
    
    // Test 1: Simple query to check connection
    const { data: tables, error: tablesError } = await supabase
      .from('projects')
      .select('count')
      .limit(0);
    
    if (tablesError) {
      console.error('❌ Connection failed:', tablesError.message);
      console.log('\nPossible issues:');
      console.log('- Check if you ran the SQL schema in Supabase SQL Editor');
      console.log('- Verify the URL and API key are correct');
      console.log('- Make sure the "projects" table exists');
      return;
    }
    
    console.log('✅ Database connected successfully!\n');
    
    // Test 2: Count existing projects
    console.log('2. Checking existing projects...');
    const { count, error: countError } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Count failed:', countError.message);
      return;
    }
    
    console.log(`✅ Found ${count} project(s) in database\n`);
    
    // Test 3: Try to fetch all projects
    console.log('3. Fetching projects...');
    const { data: projects, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .limit(5);
    
    if (fetchError) {
      console.error('❌ Fetch failed:', fetchError.message);
      return;
    }
    
    console.log(`✅ Successfully fetched ${projects.length} project(s)`);
    
    if (projects.length > 0) {
      console.log('\nSample project:');
      console.log(JSON.stringify(projects[0], null, 2));
    } else {
      console.log('\nℹ️  No projects in database yet (this is normal for a fresh setup)');
    }
    
    console.log('\n🎉 Supabase connection test PASSED!');
    console.log('✅ All API endpoints should work correctly');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testConnection();

