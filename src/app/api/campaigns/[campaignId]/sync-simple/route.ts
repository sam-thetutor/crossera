import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { SERVER_CONFIG, CROSS_ERA_REWARD_SYSTEM_ABI } from '@/lib/serverConfig';

export async function POST(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const { campaignId: campaignIdParam } = await params;
    const campaignId = parseInt(campaignIdParam);
    
    if (isNaN(campaignId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid campaign ID' },
        { status: 400 }
      );
    }

    // Just test smart contract connection
    const provider = new ethers.JsonRpcProvider(SERVER_CONFIG.rpcUrl);
    const contract = new ethers.Contract(
      SERVER_CONFIG.contractAddress,
      CROSS_ERA_REWARD_SYSTEM_ABI,
      provider
    );

    // Fetch campaign data from smart contract
    const contractData = await contract.getCampaign(campaignId);

    return NextResponse.json({
      success: true,
      campaignId,
      contractData: {
        active: contractData.active,
        totalPool: ethers.formatEther(contractData.totalPool),
        distributedRewards: ethers.formatEther(contractData.distributedRewards),
        startDate: new Date(Number(contractData.startDate) * 1000).toISOString(),
        endDate: new Date(Number(contractData.endDate) * 1000).toISOString()
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}
