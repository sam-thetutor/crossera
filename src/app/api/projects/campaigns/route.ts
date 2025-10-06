import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const supabase = supabaseAdmin!;

// POST /api/projects/campaigns - Register a project for a campaign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id, campaign_id, registration_tx_hash, registration_fee } = body;

    // Validate required fields
    if (!project_id || !campaign_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: project_id, campaign_id' },
        { status: 400 }
      );
    }

    // Check if already registered
    const { data: existing } = await supabase
      .from('project_campaigns')
      .select('*')
      .eq('project_id', project_id)
      .eq('campaign_id', campaign_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Project already registered for this campaign' },
        { status: 409 }
      );
    }

    // Register project for campaign
    const { data, error } = await supabase
      .from('project_campaigns')
      .insert([{
        project_id,
        campaign_id,
        registration_tx_hash: registration_tx_hash || null,
        registration_fee: registration_fee || '0'
        // Note: is_active defaults to TRUE in database
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      registration: data,
      message: 'Project registered for campaign successfully'
    });

  } catch (error) {
    console.error('Campaign registration error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// GET /api/projects/campaigns - Get campaign registrations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const project_id = searchParams.get('project_id');
    const campaign_id = searchParams.get('campaign_id');

    let query = supabase.from('project_campaigns').select(`
      *,
      projects:project_id (
        app_id,
        app_name,
        owner_address
      )
    `);

    if (project_id) {
      query = query.eq('project_id', project_id);
    }

    if (campaign_id) {
      query = query.eq('campaign_id', campaign_id);
    }

    const { data, error } = await query.order('registered_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      registrations: data || [],
      count: data?.length || 0
    });

  } catch (error) {
    console.error('Get campaign registrations error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

