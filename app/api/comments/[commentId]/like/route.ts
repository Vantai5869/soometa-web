import { NextRequest, NextResponse } from 'next/server';

// Function để tạo mock data động
const createMockComments = (currentUserId: string) => [
  {
    _id: '1',
    examId: '1',
    userId: 'user1',
    userName: 'Nguyễn Văn A',
    content: 'Đề thi này khá hay, phần nghe có audio rõ ràng. Cảm ơn TopikGo!',
    createdAt: '2024-01-15T10:30:00Z',
    likes: 5,
    likedBy: ['user2', 'user3'], // currentUserId chưa like comment của chính mình
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
    likedBy: [currentUserId], // currentUserId đã like comment này
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
    likedBy: [currentUserId], // currentUserId đã like comment này
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
    likedBy: [currentUserId], // currentUserId đã like reply này
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
    likedBy: [], // currentUserId chưa like reply này
    parentId: '3'
  }
];

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
}> = createMockComments('default-user');

// POST /api/comments/[commentId]/like
export async function POST(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    const { commentId } = params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Find the comment
    const commentIndex = comments.findIndex(comment => comment._id === commentId);
    
    if (commentIndex === -1) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    const comment = comments[commentIndex];
    const isLiked = comment.likedBy.includes(userId);

    // Toggle like status
    if (isLiked) {
      // Unlike
      comment.likes = Math.max(0, comment.likes - 1);
      comment.likedBy = comment.likedBy.filter(id => id !== userId);
    } else {
      // Like
      comment.likes += 1;
      comment.likedBy.push(userId);
    }

    // Update the comment in the array
    comments[commentIndex] = comment;

    // Return the updated comment with isLiked status
    const updatedComment = {
      ...comment,
      isLiked: !isLiked
    };

    return NextResponse.json({
      success: true,
      data: updatedComment
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 