import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { app_ids } = await request.json();

    if (!app_ids || !Array.isArray(app_ids) || app_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'app_ids array is required' },
        { status: 400 }
      );
    }

    // Fetch projects by app_ids
    const { data: projects, error } = await supabase
      .from('projects')
      .select('app_id, app_name, logo_url')
      .in('app_id', app_ids);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch project names' },
        { status: 500 }
      );
    }

    // Create a map of app_id -> project data
    const projectMap: Record<string, { name: string; logo_url?: string }> = {};
    projects?.forEach(project => {
      projectMap[project.app_id] = {
        name: project.app_name,
        logo_url: project.logo_url,
      };
    });

    return NextResponse.json({
      success: true,
      projects: projectMap,
    });
  } catch (error) {
    console.error('Error fetching project names:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

