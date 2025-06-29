// hooks/useHomepageSocket.ts (Frontend - Đặt trong thư mục hooks của bạn)
import { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { initializeSocket, disconnectSocket } from '../../lib/configSocket';

// Lấy URL từ biến môi trường, nếu không có thì dùng giá trị mặc định
const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL; // Thay bằng URL server của bạn

interface LoggedInUserData { // Định nghĩa kiểu dữ liệu cho người dùng đã đăng nhập (nếu có)
  _id: string;
  name?: string;
  email?: string;
  // Thêm các trường khác nếu cần
}

/**
 * Custom Hook để quản lý kết nối Socket.IO từ trang chủ.
 * @param loggedInUser - Thông tin người dùng đã đăng nhập (nếu có), hoặc null nếu là khách.
 */
export const useHomepageSocket = (loggedInUser: LoggedInUserData | null) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Khởi tạo kết nối Socket.IO sử dụng configSocket
    socketRef.current = initializeSocket();

    const socket = socketRef.current;

    socket.on('connect', () => {
      // Gửi thông tin định danh lên server
      if (loggedInUser) {
        socket.emit('USER_CAME_ONLINE', {
            userId: loggedInUser._id,
            name: loggedInUser.name || loggedInUser.email,
            email: loggedInUser.email, // << Gửi email
            type: 'user',
        });
      } else {
        socket.emit('USER_CAME_ONLINE', {
          // id: socket.id, // Server sẽ tự lấy socket.id nếu không có userId
          type: 'guest', // Đánh dấu là khách
        });
      }
    });

    socket.on('disconnect', (reason: Socket.DisconnectReason) => {
      console.log('Trang chủ: Đã ngắt kết nối khỏi máy chủ Socket.IO:', reason);
    });

    socket.on('connect_error', (err: Error) => {
    //   console.error('Trang chủ: Lỗi kết nối Socket:', err.message);
    });

    // Cleanup khi component unmount hoặc loggedInUser thay đổi
    return () => {
      if (socket) {
        console.log('Trang chủ: Đang ngắt kết nối socket...');
        disconnectSocket();
      }
    };
  }, [loggedInUser]); // Chạy lại effect nếu trạng thái đăng nhập của người dùng thay đổi

  // Hook này không cần trả về gì, nó chỉ quản lý kết nối
};

/*
// --- Cách sử dụng Hook trong component Trang chủ ---
// import { useState, useEffect } from 'react';
// import { useHomepageSocket } from './hooks/useHomepageSocket'; // Điều chỉnh đường dẫn

// interface UserData { _id: string; name?: string; email?: string; }

// function HomePageComponent() {
//   const [currentUser, setCurrentUser] = useState<UserData | null>(null);

//   useEffect(() => {
//     // Giả lập lấy thông tin người dùng đã đăng nhập (ví dụ từ localStorage hoặc context)
//     const storedUserData = localStorage.getItem('currentUser');
//     if (storedUserData) {
//       setCurrentUser(JSON.parse(storedUserData));
//     }
//   }, []);

//   useHomepageSocket(currentUser); // Gọi hook

//   return (
//     <div>
//       <h1>Chào mừng đến Trang Chủ!</h1>
//       {currentUser ? <p>Xin chào, {currentUser.name || currentUser.email}!</p> : <p>Bạn đang truy cập với tư cách khách.</p>}
//     </div>
//   );
// }
// export default HomePageComponent;
*/
