import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/projects/[appId]/user-tracking/users - Get unique user analytics
export async function GET(
  request: NextRequest,
  { params }: { params: { appId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get project ID from app_id
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('app_id', params.appId)
      .single();

    if (!project) {
      return NextResponse.json(
        { success: false, error: `Project not found for app_id: ${params.appId}` },
        { status: 404 }
      );
    }

    const projectId = project.id;

    // Get unique users for the project
    const { data: users, error: usersError } = await supabase
      .from('project_unique_users')
      .select('*')
      .eq('project_id', projectId)
      .order('last_transaction_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (usersError) {
      throw usersError;
    }

    // Get project user stats
    const { data: stats, error: statsError } = await supabase
      .from('project_user_stats')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (statsError && statsError.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw statsError;
    }

    // Get total count for pagination
    const { count: totalUsers } = await supabase
      .from('project_unique_users')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);

    // Calculate analytics
    const analytics = {
      totalUniqueUsers: totalUsers || 0,
      totalUsersTransactions: stats?.total_users_transactions || 0,
      totalUsersVolume: stats?.total_users_volume || '0',
      totalUsersFees: stats?.total_users_fees || '0',
      totalUsersRewards: stats?.total_users_rewards || '0',
      avgTransactionsPerUser: totalUsers && totalUsers > 0 
        ? Math.round((stats?.total_users_transactions || 0) / totalUsers * 100) / 100 
        : 0,
      topUsers: users?.slice(0, 10) || [],
      lastUpdated: stats?.last_updated || null
    };

    return NextResponse.json({
      success: true,
      data: {
        users: users || [],
        analytics,
        pagination: {
          limit,
          offset,
          total: totalUsers || 0,
          hasMore: (offset + limit) < (totalUsers || 0)
        }
      }
    });

  } catch (error) {
    console.error('Get project users error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
