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

    // TODO: Thay thế bằng database query thật
    // Hiện tại trả về empty array để test với data thật từ frontend
    const comments: any[] = [];

    return NextResponse.json({
      success: true,
      data: {
        comments: comments,
        pagination: {
          page: 1,
          limit: comments.length,
          total: comments.length,
          totalPages: 1
        }
      }
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

    // TODO: Thay thế bằng database insert thật
    const newComment = {
      _id: Date.now().toString(),
      examId,
      userId,
      userName,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      likes: 0,
      likedBy: [],
      parentId: parentId || null
    };

    return NextResponse.json({
      success: true,
      data: newComment
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 