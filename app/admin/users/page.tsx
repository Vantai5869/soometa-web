// app/admin/users/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '../components/badge'; // Đường dẫn tới Badge component của bạn
import UserDetailModal from './components/UserDetailModal'; // Component Modal mới
import { useAuthStore, UserData as AuthUserData } from '../../store/authStore'; // Import store và UserData từ store

// Sử dụng UserData từ store để đảm bảo tính nhất quán, hoặc định nghĩa lại nếu cần
export type User = AuthUserData & { // Mở rộng UserData từ store nếu cần thêm trường
  deviceId: string;
  platform: 'iOS' | 'Android' | 'WEB' | string;
  createdAt: string;
  isActive: boolean;
  lastLogin: string | null;
  name?: string;
  subscriptionTier?: string;

};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://soometa-be.onrender.com'; // Lấy từ env

export default function UserListPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pageLoading, setPageLoading] = useState(true); // Đổi tên state loading chính
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Lấy trạng thái từ store
  const tokenFromStore = useAuthStore((state) => state.token);
  const currentUserFromStore = useAuthStore((state) => state.currentUser);
  const isLoadingAuthFromStore = useAuthStore((state) => state._isLoadingAuth);
  const logout = useAuthStore((state) => state.logout);


  const fetchUsers = useCallback(async (token: string) => {
    setPageLoading(true); // Bắt đầu loading cho việc fetch users
    setFetchError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        if (isClient) alert("Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
        logout(); // Logout người dùng
        router.push('/login'); // Chuyển hướng về trang đăng nhập
        return; // Không xử lý thêm
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `Lỗi ${response.status}: Không thể tải dữ liệu.`);
      }

      const data = await response.json();
      // API của bạn trả về mảng user trong data.users, hoặc trực tiếp data là mảng user?
      // Giả sử API trả về { users: User[] } hoặc User[]
      const usersArray = Array.isArray(data) ? data : (data.users && Array.isArray(data.users)) ? data.users : [];
      setUsers(usersArray as User[]);
    } catch (err: any) {
      setFetchError(err.message || 'Không thể tải dữ liệu người dùng. Vui lòng thử lại.');
    } finally {
      setPageLoading(false); // Kết thúc loading cho việc fetch users
    }
  }, [isClient, router, logout]); // Thêm isClient, router, logout

  useEffect(() => {
    // Chờ client mount và store auth sẵn sàng
    if (!isClient || isLoadingAuthFromStore) {
      setPageLoading(true); // Hiển thị loading chính
      return;
    }

    if (!tokenFromStore || !currentUserFromStore) {
      router.push('/login');
      setPageLoading(false); // Dừng loading
      return;
    }

    if (currentUserFromStore.role === 'admin') {
      setIsAuthorized(true);
      fetchUsers(tokenFromStore); // Gọi fetchUsers sau khi xác nhận admin
    } else {
      setFetchError('Truy cập bị từ chối. Bạn không có quyền vào trang này.');
      setIsAuthorized(false);
      setPageLoading(false); // Dừng loading
      // Cân nhắc redirect về trang chủ nếu không phải admin
      // router.push('/');
    }
  }, [isClient, isLoadingAuthFromStore, tokenFromStore, currentUserFromStore, router, fetchUsers]);


  const truncateText = (text: string | null | undefined, maxLength: number = 10): string => {
    if (!text) return 'N/A';
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  const handleOpenDetailModal = (user: User) => {
    setSelectedUser(user);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setTimeout(() => { setSelectedUser(null); }, 300); 
  };

  const handleConfirmDeleteUser = async (userId: string) => {
    const token = useAuthStore.getState().token; // Lấy token mới nhất từ store
    if (!token) {
        setFetchError("Phiên làm việc hết hạn. Vui lòng đăng nhập lại.");
        if (isClient) alert("Phiên làm việc hết hạn. Vui lòng đăng nhập lại.");
        logout();
        router.push('/login');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.status === 401 || response.status === 403) {
          if (isClient) alert("Token không hợp lệ hoặc bạn không có quyền xoá.");
          logout();
          router.push('/login');
          return;
        }
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `Lỗi ${response.status} khi xoá`}));
          throw new Error(errorData.message || `Không thể xoá người dùng.`);
        }
        
        setUsers(prevUsers => prevUsers.filter(user => user._id !== userId));
        if (isClient) alert(`Người dùng với ID: ${userId} đã được xoá.`);
        
    } catch (err: any) {
        setFetchError(err.message || "Đã có lỗi xảy ra khi cố gắng xoá người dùng.");
    } finally {
        handleCloseDetailModal();
    }
  };

  if (!isClient || isLoadingAuthFromStore || pageLoading && !fetchError && !isAuthorized) {
    // Điều kiện loading này bao gồm cả lúc chờ store, chờ client, và chờ fetchUsers (nếu isAuthorized)
    return (
        <div className="flex justify-center items-center h-screen">
            <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-sky-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-4 text-lg font-medium text-gray-700">Đang tải dữ liệu...</p>
            </div>
        </div>
    );
  }
  
  // Nếu không được ủy quyền và đã hết loading, hiển thị lỗi (nếu có) hoặc thông báo
  if (!isAuthorized) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-xl text-red-600">
          {fetchError || 'Truy cập bị từ chối. Bạn không có quyền vào trang này.'}
        </p>
      </div>
    );
  }

  // Nếu có lỗi fetch sau khi đã được ủy quyền, nhưng không load được user
  if (fetchError && users.length === 0) { 
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-xl text-red-600">Lỗi: {fetchError}</p>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Danh sách người dùng</h1>
        </header>
        
        {fetchError && users.length > 0 && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md">
                <p><strong>Đã có lỗi xảy ra:</strong> {fetchError}</p>
                <p>Dữ liệu hiển thị bên dưới có thể không phải là mới nhất.</p>
            </div>
        )}

        {users.length === 0 && !pageLoading && !fetchError ? (
          <div className="text-center py-10">
            <p className="text-gray-600 text-lg">Không có người dùng nào để hiển thị.</p>
          </div>
        ) : (
          <div className="bg-white shadow-xl rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto text-sm">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="p-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                    <th className="p-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Vai trò</th>
                    <th className="p-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Gói</th>
                    <th className="p-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Device ID</th>
                    <th className="p-3 text-center font-semibold text-gray-600 uppercase tracking-wider">Trạng thái</th>
                    <th className="p-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Đăng nhập cuối</th>
                    <th className="p-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Ngày tạo</th>
                    <th className="p-3 text-center font-semibold text-gray-600 uppercase tracking-wider">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50 transition-colors duration-150 ease-in-out">
                      <td className="p-3 text-gray-700 whitespace-nowrap">{user.email}</td>
                      <td className="p-3 whitespace-nowrap">
                        <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <Badge variant="outline" className="border-gray-300 text-gray-600">
                          {user.subscriptionTier}
                        </Badge>
                      </td>
                      <td className="p-3 text-gray-500 whitespace-nowrap" title={user.deviceId}>
                        {truncateText(user.deviceId, 10)}
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <Badge className={user.isActive ? 'bg-green-100 text-green-700 border-green-300' : 'bg-yellow-100 text-yellow-700 border-yellow-300'}>
                          {user.isActive ? 'Hoạt động' : 'Tạm khóa'}
                        </Badge>
                      </td>
                      <td className="p-3 text-gray-600 whitespace-nowrap">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : 'Chưa có'}
                      </td>
                      <td className="p-3 text-gray-600 whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString('vi-VN', { dateStyle: 'short' })}
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleOpenDetailModal(user)}
                          className="px-4 py-2 text-xs font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-colors shadow-sm hover:shadow-md"
                          title={`Xem chi tiết ${user.email}`}
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {isDetailModalOpen && selectedUser && (
        <UserDetailModal 
            user={selectedUser} 
            onClose={handleCloseDetailModal} 
            onConfirmDelete={handleConfirmDeleteUser}
        />
      )}
    </>
  );
}