# 💬 Tính năng Reply và Delete Comments

## 🎯 Tính năng mới

### 1. **Reply Comments** - Trả lời bình luận
- Người dùng có thể trả lời bất kỳ comment nào
- Hỗ trợ nested replies (chỉ 1 level)
- UI thân thiện với reply input inline

### 2. **Delete Comments** - Xóa bình luận
- Chỉ chủ sở hữu comment mới có thể xóa
- Confirmation dialog trước khi xóa
- Xóa cả comment gốc và replies

### 3. **Expand/Collapse Replies** - Mở/đóng replies
- Hiển thị số lượng replies
- Lazy loading replies khi expand
- Toggle expand/collapse với animation

## 🔄 API Endpoints

### **Tạo comment gốc:**
```http
POST /api/comments
{
  "examId": "exam123",
  "userId": "user123",
  "userName": "John Doe",
  "content": "Great exam!"
}
```

### **Tạo reply:**
```http
POST /api/comments
{
  "examId": "exam123",
  "userId": "user456",
  "userName": "Jane Smith",
  "content": "I agree!",
  "parentId": "comment123" // ID của comment gốc
}
```

### **Lấy replies của một comment:**
```http
GET /api/comments/comment123/replies
```

### **Xóa comment:**
```http
DELETE /api/comments/comment123
```

## 📁 Files đã cập nhật

```
lib/
└── apiServices.ts        ✅ Thêm interfaces và API methods cho replies

app/components/
└── CommentSection.tsx    ✅ Thêm UI và logic cho reply/delete
```

## 🔧 Interface Updates

### **Comment Interface:**
```typescript
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
    parentId?: string;     // ID của comment gốc (nếu là reply)
    replies?: Comment[];   // Danh sách replies
    replyCount?: number;   // Số lượng replies
}
```

### **CreateCommentData Interface:**
```typescript
export interface CreateCommentData {
    examId: string;
    userId: string;
    userName: string;
    content: string;
    parentId?: string;     // Thêm parentId cho replies
}
```

## 🎨 UI Features

### **Action Buttons:**
- **Like/Unlike** - Heart icon với counter
- **Reply** - ChatBubbleLeftRightIcon với "Trả lời" text
- **Delete** - TrashIcon với "Xóa" text (chỉ hiển thị cho chủ sở hữu)
- **Expand Replies** - ChevronDown/UpIcon với reply count

### **Reply Input:**
- Inline textarea với placeholder
- Avatar của user hiện tại
- Cancel và Send buttons
- Keyboard shortcuts (Enter to send, Shift+Enter for new line)

### **Replies Display:**
- Indented với border-left
- Smaller avatar và text size
- Same action buttons như comment gốc
- Proper spacing và visual hierarchy

## 🚀 State Management

### **New State Variables:**
```typescript
const [replyingTo, setReplyingTo] = useState<string | null>(null);
const [replyContent, setReplyContent] = useState('');
const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
```

### **Key Functions:**
- `handleSubmitReply()` - Tạo reply mới
- `handleDeleteComment()` - Xóa comment với confirmation
- `handleLoadReplies()` - Lazy load replies từ API
- `toggleReplies()` - Expand/collapse replies
- `handleReplyKeyPress()` - Keyboard shortcuts cho reply

## ✅ Features Breakdown

### **Reply System:**
1. **Click "Trả lời"** → Mở reply input
2. **Type reply** → Real-time validation
3. **Press Enter** → Submit reply
4. **API call** → Tạo reply với parentId
5. **Update UI** → Thêm reply vào comment gốc
6. **Reset state** → Clear input và close

### **Delete System:**
1. **Click "Xóa"** → Show confirmation dialog
2. **Confirm** → API call to delete
3. **Success** → Remove from UI
4. **Error** → Show error message

### **Expand/Collapse:**
1. **Show reply count** → "X trả lời" button
2. **Click to expand** → Load replies if needed
3. **Display replies** → Indented layout
4. **Click to collapse** → Hide replies

## 🔒 Security & Permissions

### **Delete Permission:**
```typescript
const canDelete = currentUser && (comment.userId === currentUser._id);
```

### **Authentication Check:**
- Tất cả actions đều check `currentUser`
- Redirect to login modal nếu chưa đăng nhập
- Proper error handling cho unauthorized actions

## 🎯 User Experience

### **Visual Feedback:**
- Loading states cho tất cả actions
- Disabled states cho invalid inputs
- Hover effects cho buttons
- Smooth transitions

### **Keyboard Support:**
- Enter to submit comment/reply
- Shift+Enter for new line
- Escape to cancel reply

### **Responsive Design:**
- Mobile-friendly button sizes
- Proper spacing cho touch targets
- Readable text sizes

## 🧪 Testing Scenarios

### **Reply Testing:**
1. **Unauthenticated user** → Redirect to login
2. **Empty reply** → Disabled submit button
3. **Valid reply** → Success submission
4. **API error** → Error handling
5. **Keyboard shortcuts** → Enter/Shift+Enter

### **Delete Testing:**
1. **Not owner** → Delete button hidden
2. **Owner** → Delete button visible
3. **Confirmation** → Dialog appears
4. **Cancel** → No action taken
5. **Confirm** → Comment deleted
6. **API error** → Error message shown

### **Expand/Collapse Testing:**
1. **No replies** → No expand button
2. **Has replies** → Show count and button
3. **First expand** → Load replies from API
4. **Subsequent expands** → Use cached replies
5. **Collapse** → Hide replies

## 📝 Best Practices

1. **Lazy Loading** - Chỉ load replies khi cần
2. **Optimistic Updates** - Update UI trước API response
3. **Error Handling** - Graceful fallbacks cho tất cả errors
4. **Accessibility** - Proper ARIA labels và keyboard support
5. **Performance** - Efficient re-renders với proper keys
6. **Security** - Server-side validation cho tất cả actions

## 🔄 Future Enhancements

1. **Nested Replies** - Hỗ trợ multiple levels
2. **Edit Comments** - Chỉnh sửa comment đã post
3. **Report Comments** - Báo cáo comment không phù hợp
4. **Rich Text** - Formatting options (bold, italic, links)
5. **Mentions** - @username functionality
6. **Notifications** - Real-time notifications cho replies

## 🎨 UI Screenshots (Mô tả)

### **Comment với Action Buttons:**
```
┌─────────────────────────────────────┐
│ 👤 Nguyễn Văn A    2 giờ trước      │
│ Đề thi này khá hay!                 │
│                                     │
│ ❤️ 5  💬 Trả lời  🗑️ Xóa  📄 2 trả lời │
└─────────────────────────────────────┘
```

### **Reply Input:**
```
┌─────────────────────────────────────┐
│ 👤 Nguyễn Văn A    2 giờ trước      │
│ Đề thi này khá hay!                 │
│                                     │
│ ❤️ 5  💬 Trả lời  🗑️ Xóa  📄 2 trả lời │
│                                     │
│ │ 👤 Bạn (reply input)              │
│ │ ┌─────────────────────────────┐   │
│ │ │ Trả lời Nguyễn Văn A...     │   │
│ │ └─────────────────────────────┘   │
│ │ [Hủy]                    [Gửi]   │
└─────────────────────────────────────┘
```

### **Expanded Replies:**
```
┌─────────────────────────────────────┐
│ 👤 Nguyễn Văn A    2 giờ trước      │
│ Đề thi này khá hay!                 │
│                                     │
│ ❤️ 5  💬 Trả lời  🗑️ Xóa  📄 2 trả lời │
│                                     │
│ │ 👤 Trần Thị B    1 giờ trước      │
│ │ Tôi cũng thấy vậy!                │
│ │ ❤️ 2  🗑️ Xóa                      │
│ │                                   │
│ │ 👤 Lê Văn C    30 phút trước      │
│ │ Đồng ý với bạn!                   │
│ │ ❤️ 1  🗑️ Xóa                      │
└─────────────────────────────────────┘
```

## 🔧 Implementation Notes

### **Key Components:**
- **Reply Input**: Inline textarea với validation
- **Action Buttons**: Conditional rendering dựa trên permissions
- **Replies List**: Indented layout với proper spacing
- **Expand/Collapse**: Toggle state với lazy loading

### **State Management:**
- **replyingTo**: Track comment đang reply
- **replyContent**: Content của reply input
- **expandedReplies**: Set của comment IDs đã expand

### **API Integration:**
- **createComment**: Hỗ trợ parentId cho replies
- **getReplies**: Lazy load replies khi cần
- **deleteComment**: Xóa với confirmation

### **Error Handling:**
- **Network errors**: Graceful fallbacks
- **Permission errors**: User-friendly messages
- **Validation errors**: Real-time feedback 