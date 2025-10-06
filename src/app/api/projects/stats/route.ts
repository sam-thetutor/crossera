import { NextRequest, NextResponse } from 'next/server';
import { projectService } from '@/lib/projectService';
import { supabaseAdmin } from '@/lib/supabase';

const supabase = supabaseAdmin!;

// GET /api/projects/stats - Get project statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');

    // Get project stats from view and filter by owner if provided
    let stats: any[] = [];
    try {
      stats = await projectService.getProjectStats();
    } catch (e) {
      // Non-fatal: proceed with empty stats
      stats = [];
    }
    const filteredStats = owner
      ? stats.filter(s => ((s as any).owner_address ? String((s as any).owner_address).toLowerCase() : '') === owner.toLowerCase())
      : stats;

    // Base projects query (filtered by owner when provided)
    const baseProjectsQuery = supabase.from('projects').select('*');
    let projectsData: any[] = [];
    try {
      const { data: allProjects, error: projectsError } = owner
        ? await baseProjectsQuery.eq('owner_address', owner.toLowerCase())
        : await baseProjectsQuery;
      if (projectsError) throw projectsError;
      projectsData = allProjects || [];
    } catch (e) {
      projectsData = [];
    }

    const totalProjects = projectsData.length;
    const activeProjects = projectsData.filter(p => p.blockchain_tx_hash).length;

    // Calculate total rewards from project stats
    const totalRewards = filteredStats.reduce((sum, p) => {
      const val = typeof p.total_rewards === 'string' ? parseFloat(p.total_rewards) : Number(p.total_rewards || 0);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);

    // Total transactions: if owner provided, count only transactions for their apps
    let totalTransactions = 0;
    try {
      if (owner) {
        const appIds = projectsData.map(p => p.app_id).filter(Boolean);
        if (appIds.length > 0) {
          const { count, error: txErr } = await supabase
            .from('transactions')
            .select('*', { count: 'exact', head: true })
            .in('app_id', appIds);
          if (txErr) throw txErr;
          totalTransactions = count || 0;
        }
      } else {
        const { count, error: txErr } = await supabase
          .from('transactions')
          .select('*', { count: 'exact', head: true });
        if (txErr) throw txErr;
        totalTransactions = count || 0;
      }
    } catch (e) {
      totalTransactions = 0;
    }

    // Categories distribution within current scope
    const categories = projectsData.reduce((acc: Record<string, number>, p: any) => {
      const cat = p.category || 'Other';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      projectStats: filteredStats,
      platformStats: {
        totalProjects,
        activeProjects,
        totalRewards: totalRewards.toString(),
        totalTransactions: totalTransactions || 0,
        categoriesDistribution: categories
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

