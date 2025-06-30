import { NextRequest, NextResponse } from 'next/server';

// GET /api/comments/[commentId]/replies
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const { commentId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId'); // Để check like status

    if (!commentId) {
      return NextResponse.json(
        { error: 'commentId is required' },
        { status: 400 }
      );
    }

    // TODO: Implement with real database
    // 1. Find all replies for the given commentId
    // 2. Add isLiked property based on userId if provided
    // 3. Sort replies by creation date (newest first)
    // 4. Return sorted replies with like status

    return NextResponse.json({
      success: true,
      data: [],
      message: 'Replies functionality will be implemented with real database'
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 