// app/admin/feedback/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuthStore } from '../../store/authStore'; // Điều chỉnh đường dẫn

// Định nghĩa kiểu dữ liệu cho phản hồi trên client
interface PopulatedUserInFeedback {
  _id: string;
  email: string;
  name?: string;
}
export interface FeedbackEntryClientType {
  _id: string;
  userId: PopulatedUserInFeedback | null; // userId có thể null nếu populate thất bại hoặc user bị xóa
  feedbackText: string;
  pageContext?: string;
  status: 'new' | 'seen' | 'in-progress' | 'resolved' | 'wont-fix';
  createdAt: string; // ISO Date string
}

const NEXT_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const ITEMS_PER_PAGE = 15;
const STATUS_OPTIONS: FeedbackEntryClientType['status'][] = ['new', 'seen', 'in-progress', 'resolved', 'wont-fix'];

const statusColors: Record<FeedbackEntryClientType['status'], string> = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100',
  seen: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100',
  'in-progress': 'bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-purple-100',
  resolved: 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100',
  'wont-fix': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100',
};
const statusLabels: Record<FeedbackEntryClientType['status'], string> = {
  new: 'Mới',
  seen: 'Đã xem',
  'in-progress': 'Đang xử lý',
  resolved: 'Đã giải quyết',
  'wont-fix': 'Sẽ không sửa',
};


export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackEntryClientType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalFeedbacks, setTotalFeedbacks] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>(''); // '' nghĩa là tất cả

  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.currentUser);
  const isLoadingAuth = useAuthStore((state) => state._isLoadingAuth);
  const logout = useAuthStore((state) => state.logout);

  const fetchFeedbacks = useCallback(async (page: number, status: string) => {
    if (!isClient || !token || !currentUser || currentUser.role !== 'admin') {
      if (isClient && (!currentUser || !token)) setError("Cần đăng nhập với quyền admin.");
      else if (isClient && currentUser && currentUser.role !== 'admin') setError("Không có quyền truy cập.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      let url = `${NEXT_API_BASE_URL}/feedback?page=${page}&limit=${ITEMS_PER_PAGE}`;
      if (status) {
        url += `&status=${status}`;
      }
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.status === 401 || response.status === 403) { 
        logout(); 
        throw new Error("Phiên hết hạn hoặc không có quyền."); 
      }
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Lỗi API: ${response.statusText}`);
      }
      const data = await response.json();
      setFeedbacks(data.feedbacks || []);
      setTotalPages(data.totalPages || 0);
      setCurrentPage(data.currentPage || 1);
      setTotalFeedbacks(data.totalFeedbacks || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [isClient, token, currentUser, logout]);

  useEffect(() => {
    if (isClient && !isLoadingAuth && currentUser && currentUser.role === 'admin') {
      fetchFeedbacks(currentPage, statusFilter);
    } else if (isClient && !isLoadingAuth && (!currentUser || currentUser.role !== 'admin')) {
        setError("Bạn không có quyền truy cập trang này.");
        setIsLoading(false);
    }
  }, [isClient, isLoadingAuth, currentUser, currentPage, statusFilter, fetchFeedbacks]);

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1); // Reset về trang 1 khi đổi filter
  };

  const handleUpdateStatus = async (feedbackId: string, newStatus: FeedbackEntryClientType['status']) => {
    if (!isClient || !token) {
      alert("Vui lòng đăng nhập lại.");
      return;
    }
    const originalFeedbacks = [...feedbacks]; // Lưu lại trạng thái cũ để rollback nếu lỗi
    // Cập nhật UI ngay lập tức để có trải nghiệm tốt hơn
    setFeedbacks(prev => prev.map(fb => fb._id === feedbackId ? { ...fb, status: newStatus } : fb));

    try {
      const response = await fetch(`${NEXT_API_BASE_URL}/feedback/${feedbackId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Không thể cập nhật trạng thái.");
      }
      // const updatedData = await response.json();
      // Không cần setFeedbacks lại từ response nếu UI đã cập nhật, nhưng có thể fetch lại toàn bộ list
      // fetchFeedbacks(currentPage, statusFilter); // Hoặc chỉ cập nhật item đó
      alert("Cập nhật trạng thái thành công!");
    } catch (error: any) {
      alert(`Lỗi cập nhật trạng thái: ${error.message}`);
      setFeedbacks(originalFeedbacks); // Rollback nếu có lỗi
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' });

  // UI Loading, Error
  if (!isClient || isLoadingAuth) {
    return <div className="p-8 text-center">Đang tải dữ liệu xác thực...</div>;
  }
  if (isLoading && feedbacks.length === 0) { // Chỉ hiện loading toàn trang nếu chưa có dữ liệu
    return <div className="p-8 text-center">Đang tải danh sách phản hồi...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-600">Lỗi: {error}</div>;
  }
  if (!currentUser || currentUser.role !== 'admin') {
    return <div className="p-8 text-center text-red-600">Bạn không có quyền truy cập trang này. Vui lòng <button onClick={() => useAuthStore.getState().openLoginModal()} className="text-sky-600 underline">đăng nhập</button> với tài khoản admin.</div>;
  }

  return (
    <div className="container mx-auto p-4 py-8 sm:p-6 lg:p-8">
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100 tracking-tight">
            Quản lý Phản Hồi
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">Tổng số: {totalFeedbacks} phản hồi</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <label htmlFor="statusFilter" className="mr-2 text-sm font-medium text-gray-700 dark:text-slate-300">Lọc theo trạng thái:</label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm dark:bg-slate-700 dark:text-slate-100"
          >
            <option value="">Tất cả</option>
            {STATUS_OPTIONS.map(status => (
              <option key={status} value={status}>{statusLabels[status]}</option>
            ))}
          </select>
        </div>
      </header>

      {isLoading && feedbacks.length > 0 && <div className="text-center my-4 text-sm text-gray-500">Đang cập nhật...</div> }

      {feedbacks.length === 0 && !isLoading ? (
        <p className="text-center text-gray-500 dark:text-slate-400 py-10">Không có phản hồi nào {statusFilter ? `với trạng thái "${statusLabels[statusFilter as FeedbackEntryClientType['status']]}"` : ''}.</p>
      ) : (
        <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200 dark:border-slate-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Người gửi</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Nội dung</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Ngữ cảnh</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Ngày gửi</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
              {feedbacks.map((fb) => (
                <tr key={fb._id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-slate-300">
                    <div className="font-medium">{fb.userId?.name || 'N/A'}</div>
                    <div className="text-xs text-gray-500 dark:text-slate-400">{fb.userId?.email || 'Ẩn danh'}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-300 max-w-md">
                    <p className="truncate hover:whitespace-normal hover:overflow-visible transition-all" title={fb.feedbackText}>
                      {fb.feedbackText}
                    </p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 dark:text-slate-400">{fb.pageContext || 'N/A'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 dark:text-slate-400">{formatDate(fb.createdAt)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs">
                    <select
                        value={fb.status}
                        onChange={(e) => handleUpdateStatus(fb._id, e.target.value as FeedbackEntryClientType['status'])}
                        className={`px-2 py-1 rounded-full text-xs appearance-none focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-slate-900 ${statusColors[fb.status]}`}
                        style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none', minWidth: '100px' }}
                    >
                        {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s} className="bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-200">
                                {statusLabels[s]}
                            </option>
                        ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center items-center space-x-2">
          <button
            onClick={() => fetchFeedbacks(currentPage - 1, statusFilter)}
            disabled={currentPage <= 1 || isLoading}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white dark:bg-slate-700 dark:text-slate-300 border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50"
          >
            Trước
          </button>
          <span className="text-xs text-gray-700 dark:text-slate-400">
            Trang {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => fetchFeedbacks(currentPage + 1, statusFilter)}
            disabled={currentPage >= totalPages || isLoading}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white dark:bg-slate-700 dark:text-slate-300 border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      )}
      {/* Thêm link này vào admin sidebar/layout của bạn */}
      {/* <Link href="/admin/dashboard">Về Dashboard</Link> */}
    </div>
  );
}