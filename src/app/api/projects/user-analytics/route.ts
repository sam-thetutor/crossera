import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/projects/user-analytics - Get all projects with unique user analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'unique_users_count';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Get projects with user analytics using the view
    const { data: projects, error: projectsError } = await supabase
      .from('project_user_analytics')
      .select('*')
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    if (projectsError) {
      throw projectsError;
    }

    // Get total count for pagination
    const { count: totalProjects } = await supabase
      .from('project_user_analytics')
      .select('*', { count: 'exact', head: true });

    // Calculate global analytics
    const { data: globalStats, error: globalError } = await supabase
      .from('project_user_stats')
      .select('unique_users_count, total_users_transactions, total_users_volume, total_users_fees, total_users_rewards');

    if (globalError) {
      console.warn('Error fetching global stats:', globalError);
    }

    const globalAnalytics = globalStats?.reduce((acc, stat) => ({
      totalUniqueUsers: acc.totalUniqueUsers + (stat.unique_users_count || 0),
      totalUsersTransactions: acc.totalUsersTransactions + (stat.total_users_transactions || 0),
      totalUsersVolume: (BigInt(acc.totalUsersVolume) + BigInt(stat.total_users_volume || '0')).toString(),
      totalUsersFees: (BigInt(acc.totalUsersFees) + BigInt(stat.total_users_fees || '0')).toString(),
      totalUsersRewards: (BigInt(acc.totalUsersRewards) + BigInt(stat.total_users_rewards || '0')).toString()
    }), {
      totalUniqueUsers: 0,
      totalUsersTransactions: 0,
      totalUsersVolume: '0',
      totalUsersFees: '0',
      totalUsersRewards: '0'
    }) || {
      totalUniqueUsers: 0,
      totalUsersTransactions: 0,
      totalUsersVolume: '0',
      totalUsersFees: '0',
      totalUsersRewards: '0'
    };

    return NextResponse.json({
      success: true,
      data: {
        projects: projects || [],
        globalAnalytics,
        pagination: {
          limit,
          offset,
          total: totalProjects || 0,
          hasMore: (offset + limit) < (totalProjects || 0)
        },
        sortOptions: {
          current: { sortBy, sortOrder },
          available: [
            { field: 'unique_users_count', label: 'Unique Users' },
            { field: 'total_users_transactions', label: 'Total Transactions' },
            { field: 'avg_transactions_per_user', label: 'Avg Transactions/User' },
            { field: 'project_created_at', label: 'Project Created' }
          ]
        }
      }
    });

  } catch (error) {
    console.error('Get projects user analytics error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
