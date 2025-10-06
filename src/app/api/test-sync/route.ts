import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Test sync endpoint called');
    return NextResponse.json({
      success: true,
      message: 'Test sync endpoint working'
    });
  } catch (error) {
    console.error('Test sync error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
