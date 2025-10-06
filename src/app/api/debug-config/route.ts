import { NextRequest, NextResponse } from 'next/server';
import { SERVER_CONFIG, CROSS_ERA_REWARD_SYSTEM_ABI } from '@/lib/serverConfig';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      config: {
        rpcUrl: SERVER_CONFIG.rpcUrl,
        contractAddress: SERVER_CONFIG.contractAddress,
        network: SERVER_CONFIG.network,
        hasABI: !!CROSS_ERA_REWARD_SYSTEM_ABI,
        abiLength: CROSS_ERA_REWARD_SYSTEM_ABI?.length || 0,
        env: {
          RPC_URL: process.env.RPC_URL,
          CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS,
          NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET
        }
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
