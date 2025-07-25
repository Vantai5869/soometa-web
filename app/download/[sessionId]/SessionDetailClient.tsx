'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Eye, Download, FileText } from 'lucide-react';
import { ExamSession } from '@/data/download-data';
import PdfViewerModal from '../components/PdfViewerModal';
import { api } from '@/lib/configAxios';

interface SessionDetailClientProps {
  session: ExamSession | undefined;
}

export default function SessionDetailClient({ session }: SessionDetailClientProps) {
  const [selectedExam, setSelectedExam] = useState<{ name: string; driveLink: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Không tìm thấy kỳ thi
            </h1>
            <p className="text-gray-600 mb-8">
              Kỳ thi bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
            </p>
            <Link
              href="/download"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Quay lại trang tải đề
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handlePreview = (exam: { name: string; driveLink: string }) => {
    setSelectedExam(exam);
    setIsModalOpen(true);
  };

  const handleDownload = async (exam: { id: string; name: string; driveLink: string }) => {
    try {
      await api.post(`/download-stats/${exam.id}`);
    } catch {}
    // Tạo download link từ drive link
    const match = exam.driveLink.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match) {
      const fileId = match[1];
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${exam.name}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
          <Link href="/download" className="hover:text-gray-700">
            Tải Đề
          </Link>
          <span>/</span>
          <span className="text-gray-900 truncate">{session.name}</span>
        </nav>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {session.name}
          </h1>
          <p className="text-gray-600 mb-4">
            {session.description}
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center text-sm text-gray-500 space-y-1 sm:space-y-0 sm:space-x-4">
            <span>Ngày thi: {session.date}</span>
            <span className="hidden sm:inline">•</span>
            <span>{session.exams.length} đề thi</span>
          </div>
        </div>

        {/* Exam List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Danh sách đề thi
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {session.exams.map((exam) => (
              <div key={exam.id} className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="flex-shrink-0">
                      <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1">
                        {exam.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">
                        {exam.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {exam.type}
                        </span>
                        <span className="text-sm text-gray-500">
                          {exam.size}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <button
                      onClick={() => handlePreview(exam)}
                      className="flex items-center justify-center px-3 sm:px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Xem trước
                    </button>
                    <button
                      onClick={() => handleDownload(exam)}
                      className="flex items-center justify-center px-3 sm:px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Tải xuống
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-6 sm:mt-8">
          <Link
            href="/download"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Quay lại trang tải đề
          </Link>
        </div>
      </div>

      {/* PDF Viewer Modal */}
      {selectedExam && (
        <PdfViewerModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedExam(null);
          }}
          examName={selectedExam.name}
          driveLink={selectedExam.driveLink}
        />
      )}
    </div>
  );
} 