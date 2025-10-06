import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      hasServiceKey: !!supabaseServiceKey,
      url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'missing'
    });

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        error: 'Missing Supabase environment variables',
        hasUrl: !!supabaseUrl,
        hasAnonKey: !!supabaseAnonKey,
        hasServiceKey: !!supabaseServiceKey
      }, { status: 500 });
    }

    // Test regular client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test basic query
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*', { count: 'exact' });

    console.log('Campaigns query result:', { campaigns, campaignsError });

    // Test service role client if available
    let serviceClientTest = null;
    if (supabaseServiceKey) {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      const { data: projects, error: projectsError } = await supabaseAdmin
        .from('projects')
        .select('*', { count: 'exact' });
      
      serviceClientTest = { projects, projectsError };
      console.log('Projects query result:', serviceClientTest);
    }

    return NextResponse.json({
      success: true,
      environment: {
        hasUrl: !!supabaseUrl,
        hasAnonKey: !!supabaseAnonKey,
        hasServiceKey: !!supabaseServiceKey
      },
      regularClient: {
        campaigns,
        campaignsError: campaignsError?.message
      },
      serviceClient: serviceClientTest
    });

  } catch (error: any) {
    console.error('Debug error:', error);
    return NextResponse.json({
      error: 'Debug failed',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
