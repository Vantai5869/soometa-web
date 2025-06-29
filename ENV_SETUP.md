# 🔧 Cấu hình Environment Variables

## 📋 Tạo file .env.local

Tạo file `.env.local` trong thư mục gốc của dự án với nội dung sau:

```env
# API Configuration
# URL cơ sở cho tất cả API calls (HTTP requests)
NEXT_PUBLIC_API_BASE_URL=https://soometa-be.onrender.com

# Socket Configuration
# URL cho real-time features (WebSocket connections)
NEXT_PUBLIC_SOCKET_SERVER_URL=https://soometa-be.onrender.com

# Development (uncomment nếu cần)
# NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
# NEXT_PUBLIC_SOCKET_SERVER_URL=http://localhost:5000

# Các biến môi trường khác (nếu có)
# NEXT_PUBLIC_APP_NAME=TopikGo
# NEXT_PUBLIC_APP_VERSION=1.0.0
```

## 🔄 Thay đổi từ cũ

### Trước đây:
- Tất cả API calls và Socket connections đều sử dụng `NEXT_PUBLIC_SOCKET_SERVER_URL`

### Bây giờ:
- **API calls** sử dụng `NEXT_PUBLIC_API_BASE_URL`
- **Socket connections** sử dụng `NEXT_PUBLIC_SOCKET_SERVER_URL`

## 📁 Cấu trúc files

```
lib/
├── configAxios.ts    # Sử dụng NEXT_PUBLIC_API_BASE_URL
├── configSocket.ts   # Sử dụng NEXT_PUBLIC_SOCKET_SERVER_URL
└── apiServices.ts    # Sử dụng configAxios
```

## 🚀 Cách sử dụng

### 1. API Calls
```typescript
import { api } from '@/lib/configAxios';

// Tự động sử dụng NEXT_PUBLIC_API_BASE_URL
const data = await api.get('/api/users');
```

### 2. Socket Connections
```typescript
import { initializeSocket } from '@/lib/configSocket';

// Tự động sử dụng NEXT_PUBLIC_SOCKET_SERVER_URL
const socket = initializeSocket();
```

## ✅ Lợi ích

1. **Tách biệt rõ ràng**: API và Socket có thể sử dụng URL khác nhau
2. **Dễ cấu hình**: Mỗi loại connection có biến riêng
3. **Linh hoạt**: Có thể deploy API và Socket trên server khác nhau
4. **Backward compatible**: Code cũ vẫn hoạt động bình thường

## 🔍 Kiểm tra cấu hình

Sau khi tạo `.env.local`, restart development server:

```bash
npm run dev
```

Kiểm tra console để đảm bảo:
- API calls sử dụng đúng `NEXT_PUBLIC_API_BASE_URL`
- Socket connections sử dụng đúng `NEXT_PUBLIC_SOCKET_SERVER_URL` 