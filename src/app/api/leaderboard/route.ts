import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { SERVER_CONFIG, CROSS_ERA_REWARD_SYSTEM_ABI } from '@/lib/serverConfig';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaign_id = searchParams.get('campaign_id');

    // Mock leaderboard data
    const mockLeaderboard = [
      {
        appId: 'demo-app-1',
        appName: 'Demo App 1',
        developer: '0x1234567890123456789012345678901234567890',
        totalVolume: '1000000000000000000000', // 1000 XFI
        totalFees: '10000000000000000000', // 10 XFI
        transactionCount: 150,
        rank: 1
      },
      {
        appId: 'demo-app-2',
        appName: 'Demo App 2',
        developer: '0x2345678901234567890123456789012345678901',
        totalVolume: '800000000000000000000', // 800 XFI
        totalFees: '8000000000000000000', // 8 XFI
        transactionCount: 120,
        rank: 2
      },
      {
        appId: 'demo-app-3',
        appName: 'Demo App 3',
        developer: '0x3456789012345678901234567890123456789012',
        totalVolume: '600000000000000000000', // 600 XFI
        totalFees: '6000000000000000000', // 6 XFI
        transactionCount: 90,
        rank: 3
      }
    ];

    if (campaign_id) {
      // Return leaderboard for specific campaign
      return NextResponse.json({
        success: true,
        campaignId: campaign_id,
        leaderboard: mockLeaderboard,
        total: mockLeaderboard.length
      });
    } else {
      // Return global leaderboard
      return NextResponse.json({
        success: true,
        leaderboard: mockLeaderboard,
        total: mockLeaderboard.length,
        globalStats: {
          totalDevelopers: 3,
          totalApps: 3,
          totalTransactions: 360,
          totalVolume: '2400000000000000000000', // 2400 XFI
          totalFees: '24000000000000000000' // 24 XFI
        }
      });
    }

  } catch (error) {
    console.error('Get leaderboard error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
