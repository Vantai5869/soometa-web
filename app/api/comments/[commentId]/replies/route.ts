import { NextRequest, NextResponse } from 'next/server';

// Mock database - trong thực tế sẽ sử dụng database thật
let comments: Array<{
  _id: string;
  examId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
  likes: number;
  likedBy: string[];
  parentId: string | null;
  replyCount?: number;
}> = [
  {
    _id: '1',
    examId: '1',
    userId: 'user1',
    userName: 'Nguyễn Văn A',
    content: 'Đề thi này khá hay, phần nghe có audio rõ ràng. Cảm ơn TopikGo!',
    createdAt: '2024-01-15T10:30:00Z',
    likes: 5,
    likedBy: ['user2', 'user3'], // user1 chưa like comment của chính mình
    parentId: null,
    replyCount: 2
  },
  {
    _id: '2',
    examId: '1',
    userId: 'user2',
    userName: 'Trần Thị B',
    content: 'Mình vừa làm xong đề này, độ khó vừa phải. Phù hợp để ôn luyện.',
    createdAt: '2024-01-14T15:45:00Z',
    likes: 3,
    likedBy: ['user1'], // user1 đã like comment này
    parentId: null,
    replyCount: 1
  },
  {
    _id: '3',
    examId: '1',
    userId: 'user3',
    userName: 'Lê Văn C',
    content: 'Có ai biết cách làm câu 15 không? Mình thấy khó quá.',
    createdAt: '2024-01-13T09:20:00Z',
    likes: 2,
    likedBy: ['user1'], // user1 đã like comment này
    parentId: null,
    replyCount: 2
  },
  // Thêm một số replies để test
  {
    _id: '4',
    examId: '1',
    userId: 'user4',
    userName: 'Phạm Văn D',
    content: 'Mình cũng thấy câu 15 khó, nhưng có thể làm theo cách này...',
    createdAt: '2024-01-13T10:20:00Z',
    likes: 1,
    likedBy: ['user1'], // user1 đã like reply này
    parentId: '3'
  },
  {
    _id: '5',
    examId: '1',
    userId: 'user5',
    userName: 'Hoàng Thị E',
    content: 'Cảm ơn bạn đã chia sẻ cách làm!',
    createdAt: '2024-01-13T11:20:00Z',
    likes: 0,
    likedBy: [], // user1 chưa like reply này
    parentId: '3'
  }
];

// GET /api/comments/[commentId]/replies
export async function GET(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    const { commentId } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId'); // Để check like status

    if (!commentId) {
      return NextResponse.json(
        { error: 'commentId is required' },
        { status: 400 }
      );
    }

    // Tìm tất cả replies của comment này
    const replies = comments.filter(comment => comment.parentId === commentId);

    // Add isLiked property if userId is provided
    const repliesWithLikeStatus = replies.map(reply => ({
      ...reply,
      isLiked: userId ? reply.likedBy.includes(userId) : false
    }));

    // Sort replies by newest first
    const sortedReplies = repliesWithLikeStatus.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      success: true,
      data: sortedReplies
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 