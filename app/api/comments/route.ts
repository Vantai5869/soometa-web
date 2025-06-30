import { NextRequest, NextResponse } from 'next/server';

// GET /api/comments?examId=123
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const examId = searchParams.get('examId');
    const userId = searchParams.get('userId'); // Để check like status
    const sort = searchParams.get('sort') || 'newest';

    if (!examId) {
      return NextResponse.json(
        { error: 'examId is required' },
        { status: 400 }
      );
    }

    // TODO: Implement with real database
    // 1. Query comments by examId
    // 2. Add isLiked property based on userId if provided
    // 3. Sort comments based on sort parameter
    // 4. Implement pagination if needed

    return NextResponse.json({
      success: true,
      data: {
        comments: [],
        pagination: {
          page: 1,
          limit: 0,
          total: 0,
          totalPages: 1
        }
      },
      message: 'Comments functionality will be implemented with real database'
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/comments
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { examId, userId, userName, content, parentId } = body;

    // Validation
    if (!examId || !userId || !userName || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content cannot be empty' },
        { status: 400 }
      );
    }

    // TODO: Implement with real database
    // 1. Insert new comment into database
    // 2. Update replyCount of parent comment if this is a reply
    // 3. Return the newly created comment

    return NextResponse.json({
      success: true,
      message: 'Comment creation will be implemented with real database'
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 