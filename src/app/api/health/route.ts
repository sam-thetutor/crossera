import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { SERVER_CONFIG, CROSS_ERA_REWARD_SYSTEM_ABI } from '@/lib/serverConfig';

export async function GET(request: NextRequest) {
  try {
    // Create provider and contract instance
    const provider = new ethers.JsonRpcProvider(SERVER_CONFIG.rpcUrl);
    const contract = new ethers.Contract(SERVER_CONFIG.contractAddress, CROSS_ERA_REWARD_SYSTEM_ABI, provider);

    // Check contract health by calling a view function
    let contractHealth = 'healthy';
    let contractError = null;

    try {
      // Try to call a simple view function
      await contract.totalCampaigns();
    } catch (error) {
      contractHealth = 'unhealthy';
      contractError = error instanceof Error ? error.message : 'Unknown error';
    }

    // Check RPC connection
    let rpcHealth = 'healthy';
    let rpcError = null;

    try {
      await provider.getBlockNumber();
    } catch (error) {
      rpcHealth = 'unhealthy';
      rpcError = error instanceof Error ? error.message : 'Unknown error';
    }

    const overallHealth = contractHealth === 'healthy' && rpcHealth === 'healthy' ? 'healthy' : 'unhealthy';

    return NextResponse.json({
      success: true,
      status: overallHealth,
      timestamp: new Date().toISOString(),
      services: {
        contract: {
          status: contractHealth,
          address: SERVER_CONFIG.contractAddress,
          network: SERVER_CONFIG.network,
          error: contractError
        },
        rpc: {
          status: rpcHealth,
          url: SERVER_CONFIG.rpcUrl,
          error: rpcError
        }
      },
      version: '1.0.0'
    });

  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { 
        success: false, 
        status: 'unhealthy',
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
