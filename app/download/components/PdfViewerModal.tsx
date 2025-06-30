'use client';

import { useState } from 'react';
import { X, Download, ExternalLink } from 'lucide-react';

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  examName: string;
  driveLink: string;
}

export default function PdfViewerModal({ isOpen, onClose, examName, driveLink }: PdfViewerModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tạo preview URL từ drive link
  const createPreviewUrl = (driveLink: string): string => {
    const match = driveLink.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match) {
      const fileId = match[1];
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
    return driveLink;
  };

  // Tạo download URL
  const createDownloadUrl = (driveLink: string): string => {
    const match = driveLink.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match) {
      const fileId = match[1];
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
    return driveLink;
  };

  const previewUrl = createPreviewUrl(driveLink);
  const downloadUrl = createDownloadUrl(driveLink);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${examName}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInDrive = () => {
    window.open(driveLink, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4">
      <div className="relative w-full h-full max-w-6xl max-h-[95vh] bg-white rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate flex-1 mr-2">
            {examName}
          </h2>
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            <button
              onClick={handleDownload}
              className="flex items-center px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              <span className="hidden sm:inline">Tải xuống</span>
              <span className="sm:hidden">Tải</span>
            </button>
            <button
              onClick={handleOpenInDrive}
              className="flex items-center px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              <span className="hidden sm:inline">Mở Drive</span>
              <span className="sm:hidden">Drive</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-3 sm:mb-4"></div>
                <p className="text-sm sm:text-base text-gray-600">Đang tải tài liệu...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 p-4">
              <div className="text-center">
                <p className="text-red-600 mb-4 text-sm sm:text-base">{error}</p>
                <button
                  onClick={() => window.open(driveLink, '_blank')}
                  className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm sm:text-base"
                >
                  Mở trong Google Drive
                </button>
              </div>
            </div>
          )}

          <iframe
            src={previewUrl}
            className="w-full h-full border-0"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setError('Không thể tải tài liệu. Vui lòng thử lại.');
            }}
            title={examName}
          />
        </div>
      </div>
    </div>
  );
} 