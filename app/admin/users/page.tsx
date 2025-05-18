// app/admin/users/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '../components/badge'; // Đường dẫn tới Badge component của bạn
import UserDetailModal from './../components/UserDetailModal'; // Component Modal mới

// **THÊM export cho User type để UserDetailModal có thể sử dụng**
export type User = {
  _id: string;
  email: string;
  deviceId: string; // Assuming deviceId is always a string based on usage. Nullable if it can be.
  platform: 'iOS' | 'Android' | 'WEB' | string; // Allow string for flexibility if API returns other values
  createdAt: string; // ISO date string
  role: string; // e.g., 'admin', 'user'
  isActive: boolean;
  lastLogin: string | null; // ISO date string
  name?: string; // Optional name field
};

const API_BASE_URL = 'https://soometa-be.onrender.com';

export default function UserListPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false); // Tracks if the user is an admin
  const router = useRouter();

  // State cho User Detail Modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    const userDataString = localStorage.getItem('userData');

    if (!token || !userDataString) {
      router.push('/login'); // Redirect to login if no token or user data
      return;
    }

    try {
      const userData = JSON.parse(userDataString);
      // Check if user data exists and role is admin
      if (userData && userData.role === 'admin') {
        setIsAuthorized(true);
        fetchUsers(token); // Fetch users if authorized
      } else {
        setError('Truy cập bị từ chối. Bạn không có quyền vào trang này.');
        setIsAuthorized(false); // Explicitly set to false
        setLoading(false);
        // Optionally, redirect non-admins away, e.g., router.push('/');
      }
    } catch (e) {
      console.error("Lỗi xử lý thông tin người dùng:", e);
      // Clear corrupted or invalid auth data and redirect to login
      localStorage.removeItem('userToken');
      localStorage.removeItem('userData');
      router.push('/login');
    }
  }, [router]); // Add router to dependency array

  const fetchUsers = async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Try to parse error message from API, otherwise use status text or generic error
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `Lỗi ${response.status}: Không thể tải dữ liệu.`);
      }

      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []); // Ensure data is an array
    } catch (err: any) {
      console.error("Lỗi khi tải danh sách người dùng:", err);
      setError(err.message || 'Không thể tải dữ liệu người dùng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to truncate text
  const truncateText = (text: string | null | undefined, maxLength: number = 10): string => {
    if (!text) return 'N/A'; // Return 'N/A' or empty string if text is null/undefined
    if (text.length <= maxLength) {
      return text;
    }
    return `${text.substring(0, maxLength)}...`;
  };

  // Function to open the detail modal
  const handleOpenDetailModal = (user: User) => {
    setSelectedUser(user);
    setIsDetailModalOpen(true);
  };

  // Function to close the detail modal
  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    // Delay resetting selectedUser to allow for modal close animation, if any
    setTimeout(() => {
        setSelectedUser(null);
    }, 300); 
  };

  // Function to handle the actual deletion of a user
  const handleConfirmDeleteUser = async (userId: string) => {
    const token = localStorage.getItem('userToken');
    if (!token) {
        setError("Phiên làm việc hết hạn hoặc không tìm thấy token. Vui lòng đăng nhập lại.");
        router.push('/login');
        return;
    }

    console.log(`Yêu cầu xoá người dùng với ID: ${userId}`);
    // **THAY THẾ BẰNG LOGIC GỌI API XOÁ USER THỰC TẾ CỦA BẠN**
    try {
        // Example API call (replace with your actual endpoint and logic)
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `Lỗi ${response.status} khi xoá`}));
          throw new Error(errorData.message || `Không thể xoá người dùng.`);
        }
        
        // Nếu API call thành công:
        setUsers(prevUsers => prevUsers.filter(user => user._id !== userId));
        alert(`(Demo) Người dùng với ID: ${userId} đã được xoá.`); // Replace with a proper notification/toast
        
    } catch (err: any) {
        console.error("Lỗi khi xoá người dùng:", err);
        setError(err.message || "Đã có lỗi xảy ra khi cố gắng xoá người dùng.");
        // Optionally, display a toast message to the user
    } finally {
        handleCloseDetailModal(); // Đóng modal sau khi xoá (thành công hoặc thất bại)
    }
  };


  // Conditional rendering based on loading, error, and authorization states
  if (loading) {
    return <div className="flex justify-center items-center h-screen"><p className="text-xl text-gray-600">Đang tải dữ liệu người dùng...</p></div>;
  }
  
  if (!isAuthorized && !error) { // If still checking authorization or explicitly denied without a fetch error
    return <div className="flex justify-center items-center h-screen"><p className="text-xl text-yellow-600">Đang xác thực quyền truy cập...</p></div>;
  }

  if (error && !users.length) { // Display any error that occurred, especially if no users are loaded
    return <div className="flex justify-center items-center h-screen"><p className="text-xl text-red-600">Lỗi: {error}</p></div>;
  }


  return (
    <>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Danh sách người dùng</h1>
        </header>
        
        {/* Display general error if it occurred but users might still be visible from a previous successful fetch */}
        {error && users.length > 0 && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md">
                <p><strong>Đã có lỗi xảy ra:</strong> {error}</p>
                <p>Dữ liệu hiển thị bên dưới có thể không phải là mới nhất.</p>
            </div>
        )}

        {users.length === 0 && !loading && !error ? ( // Check !error here
          <div className="text-center py-10">
            <p className="text-gray-600 text-lg">Không có người dùng nào để hiển thị.</p>
            {/* Optionally, add a button to refresh or guide the admin */}
          </div>
        ) : (
          <div className="bg-white shadow-xl rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto text-sm">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="p-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                    <th className="p-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Vai trò</th>
                    <th className="p-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Platform</th>
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
                        <Badge
                          variant={user.role === 'admin' ? 'destructive' : 'secondary'}
                          className={`capitalize`} // Removed redundant color classes, assuming Badge handles them
                        >
                          {user.role}
                        </Badge>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <Badge variant="outline" className="border-gray-300 text-gray-600">
                          {user.platform}
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

      {/* Render User Detail Modal */}
      {isDetailModalOpen && selectedUser && (
        <UserDetailModal 
            user={selectedUser} 
            onClose={handleCloseDetailModal} 
            onConfirmDelete={handleConfirmDeleteUser} // **ĐÃ THÊM PROP onConfirmDelete**
        />
      )}
    </>
  );
}
