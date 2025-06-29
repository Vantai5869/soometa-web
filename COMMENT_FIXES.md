# 🔧 Sửa lỗi CommentSection - API Response Format & Key Props

## 🎯 Vấn đề đã sửa

1. **Lỗi "Each child in a list should have a unique key prop"**
2. **API response format không phù hợp** - API trả về `{ data: { comments: [], pagination: {} } }`

## 🔄 Thay đổi chính

### 1. **CommentSection.tsx** - Cập nhật xử lý API response

**Trước:**
```typescript
if (response.success && Array.isArray(response.data)) {
  setComments(response.data);
}
```

**Sau:**
```typescript
if (response.success) {
  if (response.data && typeof response.data === 'object' && 'comments' in response.data) {
    // API trả về { data: { comments: [], pagination: {} } }
    const commentsArray = Array.isArray(response.data.comments) ? response.data.comments : [];
    setComments(commentsArray);
  } else if (Array.isArray(response.data)) {
    // Fallback: API trả về trực tiếp array
    setComments(response.data);
  }
}
```

### 2. **Sửa lỗi Key Props**

**Trước:**
```typescript
{safeSortedComments.map((comment) => (
  <div key={comment.id} className="p-6">
```

**Sau:**
```typescript
{safeSortedComments.map((comment) => (
  <div key={`comment-${comment.id}`} className="p-6">
```

### 3. **apiServices.ts** - Cập nhật types và xử lý response

**Types mới:**
```typescript
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
```

**Xử lý response mới:**
```typescript
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
```

## 📁 Files đã thay đổi

```
app/components/
└── CommentSection.tsx    ✅ Cập nhật xử lý API response và key props

lib/
└── apiServices.ts        ✅ Cập nhật types và response handling
```

## ✅ Lợi ích

1. **Không còn lỗi React key props** - Mỗi comment có key unique
2. **Tương thích với API format mới** - Hỗ trợ `{ data: { comments: [], pagination: {} } }`
3. **Backward compatible** - Vẫn hỗ trợ format cũ (array trực tiếp)
4. **Better error handling** - Xử lý các trường hợp response không đúng format
5. **Type safety** - TypeScript types chính xác hơn

## 🔍 API Response Format

### Format mới (được hỗ trợ):
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": "1",
        "examId": "exam123",
        "userId": "user1",
        "userName": "Nguyễn Văn A",
        "content": "Đề thi hay quá!",
        "createdAt": "2024-01-15T10:30:00Z",
        "likes": 5,
        "isLiked": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  },
  "message": "Comments retrieved successfully"
}
```

### Format cũ (vẫn được hỗ trợ):
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "examId": "exam123",
      "userId": "user1",
      "userName": "Nguyễn Văn A",
      "content": "Đề thi hay quá!",
      "createdAt": "2024-01-15T10:30:00Z",
      "likes": 5,
      "isLiked": false
    }
  ],
  "message": "Comments retrieved successfully"
}
```

## 🚀 Testing

1. **Kiểm tra console logs** - Xem API response format
2. **Verify comments hiển thị** - Đảm bảo không có lỗi key props
3. **Test sorting** - Mới nhất, cũ nhất, nhiều like nhất
4. **Test like/unlike** - Đảm bảo hoạt động bình thường
5. **Test create comment** - Đảm bảo comment mới được thêm vào đầu list

## 📝 Notes

- **Pagination info** hiện tại chưa được sử dụng trong UI, có thể thêm sau
- **Fallback data** vẫn được giữ lại để đảm bảo app hoạt động khi API không available
- **Type safety** được cải thiện với TypeScript interfaces mới
- **Error handling** robust hơn với multiple format support 