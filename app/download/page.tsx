"use client";

import { useState } from 'react';
import Link from 'next/link';
import { FileText, Calendar, Users } from 'lucide-react';
import { topikISessions, topikIISessions } from '@/data/download-data';

export default function DownloadPage() {
  const [activeTab, setActiveTab] = useState<'topik-i' | 'topik-ii'>('topik-i');

  const currentSessions = activeTab === 'topik-i' ? topikISessions : topikIISessions;

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            Tải Đề Thi TOPIK
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            Tải xuống các đề thi TOPIK chính thức từ các kỳ thi gần đây. 
            Bao gồm cả TOPIK I và TOPIK II với đầy đủ đáp án và audio.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 w-full max-w-xs sm:max-w-none">
            <button
              onClick={() => setActiveTab('topik-i')}
              className={`w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'topik-i'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              TOPIK I
            </button>
            <button
              onClick={() => setActiveTab('topik-ii')}
              className={`w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'topik-ii'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              TOPIK II
            </button>
          </div>
        </div>

        {/* Sessions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {currentSessions.map((session) => (
            <Link
              key={session.id}
              href={`/download/${session.id}`}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-xs font-medium ${
                    activeTab === 'topik-i' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {activeTab === 'topik-i' ? 'TOPIK I' : 'TOPIK II'}
                  </span>
                </div>
                
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                  {session.name}
                </h3>
                
                <p className="text-sm text-gray-600 mb-3 sm:mb-4 line-clamp-2">
                  {session.description}
                </p>
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-500 space-y-1 sm:space-y-0">
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    {session.date}
                  </div>
                  <div className="flex items-center">
                    <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    {session.exams.length} đề
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-8 sm:mt-12 bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-3">
            Hướng dẫn sử dụng
          </h3>
          <ul className="space-y-2 text-blue-800 text-sm sm:text-base">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              Chọn loại đề thi (TOPIK I hoặc TOPIK II) từ các tab phía trên
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              Nhấn vào kỳ thi để xem danh sách đề thi chi tiết
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              Sử dụng nút "Xem trước" để xem tài liệu trực tiếp trên web
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              Sử dụng nút "Tải xuống" để tải file PDF về máy tính
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              Tất cả đề thi đều bao gồm đáp án và audio kèm theo
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
} 