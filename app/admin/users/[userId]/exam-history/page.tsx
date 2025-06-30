'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation'; // useParams để lấy userId
import Link from 'next/link';
import { useAuthStore } from '../../../../store/authStore'; // Điều chỉnh đường dẫn

// Kiểu dữ liệu (có thể import từ file types chung hoặc UserDetailModal nếu đã export)
export interface ExamSessionHistoryEntry {
  _id: string;
  examId: string | number;
  examMeta?: { description?: string; level?: string; skill?: string; year?: string; };
  score: number;
  totalQuestions: number;
  submittedAt: string;
}

const NEXT_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const ITEMS_PER_PAGE = 10;

export default function UserExamHistoryPage() {
  const params = useParams(); // { userId: 'some-id' }
  const userId = params.userId as string; // Lấy userId từ URL

  const [sessions, setSessions] = useState<ExamSessionHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [userName, setUserName] = useState<string>(''); // Để hiển thị tên user

  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.currentUser); // Admin user
  const isLoadingAuth = useAuthStore((state) => state._isLoadingAuth);
  const logout = useAuthStore((state) => state.logout);
  const openLoginModalGlobal = useAuthStore(state => state.openLoginModal);

  const router = useRouter();

  const fetchHistory = useCallback(async (pageToFetch: number) => {
    if (!isClient || !token || !currentUser || currentUser.role !== 'admin' || !userId) {
      if (isClient && (!currentUser || !token)) setError("Cần đăng nhập với quyền admin.");
      else if (isClient && currentUser && currentUser.role !== 'admin') setError("Không có quyền truy cập.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // Lấy thông tin user đang xem để hiển thị tên (tùy chọn)
      if (!userName) {
          const userRes = await fetch(`${NEXT_API_BASE_URL}/users/${userId}`, {
              headers: { 'Authorization': `Bearer ${token}`},
          });
          if (userRes.ok) {
              const userData = await userRes.json();
              setUserName(userData.name || userData.email);
          }
      }

      const response = await fetch(`${NEXT_API_BASE_URL}/exam-sessions?userId=${userId}&limit=${ITEMS_PER_PAGE}&page=${pageToFetch}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.status === 401 || response.status === 403) { 
        logout(); 
        openLoginModalGlobal();
        throw new Error("Phiên hết hạn hoặc không có quyền."); 
      }
      if (!response.ok) {
        const errData = await response.json().catch(() => ({message: "Lỗi không xác định"}));
        throw new Error(errData.message || `Lỗi API: ${response.statusText}`);
      }
      const data = await response.json();
      setSessions(data.sessions || []);
      setTotalPages(data.totalPages || 0);
      setCurrentPage(data.currentPage || 1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [isClient, token, currentUser, userId, userName, logout, openLoginModalGlobal]);

  useEffect(() => {
    if (isClient && !isLoadingAuth && userId) { // Đảm bảo userId tồn tại
        fetchHistory(currentPage);
    } else if (isClient && !isLoadingAuth && !userId) {
        setError("Không tìm thấy ID người dùng trong URL.");
        setIsLoading(false);
    }
  }, [isClient, isLoadingAuth, userId, currentPage, fetchHistory]);


  const formatDate = (dateString: string) => new Date(dateString).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

  if (!isClient || isLoadingAuth || (isLoading && !error)) {
    return <>loading</>
  }
  if (error) {
    return <>loi</>
  }

  return (
    <div className="container mx-auto p-6 md:p-8">
      <button onClick={() => router.back()} className="mb-6 text-sm text-sky-600 hover:text-sky-700 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-1">
          <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
        </svg>
        Quay lại
      </button>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100 mb-2">
        Lịch sử làm bài của <span className="text-sky-600">{userName || userId}</span>
      </h1>
      <p className="text-gray-600 dark:text-slate-300 mb-8">Tổng số bài đã làm: {sessions.length > 0 ? sessions.length + (currentPage > 1 ? ` (trang ${currentPage})` : '') : '0'}</p>

      {sessions.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-slate-400 py-8">Người dùng này chưa có bài làm nào.</p>
      ) : (
        <div className="space-y-4">
          {sessions.map(session => (
            <div key={session._id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-start">
                <h2 className="text-lg font-semibold text-sky-700 dark:text-sky-400">
                  {session.examMeta?.description || `Đề ${session.examId.toString()}`}
                </h2>
                <span className="text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">
                  {session.examMeta?.level} - {session.examMeta?.skill}
                </span>
              </div>
              <div className="mt-2 text-sm">
                <p className="text-gray-700 dark:text-slate-300">Điểm số: <strong className="text-green-600 dark:text-green-400">{session.score}</strong>/{session.totalQuestions}</p>
                <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">Nộp lúc: {formatDate(session.submittedAt)}</p>
              </div>
               {/* Nút xem chi tiết bài làm nếu có */}
                <div className="mt-3 text-right">
                    <Link href={`/exams/${session.examId.toString()}/take?reviewSessionId=${session._id}`} 
                          className="text-xs text-white bg-sky-500 hover:bg-sky-600 px-3 py-1.5 rounded-md transition-colors">
                        Xem lại bài làm
                    </Link>
                </div>
            </div>
          ))}
        </div>
      )}
      {/* TODO: Thêm phân trang nếu totalPages > 1 */}
    </div>
  );
}