// app/admin/exam-stats/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from './../../store/authStore'; // Điều chỉnh đường dẫn cho chính xác
import UserListModal, { UserInfo } from './components/UserListModal'; // Import Modal và UserInfo

const NEXT_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// --- Types ---
interface ExamDefinition {
  examId: string | number;
  examMeta: {
    description?: string;
    level?: string;
    skill?: string;
    year?: string;
  };
}

interface ExamStat extends ExamDefinition {
  totalCompletions: number; // totalCompletions giờ là bắt buộc từ API /distinct-exams
  // Không cần isLoadingStats hay statError cho từng dòng nữa vì totalCompletions đã có sẵn
}

export default function ExamStatsPage() {
  const [examStatsList, setExamStatsList] = useState<ExamStat[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // State cho modal danh sách user
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [modalUserList, setModalUserList] = useState<UserInfo[]>([]);
  const [selectedExamForModal, setSelectedExamForModal] = useState<ExamStat | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.currentUser);
  const isLoadingAuth = useAuthStore((state) => state._isLoadingAuth);
  const logout = useAuthStore((state) => state.logout);
  const openLoginModalGlobal = useAuthStore(state => state.openLoginModal);

  const router = useRouter();
  const [hasInitiatedDataFetch, setHasInitiatedDataFetch] = useState(false);

  // Fetch danh sách các đề thi duy nhất KÈM totalCompletions
  const fetchExamsWithStats = useCallback(async () => {
    const currentToken = useAuthStore.getState().token;
    const user = useAuthStore.getState().currentUser;

    // Guard clauses
    if (!isClient || !currentToken || user?.role !== 'admin') {
      if (isClient && (!user || !currentToken || user.role !== 'admin')) {
        setPageError("Truy cập bị từ chối hoặc phiên đăng nhập không hợp lệ.");
      }
      setIsLoadingPage(false);
      if (isClient && (!user || !currentToken)) {
         // openLoginModalGlobal(); // Có thể mở modal nếu chưa đăng nhập
         // router.push('/login'); // Hoặc redirect
      }
      return;
    }
    
    console.log("ExamStatsPage: Fetching distinct exams with pre-calculated stats...");
    setIsLoadingPage(true);
    setPageError(null);
    try {
      const response = await fetch(`${NEXT_API_BASE_URL}/exam-sessions/distinct-exams`, {
        headers: { 'Authorization': `Bearer ${currentToken}` },
      });

      if (response.status === 401 || response.status === 403) {
        logout(); 
        setPageError("Phiên đăng nhập hết hạn hoặc bạn không có quyền truy cập.");
        router.push('/login'); 
        throw new Error("Unauthorized to fetch distinct exams with stats");
      }
      if (!response.ok) {
        const errData = await response.json().catch(() => ({message: "Lỗi không xác định từ server"}));
        throw new Error(errData.message || `Lỗi tải danh sách đề thi: ${response.statusText}`);
      }
      
      const examsData: ExamStat[] = await response.json(); // API trả về examId, examMeta, và totalCompletions
      setExamStatsList(examsData);
      console.log("ExamStatsPage: Fetched distinct exams with stats, count:", examsData.length);
    } catch (err: any) {
      console.error("Lỗi fetchExamsWithStats:", err);
      if (err.message !== "Unauthorized to fetch distinct exams with stats") {
        setPageError(err.message || "Không thể tải dữ liệu thống kê.");
      }
    } finally {
      setIsLoadingPage(false);
    }
  }, [isClient, router, logout]); // Dependencies tối giản, token và user lấy qua getState


  // useEffect chính: Kiểm tra auth và gọi fetchExamsWithStats
  useEffect(() => {
    if (!isClient || isLoadingAuth) {
      return; 
    }
    if (!currentUser) { 
      setPageError("Vui lòng đăng nhập với tài khoản admin để xem trang này."); 
      setIsLoadingPage(false); 
      openLoginModalGlobal(
        () => { // onSuccess: người dùng vừa đăng nhập thành công
            const recheckUser = useAuthStore.getState().currentUser;
            if(recheckUser?.role === 'admin' && !hasInitiatedDataFetch){
                fetchExamsWithStats();
                setHasInitiatedDataFetch(true);
            } else if (recheckUser && recheckUser.role !== 'admin') {
                setPageError("Truy cập bị từ chối."); setIsLoadingPage(false);
            }
        },
        () => { // onCancel: người dùng đóng modal
            setPageError("Bạn cần đăng nhập để tiếp tục."); setIsLoadingPage(false);
        }
      );
      return;
    }
    if (currentUser.role !== 'admin') {
      setPageError("Truy cập bị từ chối. Bạn không có quyền vào trang này."); 
      setIsLoadingPage(false); 
      return;
    }
    // Đã đăng nhập và là admin
    if (!hasInitiatedDataFetch) {
      fetchExamsWithStats();
      setHasInitiatedDataFetch(true);
    }
  }, [isClient, isLoadingAuth, currentUser, fetchExamsWithStats, router, hasInitiatedDataFetch, openLoginModalGlobal]);


  // Fetch danh sách user chi tiết cho modal khi được yêu cầu
  const fetchUsersForModal = useCallback(async (examId: string | number) => {
    if (currentUser?.role !== 'admin') {
      setModalError("Không có quyền xem danh sách này."); return;
    }
    const currentToken = useAuthStore.getState().token;
    if (!currentToken) {
      setModalError("Phiên đăng nhập không hợp lệ."); logout(); openLoginModalGlobal(); return;
    }

    setIsModalLoading(true);
    setModalError(null);
    setModalUserList([]);
    try {
      const response = await fetch(`${NEXT_API_BASE_URL}/exam-sessions/exam/${examId}/participants`, {
        headers: { 'Authorization': `Bearer ${currentToken}` },
      });
      if (response.status === 401 || response.status === 403) {
        logout(); openLoginModalGlobal(); throw new Error("Lỗi xác thực khi tải DS người dùng.");
      }
      if (!response.ok) {
        const errData = await response.json().catch(() => ({message: "Lỗi không xác định"}));
        throw new Error(errData.message || `Lỗi tải DS người dùng: ${response.statusText}`);
      }
      const usersData: UserInfo[] = await response.json();
      setModalUserList(usersData);
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setIsModalLoading(false);
    }
  }, [currentUser, logout, openLoginModalGlobal]); // Token được lấy qua getState

  const handleShowUserList = (exam: ExamStat) => {
    setSelectedExamForModal(exam);
    setIsUserModalOpen(true);
    fetchUsersForModal(exam.examId); 
  };

  const handleCloseUserModal = () => {
    setIsUserModalOpen(false);
    setTimeout(() => {
        setModalUserList([]);
        setSelectedExamForModal(null); // Reset cả selectedExamForModal
        setModalError(null);
    }, 300); // Delay để animation modal đóng xong
  };


  // ---- RENDER LOGIC ----
  if (!isClient || isLoadingAuth || (isLoadingPage && !pageError) ) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center text-gray-600 bg-gray-50">
        <svg className="mx-auto h-16 w-16 text-sky-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-5 text-xl font-medium">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="container mx-auto p-6 md:p-8">
        <h1 className="text-3xl font-bold text-red-700 mb-8 text-center">Thống Kê Lượt Làm Đề Thi</h1>
        <div className="flex flex-col items-center justify-center bg-red-50 p-8 rounded-lg shadow min-h-[200px]">
          <p className="text-red-600 text-lg">{pageError}</p>
          {(pageError.includes("Vui lòng đăng nhập") || pageError.includes("Phiên đăng nhập không hợp lệ")) && (
            <button 
                onClick={() => openLoginModalGlobal()}
                className="mt-4 px-6 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 transition-colors"
            >
                Đăng nhập
            </button>
          )}
           {pageError.includes("Truy cập bị từ chối") && currentUser && (
             <Link href="/" className="mt-4 px-6 py-2 bg-slate-500 text-white rounded-md hover:bg-slate-600 transition-colors">
                Về trang chủ
            </Link>
           )}
        </div>
      </div>
    );
  }
  
  if (examStatsList.length === 0 && !isLoadingPage) { 
    return (
      <div className="container mx-auto p-6 md:p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Thống Kê Lượt Làm Đề Thi</h1>
        <div className="flex flex-col items-center justify-center bg-white p-8 rounded-lg shadow min-h-[200px]">
          <p className="text-gray-600 text-lg">Chưa có đề thi nào được làm để hiển thị thống kê.</p>
          <Link href="/exams" className="mt-4 px-6 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 transition-colors">
            Luyện thi ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto p-4 py-8 sm:p-6 lg:p-8">
        <header className="mb-10">
          <h1 className="text-4xl font-bold text-gray-800 text-center tracking-tight">Thống Kê Lượt Làm Đề Thi</h1>
        </header>
        
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto text-sm">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="p-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">ID Đề Thi</th>
                  <th className="p-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Mô Tả</th>
                  <th className="p-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden sm:table-cell">Cấp Độ</th>
                  <th className="p-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden md:table-cell">Kỹ Năng</th>
                  <th className="p-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Số Người Làm</th>
                  <th className="p-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {examStatsList.map((examStat) => (
                  <tr key={examStat.examId.toString()} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4 text-slate-700 whitespace-nowrap font-mono text-xs">{examStat.examId.toString()}</td>
                    <td className="p-4 text-slate-800 font-medium group-hover:text-sky-700 max-w-xs truncate" title={examStat.examMeta?.description}>
                        {examStat.examMeta?.description || 'N/A'}
                    </td>
                    <td className="p-4 text-slate-600 whitespace-nowrap hidden sm:table-cell">{examStat.examMeta?.level || 'N/A'}</td>
                    <td className="p-4 text-slate-600 whitespace-nowrap hidden md:table-cell">{examStat.examMeta?.skill || 'N/A'}</td>
                    <td className="p-4 text-slate-700 whitespace-nowrap text-center">
                      <span className="font-bold text-lg text-sky-600">{examStat.totalCompletions}</span>
                    </td>
                    <td className="p-4 text-center whitespace-nowrap">
                      {currentUser?.role === 'admin' && ( // Nút luôn hiển thị cho admin
                        <button
                          onClick={() => handleShowUserList(examStat)}
                          disabled={examStat.totalCompletions === 0} // Vô hiệu hóa nếu không có ai làm
                          className={`px-3 py-1.5 text-xs font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors shadow-sm
                                      ${examStat.totalCompletions === 0 
                                        ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
                                        : 'bg-indigo-500 hover:bg-indigo-600 focus:ring-indigo-500'}`}
                        >
                          {examStat.totalCompletions === 0 ? 'Chưa có' : 'Xem DS Người Làm'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <UserListModal 
        isOpen={isUserModalOpen}
        onClose={handleCloseUserModal}
        users={modalUserList}
        examDescription={selectedExamForModal?.examMeta?.description || selectedExamForModal?.examId.toString()}
        isLoading={isModalLoading}
        error={modalError}
      />
    </>
  );
}