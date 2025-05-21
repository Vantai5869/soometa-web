// app/my-vocabulary/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from './../store/authStore'; // Điều chỉnh đường dẫn cho chính xác

const NEXT_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// --- Types ---
interface ExamplePair {
  koreanExample: string;
  vietnameseExample: string;
  // _id không cần thiết ở client cho example nếu backend không trả về
}

export interface VocabularyEntry {
  _id: string; // ID của mục từ vựng
  koreanWord: string;
  vietnameseMeaning: string;
  examples: ExamplePair[];
  createdAt: string; // ISO Date string
}

// --- Icons --- (Sử dụng SVG inline hoặc import từ thư viện icon)
const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75H4.75a.75.75 0 000 1.5h.443a7.027 7.027 0 011.366 4.234l.01.142.01.142a2.5 2.5 0 002.498 2.232h3.864a2.5 2.5 0 002.498-2.232l.01-.142.01-.142a7.027 7.027 0 011.367-4.234h.442a.75.75 0 000-1.5H14A2.75 2.75 0 0011.25 1H8.75zM9.25 3.75a1.25 1.25 0 011.25-1.25h.5a1.25 1.25 0 011.25 1.25H9.25zM6.25 5.25h7.5c.061 0 .12.004.178.011l-.93 4.648a1 1 0 01-.976.841H7.972a1 1 0 01-.976-.841l-.93-4.648A4.505 4.505 0 016.25 5.25z" clipRule="evenodd" />
  </svg>
);


export default function MyVocabularyPage() {
  const [savedWords, setSavedWords] = useState<VocabularyEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.currentUser);
  const isLoadingAuth = useAuthStore((state) => state._isLoadingAuth);
  const logout = useAuthStore((state) => state.logout);
  const openLoginModal = useAuthStore(state => state.openLoginModal);

  const router = useRouter();

  const fetchSavedWords = useCallback(async () => {
    if (!isClient || !token || !currentUser) {
      if (isClient && (!currentUser || !token)) {
        setError("Bạn cần đăng nhập để xem từ vựng đã lưu.");
      }
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${NEXT_API_BASE_URL}/vocabulary`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.status === 401 || response.status === 403) {
        if(isClient) alert("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
        logout(); 
        openLoginModal(); // Mở modal để đăng nhập lại
        throw new Error("Unauthorized");
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Lỗi tải từ vựng: ${response.statusText}`);
      }
      const data: VocabularyEntry[] = await response.json();
      setSavedWords(data);
    } catch (err: any) {
      console.error("Lỗi khi tải từ vựng đã lưu:", err);
      if (err.message !== "Unauthorized") setError(err.message || 'Không thể tải danh sách từ vựng.');
    } finally {
      setIsLoading(false);
    }
  }, [isClient, token, currentUser, logout, openLoginModal]);

  useEffect(() => {
    if (isClient && !isLoadingAuth) { // Chờ client và auth load xong
      if (currentUser && token) {
        fetchSavedWords();
      } else {
        // Nếu chưa đăng nhập, hiển thị thông báo hoặc yêu cầu đăng nhập
        setError("Vui lòng đăng nhập để xem từ vựng đã lưu.");
        setIsLoading(false);
        // openLoginModal(); // Có thể mở modal ở đây
      }
    }
  }, [isClient, isLoadingAuth, currentUser, token, fetchSavedWords]);


  const handleDeleteWord = async (entryId: string) => {
    if (!isClient) return;
    if (!window.confirm("Bạn có chắc chắn muốn xóa từ vựng này không?")) return;

    const currentToken = useAuthStore.getState().token;
    if (!currentToken) {
      alert("Phiên làm việc hết hạn. Vui lòng đăng nhập lại.");
      logout();
      openLoginModal();
      return;
    }

    try {
      const response = await fetch(`${NEXT_API_BASE_URL}/vocabulary/${entryId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${currentToken}` },
      });

      if (response.status === 401 || response.status === 403) {
        alert("Phiên đăng nhập không hợp lệ hoặc bạn không có quyền xóa. Vui lòng đăng nhập lại.");
        logout();
        openLoginModal();
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Lỗi khi xóa từ vựng: ${response.statusText}`);
      }
      // Xóa thành công, cập nhật UI
      setSavedWords(prevWords => prevWords.filter(word => word._id !== entryId));
      alert("Đã xóa từ vựng thành công.");

    } catch (err: any) {
      console.error("Lỗi khi xóa từ vựng:", err);
      alert(err.message || "Không thể xóa từ vựng. Vui lòng thử lại.");
      setError(err.message || "Không thể xóa từ vựng. Vui lòng thử lại."); // Cũng có thể set error chung
    }
  };


  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit'
    });
  };

  // ---- RENDER LOGIC ----
  if (!isClient || isLoadingAuth) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center text-gray-600 bg-gray-50 p-4">
        <svg className="mx-auto h-12 w-12 text-sky-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-4 text-lg font-medium">Đang kiểm tra đăng nhập...</p>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center text-gray-600 bg-gray-50 p-4">
        <svg className="mx-auto h-12 w-12 text-sky-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-4 text-lg font-medium">Đang tải từ vựng của bạn...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 md:p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">Từ Vựng Của Tôi</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative" role="alert">
          <strong className="font-bold">Lỗi!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
        {error.includes("Vui lòng đăng nhập") && (
             <button 
                onClick={() => openLoginModal()}
                className="mt-6 px-6 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 transition-colors"
            >
                Đăng nhập
            </button>
        )}
      </div>
    );
  }
  
  if (savedWords.length === 0) {
    return (
      <div className="container mx-auto p-6 md:p-8 text-center min-h-[calc(100vh-100px)] flex flex-col justify-center items-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-gray-400 mb-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
        </svg>
        <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-3">Chưa có từ vựng nào</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Hãy bắt đầu khám phá các bài thi và lưu lại những từ vựng quan trọng nhé!
        </p>
        <Link href="/exams" className="px-6 py-2.5 bg-sky-600 text-white font-medium rounded-lg hover:bg-sky-700 transition-colors shadow-md">
          Khám phá đề thi
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 py-8 sm:p-6 lg:p-8">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">Từ Vựng Của Tôi</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
          Nơi lưu trữ những từ vựng quan trọng bạn đã thu thập được.
        </p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {savedWords.map((wordEntry) => (
          <div 
            key={wordEntry._id} 
            className="bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col overflow-hidden border border-gray-200 dark:border-slate-700"
          >
            <div className="p-5 flex-grow">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-2xl font-bold text-sky-600 dark:text-sky-400 break-all pr-2">
                  {wordEntry.koreanWord}
                </h2>
                <button 
                  onClick={() => handleDeleteWord(wordEntry._id)}
                  className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-1 transition-colors"
                  title="Xóa từ vựng này"
                >
                  <DeleteIcon />
                </button>
              </div>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {wordEntry.vietnameseMeaning}
              </p>
              
              {wordEntry.examples && wordEntry.examples.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                  <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Ví dụ:</h4>
                  <ul className="space-y-2 text-sm">
                    {wordEntry.examples.map((ex, index) => (
                      <li key={index} className="pl-1">
                        <p className="text-gray-700 dark:text-gray-300"><strong>Kor:</strong> {ex.koreanExample}</p>
                        <p className="text-gray-500 dark:text-gray-400 italic"><strong>Vie:</strong> {ex.vietnameseExample}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="bg-gray-50 dark:bg-slate-700/50 px-5 py-2.5 text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-slate-700">
              Lưu ngày: {formatDate(wordEntry.createdAt)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}