// app/documents/[documentId]/view/components/ShareButtonClient.tsx
'use client';

import React, { useState, useEffect } from 'react';

// Icons (Sử dụng lại hoặc định nghĩa nếu cần)
const ShareIcon = React.memo(() => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 mr-0 sm:mr-1.5"><path d="M13 4.5a2.5 2.5 0 11.702 4.426l-6.516 3.257a2.5 2.5 0 11-1.618-1.618l6.516-3.257A2.5 2.5 0 0113 4.5zM4.5 13a2.5 2.5 0 100 5 2.5 2.5 0 000-5zm11-1.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z" /></svg>);
ShareIcon.displayName = 'ShareIcon';

const CheckCircleIcon = React.memo(() => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 mr-0 sm:mr-1.5 text-green-500 dark:text-green-400"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>);
CheckCircleIcon.displayName = 'CheckCircleIcon';

interface ShareButtonProps {
  titleToShare: string;
  urlToShare: string;
}

const ShareButtonClient: React.FC<ShareButtonProps> = ({ titleToShare, urlToShare }) => {
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [showUrlToCopy, setShowUrlToCopy] = useState<boolean>(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // Component đã mount ở client
  }, []);

  const copyLinkToClipboard = () => {
    // Đã có isClient check ở handleShare
    if (!navigator.clipboard) {
      setShowUrlToCopy(true);
      setFeedbackMessage("Trình duyệt không hỗ trợ tự sao chép. Vui lòng sao chép thủ công.");
      // Không tự động ẩn feedbackMessage ở đây để người dùng có thể thấy URL
      return;
    }

    navigator.clipboard.writeText(urlToShare).then(() => {
      setFeedbackMessage("Đã sao chép link!");
      setShowUrlToCopy(true);
      setTimeout(() => {
        setFeedbackMessage(null);
        setShowUrlToCopy(false);
      }, 3000); 
    }).catch(err => {
      console.error('Không thể sao chép link tự động:', err);
      setFeedbackMessage("Lỗi sao chép. Hãy copy thủ công bên dưới.");
      setShowUrlToCopy(true);
    });
  };

  const handleShare = async () => {
    if (!isClient) return; // Đảm bảo chỉ chạy ở client

    const shareData = {
      title: `TopikGo: ${titleToShare}`,
      text: `Xem tài liệu "${titleToShare}" trên TopikGo!`, // Bỏ URL ở đây vì nó đã có trong shareData.url
      url: urlToShare,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setFeedbackMessage("Đã chia sẻ!");
        setShowUrlToCopy(false); // Ẩn input URL nếu chia sẻ thành công
        setTimeout(() => setFeedbackMessage(null), 3000);
      } catch (err) {
        // Lỗi có thể do người dùng hủy chia sẻ, không nhất thiết là lỗi kỹ thuật
        if (err instanceof Error && err.name === 'AbortError') {
            console.log('Người dùng đã hủy chia sẻ.');
            // Có thể hiển thị URL để copy nếu muốn
            // copyLinkToClipboard();
        } else {
            console.error('Lỗi khi chia sẻ (Web Share API):', err);
            copyLinkToClipboard(); // Fallback nếu có lỗi khác
        }
      }
    } else {
      // Fallback cho trình duyệt không hỗ trợ Web Share API
      copyLinkToClipboard();
    }
  };

  // Để tránh lỗi hydration, chỉ render đầy đủ UI sau khi isClient là true.
  // Trước đó, render một placeholder đơn giản hoặc không render gì cả (nếu không ảnh hưởng layout).
  if (!isClient) {
    // Render một nút placeholder đơn giản, không có logic phức tạp
    // Class nên giống với nút thật để tránh thay đổi layout lớn gây hydration mismatch
    return (
      <button
        disabled
        className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 border border-slate-300 dark:border-slate-600 text-xs sm:text-sm font-medium rounded-md shadow-sm text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 cursor-not-allowed"
        title="Chia sẻ hoặc sao chép liên kết"
      >
        <ShareIcon />
        <span className="hidden sm:inline">Chia sẻ</span>
      </button>
    );
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={handleShare}
        className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 border border-slate-300 dark:border-slate-600 text-xs sm:text-sm font-medium rounded-md shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 focus:ring-sky-500 transition-colors"
        title="Chia sẻ hoặc sao chép liên kết"
      >
        {feedbackMessage && feedbackMessage.includes("Đã sao chép") ? <CheckCircleIcon /> : <ShareIcon />}
        <span className="hidden sm:inline">
            {feedbackMessage && !feedbackMessage.includes("thủ công") ? feedbackMessage : 'Chia sẻ'}
        </span>
        <span className="sm:hidden">
            {feedbackMessage && feedbackMessage.includes("Đã sao chép") ? 'Copied' : 
             (feedbackMessage && feedbackMessage.includes("Đã chia sẻ") ? 'Shared' : 'Share')}
        </span>
      </button>

      {showUrlToCopy && (
        <div 
            className="absolute top-full right-0 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto mt-2 w-64 sm:w-80 p-3 bg-slate-700 dark:bg-slate-900 text-white rounded-md shadow-xl z-20 border border-slate-600 dark:border-slate-700 text-xs
                       transform transition-all duration-200 ease-out opacity-0 animate-fadeInUp"
            style={{animation: 'fadeInUp 0.2s ease-out forwards'}}
        >
          <p className="mb-1.5 font-medium text-slate-100">
            {feedbackMessage && (feedbackMessage.includes("Lỗi") || feedbackMessage.includes("Trình duyệt không hỗ trợ")) 
                ? feedbackMessage 
                : "Link để chia sẻ/sao chép:"
            }
          </p>
          <input
            type="text"
            value={urlToShare}
            readOnly
            onFocus={(e) => e.target.select()} // Tự động chọn text khi focus
            className="w-full bg-slate-600 dark:bg-slate-800 text-slate-100 p-2 rounded text-xs border border-slate-500 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 mb-2"
            aria-label="Link để sao chép"
          />
           <button 
             onClick={() => {setShowUrlToCopy(false); setFeedbackMessage(null);}}
             className="w-full mt-1 text-xs text-center text-slate-300 hover:text-slate-100 bg-slate-600 hover:bg-slate-500 py-1 rounded transition-colors"
            >
                Đóng
            </button>
        </div>
      )}
    </div>
  );
};

export default ShareButtonClient;