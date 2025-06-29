# API Configuration & Services

## 📁 Cấu trúc thư mục

```
lib/
├── configAxios.ts    # Cấu hình axios cho API calls
├── configSocket.ts   # Cấu hình socket.io cho real-time
├── apiServices.ts    # Các service API
└── README.md         # Hướng dẫn sử dụng
```

## 🔧 Cấu hình

### 1. Environment Variables
Tạo file `.env.local` trong thư mục gốc:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://soometa-be.onrender.com

# Socket Configuration (cho real-time features)
NEXT_PUBLIC_SOCKET_SERVER_URL=https://soometa-be.onrender.com

# Development (uncomment if needed)
# NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
# NEXT_PUBLIC_SOCKET_SERVER_URL=http://localhost:5000
```

### 2. Cài đặt dependencies
```bash
npm install axios socket.io-client
```

## 🚀 Cách sử dụng

### 1. API Calls (HTTP)

```typescript
import { api } from '@/lib/configAxios';

// GET request
const data = await api.get('/api/users');

// POST request
const response = await api.post('/api/users', { name: 'John' });

// PUT request
const updated = await api.put('/api/users/123', { name: 'Jane' });

// DELETE request
await api.delete('/api/users/123');
```

### 2. Socket Connection (Real-time)

```typescript
import { initializeSocket, getSocket, disconnectSocket } from '@/lib/configSocket';

// Khởi tạo socket connection
const socket = initializeSocket();

// Lắng nghe events
socket.on('userJoined', (data) => {
  console.log('User joined:', data);
});

// Emit events
socket.emit('joinRoom', { roomId: 'exam123' });

// Disconnect khi cần
disconnectSocket();
```

### 3. Sử dụng services

```typescript
import { commentService, userService, examService } from '@/lib/apiServices';

// Comments
const comments = await commentService.getComments('exam123', 'user456');
const newComment = await commentService.createComment({
  examId: 'exam123',
  userId: 'user456',
  userName: 'John Doe',
  content: 'Great exam!'
});

// Users
const profile = await userService.getProfile('user123');
const updated = await userService.updateProfile('user123', { name: 'Jane' });

// Exams
const exam = await examService.getExam('exam123');
const result = await examService.submitExamResult('exam123', { score: 85 });
```

## 🔒 Tính năng bảo mật

### 1. Authentication
- **API**: Tự động thêm Bearer token vào header
- **Socket**: Tự động thêm token vào auth object
- Xử lý 401/403 errors
- Tự động logout khi token hết hạn

### 2. Error Handling
- Xử lý network errors
- Log errors trong development
- Standardized error responses

### 3. Request/Response Logging
- Log tất cả requests trong development
- Log responses và errors
- Socket events logging
- Dễ debug và monitor

## 📊 Response Format

### Success Response
```typescript
{
  success: true,
  data: any,
  message?: string
}
```

### Error Response
```typescript
{
  success: false,
  error: string,
  code?: string
}
```

## 🛠️ Customization

### 1. Thêm service mới

```typescript
// Trong apiServices.ts
export const newService = {
  getData: async (id: string) => {
    try {
      const response = await api.get(`/api/new/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  }
};
```

### 2. Thêm socket event handler

```typescript
// Trong component
import { getSocket } from '@/lib/configSocket';

useEffect(() => {
  const socket = getSocket();
  if (socket) {
    socket.on('newComment', (comment) => {
      // Handle new comment
    });
  }
}, []);
```

### 3. Thay đổi base URLs

```typescript
// Trong configAxios.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://your-api.com';

// Trong configSocket.ts
const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'https://your-socket.com';
```

## 🔍 Debug

### 1. Development Logs
- API requests được log với emoji 🚀
- API responses được log với emoji ✅
- API errors được log với emoji ❌
- Socket events được log với emoji 🔌

### 2. Network Tab
- Kiểm tra HTTP requests trong browser dev tools
- Verify WebSocket connections
- Monitor response times

## 📝 Best Practices

1. **Luôn sử dụng services** thay vì gọi API trực tiếp
2. **Handle errors** trong try-catch blocks
3. **Type your responses** với TypeScript interfaces
4. **Use environment variables** cho different environments
5. **Test API calls** trong development trước khi deploy
6. **Disconnect socket** khi component unmount
7. **Reconnect socket** khi token thay đổi

## 🚨 Troubleshooting

### Common Issues

1. **CORS Error**: Kiểm tra server CORS configuration
2. **401 Unauthorized**: Kiểm tra token và authentication
3. **Network Error**: Kiểm tra API URL và internet connection
4. **Socket Connection Failed**: Kiểm tra socket server URL
5. **Timeout**: Tăng timeout trong config nếu cần

### Debug Steps

1. Kiểm tra console logs
2. Verify environment variables
3. Test API endpoint trực tiếp
4. Check network tab trong dev tools
5. Verify socket connection status

## 🔄 Migration từ cũ

Nếu bạn đang sử dụng `NEXT_PUBLIC_SOCKET_SERVER_URL` cho API calls:

1. **Cập nhật .env.local**:
```env
NEXT_PUBLIC_API_BASE_URL=https://soometa-be.onrender.com
NEXT_PUBLIC_SOCKET_SERVER_URL=https://soometa-be.onrender.com
```

2. **API calls** sẽ tự động sử dụng `NEXT_PUBLIC_API_BASE_URL`
3. **Socket connections** sẽ sử dụng `NEXT_PUBLIC_SOCKET_SERVER_URL`
4. **Không cần thay đổi code** khác 