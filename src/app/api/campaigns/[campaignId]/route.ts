import { NextRequest, NextResponse } from 'next/server';
import { campaignService } from '@/lib/campaignService';

// GET /api/campaigns/[campaignId] - Get single campaign
export async function GET(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const campaignId = parseInt(params.campaignId);
    
    if (isNaN(campaignId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid campaign ID' },
        { status: 400 }
      );
    }

    const campaign = await campaignService.getCampaignById(campaignId);

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      campaign
    });

  } catch (error) {
    console.error('Get campaign error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// PATCH /api/campaigns/[campaignId] - Update campaign
export async function PATCH(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const campaignId = parseInt(params.campaignId);
    
    if (isNaN(campaignId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid campaign ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updates = { ...body };

    // Don't allow updating certain fields via API
    delete updates.id;
    delete updates.campaign_id;
    delete updates.created_at;
    delete updates.created_by;

    const campaign = await campaignService.updateCampaign(campaignId, updates);

    return NextResponse.json({
      success: true,
      campaign,
      message: 'Campaign updated successfully'
    });

  } catch (error) {
    console.error('Update campaign error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/campaigns/[campaignId] - Delete campaign
export async function DELETE(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const campaignId = parseInt(params.campaignId);
    
    if (isNaN(campaignId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid campaign ID' },
        { status: 400 }
      );
    }

    await campaignService.deleteCampaign(campaignId);

    return NextResponse.json({
      success: true,
      message: 'Campaign deleted successfully'
    });

  } catch (error) {
    console.error('Delete campaign error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

