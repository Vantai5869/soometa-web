import { io, Socket } from 'socket.io-client';

// Lấy socket server URL từ environment variable
const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'https://soometa-be.onrender.com';

// Tạo socket instance với cấu hình mặc định
let socket: Socket | null = null;

// Hàm khởi tạo socket connection
export const initializeSocket = (token?: string): Socket => {
  if (socket && socket.connected) {
    return socket;
  }

  // Tạo socket connection mới
  socket = io(SOCKET_SERVER_URL, {
    transports: ['websocket', 'polling'],
    autoConnect: true,
    auth: {
      token: token || (typeof window !== 'undefined' ? localStorage.getItem('token') || sessionStorage.getItem('token') : null)
    },
    timeout: 10000,
  });

  // Socket event listeners
  socket.on('connect', () => {
    console.log('🔌 Socket connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error);
  });

  socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });

  // Log trong development
  if (process.env.NODE_ENV === 'development') {
    socket.onAny((eventName, ...args) => {
      console.log('🔌 Socket Event:', eventName, args);
    });
  }

  return socket;
};

// Hàm lấy socket instance hiện tại
export const getSocket = (): Socket | null => {
  return socket;
};

// Hàm disconnect socket
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Hàm reconnect socket
export const reconnectSocket = (token?: string): Socket => {
  disconnectSocket();
  return initializeSocket(token);
};

// Export socket server URL để sử dụng ở nơi khác
export { SOCKET_SERVER_URL }; 