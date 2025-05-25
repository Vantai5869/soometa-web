// app/components/UserActivityTracker.tsx
"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '../store/authStore'; // Đảm bảo đường dẫn này đúng

/**
 * UserActivityTracker Component
 * Ghi lại lượt truy cập của người dùng đã đăng nhập vào backend.
 * Component này không có UI, chỉ thực hiện logic theo dõi.
 */
export default function UserActivityTracker() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const token = useAuthStore((state) => state.token); // Cần token để xác thực request
  const pathname = usePathname(); // Lấy đường dẫn trang hiện tại

  console.log('UserActivityTracker mounted');
  useEffect(() => {
    // Chỉ gửi yêu cầu nếu có người dùng đăng nhập và có token
    if (currentUser && currentUser._id && token) {
      const trackVisit = async () => {
        try {
          // Lấy API base URL từ biến môi trường của Next.js
          const NEXT_PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'; // Đặt fallback URL nếu biến môi trường không có

          const response = await fetch(`${NEXT_PUBLIC_API_BASE_URL}/analytics/track-visit`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`, // Gửi token để backend xác thực
            },
            body: JSON.stringify({
              pagePath: pathname, // Gửi đường dẫn trang hiện tại
              // Bạn có thể thêm các thông tin khác nếu muốn, ví dụ: deviceId, platform (nếu có thể lấy từ frontend)
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error('Lỗi khi ghi lại lượt truy cập:', errorData.message);
          } else {
            console.log(`Đã ghi lại lượt truy cập của User ${currentUser.id} tại ${pathname}`);
          }
        } catch (error) {
          console.error('Lỗi mạng hoặc server khi ghi lại lượt truy cập:', error);
        }
      };

      // Gọi hàm trackVisit khi component mount hoặc khi currentUser/token/pathname thay đổi
      // Điều này đảm bảo mỗi khi người dùng đã đăng nhập chuyển trang, một lượt truy cập mới sẽ được ghi lại.
      trackVisit();
    }
  }, [currentUser, token, pathname]); // Dependencies: chạy lại effect khi currentUser, token, hoặc pathname thay đổi

  // Component này không hiển thị gì cả, chỉ có tác dụng phụ (side effect)
  return null;
}