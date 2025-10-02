import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { projectService } from '@/lib/projectService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      app_id,
      owner_address,
      app_name,
      description,
      category,
      website_url,
      logo_url,
      github_url,
      twitter_url,
      discord_url
    } = body;

    // Validate required fields
    if (!app_id || !owner_address || !app_name || !logo_url) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: app_id, owner_address, app_name, logo_url' 
        },
        { status: 400 }
      );
    }

    // Validate address
    if (!ethers.isAddress(owner_address)) {
      return NextResponse.json(
        { success: false, error: 'Invalid owner address' },
        { status: 400 }
      );
    }

    // Validate app_id format (3-32 characters, alphanumeric + hyphens)
    if (!/^[a-zA-Z0-9-]{3,32}$/.test(app_id)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'App ID must be 3-32 characters (alphanumeric and hyphens only)' 
        },
        { status: 400 }
      );
    }

    // Check if app_id already exists in Supabase
    const exists = await projectService.appIdExists(app_id);
    if (exists) {
      return NextResponse.json(
        { success: false, error: 'App ID already registered' },
        { status: 409 }
      );
    }

    // Create project in Supabase
    const project = await projectService.createProject({
      app_id,
      owner_address: owner_address.toLowerCase(),
      app_name,
      description: description || '',
      category: category || 'Other',
      website_url: website_url || '',
      logo_url: logo_url || '',
      github_url: github_url || '',
      twitter_url: twitter_url || '',
      discord_url: discord_url || '',
      created_by: owner_address.toLowerCase()
    });

    return NextResponse.json({
      success: true,
      project: project,
      message: 'Project saved to database successfully',
      nextStep: 'blockchain_registration'
    });

  } catch (error) {
    console.error('Project registration error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let projects;

    if (owner) {
      if (!ethers.isAddress(owner)) {
        return NextResponse.json(
          { success: false, error: 'Invalid owner address' },
          { status: 400 }
        );
      }
      projects = await projectService.getProjectsByOwner(owner);
    } else if (category) {
      projects = await projectService.getProjectsByCategory(category);
    } else if (search) {
      projects = await projectService.searchProjects(search);
    } else {
      projects = await projectService.getAllProjects();
    }

    return NextResponse.json({
      success: true,
      projects: projects,
      count: projects.length
    });

  } catch (error) {
    console.error('Get projects error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

