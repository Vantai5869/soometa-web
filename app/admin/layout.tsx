// app/admin/layout.tsx
'use client';

import Link from 'next/link';
import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore, UserData } from '../store/authStore'; // Import UserData từ store

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://soometa-be.onrender.com';

const sidebarItems = [
  { name: 'Dashboard', href: '/admin/dashboard' },
  { name: 'Users', href: '/admin/users' },
  { name: 'Transcriptions', href: '/admin/transcriptions' },
  { name: 'Exam stats', href: '/admin/exam-stats' },
  { name: 'Download Stats', href: '/admin/download-stats' },
  { name: 'Feedback', href: '/admin/feedback' },
  { name: 'Analytics', href: '/admin/analytics' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // Lấy trạng thái và actions từ Zustand store
  // Chỉ lấy những gì thực sự cần để trigger re-render ban đầu
  const initialCurrentUserFromStore = useAuthStore((state) => state.currentUser);
  const tokenFromStore = useAuthStore((state) => state.token);
  const isLoadingAuthFromStore = useAuthStore((state) => state._isLoadingAuth);
  const logout = useAuthStore((state) => state.logout);
  const setRefreshedUser = useAuthStore((state) => state.setRefreshedUser);


  const [isClient, setIsClient] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuthorization, setIsCheckingAuthorization] = useState(true);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || isLoadingAuthFromStore) {
      // Vẫn đang trong quá trình loading ban đầu của client hoặc store
      // isCheckingAuthorization vẫn là true, UI loading sẽ được hiển thị
      return;
    }

    // Từ đây, isClient = true và isLoadingAuthFromStore = false
    // Store đã load xong trạng thái từ localStorage (nếu có)

    const currentToken = useAuthStore.getState().token; // Lấy token mới nhất từ store
    const userForIdCheck = useAuthStore.getState().currentUser; // Lấy user mới nhất để lấy ID

    if (!currentToken || !userForIdCheck?._id) {
      router.replace('/');
      setIsCheckingAuthorization(false); // Kết thúc kiểm tra (thất bại)
      return;
    }

    const fetchAndVerifyAdmin = async () => {
      // setIsCheckingAuthorization(true) đã được set ở state khởi tạo
      try {
        const response = await fetch(`${API_BASE_URL}/users/${userForIdCheck._id}`, {
          headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.status === 401 || response.status === 403) {
          logout(); // Store sẽ cập nhật currentUser và token thành null
          // router.replace('/'); // logout có thể đã xử lý redirect hoặc useEffect này sẽ chạy lại và redirect
          return; // setIsCheckingAuthorization(false) sẽ được gọi ở finally
        }

        if (!response.ok) {
          console.error(`AdminLayout: Lỗi API khi lấy thông tin user. Status: ${response.status}`);
          router.replace('/');
          return;
        }

        const apiUserData: UserData = await response.json();

        // Quan trọng: Cập nhật lại currentUser trong store với dữ liệu mới nhất từ API
        // Giả sử token không thay đổi, nếu có, API nên trả về token mới
        setRefreshedUser(apiUserData, currentToken); 

        if (apiUserData.role === 'admin') {
          setIsAuthorized(true);
        } else {
          router.replace('/');
        }
      } catch (error) {
        console.error('AdminLayout: Exception trong quá trình fetchAndVerifyAdmin:', error);
        // Cân nhắc logout nếu lỗi mạng nghiêm trọng hoặc không rõ nguyên nhân
        // logout(); 
        router.replace('/');
      } finally {
        setIsCheckingAuthorization(false); // Hoàn tất kiểm tra ủy quyền
      }
    };

    fetchAndVerifyAdmin();

  }, [isClient, isLoadingAuthFromStore, router, logout, setRefreshedUser]); // Các dependencies chính


  const handleLogout = () => {
    logout();
    // router.replace('/'); // useEffect sẽ tự động xử lý redirect khi currentUser/token thay đổi
  };

  // Điều kiện loading UI kết hợp
  if (!isClient || isLoadingAuthFromStore || isCheckingAuthorization) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-sky-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-lg font-medium text-gray-700">Đang tải trang quản trị...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    // Trường hợp này xảy ra nếu người dùng không phải admin và đang chờ redirect,
    // hoặc nếu có lỗi nào đó mà isAuthorized không được set true.
    // useEffect đã gọi router.replace('/') nên trình duyệt sẽ sớm chuyển hướng.
    // Trả về null để không render gì trong lúc chờ.
    return null; 
  }

  // Nếu đã ủy quyền, render layout admin
  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-slate-800 text-slate-100 border-r border-slate-700 p-5 flex flex-col">
        <div className="mb-8">
          <Link href="/admin/dashboard">
            <h2 className="text-2xl font-bold text-white hover:text-sky-400 transition-colors">
              Admin Panel
            </h2>
          </Link>
        </div>
        <nav className="space-y-1 flex-grow">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block px-4 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-sky-600 text-white shadow-md" 
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                )}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto pt-4 border-t border-slate-700">
            <button 
                onClick={handleLogout} 
                className="w-full px-4 py-2.5 rounded-md text-sm font-medium text-slate-300 hover:bg-rose-600 hover:text-white transition-colors text-left"
            >
                Đăng xuất
            </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto bg-slate-100">
        {children}
      </main>
    </div>
  );
}