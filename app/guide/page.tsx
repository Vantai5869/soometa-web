// app/guide/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuthStore } from './../store/authStore'; // Điều chỉnh đường dẫn

const NEXT_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// Component cho một mục hướng dẫn
const GuideSection: React.FC<{ title: string; children: React.ReactNode; id?: string }> = ({ title, children, id }) => (
  <section id={id} className="mb-10 md:mb-12 scroll-mt-20">
    <h2 className="text-2xl md:text-3xl font-semibold text-sky-700 dark:text-sky-400 mb-4 pb-2 border-b border-sky-200 dark:border-sky-800">
      {title}
    </h2>
    <div className="space-y-3 text-gray-700 dark:text-gray-300 leading-relaxed">
      {children}
    </div>
  </section>
);

// Component cho form/modal gửi phản hồi (đơn giản)
interface FeedbackFormProps {
  token: string | null;
  onFeedbackSent: () => void; // Callback khi gửi thành công để đóng form hoặc hiển thị thông báo
  onCancel: () => void;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ token, onFeedbackSent, onCancel }) => {
    const [feedbackText, setFeedbackText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

    const handleSubmitFeedback = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!feedbackText.trim() || feedbackText.trim().length < 10) {
            setSubmitError("Vui lòng nhập ít nhất 10 ký tự.");
            return;
        }
        if (!token) {
            setSubmitError("Phiên đăng nhập không hợp lệ. Vui lòng thử lại.");
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);
        setSubmitSuccess(null);

        try {
            const response = await fetch(`${NEXT_API_BASE_URL}/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ 
                    feedbackText: feedbackText.trim(),
                    pageContext: window.location.pathname // Gửi kèm trang hiện tại
                }),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || "Không thể gửi phản hồi.");
            }
            setSubmitSuccess(result.message || "Đã gửi phản hồi thành công!");
            setFeedbackText(''); // Xóa nội dung sau khi gửi
            setTimeout(() => {
                onFeedbackSent(); // Gọi callback (ví dụ để đóng form/modal)
            }, 2000); // Đợi 2s để user đọc success message

        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Lỗi không xác định.";
            setSubmitError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmitFeedback} className="mt-4 p-4 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 shadow-md">
            <h3 className="text-lg font-medium text-gray-800 dark:text-slate-100 mb-2">Góp ý của bạn:</h3>
            <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Chúng tôi có thể cải thiện điều gì? (ít nhất 10 ký tự)"
                rows={5}
                className="w-full p-2 border border-gray-300 dark:border-slate-500 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-700 dark:text-slate-100"
                minLength={10}
                maxLength={2000}
                required
                disabled={isSubmitting}
            />
            {submitError && <p className="text-sm text-red-600 mt-2">{submitError}</p>}
            {submitSuccess && <p className="text-sm text-green-600 mt-2">{submitSuccess}</p>}
            <div className="mt-4 flex justify-end space-x-3">
                <button 
                    type="button" 
                    onClick={onCancel} 
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-600 rounded-md hover:bg-gray-200 dark:hover:bg-slate-500 disabled:opacity-50"
                >
                    Hủy
                </button>
                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md disabled:opacity-50 disabled:cursor-wait"
                >
                    {isSubmitting ? 'Đang gửi...' : 'Gửi phản hồi'}
                </button>
            </div>
        </form>
    );
};


export default function GuidePage() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  const currentUser = useAuthStore((state) => state.currentUser);
  const token = useAuthStore((state) => state.token);
  const isLoadingAuth = useAuthStore((state) => state._isLoadingAuth);
  const openLoginModal = useAuthStore(state => state.openLoginModal);

  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [showThankYouModal, setShowThankYouModal] = useState(false);

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValidEmail = email.trim() !== '' && emailRegex.test(email.trim());

  const handleImageClick = (imageNum: number) => {
    setEnlargedImage(imageNum);
  };

  const handleCloseEnlarged = () => {
    setEnlargedImage(null);
  };

  // Đóng modal khi nhấn ESC
  useEffect(() => {
    if (!isClient) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (enlargedImage !== null) {
          setEnlargedImage(null);
        }
        if (showThankYouModal) {
          setShowThankYouModal(false);
        }
      }
    };
    if (enlargedImage !== null || showThankYouModal) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Ngăn scroll khi modal mở
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [enlargedImage, showThankYouModal, isClient]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isClient) return;

    // Kiểm tra đăng nhập trước
    if (!currentUser || !token) {
      alert("Vui lòng đăng nhập để đăng ký trải nghiệm ứng dụng.");
      openLoginModal();
      return;
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError("Vui lòng nhập email.");
      return;
    }
    if (!emailRegex.test(email.trim())) {
      setEmailError("Email không hợp lệ.");
      return;
    }

    setIsSubmittingEmail(true);
    setEmailError(null);

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      const response = await fetch(`${NEXT_API_BASE_URL}/feedback`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          feedbackText: `Đăng ký trải nghiệm ứng dụng - Email: ${email.trim()}`,
          pageContext: window.location.pathname
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || "Không thể gửi đăng ký.");
      }

      // Gửi thành công
      setEmail('');
      setShowThankYouModal(true);
      
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Lỗi không xác định.";
      setEmailError(msg);
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  const handleFeedbackButtonClick = () => {
    if (!isClient) return;

    if (!currentUser || !token) {
      alert("Vui lòng đăng nhập để gửi phản hồi.");
      openLoginModal(
        () => { // onSuccess callback: người dùng vừa đăng nhập thành công
            setShowFeedbackForm(true); // Mở form sau khi đăng nhập
        }
        // Không cần onCancel ở đây, nếu họ không đăng nhập thì thôi
      );
    } else {
      setShowFeedbackForm(true);
    }
  };

  if (!isClient || isLoadingAuth) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center text-gray-600 bg-gray-50 p-4">
        <svg className="mx-auto h-12 w-12 text-sky-500 animate-spin" /* SVG Spinner */></svg>
        <p className="mt-4 text-lg font-medium">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 md:p-10 lg:p-12 dark:bg-slate-900 dark:text-slate-200">
      <header className="mb-12 text-center border-b pb-8 border-gray-200 dark:border-slate-700">
        <h1 className="text-4xl md:text-5xl font-bold text-sky-600 dark:text-sky-400 tracking-tight">
          Chào mừng đến với TopikGo!
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Nền tảng toàn diện giúp bạn chinh phục kỳ thi TOPIK và nâng cao năng lực tiếng Hàn một cách hiệu quả.
        </p>
      </header>

      {/* Form đăng ký trải nghiệm ứng dụng */}
      <section className="mb-12 max-w-3xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 md:p-8 border border-gray-200 dark:border-slate-700">
          <h2 className="text-2xl md:text-3xl font-bold text-sky-600 dark:text-sky-400 mb-4 text-center">
            Đăng ký trải nghiệm ứng dụng
          </h2>
          <p className="text-sm text-amber-600 dark:text-amber-400 mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <strong>Lưu ý:</strong> Hiện tại bản thử nghiệm chỉ có trên CH Play, chưa có trên App Store. Do đó, người dùng điện thoại iPhone sẽ chưa thể trải nghiệm ứng dụng.
          </p>
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email của bạn
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(null);
                }}
                placeholder="Nhập email của bạn"
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-500 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-700 dark:text-slate-100"
                required
                disabled={isSubmittingEmail}
              />
              {emailError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{emailError}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmittingEmail || !isValidEmail}
              className="w-full px-6 py-3 text-base font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed enabled:cursor-pointer transition-colors"
            >
              {isSubmittingEmail ? 'Đang gửi...' : 'Đăng ký trải nghiệm'}
            </button>
          </form>
        </div>
      </section>

      {/* Phần hiển thị ảnh mobile preview */}
      <section className="mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-sky-600 dark:text-sky-400 mb-8 text-center">
          Hình ảnh ứng dụng
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6 max-w-3xl mx-auto">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
            <div 
              key={num} 
              className="relative group cursor-pointer"
              onClick={() => handleImageClick(num)}
            >
              <div className="aspect-[9/16] w-full overflow-hidden rounded-lg shadow-lg bg-gray-100 dark:bg-slate-800">
                <img
                  src={`/mobile-preview/${num}.png`}
                  alt={`Mobile preview ${num}`}
                  className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modal phóng to ảnh */}
      {enlargedImage !== null && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
          onClick={handleCloseEnlarged}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleCloseEnlarged}
              className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full p-2"
              aria-label="Đóng"
            >
              <svg 
                className="w-6 h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </button>
            <img
              src={`/mobile-preview/${enlargedImage}.png`}
              alt={`Mobile preview ${enlargedImage} - phóng to`}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Modal cảm ơn */}
      {showThankYouModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
          onClick={() => setShowThankYouModal(false)}
        >
          <div 
            className="relative bg-white dark:bg-slate-800 rounded-lg shadow-2xl max-w-md w-full p-6 md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowThankYouModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              aria-label="Đóng"
            >
              <svg 
                className="w-6 h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </button>
            <div className="text-center">
              <div className="mb-4">
                <svg 
                  className="mx-auto h-16 w-16 text-green-500" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4">
                Cảm ơn bạn đã đăng ký!
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                Cảm ơn bạn đã đăng ký trải nghiệm ứng dụng. Chúng tôi sẽ gửi email chứa link CH Play ứng dụng ngay khi vừa phát hành.
              </p>
              <button
                onClick={() => setShowThankYouModal(false)}
                className="w-full px-6 py-3 text-base font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-sky-500 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        <GuideSection title="TopikGo là gì?" id="gioi-thieu">
          <p>
            TopikGo được xây dựng với mục tiêu cung cấp một công cụ luyện thi TOPIK hiện đại và tiện lợi. Chúng tôi tổng hợp các đề thi TOPIK I và TOPIK II, phân loại câu hỏi theo dạng bài, và tích hợp các công cụ thông minh để hỗ trợ bạn tối đa trong quá trình học tập.
          </p>
        </GuideSection>

        <GuideSection title="Các Tính Năng Chính" id="tinh-nang">
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Luyện thi theo đề:</strong> Truy cập kho đề thi TOPIK phong phú, bao gồm các đề thi chính thức và đề mô phỏng, với giao diện làm bài sát với thực tế.</li>
            <li><strong>Luyện theo dạng bài:</strong> Tập trung rèn luyện từng dạng câu hỏi cụ thể thường xuất hiện trong các kỹ năng Đọc (읽기) và Nghe (듣기).</li>
            <li><strong>Tra cứu & Thảo luận động (AI Chat):</strong> Chỉ cần bôi đen một từ hoặc cụm từ tiếng Hàn bất kỳ trên trang, một bảng thông tin sẽ xuất hiện cung cấp nghĩa, ví dụ và cho phép bạn đặt câu hỏi, thảo luận sâu hơn với trợ lý AI.</li>
            <li><strong>Lưu từ vựng cá nhân:</strong> Dễ dàng lưu lại những từ vựng quan trọng bạn gặp phải trong quá trình học và luyện thi vào danh sách của riêng bạn.</li>
            <li><strong>Theo dõi lịch sử làm bài:</strong> Xem lại các bài thi bạn đã hoàn thành, điểm số và rút kinh nghiệm.</li>
          </ul>
        </GuideSection>

        <GuideSection title="Sử Dụng TopikGo Hiệu Quả" id="cach-dung">
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-slate-100 mb-2">1. Tra cứu nhanh khi học và làm bài:</h3>
              <p>Khi bạn đang làm bài thi Đọc, xem lại transcript phần Nghe, hoặc đọc bất kỳ nội dung tiếng Hàn nào trên TopikGo:</p>
              <ul className="list-disc list-inside ml-5 mt-1 space-y-1">
                <li>Chỉ cần dùng chuột **bôi đen (tô đen)** một từ hoặc cụm từ tiếng Hàn.</li>
                <li>Một bảng tương tác (Interactive Chat Panel) sẽ tự động xuất hiện ở góc dưới bên phải màn hình.</li>
                <li>Bảng này sẽ cung cấp cho bạn **nghĩa tiếng Việt** của từ/cụm từ đó và các **ví dụ sử dụng** trong ngữ cảnh.</li>
                <li>Bạn có thể tiếp tục **đặt câu hỏi cho AI** về từ vựng, ngữ pháp liên quan, hoặc yêu cầu thêm ví dụ ngay trong bảng chat đó.</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-slate-100 mb-2">2. Lưu từ vựng để ôn tập:</h3>
              <p>Trong bảng tra cứu từ (Interactive Chat Panel) vừa xuất hiện:</p>
              <ul className="list-disc list-inside ml-5 mt-1 space-y-1">
                <li>Bạn sẽ thấy một **biểu tượng ngôi sao (☆)** ở góc trên bên phải của bảng.</li>
                <li>Nhấp vào ngôi sao đó. Nếu bạn đã đăng nhập, từ vựng (cùng nghĩa và ví dụ bạn vừa tra) sẽ được lưu vào danh sách cá nhân.</li>
                <li>Để xem lại các từ đã lưu, hãy truy cập trang <Link href="/my-vocabulary" className="text-sky-600 hover:text-sky-500 underline dark:text-sky-400 dark:hover:text-sky-300">Từ vựng của tôi</Link> từ menu (nếu có) hoặc điều hướng trực tiếp.</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-slate-100 mb-2">3. Tận dụng lịch sử làm bài:</h3>
              <p>
                Sau mỗi lần hoàn thành đề thi (và đã đăng nhập), kết quả của bạn sẽ được lưu lại. Truy cập trang <Link href="/history" className="text-sky-600 hover:text-sky-500 underline dark:text-sky-400 dark:hover:text-sky-300">Lịch sử luyện thi</Link> để:
              </p>
              <ul className="list-disc list-inside ml-5 mt-1 space-y-1">
                <li>Xem lại điểm số các bài đã làm.</li>
                <li>Phân tích lỗi sai và rút kinh nghiệm.</li>
                <li>Theo dõi sự tiến bộ của bản thân qua thời gian.</li>
              </ul>
            </div>
          </div>
        </GuideSection>

        <GuideSection title="Đóng Góp Ý Kiến" id="gop-y">
          <p className="mb-4">
            TopikGo vẫn đang trong quá trình phát triển và hoàn thiện. Chúng tôi rất trân trọng mọi ý kiến đóng góp, báo lỗi, hoặc đề xuất tính năng từ bạn để giúp nền tảng ngày càng tốt hơn.
          </p>
          {!showFeedbackForm ? (
            <button
              onClick={handleFeedbackButtonClick}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 focus:ring-sky-500"
            >
              Gửi ý kiến đóng góp
            </button>
          ) : (
            <FeedbackForm 
                token={token} 
                onFeedbackSent={() => {
                    // Đã có alert thành công từ FeedbackForm
                    setTimeout(() => setShowFeedbackForm(false), 1500); // Đóng form sau khi thông báo thành công hiển thị xong
                }}
                onCancel={() => setShowFeedbackForm(false)}
            />
          )}
        </GuideSection>
      </div>
    </div>
  );
}