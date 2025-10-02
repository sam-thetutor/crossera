import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/projects/[appId]/campaigns - Register app for campaign
export async function POST(
  request: NextRequest,
  { params }: { params: { appId: string } }
) {
  try {
    const body = await request.json();
    const { campaign_id, registration_tx_hash } = body;
    const appId = params.appId;

    if (!campaign_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: campaign_id' },
        { status: 400 }
      );
    }

    // Get the project to verify it exists
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, app_id, owner_address')
      .eq('app_id', appId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if already registered
    const { data: existing } = await supabase
      .from('project_campaigns')
      .select('id')
      .eq('project_id', project.id)
      .eq('campaign_id', campaign_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'App already registered for this campaign' },
        { status: 409 }
      );
    }

    // Create project_campaigns entry
    const { data: registration, error: regError } = await supabase
      .from('project_campaigns')
      .insert({
        project_id: project.id,
        campaign_id: campaign_id,
        registration_tx_hash: registration_tx_hash || null,
        registration_fee: '0',
        is_active: true
      })
      .select()
      .single();

    if (regError) throw regError;

    // Increment campaign's registered_apps_count
    const { error: updateError } = await supabase.rpc('increment', {
      table_name: 'campaigns',
      column_name: 'registered_apps_count',
      row_id: campaign_id,
      id_column: 'campaign_id'
    });

    // If RPC function doesn't exist, fallback to manual increment
    if (updateError) {
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('registered_apps_count')
        .eq('campaign_id', campaign_id)
        .single();

      if (campaign) {
        await supabase
          .from('campaigns')
          .update({ registered_apps_count: (campaign.registered_apps_count || 0) + 1 })
          .eq('campaign_id', campaign_id);
      }
    }

    return NextResponse.json({
      success: true,
      registration,
      message: 'App registered for campaign successfully'
    });

  } catch (error) {
    console.error('Register app for campaign error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// GET /api/projects/[appId]/campaigns - Get campaigns app is registered for
export async function GET(
  request: NextRequest,
  { params }: { params: { appId: string } }
) {
  try {
    const appId = params.appId;

    // Get the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('app_id', appId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Get registered campaigns
    const { data: registrations, error } = await supabase
      .from('project_campaigns')
      .select(`
        *,
        campaigns (*)
      `)
      .eq('project_id', project.id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      campaigns: registrations || []
    });

  } catch (error) {
    console.error('Get app campaigns error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

