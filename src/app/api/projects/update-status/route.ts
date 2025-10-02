import { NextRequest, NextResponse } from 'next/server';
import { projectService } from '@/lib/projectService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { app_id, tx_hash, status } = body;

    // Validate required fields
    if (!app_id || !tx_hash || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: app_id, tx_hash, status' },
        { status: 400 }
      );
    }

    // Validate status
    if (!['pending', 'confirmed', 'failed'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status. Must be: pending, confirmed, or failed' },
        { status: 400 }
      );
    }

    // Validate tx_hash format
    if (!/^0x[a-fA-F0-9]{64}$/.test(tx_hash)) {
      return NextResponse.json(
        { success: false, error: 'Invalid transaction hash format' },
        { status: 400 }
      );
    }

    // Update blockchain status in Supabase
    const project = await projectService.updateBlockchainStatus(
      app_id,
      tx_hash,
      status
    );

    return NextResponse.json({
      success: true,
      project: project,
      message: `Project status updated to ${status}`
    });

  } catch (error) {
    console.error('Update status error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

