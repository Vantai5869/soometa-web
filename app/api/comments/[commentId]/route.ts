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
    likedBy: ['user2', 'user3'],
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
    likedBy: ['user1'],
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
    likedBy: ['user1'],
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
    likedBy: ['user1'],
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
    likedBy: [],
    parentId: '3'
  }
];

// DELETE /api/comments/[commentId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const { commentId } = await params;

    if (!commentId) {
      return NextResponse.json(
        { error: 'commentId is required' },
        { status: 400 }
      );
    }

    // Tìm comment cần xóa
    const commentToDelete = comments.find(comment => comment._id === commentId);
    
    if (!commentToDelete) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Xóa comment và tất cả replies của nó
    const deletedComments = [];
    
    // Xóa comment chính
    comments = comments.filter(comment => comment._id !== commentId);
    deletedComments.push(commentToDelete);
    
    // Xóa tất cả replies của comment này
    const repliesToDelete = comments.filter(comment => comment.parentId === commentId);
    comments = comments.filter(comment => comment.parentId !== commentId);
    deletedComments.push(...repliesToDelete);

    // Cập nhật replyCount của comment cha nếu comment bị xóa là reply
    if (commentToDelete.parentId) {
      const parentComment = comments.find(c => c._id === commentToDelete.parentId);
      if (parentComment && parentComment.replyCount) {
        parentComment.replyCount = Math.max(0, parentComment.replyCount - 1);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedComments.length} comment(s)`,
      data: {
        deletedCount: deletedComments.length,
        deletedComments: deletedComments.map(c => c._id)
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 