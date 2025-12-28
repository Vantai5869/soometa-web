'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { 
  ChatBubbleLeftIcon, 
  HeartIcon, 
  PaperAirplaneIcon, 
  UserCircleIcon, 
  FunnelIcon,
  TrashIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { commentService, Comment } from '../../lib/apiServices';

interface CommentSectionProps {
  examId: string;
}

type SortOption = 'newest' | 'oldest' | 'mostLiked';

const CommentSection: React.FC<CommentSectionProps> = ({ examId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  
  const { currentUser, token, openLoginModal } = useAuthStore();

  // Load comments from API
  const loadComments = async () => {
    setIsLoading(true);
    try {
      // Đảm bảo có token trước khi gọi API
      if (!currentUser || !token) {
        setComments([]);
        return;
      }

      const response = await commentService.getComments(
        examId, 
        currentUser._id, 
        1, 
        50, 
        sortBy
      );
      
      // Cập nhật để phù hợp với API response mới: { data: { comments: [], pagination: {} } }
      if (response.success) {
        if (response.data && typeof response.data === 'object' && 'comments' in response.data) {
          // API trả về { data: { comments: [], pagination: {} } }
          const commentsArray = Array.isArray(response.data.comments) ? response.data.comments : [];
          const typedCommentsArray = commentsArray as Comment[];
          // Đảm bảo mỗi comment có _id hợp lệ
          const validComments = typedCommentsArray.filter(comment => comment && comment._id);
          setComments(validComments);
        } else if (Array.isArray(response.data)) {
          // Fallback: API trả về trực tiếp array
          const typedResponseData = response.data as Comment[];
          const validComments = typedResponseData.filter(comment => comment && comment._id);
          setComments(validComments);
        } else {
          setComments([]);
        }
      } else {
        // API không thành công, trả về empty array
        setComments([]);
      }
    } catch (error) {
      // Có lỗi, trả về empty array
      setComments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [examId, currentUser?._id, token, sortBy]);

  // Sort comments based on selected option
  const sortedComments = React.useMemo(() => {
    // Đảm bảo comments luôn là array và lọc ra những comment không có _id
    if (!Array.isArray(comments)) {
      return [];
    }
    
    // Lọc ra những comment có _id hợp lệ
    const validComments = comments.filter(comment => comment && comment._id);
    
    const sorted = [...validComments];
    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'mostLiked':
        return sorted.sort((a, b) => b.likes - a.likes);
      default:
        return sorted;
    }
  }, [comments, sortBy]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Vừa xong';
    } else if (diffInHours < 24) {
      return `${diffInHours} giờ trước`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} ngày trước`;
    }
  };

  const handleSubmitComment = async () => {
    if (!currentUser || !token) {
      openLoginModal(() => {});
      return;
    }

    if (!newComment.trim()) return;

    setIsSubmitting(true);
    
    try {
      const response = await commentService.createComment({
        examId,
        userId: currentUser._id,
        userName: currentUser.name || currentUser.email || 'Người dùng',
        content: newComment.trim()
      });

      if (response.success && response.data) {
        setComments(prev => {
          // Đảm bảo prev luôn là array
          const prevArray = Array.isArray(prev) ? prev : [];
          return [response.data, ...prevArray];
        });
        setNewComment('');
      } else {
        // Handle error silently
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!currentUser || !token) {
      openLoginModal(() => {});
      return;
    }

    if (!replyContent.trim()) return;

    setIsSubmitting(true);
    
    try {
      const response = await commentService.createComment({
        examId,
        userId: currentUser._id,
        userName: currentUser.name || currentUser.email || 'Người dùng',
        content: replyContent.trim(),
        parentId
      });

      if (response.success && response.data) {
        // Cập nhật comment gốc để thêm reply
        setComments(prev => {
          const prevArray = Array.isArray(prev) ? prev : [];
          return prevArray.map(comment => {
            if (comment._id === parentId) {
              return {
                ...comment,
                replies: [...(comment.replies || []), response.data],
                replyCount: (comment.replyCount || 0) + 1
              };
            }
            return comment;
          });
        });
        setReplyContent('');
        setReplyingTo(null);
      } else {
        // Handle error silently
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!currentUser || !token) {
      openLoginModal(() => {});
      return;
    }

    try {
      const response = await commentService.toggleLike(commentId, {
        userId: currentUser._id
      });

      if (response.success && response.data) {
        setComments(prev => {
          // Đảm bảo prev luôn là array
          const prevArray = Array.isArray(prev) ? prev : [];
          
          const updatedComments = prevArray.map(comment => {
            // Cập nhật comment chính
            if (comment._id === commentId) {
              // Cập nhật likedBy array và likes count
              const currentLikedBy = comment.likedBy || [];
              const isCurrentlyLiked = currentLikedBy.includes(currentUser._id);
              const newLikedBy = isCurrentlyLiked 
                ? currentLikedBy.filter(id => id !== currentUser._id) // Unlike
                : [...currentLikedBy, currentUser._id]; // Like
              
              return {
                ...comment,
                likes: isCurrentlyLiked ? Math.max(0, comment.likes - 1) : comment.likes + 1,
                likedBy: newLikedBy
              };
            }
            
            // Cập nhật reply trong comment
            if (comment.replies) {
              const hasReply = comment.replies.some(reply => reply._id === commentId);
              if (hasReply) {
                return {
                  ...comment,
                  replies: comment.replies.map(reply => {
                    if (reply._id === commentId) {
                      const currentLikedBy = reply.likedBy || [];
                      const isCurrentlyLiked = currentLikedBy.includes(currentUser._id);
                      const newLikedBy = isCurrentlyLiked 
                        ? currentLikedBy.filter(id => id !== currentUser._id) // Unlike
                        : [...currentLikedBy, currentUser._id]; // Like
                      
                      return {
                        ...reply,
                        likes: isCurrentlyLiked ? Math.max(0, reply.likes - 1) : reply.likes + 1,
                        likedBy: newLikedBy
                      };
                    }
                    return reply;
                  })
                };
              }
            }
            
            return comment;
          });
          
          return updatedComments;
        });
      } else {
        // Fallback: nếu API fail, vẫn toggle locally
        setComments(prev => {
          const prevArray = Array.isArray(prev) ? prev : [];
          return prevArray.map(comment => {
            if (comment._id === commentId) {
              const currentLikedBy = comment.likedBy || [];
              const isCurrentlyLiked = currentLikedBy.includes(currentUser._id);
              const newLikedBy = isCurrentlyLiked 
                ? currentLikedBy.filter(id => id !== currentUser._id)
                : [...currentLikedBy, currentUser._id];
              
              return {
                ...comment,
                likes: isCurrentlyLiked ? Math.max(0, comment.likes - 1) : comment.likes + 1,
                likedBy: newLikedBy
              };
            }
            
            if (comment.replies) {
              return {
                ...comment,
                replies: comment.replies.map(reply => {
                  if (reply._id === commentId) {
                    const currentLikedBy = reply.likedBy || [];
                    const isCurrentlyLiked = currentLikedBy.includes(currentUser._id);
                    const newLikedBy = isCurrentlyLiked 
                      ? currentLikedBy.filter(id => id !== currentUser._id)
                      : [...currentLikedBy, currentUser._id];
                    
                    return {
                      ...reply,
                      likes: isCurrentlyLiked ? Math.max(0, reply.likes - 1) : reply.likes + 1,
                      likedBy: newLikedBy
                    };
                  }
                  return reply;
                })
              };
            }
            
            return comment;
          });
        });
      }
    } catch (error) {
      // Handle error silently
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!currentUser || !token) {
      openLoginModal(() => {});
      return;
    }

    if (!confirm('Bạn có chắc chắn muốn xóa bình luận này?')) {
      return;
    }

    try {
      const response = await commentService.deleteComment(commentId);

      if (response.success) {
        setComments(prev => {
          const prevArray = Array.isArray(prev) ? prev : [];
          
          // Xóa comment chính
          let updatedComments = prevArray.filter(comment => comment._id !== commentId);
          
          // Xóa tất cả replies của comment này khỏi giao diện
          updatedComments = updatedComments.map(comment => {
            if (comment.replies) {
              return {
                ...comment,
                replies: comment.replies.filter(reply => reply._id !== commentId)
              };
            }
            return comment;
          });
          
          // Cập nhật replyCount nếu comment bị xóa là reply
          updatedComments = updatedComments.map(comment => {
            if (comment.replies) {
              const deletedReply = comment.replies.find(reply => reply._id === commentId);
              if (deletedReply) {
                return {
                  ...comment,
                  replyCount: Math.max(0, (comment.replyCount || 0) - 1)
                };
              }
            }
            return comment;
          });
          
          return updatedComments;
        });
        
        // Đóng reply input nếu đang mở
        if (replyingTo === commentId) {
          setReplyingTo(null);
          setReplyContent('');
        }
        
        // Xóa khỏi expanded replies nếu đang mở
        setExpandedReplies(prev => {
          const newExpanded = new Set(prev);
          newExpanded.delete(commentId);
          return newExpanded;
        });
      } else {
        alert('Không thể xóa bình luận. Vui lòng thử lại.');
      }
    } catch (error) {
      alert('Có lỗi xảy ra khi xóa bình luận.');
    }
  };

  const handleLoadReplies = async (commentId: string) => {
    if (!currentUser || !token) {
      return;
    }

    try {
      const response = await commentService.getReplies(commentId, currentUser._id);

      if (response.success && response.data) {
        setComments(prev => {
          const prevArray = Array.isArray(prev) ? prev : [];
          return prevArray.map(comment => {
            if (comment._id === commentId) {
              return {
                ...comment,
                replies: response.data
              };
            }
            return comment;
          });
        });
      }
    } catch (error) {
      // Handle error silently
    }
  };

  const toggleReplies = (commentId: string) => {
    const newExpanded = new Set(expandedReplies);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
      // Load replies if not loaded yet
      const comment = comments.find(c => c._id === commentId);
      if (comment && !comment.replies) {
        handleLoadReplies(commentId);
      }
    }
    setExpandedReplies(newExpanded);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  const handleReplyKeyPress = (e: React.KeyboardEvent, parentId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitReply(parentId);
    }
  };

  // Đảm bảo comments luôn là array
  const safeComments = Array.isArray(comments) ? comments : [];
  const safeSortedComments = Array.isArray(sortedComments) ? sortedComments : [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ChatBubbleLeftIcon className="h-6 w-6 text-blue-600" />
            <h3 className="text-xl font-bold text-slate-900">Bình luận</h3>
            <span className="bg-blue-100 text-blue-700 text-sm font-medium px-2 py-1 rounded-full">
              {safeComments.length}
            </span>
          </div>
          
          {/* Sort Options */}
          {safeComments.length > 1 && (
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-4 w-4 text-slate-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="text-sm border border-slate-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="mostLiked">Nhiều like nhất</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Comment Input */}
      <div className="p-6 border-b border-slate-200">
        {currentUser ? (
          <div className="flex space-x-3">
            <div className="flex-shrink-0">
              {currentUser.avatar ? (
                <img 
                  src={currentUser.avatar} 
                  alt="Avatar" 
                  className="h-10 w-10 rounded-full"
                />
              ) : (
                <UserCircleIcon className="h-10 w-10 text-slate-400" />
              )}
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Chia sẻ suy nghĩ của bạn về đề thi này..."
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                disabled={isSubmitting}
              />
              <div className="flex justify-between items-center mt-3">
                <p className="text-sm text-slate-500">
                  Nhấn Enter để gửi, Shift + Enter để xuống dòng
                </p>
                <button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isSubmitting}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                      Gửi
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-slate-600 mb-4">Đăng nhập để bình luận</p>
            <button
              onClick={() => openLoginModal(() => {})}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Đăng nhập
            </button>
          </div>
        )}
      </div>

      {/* Comments List */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-slate-500">Đang tải bình luận...</p>
          </div>
        ) : safeSortedComments.length > 0 ? (
          <div className="divide-y divide-slate-200">
            {safeSortedComments.map((comment, index) => {
              // Đảm bảo có key unique, sử dụng index làm fallback
              const commentKey = comment._id || `comment-${index}-${Date.now()}`;
              const isExpanded = expandedReplies.has(comment._id);
              const canDelete = currentUser && (comment.userId === currentUser._id);
              
              // Tự check likedBy array để xác định trạng thái like
              const isLikedByCurrentUser = currentUser && comment.likedBy && comment.likedBy.includes(currentUser._id);
              
              return (
                <div key={commentKey} className="p-6">
                  <div className="flex space-x-3">
                    <div className="flex-shrink-0">
                      {comment.userAvatar ? (
                        <img 
                          src={comment.userAvatar} 
                          alt="Avatar" 
                          className="h-10 w-10 rounded-full"
                        />
                      ) : (
                        <UserCircleIcon className="h-10 w-10 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold text-slate-900">{comment.userName}</h4>
                        <span className="text-sm text-slate-500">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-slate-700 mb-3 leading-relaxed">
                        {comment.content}
                      </p>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => comment._id && handleLikeComment(comment._id)}
                          disabled={!comment._id}
                          className={`inline-flex items-center space-x-1 text-sm font-medium transition-colors ${
                            isLikedByCurrentUser 
                              ? 'text-red-600 hover:text-red-700' 
                              : 'text-slate-500 hover:text-slate-700'
                          } ${!comment._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {isLikedByCurrentUser ? (
                            <HeartIconSolid className="h-4 w-4" />
                          ) : (
                            <HeartIcon className="h-4 w-4" />
                          )}
                          <span>{comment.likes}</span>
                        </button>

                        <button
                          onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                          className="inline-flex items-center space-x-1 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
                        >
                          <ChatBubbleLeftRightIcon className="h-4 w-4" />
                          <span>Trả lời</span>
                        </button>

                        {canDelete && (
                          <button
                            onClick={() => comment._id && handleDeleteComment(comment._id)}
                            className="inline-flex items-center space-x-1 text-sm font-medium text-red-500 hover:text-red-700 transition-colors"
                          >
                            <TrashIcon className="h-4 w-4" />
                            <span>Xóa</span>
                          </button>
                        )}

                        {/* Show replies count and toggle */}
                        { !!comment.replyCount && comment.replyCount > 0 && (
                          <button
                            onClick={() => toggleReplies(comment._id)}
                            className="inline-flex items-center space-x-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUpIcon className="h-4 w-4" />
                            ) : (
                              <ChevronDownIcon className="h-4 w-4" />
                            )}
                            <span>{comment.replyCount} trả lời</span>
                          </button>
                        )}
                      </div>

                      {/* Reply Input */}
                      {replyingTo === comment._id && (
                        <div className="mt-4 pl-4 border-l-2 border-slate-200">
                          <div className="flex space-x-3">
                            <div className="flex-shrink-0">
                              {currentUser?.avatar ? (
                                <img 
                                  src={currentUser.avatar} 
                                  alt="Avatar" 
                                  className="h-8 w-8 rounded-full"
                                />
                              ) : (
                                <UserCircleIcon className="h-8 w-8 text-slate-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                onKeyPress={(e) => handleReplyKeyPress(e, comment._id)}
                                placeholder={`Trả lời ${comment.userName}...`}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                                rows={2}
                                disabled={isSubmitting}
                              />
                              <div className="flex justify-between items-center mt-2">
                                <button
                                  onClick={() => setReplyingTo(null)}
                                  className="text-sm text-slate-500 hover:text-slate-700"
                                >
                                  Hủy
                                </button>
                                <button
                                  onClick={() => handleSubmitReply(comment._id)}
                                  disabled={!replyContent.trim() || isSubmitting}
                                  className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  {isSubmitting ? 'Đang gửi...' : 'Gửi'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Replies */}
                      {isExpanded && comment.replies && comment.replies.length > 0 && (
                        <div className="mt-4 space-y-3">
                          {comment.replies.map((reply, replyIndex) => {
                            const replyKey = reply._id || `reply-${comment._id}-${replyIndex}`;
                            const canDeleteReply = currentUser && (reply.userId === currentUser._id);
                            
                            // Tự check likedBy array để xác định trạng thái like cho reply
                            const isReplyLikedByCurrentUser = currentUser && reply.likedBy && reply.likedBy.includes(currentUser._id);
                            
                            return (
                              <div key={replyKey} className="pl-4 border-l-2 border-slate-200">
                                <div className="flex space-x-3">
                                  <div className="flex-shrink-0">
                                    {reply.userAvatar ? (
                                      <img 
                                        src={reply.userAvatar} 
                                        alt="Avatar" 
                                        className="h-8 w-8 rounded-full"
                                      />
                                    ) : (
                                      <UserCircleIcon className="h-8 w-8 text-slate-400" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <h5 className="font-medium text-slate-900 text-sm">{reply.userName}</h5>
                                      <span className="text-xs text-slate-500">
                                        {formatDate(reply.createdAt)}
                                      </span>
                                    </div>
                                    <p className="text-slate-700 text-sm mb-2 leading-relaxed">
                                      {reply.content}
                                    </p>
                                    <div className="flex items-center space-x-3">
                                      <button
                                        onClick={() => reply._id && handleLikeComment(reply._id)}
                                        disabled={!reply._id}
                                        className={`inline-flex items-center space-x-1 text-xs font-medium transition-colors ${
                                          isReplyLikedByCurrentUser 
                                            ? 'text-red-600 hover:text-red-700' 
                                            : 'text-slate-500 hover:text-slate-700'
                                        } ${!reply._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                      >
                                        {isReplyLikedByCurrentUser ? (
                                          <HeartIconSolid className="h-3 w-3" />
                                        ) : (
                                          <HeartIcon className="h-3 w-3" />
                                        )}
                                        <span>{reply.likes}</span>
                                      </button>

                                      {canDeleteReply && (
                                        <button
                                          onClick={() => reply._id && handleDeleteComment(reply._id)}
                                          className="inline-flex items-center space-x-1 text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
                                        >
                                          <TrashIcon className="h-3 w-3" />
                                          <span>Xóa</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center">
            <ChatBubbleLeftIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSection; 