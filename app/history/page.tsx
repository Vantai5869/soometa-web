// app/history/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../store/authStore'; // Điều chỉnh đường dẫn nếu cần
import styles from './HistoryPage.module.css'; // Tạo file CSS Module này

// Định nghĩa lại hoặc import ExamSessionClientType
interface PopulatedUserInSession {
  _id: string; email: string; name?: string; role: string;
}
// Có thể đặt ở app/history/types.ts hoặc trực tiếp trong page.tsx
interface PopulatedUserInSession {
    _id: string;
    email: string;
    name?: string;
    role: string;
  }
  
  export interface ExamSessionClientType {
    _id: string; // ID của phiên làm bài (sessionId)
    userId: PopulatedUserInSession | string; // Có thể là object User hoặc chỉ ID nếu populate thất bại
    examId: string | number; // ID của đề thi gốc
    examMeta: {
      description?: string; // Ví dụ: "Đề thi TOPIK lần thứ 80"
      level?: string;       // Ví dụ: "TOPIK II"
      skill?: string;       // Ví dụ: "Đọc"
      year?: string;        // Ví dụ: "2023"
    };
    selectedAnswers: Record<string, number>; // { "1": 0, "2": 3 }
    score: number;
    totalQuestions: number;
    isSubmitted: boolean; // Luôn là true ở đây
    submittedAt: string;  // ISO Date string
    initialDuration: number;
  }
export interface ExamSessionClientType {
  _id: string; userId: PopulatedUserInSession | string; examId: string | number;
  examMeta: { description?: string; level?: string; skill?: string; year?: string; };
  selectedAnswers: Record<string, number>; score: number; totalQuestions: number;
  isSubmitted: boolean; submittedAt: string; initialDuration: number;
}

const NEXT_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const SESSIONS_PER_PAGE = 10;

export default function HistoryPage() {
  const [sessions, setSessions] = useState<ExamSessionClientType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);

  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.currentUser);
  const isLoadingAuth = useAuthStore((state) => state._isLoadingAuth);
  const logout = useAuthStore((state) => state.logout);
  const openLoginModal = useAuthStore(state => state.openLoginModal);

  const router = useRouter();

  const fetchUserSessions = useCallback(async (page: number) => {
    if (!token || !currentUser) {
      // Không nên xảy ra nếu logic guard ở useEffect dưới hoạt động đúng
      setError("Bạn cần đăng nhập để xem lịch sử.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${NEXT_API_BASE_URL}/exam-sessions?page=${page}&limit=${SESSIONS_PER_PAGE}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401 || response.status === 403) {
        alert("Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.");
        logout();
        // Không cần router.push('/login') vì logout có thể đã xử lý hoặc trang sẽ tự điều hướng
        // khi currentUser trở thành null trong useEffect chính.
        // Mở modal đăng nhập để người dùng có thể đăng nhập lại ngay.
        openLoginModal();
        throw new Error("Unauthorized"); // Ném lỗi để dừng thực thi tiếp
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Lỗi tải lịch sử: ${response.statusText}`);
      }

      const data = await response.json();
      setSessions(data.sessions || []);
      setCurrentPage(data.currentPage || 1);
      setTotalPages(data.totalPages || 0);
      setTotalSessions(data.totalSessions || 0);

    } catch (err: any) {
      console.error("Lỗi khi tải lịch sử làm bài:", err);
      if (err.message !== "Unauthorized") { // Chỉ set lỗi nếu không phải lỗi do Unauthorized đã xử lý
          setError(err.message || 'Không thể tải lịch sử làm bài.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, currentUser, logout, openLoginModal, isClient]); // Thêm isClient

  useEffect(() => {
    if (!isClient || isLoadingAuth) {
      return; // Chờ client mount và auth state sẵn sàng
    }
    if (!currentUser || !token) {
      // Nếu không có user hoặc token sau khi auth đã load xong, có thể chuyển hướng hoặc yêu cầu đăng nhập
      setError("Vui lòng đăng nhập để xem lịch sử làm bài của bạn.");
      setIsLoading(false);
      // Tùy chọn: router.push('/login'); hoặc mở modal đăng nhập
      // openLoginModal();
      return;
    }
    fetchUserSessions(currentPage);
  }, [isClient, isLoadingAuth, currentUser, token, currentPage, fetchUserSessions]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // ---- RENDER LOGIC ----
  if (!isClient || isLoadingAuth) {
    return (
      <div className={styles.loadingContainer}>
        <p>Đang kiểm tra thông tin đăng nhập...</p>
        {/* Có thể thêm spinner ở đây */}
      </div>
    );
  }
  
  // Sau khi auth load xong, nếu không có user/token (ví dụ bị logout)
  if (!currentUser || !token) {
      return (
        <div className={styles.container}>
          <h1 className={styles.pageTitle}>Lịch Sử Luyện Thi</h1>
          <div className={styles.messageContainer}>
            <p>{error || "Vui lòng đăng nhập để xem lịch sử."}</p>
            <button onClick={()=> openLoginModal()} className={styles.actionButton}>Đăng nhập</button>
          </div>
        </div>
      );
  }
  
  // Đang tải dữ liệu sessions
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <p>Đang tải lịch sử làm bài...</p>
         {/* Có thể thêm spinner ở đây */}
      </div>
    );
  }
  
  // Có lỗi khi fetch sessions (và không phải do chưa đăng nhập)
  if (error) {
    return (
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>Lịch Sử Luyện Thi</h1>
        <div className={styles.messageContainer}>
          <p className={styles.errorMessage}>Lỗi: {error}</p>
          <button onClick={() => fetchUserSessions(currentPage)} className={styles.actionButton}>Thử lại</button>
        </div>
      </div>
    );
  }
  
  // Không có bài làm nào
  if (sessions.length === 0) {
    return (
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>Lịch Sử Luyện Thi</h1>
        <div className={styles.messageContainer}>
          <p>Bạn chưa có bài làm nào được ghi lại.</p>
          <Link href="/exams" className={styles.actionButton}>Bắt đầu luyện thi</Link>
        </div>
      </div>
    );
  }

  // Hiển thị danh sách bài làm
  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Lịch Sử Luyện Thi</h1>
      <p className={styles.totalCount}>Tổng số bài đã làm: {totalSessions}</p>

      <div className={styles.sessionList}>
        {sessions.map((session) => (
          <div key={session._id} className={styles.sessionCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.examName}>
                {session.examMeta?.description || `Đề thi ${session.examId}`}
              </h2>
              <span className={styles.examDate}>{formatDate(session.submittedAt)}</span>
            </div>
            <div className={styles.cardBody}>
              <p className={styles.examInfo}>
                Cấp độ: <strong>{session.examMeta?.level || 'N/A'}</strong> - 
                Kỹ năng: <strong>{session.examMeta?.skill || 'N/A'}</strong>
              </p>
              <p className={styles.examScore}>
                Điểm số: <span className={styles.scoreValue}>{session.score} / {session.totalQuestions}</span>
              </p>
            </div>
            <div className={styles.cardFooter}>
              {/* TODO: Cập nhật ExamViewerWrapper để có thể review một session cụ thể bằng sessionId
                Link ví dụ: /exams/viewer/{exam_id_de_thi_goc}?reviewSessionId={session._id}
                exam_id_de_thi_goc có thể là session.examId nếu nó là định danh duy nhất của đề thi
                Nếu session.examId chỉ là một số thứ tự, bạn có thể cần lưu thêm slug hoặc một định danh
                khác của đề thi trong examMeta.
              */}
              <Link 
                href={`/exams/${session.examId}/take?reviewSessionId=${session._id}`} 
                className={styles.detailsButton}
              >
                Xem Chi Tiết
              </Link>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={styles.pageButton}
          >
            Trang trước
          </button>
          <span className={styles.pageInfo}>
            Trang {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={styles.pageButton}
          >
            Trang sau
          </button>
        </div>
      )}
    </div>
  );
}