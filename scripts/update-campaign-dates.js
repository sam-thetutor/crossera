require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateCampaignDates() {
  try {
    console.log('🔄 Updating campaign start dates...\n');
    
    const now = new Date();
    const startTime = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
    const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    console.log(`Setting start_date to: ${startTime.toISOString()}`);
    console.log(`Setting end_date to: ${endTime.toISOString()}\n`);
    
    // Update all campaigns
    const { data, error } = await supabase
      .from('campaigns')
      .update({
        start_date: startTime.toISOString(),
        end_date: endTime.toISOString()
      })
      .neq('id', 0) // Update all campaigns (WHERE id != 0)
      .select();
    
    if (error) {
      console.error('❌ Error updating campaigns:', error);
      return;
    }
    
    console.log('✅ Updated campaigns:');
    data.forEach(c => {
      console.log(`   Campaign ${c.campaign_id}: ${c.name}`);
      console.log(`   New start: ${c.start_date}`);
      console.log(`   New end: ${c.end_date}\n`);
    });
    
    console.log('🎉 All campaigns should now show as "Active"!');
    
  } catch (err) {
    console.error('❌ Script error:', err);
  }
}

updateCampaignDates();
