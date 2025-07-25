// app/admin/users/[userId]/edit/page.tsx
'use client';

import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore, UserData } from '../../../../store/authStore'; // Điều chỉnh đường dẫn

const NEXT_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// Định nghĩa kiểu cho dữ liệu form, bao gồm cả các trường có thể là null/undefined
type UserFormData = Partial<Omit<UserData, '_id' | 'createdAt' | 'lastLogin'>> & {
  // premiumExpiresAt sẽ được xử lý riêng vì input type date trả về string YYYY-MM-DD
};


export default function EditUserPage() {
  const params = useParams();
  const userId = params.userId as string;
  const router = useRouter();

  const [userToEdit, setUserToEdit] = useState<UserData | null>(null);
  const [formData, setFormData] = useState<UserFormData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.currentUser); // Admin đang thực hiện hành động
  const isLoadingAuth = useAuthStore((state) => state._isLoadingAuth);
  const logout = useAuthStore((state) => state.logout);
  const openLoginModal = useAuthStore((state) => state.openLoginModal);


  // Fetch dữ liệu user cần chỉnh sửa
  const fetchUserToEdit = useCallback(async () => {
    if (!isClient || !token || !currentUser || currentUser.role !== 'admin' || !userId) {
        if (isClient && (!currentUser || !token)) setError("Cần đăng nhập với quyền admin.");
        else if (isClient && currentUser && currentUser.role !== 'admin') setError("Không có quyền truy cập.");
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${NEXT_API_BASE_URL}/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.status === 401 || response.status === 403) {
        logout(); router.push('/login'); throw new Error("Unauthorized or Forbidden");
      }
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Lỗi tải thông tin user: ${response.statusText}`);
      }
      const data: UserData = await response.json();
      setUserToEdit(data);
      // Khởi tạo formData với giá trị hiện tại của user
      setFormData({
        name: data.name || '',
        email: data.email, // Email thường không cho sửa hoặc cần quy trình riêng
        role: data.role,
        subscriptionTier: data.subscriptionTier,
        premiumExpiresAt: data.premiumExpiresAt ? new Date(data.premiumExpiresAt).toISOString().split('T')[0] : '',
        isActive: data.isActive,
        platform: data.platform,
        // deviceId thường không nên cho admin sửa trực tiếp
      });
    } catch (err: any) {
      console.error("Error fetching user to edit:", err);
      if (err.message !== "Unauthorized or Forbidden") setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [isClient, token, currentUser, userId, router, logout]);

  useEffect(() => {
    if (isClient && !isLoadingAuth && userId) {
        if (currentUser && currentUser.role === 'admin') {
            fetchUserToEdit();
        } else if (currentUser && currentUser.role !== 'admin') {
            setError("Bạn không có quyền truy cập trang này.");
            setIsLoading(false);
        } else if (!currentUser) {
            setError("Vui lòng đăng nhập với tài khoản admin.");
            setIsLoading(false);
            openLoginModal(() => fetchUserToEdit()); // Thử fetch lại sau khi login
        }
    }
  }, [isClient, isLoadingAuth, currentUser, token, userId, fetchUserToEdit, openLoginModal]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    setSuccessMessage(null); // Xóa thông báo thành công khi bắt đầu sửa
    setError(null); // Xóa lỗi cũ
  };

  const handleSaveChanges = async (e: FormEvent) => {
    e.preventDefault();
    if (!userToEdit || !token || currentUser?.role !== 'admin') {
      setError("Không đủ quyền hoặc thiếu thông tin để lưu.");
      return;
    }
    
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    // Chuẩn bị payload, chỉ gửi những trường admin có thể thay đổi
    const payloadToUpdate: any = {
        name: formData.name,
        // email: formData.email, // Cẩn thận khi cho sửa email
        role: formData.role,
        isActive: formData.isActive,
    };

    if (formData.role === 'user') {
        payloadToUpdate.subscriptionTier = formData.subscriptionTier || 'nomo';
        if (payloadToUpdate.subscriptionTier === 'premium') {
            payloadToUpdate.premiumExpiresAt = formData.premiumExpiresAt ? new Date(formData.premiumExpiresAt as string).toISOString() : null;
        } else {
            payloadToUpdate.premiumExpiresAt = null;
        }
    } else if (formData.role === 'admin') {
        payloadToUpdate.subscriptionTier = null;
        payloadToUpdate.premiumExpiresAt = null;
    }
    // Các trường platform, deviceId thường không nên để admin sửa tùy ý
    // Nếu muốn cho sửa, thêm vào payload:
    // if (formData.platform) payloadToUpdate.platform = formData.platform;


    try {
      const response = await fetch(`${NEXT_API_BASE_URL}/users/${userToEdit._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payloadToUpdate),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Lỗi cập nhật thông tin người dùng.");
      }
      
      setSuccessMessage("Cập nhật thông tin người dùng thành công!");
      setUserToEdit(result.user); // Cập nhật state với user data mới từ server
      setFormData({ // Reset formData với giá trị mới
        name: result.user.name || '',
        email: result.user.email,
        role: result.user.role,
        subscriptionTier: result.user.subscriptionTier,
        premiumExpiresAt: result.user.premiumExpiresAt ? new Date(result.user.premiumExpiresAt).toISOString().split('T')[0] : '',
        isActive: result.user.isActive,
        platform: result.user.platform,
      });
      // router.push('/admin/users'); // Tùy chọn: Điều hướng về trang danh sách sau khi lưu

    } catch (err: any) {
      console.error("Error saving user details:", err);
      setError(err.message || "Đã có lỗi xảy ra khi lưu.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- RENDER LOGIC ---
  if (!isClient || isLoadingAuth) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-900 p-4">
        <svg className="mx-auto h-12 w-12 text-sky-500 dark:text-sky-400 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        <p className="mt-4 text-lg font-medium">Đang kiểm tra quyền truy cập...</p>
      </div>
    );
  }

  if (isLoading && !userToEdit && !error) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-900 p-4">
        <svg className="mx-auto h-12 w-12 text-sky-500 dark:text-sky-400 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        <p className="mt-4 text-lg font-medium">Đang tải thông tin người dùng...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto p-6 md:p-8 text-center min-h-screen flex flex-col justify-center items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100 mb-8">Chỉnh sửa Người dùng</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-md max-w-lg w-full" role="alert">
          <strong className="font-bold block text-lg mb-2">Lỗi!</strong>
          <span className="block"> {error}</span>
           {(error.includes("Vui lòng đăng nhập") || error.includes("Phiên hết hạn")) && (
             <button onClick={() => openLoginModal(() => { fetchUserToEdit(); })}
                className="mt-6 px-6 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 transition-colors font-medium">
                Đăng nhập
            </button>
           )}
            <Link href="/admin/users" className="mt-4 inline-block px-6 py-2 bg-slate-500 text-white rounded-md hover:bg-slate-600 transition-colors ml-3">
                Quay lại Danh sách
            </Link>
        </div>
      </div>
    );
  }
  
  if (!userToEdit) {
    return (
      <div className="container mx-auto p-6 md:p-8 text-center min-h-screen flex flex-col justify-center items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100 mb-8">Chỉnh sửa Người dùng</h1>
        <p className="text-gray-600 dark:text-slate-400 text-lg">Không tìm thấy người dùng.</p>
        <Link href="/admin/users" className="mt-6 px-6 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 transition-colors font-medium">
            Về Danh sách người dùng
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 py-8 sm:p-6 lg:p-10 dark:bg-slate-900 min-h-screen">
      <header className="mb-8">
        <div className="flex items-center mb-2">
          <Link href="/admin/users" className="text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 flex items-center text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-1"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" /></svg>
            Danh sách người dùng
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100 tracking-tight">
          Chỉnh sửa: <span className="text-sky-600 dark:text-sky-400">{userToEdit.name || userToEdit.email}</span>
        </h1>
      </header>

      {successMessage && (
        <div className="mb-6 p-3 bg-green-100 text-green-700 border border-green-300 rounded-md text-sm">
          {successMessage}
        </div>
      )}
      {error && !isLoading && ( // Hiển thị lỗi cục bộ của form nếu có (khác với pageError)
        <div className="mb-6 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md text-sm">
          {error}
        </div>
      )}


      <form onSubmit={handleSaveChanges} className="bg-white dark:bg-slate-800 shadow-xl rounded-lg p-6 md:p-8 space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Tên hiển thị</label>
          <input type="text" name="name" id="name" value={formData.name || ''} onChange={handleInputChange}
                 className="w-full p-2.5 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-700 dark:text-slate-100" />
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Email (Chỉ đọc)</label>
          <input type="email" name="email" id="email" value={formData.email || ''} readOnly
                 className="w-full p-2.5 border border-gray-300 dark:border-slate-600 rounded-md bg-gray-100 dark:bg-slate-700/50 dark:text-slate-400 cursor-not-allowed" />
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Vai trò</label>
          <select name="role" id="role" value={formData.role || 'user'} onChange={handleInputChange}
                  className="w-full p-2.5 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-700 dark:text-slate-100">
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Chỉ hiển thị lựa chọn tier nếu role là 'user' */}
        {formData.role === 'user' && (
          <div>
            <label htmlFor="subscriptionTier" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Gói thành viên</label>
            <select name="subscriptionTier" id="subscriptionTier" value={formData.subscriptionTier || 'nomo'} onChange={handleInputChange}
                    className="w-full p-2.5 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-700 dark:text-slate-100">
              <option value="nomo">Nomo (Thường)</option>
              <option value="premium">Premium</option>
            </select>
          </div>
        )}

        {formData.role === 'user' && formData.subscriptionTier === 'premium' && (
          <div>
            <label htmlFor="premiumExpiresAt" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Ngày hết hạn Premium (để trống nếu không thời hạn)</label>
            <input type="date" name="premiumExpiresAt" id="premiumExpiresAt" 
                   value={formData.premiumExpiresAt || ''} 
                   onChange={handleInputChange}
                   className="w-full p-2.5 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-700 dark:text-slate-100" />
          </div>
        )}
        
        <div className="flex items-center">
            <input type="checkbox" name="isActive" id="isActive" 
                   checked={formData.isActive !== undefined ? formData.isActive : true} // Mặc định là true nếu chưa có giá trị
                   onChange={handleInputChange}
                   className="h-4 w-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500 dark:bg-slate-700 dark:border-slate-600 dark:checked:bg-sky-500 dark:focus:ring-sky-600 dark:focus:ring-offset-slate-800" />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900 dark:text-slate-200">Kích hoạt tài khoản</label>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-slate-700">
          <Link href="/admin/users" className="px-5 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-600 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-500 transition-colors">
            Hủy
          </Link>
          <button type="submit" disabled={isSaving}
                  className="px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:ring-offset-slate-800 disabled:opacity-70">
            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </div>
  );
}