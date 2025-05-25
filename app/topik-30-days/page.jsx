'use client';

import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import transcriptData from '../../data/topik-30-days.json';

// Biểu tượng SVG đơn giản cho Menu và Close (Bạn có thể thay thế bằng thư viện icon)
const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);


export default function Home() {
  const [selectedDay, setSelectedDay] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [viewMode, setViewMode] = useState('transcript'); // Bắt đầu với Transcript
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Trạng thái sidebar cho mobile
  const audioRef = useRef(null);
  const animationFrameRef = useRef(null); // Ref để lưu ID của requestAnimationFrame

  // Hàm cập nhật thời gian
  const updateTime = () => {
    if (audioRef.current) {
      const newTime = audioRef.current.currentTime * 1000;
      setCurrentTime(newTime);
      animationFrameRef.current = requestAnimationFrame(updateTime);
    }
  };

  // Hàm bắt đầu cập nhật
  const startUpdatingTime = () => {
    cancelAnimationFrame(animationFrameRef.current); // Hủy frame cũ nếu có
    animationFrameRef.current = requestAnimationFrame(updateTime);
  };

  // Hàm dừng cập nhật
  const stopUpdatingTime = () => {
    cancelAnimationFrame(animationFrameRef.current);
  };


  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.addEventListener('play', startUpdatingTime);
    audio.addEventListener('pause', stopUpdatingTime);
    audio.addEventListener('ended', () => {
      stopUpdatingTime();
      setCurrentTime(0); // Reset về 0 khi kết thúc
    });
    // Đảm bảo dừng khi component unmount hoặc selectedDay thay đổi
    return () => {
      stopUpdatingTime();
      audio.removeEventListener('play', startUpdatingTime);
      audio.removeEventListener('pause', stopUpdatingTime);
      audio.removeEventListener('ended', () => {
        stopUpdatingTime();
        setCurrentTime(0);
      });
    };
  }, [selectedDay]); // Chỉ chạy lại khi selectedDay thay đổi

  // Lấy dữ liệu transcript
  const selectedTranscript = transcriptData[selectedDay - 1] || {};
  const utterances = selectedTranscript.utterances?.[0] || {};
  const words = utterances.words || [];
  const title = `Day ${selectedDay}`;

  // Xử lý click vào từ
  const handleWordClick = (startTime) => {
    if (audioRef.current) {
      audioRef.current.currentTime = startTime / 1000;
      audioRef.current.play();
    }
  };

  // Xử lý chọn ngày mới
  const handleDaySelect = (day) => {
    setSelectedDay(day);
    setCurrentTime(0);
    setIsSidebarOpen(false); // Đóng sidebar trên mobile sau khi chọn
    if (audioRef.current) {
      audioRef.current.pause();
      // Cần đợi một chút để audio src cập nhật trước khi set currentTime
      setTimeout(() => {
        if (audioRef.current) audioRef.current.currentTime = 0;
      }, 100);
    }
  }

  return (
    <>
      <Head>
        <title>TOPIK in 30 Days | Day {selectedDay}</title>
        <meta name="description" content={`Transcript for Day ${selectedDay} of TOPIK in 30 Days`} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex h-screen bg-gray-50 text-gray-900">
        {/* Lớp phủ cho sidebar trên mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black opacity-50 z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        {/* Thanh bên trái (Sidebar) */}
        <div
          className={`fixed lg:static inset-y-0 left-0 w-64 lg:w-1/4 bg-white shadow-lg p-4 overflow-y-auto transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out z-40`}
        >
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">TOPIK in 30 Days</h1>
            <button
              className="lg:hidden text-gray-600 hover:text-gray-900"
              onClick={() => setIsSidebarOpen(false)}
            >
              <CloseIcon />
            </button>
          </div>
          <ul className="space-y-1">
            {transcriptData.map((_, index) => (
              <li key={index}>
                <button
                  className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${selectedDay === index + 1
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  onClick={() => handleDaySelect(index + 1)}
                >
                  Day {index + 1}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Nội dung bên phải */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header trên Mobile */}
          <div className="lg:hidden p-4 bg-white shadow-sm flex items-center">
            <button
              className="text-gray-600 hover:text-gray-900 mr-4"
              onClick={() => setIsSidebarOpen(true)}
            >
              <MenuIcon />
            </button>
            <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          </div>

          {/* Khu vực nội dung chính */}
          <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
            <h2 className="hidden lg:block text-3xl font-bold mb-6 text-gray-800">{title}</h2>

            <audio
              ref={audioRef}
              controls
              src={selectedTranscript.audio_url}
              className="w-full mb-6 rounded-md" // Quay lại 'rounded-md' và bỏ 'shadow-sm'
              key={selectedDay}
            ></audio>

            {/* Nút chuyển đổi chế độ xem (Tabs) */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                  <button
                    onClick={() => setViewMode('transcript')}
                    className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${viewMode === 'transcript'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    Transcript
                  </button>
                  <button
                    onClick={() => setViewMode('pdf')}
                    className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${viewMode === 'pdf'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    PDF
                  </button>
                </nav>
              </div>
            </div>

            {/* Khu vực hiển thị nội dung */}
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg min-h-[400px]">
              {viewMode === 'pdf' ? (
                <div className="h-[600px] lg:h-[800px] -m-6 md:-m-8 rounded-xl overflow-hidden">
                  <iframe
                    src="https://drive.google.com/file/d/1hmZlCYFE5s034vjWCfKh3qWALkgqHIv_/preview"
                    width="100%"
                    height="100%"
                    title="PDF Viewer"
                    className="border-none"
                  ></iframe>
                </div>
              ) : words.length > 0 ? (
                <p className="text-base md:text-lg text-gray-800 leading-relaxed"> {/* <-- Đã thay đổi */}
                  {words.map((word, index) => (
                    <span
                      key={index}
                      className={`inline-block mx-0.5 px-1 py-0.5 rounded transition-colors duration-150 cursor-pointer ${ // <-- Đã thay đổi
                        currentTime >= word.start && currentTime < word.end
                          ? 'bg-blue-100 text-blue-700 font-medium' // Tô sáng từ hiện tại
                          : 'bg-transparent hover:bg-gray-100'     // Hiệu ứng hover nhẹ nhàng hơn
                        }`}
                      onClick={() => handleWordClick(word.start)}
                    >
                      {word.text}
                    </span>
                  ))}
                </p>
              ) : (
                <div className="flex items-center justify-center h-[400px]">
                  <p className="text-gray-500 text-lg">No transcript available for this day.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}