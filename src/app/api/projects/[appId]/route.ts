import { NextRequest, NextResponse } from 'next/server';
import { projectService } from '@/lib/projectService';

// GET /api/projects/[appId] - Get a specific project
export async function GET(
  request: NextRequest,
  { params }: { params: { appId: string } }
) {
  try {
    const { appId } = params;

    const project = await projectService.getProjectByAppId(appId);

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      project: project
    });

  } catch (error) {
    console.error('Get project error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[appId] - Update a project
export async function PUT(
  request: NextRequest,
  { params }: { params: { appId: string } }
) {
  try {
    const { appId } = params;
    const body = await request.json();

    const {
      app_name,
      description,
      category,
      website_url,
      logo_url,
      github_url,
      twitter_url,
      discord_url,
      is_active
    } = body;

    const project = await projectService.updateProject(appId, {
      app_name,
      description,
      category,
      website_url,
      logo_url,
      github_url,
      twitter_url,
      discord_url,
      is_active
    });

    return NextResponse.json({
      success: true,
      project: project,
      message: 'Project updated successfully'
    });

  } catch (error) {
    console.error('Update project error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[appId] - Delete a project
export async function DELETE(
  request: NextRequest,
  { params }: { params: { appId: string } }
) {
  try {
    const { appId } = params;

    await projectService.deleteProject(appId);

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error) {
    console.error('Delete project error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

