import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/projects/[appId]/user-tracking/user-stats - Get project user statistics
export async function GET(
  request: NextRequest,
  { params }: { params: { appId: string } }
) {
  try {
    // Get project basic info first
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, app_id, app_name, created_at')
      .eq('app_id', params.appId)
      .single();

    if (projectError) {
      throw projectError;
    }

    const projectId = project.id;

    // Get project user stats
    const { data: stats, error: statsError } = await supabase
      .from('project_user_stats')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (statsError && statsError.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw statsError;
    }

    // Get daily unique user growth (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: dailyGrowth, error: growthError } = await supabase
      .from('project_unique_users')
      .select('first_transaction_at')
      .eq('project_id', projectId)
      .gte('first_transaction_at', thirtyDaysAgo.toISOString())
      .order('first_transaction_at', { ascending: true });

    if (growthError) {
      console.warn('Error fetching daily growth:', growthError);
    }

    // Process daily growth data
    const growthData = dailyGrowth?.reduce((acc: any, user: any) => {
      const date = new Date(user.first_transaction_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {}) || {};

    // Calculate growth metrics
    const totalDays = Math.ceil((Date.now() - new Date(project.created_at).getTime()) / (1000 * 60 * 60 * 24));
    const avgDailyGrowth = totalDays > 0 ? (stats?.unique_users_count || 0) / totalDays : 0;

    return NextResponse.json({
      success: true,
      data: {
        project: {
          id: projectId,
          appId: project.app_id,
          appName: project.app_name,
          createdAt: project.created_at
        },
        userStats: {
          uniqueUsersCount: stats?.unique_users_count || 0,
          totalUsersTransactions: stats?.total_users_transactions || 0,
          totalUsersVolume: stats?.total_users_volume || '0',
          totalUsersFees: stats?.total_users_fees || '0',
          totalUsersRewards: stats?.total_users_rewards || '0',
          avgTransactionsPerUser: stats?.unique_users_count && stats.unique_users_count > 0 
            ? Math.round((stats.total_users_transactions || 0) / stats.unique_users_count * 100) / 100 
            : 0,
          lastUpdated: stats?.last_updated || null
        },
        growthMetrics: {
          avgDailyGrowth: Math.round(avgDailyGrowth * 100) / 100,
          totalDaysActive: totalDays,
          dailyGrowthData: growthData
        }
      }
    });

  } catch (error) {
    console.error('Get project user stats error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
