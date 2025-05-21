// app/admin/users/[userId]/vocabulary/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../../../store/authStore'; // Điều chỉnh đường dẫn

// Kiểu dữ liệu (có thể import từ file types chung hoặc UserDetailModal nếu đã export)
interface ExamplePair { koreanExample: string; vietnameseExample: string; }
export interface VocabularyListEntry {
  _id: string;
  koreanWord: string;
  vietnameseMeaning: string;
  examples: ExamplePair[];
  createdAt: string;
}

const NEXT_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const ITEMS_PER_PAGE = 15; // Hoặc số lượng bạn muốn

// Icon Xóa (Tương tự như trang MyVocabulary)
const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75H4.75a.75.75 0 000 1.5h.443a7.027 7.027 0 011.366 4.234l.01.142.01.142a2.5 2.5 0 002.498 2.232h3.864a2.5 2.5 0 002.498-2.232l.01-.142.01-.142a7.027 7.027 0 011.367-4.234h.442a.75.75 0 000-1.5H14A2.75 2.75 0 0011.25 1H8.75zM9.25 3.75a1.25 1.25 0 011.25-1.25h.5a1.25 1.25 0 011.25 1.25H9.25zM6.25 5.25h7.5c.061 0 .12.004.178.011l-.93 4.648a1 1 0 01-.976.841H7.972a1 1 0 01-.976-.841l-.93-4.648A4.505 4.505 0 016.25 5.25z" clipRule="evenodd" />
  </svg>
);


export default function UserVocabularyPage() {
  const params = useParams();
  const userId = params.userId as string;

  const [vocabulary, setVocabulary] = useState<VocabularyListEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');

  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.currentUser); // Admin user
  const isLoadingAuth = useAuthStore((state) => state._isLoadingAuth);
  const logout = useAuthStore((state) => state.logout);
  const openLoginModalGlobal = useAuthStore(state => state.openLoginModal);

  const router = useRouter();

  const fetchVocab = useCallback(async () => {
    if (!isClient || !token || !currentUser || currentUser.role !== 'admin' || !userId) {
      if (isClient && (!currentUser || !token)) setError("Cần đăng nhập với quyền admin.");
      else if (isClient && currentUser && currentUser.role !== 'admin') setError("Không có quyền truy cập.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true); setError(null);
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

      const response = await fetch(`${NEXT_API_BASE_URL}/vocabulary?userId=${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.status === 401 || response.status === 403) { 
        logout(); openLoginModalGlobal(); throw new Error("Phiên hết hạn."); 
      }
      if (!response.ok) { 
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Lỗi API: ${response.statusText}`);
      }
      const data = await response.json();
      setVocabulary(data || []);
    } catch (err: any) { setError(err.message); } 
    finally { setIsLoading(false); }
  }, [isClient, token, currentUser, userId, userName, logout, openLoginModalGlobal]);

  useEffect(() => {
    if (isClient && !isLoadingAuth && userId) {
        fetchVocab();
    } else if (isClient && !isLoadingAuth && !userId) {
        setError("Không tìm thấy ID người dùng trong URL.");
        setIsLoading(false);
    }
  }, [isClient, isLoadingAuth, userId, fetchVocab]);

  const handleDeleteWord = async (entryId: string) => {
    if (!isClient || !window.confirm("Xác nhận xóa từ vựng này khỏi danh sách của người dùng?")) return;

    const currentToken = useAuthStore.getState().token;
    if (!currentToken) {
      alert("Phiên làm việc hết hạn. Vui lòng đăng nhập lại.");
      logout(); openLoginModalGlobal(); return;
    }
    try {
      const response = await fetch(`${NEXT_API_BASE_URL}/vocabulary/${entryId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${currentToken}` },
      });
      if (response.status === 401 || response.status === 403) { /* ... xử lý logout ... */ return;}
      if (!response.ok) { /* ... xử lý lỗi ... */ throw new Error("Lỗi xóa từ");}
      setVocabulary(prev => prev.filter(word => word._id !== entryId));
      alert("Đã xóa từ vựng.");
    } catch (err: any) { alert(err.message); setError(err.message); }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('vi-VN');

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
        Quay lại chi tiết User
      </button>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100 mb-2">
        Từ vựng đã lưu của <span className="text-purple-600">{userName || userId}</span>
      </h1>
       <p className="text-gray-600 dark:text-slate-300 mb-8">Tổng số từ đã lưu: {vocabulary.length}</p>

      {vocabulary.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-slate-400 py-8">Người dùng này chưa lưu từ vựng nào.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vocabulary.map((entry) => (
            <div key={entry._id} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col overflow-hidden border border-gray-200 dark:border-slate-700">
              <div className="p-5 flex-grow">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-2xl font-bold text-purple-600 dark:text-purple-400 break-all pr-2">{entry.koreanWord}</h2>
                  {currentUser?.role === 'admin' && ( // Chỉ admin mới có nút xóa ở đây
                     <button onClick={() => handleDeleteWord(entry._id)} className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-1 transition-colors" title="Xóa từ này">
                        <DeleteIcon />
                    </button>
                  )}
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4"> {entry.vietnameseMeaning} </p>
                {entry.examples && entry.examples.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Ví dụ:</h4>
                    <ul className="space-y-2 text-sm">
                      {entry.examples.map((ex, index) => (
                        <li key={index} className="pl-1">
                          <p className="text-gray-700 dark:text-gray-300"><strong>Kor:</strong> {ex.koreanExample}</p>
                          <p className="text-gray-500 dark:text-gray-400 italic"><strong>Vie:</strong> {ex.vietnameseExample}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="bg-gray-50 dark:bg-slate-700/50 px-5 py-2.5 text-xs text-gray-400 dark:text-slate-500 border-t border-gray-100 dark:border-slate-700">
                Lưu ngày: {formatDate(entry.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}
      {/* TODO: Thêm phân trang nếu cần */}
    </div>
  );
}
// Các phần JSX cho UI Loading, Error cần được điền đầy đủ như các trang khác.