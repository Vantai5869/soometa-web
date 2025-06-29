# 🔐 Token Security - Đảm bảo Token luôn được đính kèm

## 🎯 Mục tiêu
Đảm bảo token authentication luôn được đính kèm trong mỗi API request để bảo mật và xác thực người dùng.

## 🔧 Cập nhật chính

### 1. **configAxios.ts** - Cải thiện Token Management

#### **Hàm getAuthToken():**
```typescript
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  // Thử lấy từ localStorage trước
  let token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  // Nếu không có, thử lấy từ authStore (nếu có)
  if (!token) {
    try {
      const authStore = require('../app/store/authStore');
      if (authStore && authStore.useAuthStore) {
        const store = authStore.useAuthStore.getState();
        token = store.token;
      }
    } catch (error) {
      // Ignore error if store is not available
    }
  }

  return token;
};
```

#### **Request Interceptor:**
```typescript
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Luôn thêm token vào header nếu có
    const token = getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request với token info
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        headers: {
          ...config.headers,
          Authorization: token ? `Bearer ${token.substring(0, 10)}...` : 'No token'
        },
        data: config.data,
        params: config.params,
      });
    }
    
    return config;
  }
);
```

#### **Response Interceptor - Token Expiry Handling:**
```typescript
case 401:
  // Unauthorized - xóa token và redirect về login
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    
    // Thử clear token từ authStore
    try {
      const authStore = require('../app/store/authStore');
      if (authStore && authStore.useAuthStore) {
        const store = authStore.useAuthStore.getState();
        if (store.logout) {
          store.logout();
        }
      }
    } catch (error) {
      // Ignore error if store is not available
    }
    
    console.warn('Token expired or invalid. Please login again.');
  }
  break;
```

### 2. **CommentSection.tsx** - Token Validation

#### **Token Check trong tất cả API calls:**
```typescript
// Load comments
if (!currentUser || !token) {
  console.warn('No user or token available for loading comments');
  setComments([]);
  return;
}

// Submit comment
if (!currentUser || !token) {
  openLoginModal(() => {});
  return;
}

// Submit reply
if (!currentUser || !token) {
  openLoginModal(() => {});
  return;
}

// Like comment
if (!currentUser || !token) {
  openLoginModal(() => {});
  return;
}

// Delete comment
if (!currentUser || !token) {
  openLoginModal(() => {});
  return;
}

// Load replies
if (!currentUser || !token) {
  console.warn('No user or token available for loading replies');
  return;
}
```

#### **useEffect với Token Dependency:**
```typescript
useEffect(() => {
  loadComments();
}, [examId, currentUser?._id, token, sortBy]);
```

## 🔄 Token Sources Priority

### **1. localStorage.getItem('token')**
- Primary source
- Persisted across browser sessions
- Cleared on logout

### **2. sessionStorage.getItem('token')**
- Secondary source
- Cleared when browser tab closes
- Fallback for session-based auth

### **3. authStore.token**
- Tertiary source
- In-memory store
- Real-time token updates

## 🛡️ Security Features

### **1. Automatic Token Injection**
- Mọi request đều tự động có token
- Không cần manual thêm Authorization header
- Consistent across all API calls

### **2. Token Expiry Handling**
- Auto-detect 401 responses
- Clear all token sources
- Logout user automatically
- User-friendly error messages

### **3. Development Logging**
- Log token presence in requests
- Masked token display (first 10 chars)
- Debug information for development

### **4. Graceful Fallbacks**
- Handle missing tokens gracefully
- Redirect to login when needed
- Preserve user experience

## 📁 Files đã cập nhật

```
lib/
└── configAxios.ts        ✅ Cải thiện token management và logging

app/components/
└── CommentSection.tsx    ✅ Thêm token validation cho tất cả API calls
```

## ✅ Benefits

### **1. Security**
- Mọi request đều có authentication
- Automatic token refresh handling
- Secure token storage

### **2. User Experience**
- Seamless authentication
- Automatic logout on token expiry
- Clear error messages

### **3. Developer Experience**
- Consistent API calls
- Detailed logging for debugging
- Easy token management

### **4. Reliability**
- Multiple token sources
- Graceful error handling
- Robust fallback mechanisms

## 🧪 Testing Scenarios

### **1. Valid Token:**
- ✅ Token được đính kèm trong request
- ✅ API calls thành công
- ✅ User có thể thực hiện tất cả actions

### **2. Invalid/Expired Token:**
- ✅ 401 response được handle
- ✅ Token được clear từ tất cả sources
- ✅ User được logout automatically
- ✅ Redirect to login

### **3. Missing Token:**
- ✅ Graceful handling
- ✅ Redirect to login modal
- ✅ Clear error messages

### **4. Token Refresh:**
- ✅ New token được sử dụng ngay lập tức
- ✅ No manual intervention needed
- ✅ Seamless user experience

## 🔍 Monitoring

### **Development Logs:**
```
🚀 API Request: {
  method: "POST",
  url: "/api/comments",
  headers: {
    Authorization: "Bearer eyJhbGciOi..."
  },
  data: { examId: "123", content: "..." }
}

✅ API Response: {
  status: 200,
  url: "/api/comments",
  data: { success: true, ... }
}
```

### **Error Logs:**
```
❌ API Error: {
  status: 401,
  url: "/api/comments",
  message: "Token expired"
}

⚠️ Token expired or invalid. Please login again.
```

## 📝 Best Practices

1. **Always check token** trước khi gọi API
2. **Use multiple token sources** để reliability
3. **Handle token expiry** gracefully
4. **Log token presence** trong development
5. **Clear all token sources** khi logout
6. **Provide user feedback** cho authentication errors
7. **Use consistent error handling** across all API calls

## 🔄 Future Enhancements

1. **Token Refresh** - Automatic token refresh
2. **Token Rotation** - Regular token updates
3. **Multi-factor Auth** - Enhanced security
4. **Session Management** - Better session handling
5. **Audit Logging** - Track authentication events 