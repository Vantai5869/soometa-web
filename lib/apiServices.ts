import { api } from './configAxios';

// Types
export interface Comment {
    _id: string;
    examId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    content: string;
    createdAt: string;
    likes: number;
    isLiked?: boolean;
    likedBy?: string[]; // Thêm thuộc tính likedBy để lưu danh sách user đã like
    parentId?: string; // ID của comment gốc (nếu là reply)
    replies?: Comment[]; // Danh sách replies
    replyCount?: number; // Số lượng replies
}

export interface CreateCommentData {
    examId: string;
    userId: string;
    userName: string;
    content: string;
    parentId?: string; // Thêm parentId cho replies
}

export interface LikeCommentData {
    userId: string;
}

export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface CommentsResponse {
    success: boolean;
    data: {
        comments: Comment[];
        pagination: PaginationInfo;
    };
    message?: string;
    error?: string;
}

export interface CommentResponse {
    success: boolean;
    data: Comment;
    message?: string;
    error?: string;
}

export interface RepliesResponse {
    success: boolean;
    data: Comment[];
    message?: string;
    error?: string;
}

// Comment API Services
export const commentService = {
    // Get comments by exam ID
    getComments: async (examId: string, userId?: string, page = 1, limit = 10, sort = 'newest'): Promise<CommentsResponse> => {
        try {
            const response = await api.get<CommentsResponse>('/api/comments', {
                params: {
                    examId,
                    userId,
                    page,
                    limit,
                    sort
                }
            });

            // Đảm bảo response có format đúng
            if (response && response.success) {
                
                // Kiểm tra format mới: { data: { comments: [], pagination: {} } }
                if (response.data && typeof response.data === 'object' && 'comments' in response.data) {
                    return {
                        success: true,
                        data: {
                            comments: Array.isArray(response.data.comments) ? response.data.comments : [],
                            pagination: response.data.pagination || { page, limit, total: 0, totalPages: 0 }
                        },
                        message: response.message
                    };
                }
                
                // Fallback: API trả về trực tiếp array
                if (Array.isArray(response.data)) {
                    return {
                        success: true,
                        data: {
                            comments: response.data as Comment[],
                            pagination: { page, limit, total: (response.data as Comment[]).length, totalPages: 1 }
                        },
                        message: response.message
                    };
                }
            }

            // Fallback nếu response không đúng format
            return {
                success: false,
                data: {
                    comments: [],
                    pagination: { page, limit, total: 0, totalPages: 0 }
                },
                error: 'Invalid response format'
            };
        } catch (error) {
            console.error('Error fetching comments:', error);
            return {
                success: false,
                data: {
                    comments: [],
                    pagination: { page, limit, total: 0, totalPages: 0 }
                },
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    },

    // Get replies of a comment
    getReplies: async (commentId: string, userId?: string): Promise<RepliesResponse> => {
        try {
            const response = await api.get<RepliesResponse>(`/api/comments/${commentId}/replies`, {
                params: { userId }
            });

            if (response && response.success) {
                return {
                    success: true,
                    data: Array.isArray(response.data) ? response.data : [],
                    message: response.message
                };
            }

            return {
                success: false,
                data: [],
                error: 'Invalid response format'
            };
        } catch (error) {
            console.error('Error fetching replies:', error);
            return {
                success: false,
                data: [],
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    },

    // Create new comment or reply
    createComment: async (commentData: CreateCommentData): Promise<CommentResponse> => {
        try {
            const response = await api.post<CommentResponse>('/api/comments', commentData);

            // Đảm bảo response có format đúng
            if (response && typeof response === 'object') {
                return {
                    success: response.success || false,
                    data: response.data,
                    message: response.message,
                    error: response.error
                };
            }

            return {
                success: false,
                data: {} as Comment,
                error: 'Invalid response format'
            };
        } catch (error) {
            console.error('Error creating comment:', error);
            return {
                success: false,
                data: {} as Comment,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    },

    // Like/unlike comment
    toggleLike: async (commentId: string, likeData: LikeCommentData): Promise<CommentResponse> => {
        try {
            const response = await api.post<CommentResponse>(`/api/comments/${commentId}/like`, likeData);

            // Đảm bảo response có format đúng
            if (response && typeof response === 'object') {
                return {
                    success: response.success || false,
                    data: response.data,
                    message: response.message,
                    error: response.error
                };
            }

            return {
                success: false,
                data: {} as Comment,
                error: 'Invalid response format'
            };
        } catch (error) {
            console.error('Error toggling comment like:', error);
            return {
                success: false,
                data: {} as Comment,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    },

    // Delete comment
    deleteComment: async (commentId: string): Promise<{ success: boolean; message?: string; error?: string }> => {
        try {
            const response = await api.delete(`/api/comments/${commentId}`);

            if (response && typeof response === 'object') {
                return {
                    success: response.success || false,
                    message: response.message,
                    error: response.error
                };
            }

            return {
                success: false,
                error: 'Invalid response format'
            };
        } catch (error) {
            console.error('Error deleting comment:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
};

// User API Services (example)
export const userService = {
    // Get user profile
    getProfile: async (userId: string) => {
        try {
            const response = await api.get(`/api/users/${userId}`);
            return response;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            throw error;
        }
    },

    // Update user profile
    updateProfile: async (userId: string, profileData: any) => {
        try {
            const response = await api.put(`/api/users/${userId}`, profileData);
            return response;
        } catch (error) {
            console.error('Error updating user profile:', error);
            throw error;
        }
    }
};

// Exam API Services (example)
export const examService = {
    // Get exam details
    getExam: async (examId: string) => {
        try {
            const response = await api.get(`/api/exams/${examId}`);
            return response;
        } catch (error) {
            console.error('Error fetching exam:', error);
            throw error;
        }
    },

    // Submit exam result
    submitExamResult: async (examId: string, resultData: any) => {
        try {
            const response = await api.post(`/api/exams/${examId}/submit`, resultData);
            return response;
        } catch (error) {
            console.error('Error submitting exam result:', error);
            throw error;
        }
    }
};

// Auth API Services (example)
export const authService = {
    // Login
    login: async (credentials: { email: string; password: string }) => {
        try {
            const response = await api.post('/api/auth/login', credentials);
            return response;
        } catch (error) {
            console.error('Error logging in:', error);
            throw error;
        }
    },

    // Register
    register: async (userData: { name: string; email: string; password: string }) => {
        try {
            const response = await api.post('/api/auth/register', userData);
            return response;
        } catch (error) {
            console.error('Error registering:', error);
            throw error;
        }
    },

    // Logout
    logout: async () => {
        try {
            const response = await api.post('/api/auth/logout');
            return response;
        } catch (error) {
            console.error('Error logging out:', error);
            throw error;
        }
    }
}; 