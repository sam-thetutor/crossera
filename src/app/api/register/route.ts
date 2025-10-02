import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { SERVER_CONFIG, CROSS_ERA_REWARD_SYSTEM_ABI } from '@/lib/serverConfig';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { developer, app_id, app_name, description, category, website_url } = body;

    // Validate required fields
    if (!developer || !app_id || !app_name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: developer, app_id, app_name' },
        { status: 400 }
      );
    }

    // Validate developer address
    if (!ethers.isAddress(developer)) {
      return NextResponse.json(
        { success: false, error: 'Invalid developer address' },
        { status: 400 }
      );
    }

    // Validate app_id format
    if (app_id.length < 3 || app_id.length > 32) {
      return NextResponse.json(
        { success: false, error: 'App ID must be between 3 and 32 characters' },
        { status: 400 }
      );
    }

    // Create provider and contract instance
    const provider = new ethers.JsonRpcProvider(SERVER_CONFIG.rpcUrl);
    const contract = new ethers.Contract(SERVER_CONFIG.contractAddress, CROSS_ERA_REWARD_SYSTEM_ABI, provider);

    // Check if app is already registered
    const isRegistered = await contract.registeredApps(app_id);
    if (isRegistered) {
      return NextResponse.json(
        { success: false, error: 'App ID already registered' },
        { status: 409 }
      );
    }

    // For now, return success without actually calling the contract
    // In production, you would need a wallet with the appropriate permissions
    return NextResponse.json({
      success: true,
      appId: app_id,
      developer: developer,
      message: 'App registration request created successfully'
    });

  } catch (error) {
    console.error('App registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const developer = searchParams.get('developer');

    if (!developer) {
      return NextResponse.json(
        { success: false, error: 'Developer address is required' },
        { status: 400 }
      );
    }

    if (!ethers.isAddress(developer)) {
      return NextResponse.json(
        { success: false, error: 'Invalid developer address' },
        { status: 400 }
      );
    }

    // In a real implementation, you would query the contract or database
    // For now, return mock data
    return NextResponse.json({
      success: true,
      apps: [
        {
          id: 'demo-app-1',
          name: 'Demo App 1',
          developer: developer,
          registeredCampaigns: [1, 2],
          totalRewards: '0',
          totalTransactions: 0
        }
      ]
    });

  } catch (error) {
    console.error('Get apps error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
