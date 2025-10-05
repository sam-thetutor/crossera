require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCampaigns() {
  try {
    console.log('🔍 Checking campaigns in database...\n');
    
    // Check campaigns table structure
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('*')
      .limit(10);
    
    if (error) {
      console.error('❌ Error fetching campaigns:', error);
      return;
    }
    
    console.log('📋 Available campaigns:');
    campaigns.forEach(c => {
      console.log(`  ID: ${c.id}, Campaign ID: ${c.campaign_id}, Name: ${c.name}`);
    });
    
    // Check if campaign 10 exists by different methods
    console.log('\n🔍 Checking for campaign 10...');
    
    const { data: campaign10ById, error: err10ById } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', 10)
      .single();
    
    console.log('Campaign 10 by ID (id column):', campaign10ById || 'Not found');
    
    const { data: campaign10ByCampaignId, error: err10ByCampaignId } = await supabase
      .from('campaigns')
      .select('*')
      .eq('campaign_id', 10)
      .single();
    
    console.log('Campaign 10 by campaign_id column:', campaign10ByCampaignId || 'Not found');
    
    // Check what the highest campaign_id is
    const { data: maxCampaign, error: maxError } = await supabase
      .from('campaigns')
      .select('campaign_id')
      .order('campaign_id', { ascending: false })
      .limit(1)
      .single();
    
    if (maxCampaign) {
      console.log(`\n📊 Highest campaign_id in database: ${maxCampaign.campaign_id}`);
    }
    
    // Check if we have any campaigns at all
    const { count, error: countError } = await supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n📈 Total campaigns in database: ${count}`);
    
  } catch (err) {
    console.error('❌ Script error:', err);
  }
}

checkCampaigns();
