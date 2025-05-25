// app/documents/components/PdfViewerModal.tsx
'use client';

import React from 'react';

// Icons (bạn có thể dùng lại từ DocumentBrowser hoặc định nghĩa ở đây)
const DownloadIconExternal = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1.5"><path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l3.25 3.5a.75.75 0 001.09 0l3.25-3.5a.75.75 0 10-1.09-1.03l-2.955 3.128V2.75z" /><path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" /></svg>;


interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfEmbedUrl: string | null; // Link dạng .../preview để nhúng
  originalGoogleDriveLink: string; // Link gốc dạng .../view?usp=sharing để tải
  title: string;
}

const PdfViewerModal: React.FC<PdfViewerModalProps> = ({ 
  isOpen, 
  onClose, 
  pdfEmbedUrl, 
  originalGoogleDriveLink,
  title 
}) => {
  if (!isOpen || !pdfEmbedUrl) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center p-2 sm:p-4 z-[1060] transition-opacity duration-300 ease-in-out animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-slate-100 dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-4xl h-[95vh] sm:h-[90vh] flex flex-col overflow-hidden transform transition-all duration-300 ease-out animate-scaleUp"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-3 sm:p-4 border-b border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
          <h3 className="text-md sm:text-lg font-semibold text-slate-700 dark:text-slate-200 truncate pr-2" title={title}>
            {title}
          </h3>
          <div className="flex items-center space-x-2">
            <a 
                href={originalGoogleDriveLink} // Link này sẽ mở trang Google Drive cho phép tải
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1 dark:focus:ring-offset-slate-800 transition-colors"
            >
                <DownloadIconExternal /> Tải từ Drive
            </a>
            <button 
                onClick={onClose} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl p-1 -m-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                aria-label="Đóng modal"
            >
                &times;
            </button>
          </div>
        </div>
        <iframe
          src={pdfEmbedUrl}
          className="w-full h-full flex-grow border-0"
          title={`Xem PDF: ${title}`}
          // sandbox="allow-scripts allow-same-origin allow-popups allow-forms" // Cân nhắc sandbox để tăng bảo mật
        >
          <p className="p-4 text-center text-slate-600 dark:text-slate-300">
            Trình duyệt của bạn không hỗ trợ iframe để xem PDF. 
            Vui lòng <a href={originalGoogleDriveLink} target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400 underline">nhấp vào đây để tải về</a>.
          </p>
        </iframe>
      </div>
      {/* Đơn giản hóa animation bằng cách định nghĩa keyframes một lần */}
      <style jsx global>{`
        @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
        @keyframes scaleUp { 0% { opacity: 0.8; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        .animate-scaleUp { animation: scaleUp 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default PdfViewerModal;