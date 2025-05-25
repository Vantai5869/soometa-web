'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Head from 'next/head';
import transcriptData from '../../data/topik-30-days.json'; // Giữ nguyên import file gốc

// Biểu tượng SVG đơn giản cho Menu và Close
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
  const [viewMode, setViewMode] = useState('transcript');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const audioRef = useRef(null);
  const animationFrameRef = useRef(null);

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
    cancelAnimationFrame(animationFrameRef.current);
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
      setCurrentTime(0);
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
  }, [selectedDay]);

  // Lấy dữ liệu transcript thô
  const selectedTranscript = transcriptData[selectedDay - 1] || {};
  const utterances = selectedTranscript.utterances?.[0] || {};
  const words = utterances.words || [];
  const title = `Day ${selectedDay}`;

  // Hàm xử lý để nhóm các từ thành câu và đánh dấu từ khóa
  const groupWordsIntoSentences = (wordsToProcess) => {
    if (!wordsToProcess || wordsToProcess.length === 0) return [];

    const sentences = [];
    let currentSentence = [];
    let lastNumericListItem = 0; // Theo dõi số cuối cùng được phát hiện
    let previousWordText = ''; // Để lưu từ trước đó

    for (let i = 0; i < wordsToProcess.length; i++) {
      const word = wordsToProcess[i];
      const wordText = word.text.trim();

      if (!wordText) {
        // Cập nhật từ trước đó ngay cả khi từ hiện tại rỗng
        previousWordText = wordText;
        continue;
      }

      const lastChar = wordText.slice(-1);
      let isNumericListItem = false; // "1."
      let currentNumber = null;

      // Kiểm tra số có dấu chấm (e.g., "1.")
      if (lastChar === '.' && wordText.length > 1) {
        const potentialNumber = parseInt(wordText.slice(0, -1), 10);
        if (!isNaN(potentialNumber) && potentialNumber > 0) {
            isNumericListItem = true;
            currentNumber = potentialNumber;
        }
      }
      
      let isStandaloneNumber = false; // "1"
      let standaloneNumberValue = null;
      // Kiểm tra số đơn lẻ không có dấu chấm (e.g., "1")
      // Chỉ kiểm tra nếu nó chưa được xác định là số có dấu chấm
      if (!isNumericListItem) {
          const potentialStandaloneNumber = parseInt(wordText, 10);
          // Đảm bảo nó là số và không có ký tự khác
          if (!isNaN(potentialStandaloneNumber) && potentialStandaloneNumber > 0 && wordText === potentialStandaloneNumber.toString()) {
              isStandaloneNumber = true;
              standaloneNumberValue = potentialStandaloneNumber;
          }
      }

      let shouldStartNewSentenceHere = false;

      // BỔ SUNG: Bỏ qua số ngay sau "데이"
      if (i > 0 && previousWordText === '데이' && (isNumericListItem || isStandaloneNumber)) {
          // Không xử lý đây là điểm bắt đầu câu mới
          // Quan trọng: Đặt lại lastNumericListItem để không ảnh hưởng đến các số thứ tự thực sự sau này
          lastNumericListItem = 0; 
          currentSentence.push({ ...word }); // Vẫn thêm từ vào câu hiện tại
          previousWordText = wordText; // Cập nhật từ trước đó
          continue; // Bỏ qua phần còn lại của vòng lặp cho từ này
      }

      // Logic cũ: nếu là số có dấu chấm và theo thứ tự
      if (isNumericListItem && currentNumber === lastNumericListItem + 1) {
          shouldStartNewSentenceHere = true;
          lastNumericListItem = currentNumber;
      } 
      // Logic mới: nếu là số đơn lẻ và theo thứ tự
      else if (isStandaloneNumber && standaloneNumberValue === lastNumericListItem + 1) {
          shouldStartNewSentenceHere = true;
          lastNumericListItem = standaloneNumberValue;
      }
      // Logic cuối cùng cho từ cuối cùng của transcript
      else if (i === wordsToProcess.length - 1 && currentSentence.length > 0) {
          // Nếu đây là từ cuối cùng và đã có từ trong câu hiện tại, kết thúc câu
          shouldStartNewSentenceHere = true;
      }


      if (shouldStartNewSentenceHere) {
          if (currentSentence.length > 0) {
              sentences.push({ words: currentSentence });
          }
          currentSentence = [];
      }
      
      currentSentence.push({ ...word });
      previousWordText = wordText; // Cập nhật từ trước đó sau khi xử lý
    }

    // Đảm bảo thêm câu cuối cùng nếu có
    if (currentSentence.length > 0) {
      sentences.push({ words: currentSentence });
    }

    const finalSentences = sentences.map(sentence => {
        if (sentence.words.length > 1) {
            const firstWordText = sentence.words[0].text.trim();
            const lastCharOfFirstWord = firstWordText.slice(-1);
            const potentialNumberWithDot = parseInt(firstWordText.slice(0, -1), 10);
            const potentialStandaloneNumber = parseInt(firstWordText, 10);

            // Kiểm tra số có dấu chấm hoặc số đơn lẻ
            const isNumericListItemAtStart = (lastCharOfFirstWord === '.' && !isNaN(potentialNumberWithDot) && potentialNumberWithDot > 0);
            const isStandaloneNumberAtStart = (!isNaN(potentialStandaloneNumber) && potentialStandaloneNumber > 0 && firstWordText === potentialStandaloneNumber.toString());


            if (isNumericListItemAtStart || isStandaloneNumberAtStart) {
                // Đánh dấu từ thứ hai là từ khóa (chỉ nếu có từ thứ hai)
                const updatedWords = sentence.words.map((w, idx) => {
                    if (idx === 1) {
                        return { ...w, isKeyword: true };
                    }
                    return w;
                });
                return { words: updatedWords };
            }
        }
        return sentence;
    });

    return finalSentences;
  };

  // Sử dụng useMemo để chỉ xử lý lại khi 'words' thay đổi
  const sentences = useMemo(() => groupWordsIntoSentences(words), [words]);

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

      <div className="flex min-h-screen bg-gray-50 text-gray-900">
        {/* Lớp phủ cho sidebar trên mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black opacity-50 z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        {/* Thanh bên trái (Sidebar) - ĐÃ BỎ rounded-xl */}
        <div
          className={`fixed lg:static inset-y-0 left-0 w-64 lg:w-1/4 bg-white shadow-xl p-6 overflow-y-auto transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out z-40`}
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
                  className={`w-full text-left p-3.5 rounded-lg transition-all duration-200 ease-in-out ${selectedDay === index + 1
                      ? 'bg-blue-100 text-blue-800 shadow-sm' // ĐÃ THAY ĐỔI HIGHLIGHT STYLE TẠI ĐÂY
                      : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
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
          <div className="lg:hidden p-4 bg-white shadow-sm flex flex-col">
            <div className="flex items-center mb-4">
              <button
                className="text-gray-600 hover:text-gray-900 mr-4"
                onClick={() => setIsSidebarOpen(true)}
              >
                <MenuIcon />
              </button>
              <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
            </div>
            <audio
              ref={audioRef}
              controls
              src={selectedTranscript.audio_url}
              className="w-full rounded-md" 
              key={selectedDay}
            ></audio>
          </div>

          {/* Header trên Desktop */}
          <h2 className="hidden lg:block text-3xl font-bold p-4 md:p-6 lg:p-8 mb-6 text-gray-800">{title}</h2>
          
          {/* Audio player cho Desktop (không sticky) */}
          <audio
            ref={audioRef}
            controls
            src={selectedTranscript.audio_url}
            className="w-full mb-6 rounded-md hidden lg:block px-4 md:px-6 lg:px-8" // Ẩn trên mobile, hiển thị trên desktop
            key={selectedDay}
          ></audio>

          {/* Nút chuyển đổi chế độ xem (Tabs) */}
          <div className="mb-6 px-4 md:px-6 lg:px-8">
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
          <div data-selectable-area="true" className="flex-1 min-h-[400px] mx-4 md:mx-6 lg:mx-8 mb-4">
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
            ) : sentences.length > 0 ? (
              <div className="text-base md:text-lg text-gray-800 leading-relaxed">
                {sentences.map((sentenceObj, sentenceIndex) => (
                  // Mỗi câu trong một thẻ <p> riêng biệt
                  <p key={`sentence-${sentenceIndex}`} className="mb-4">
                    {sentenceObj.words.map((word, wordIndex) => (
                      <span
                        key={`word-${sentenceIndex}-${wordIndex}`}
                        // Thêm lớp CSS để tô đậm từ khóa
                        className={`inline-block mx-0.5 px-1 py-0.5 rounded transition-colors duration-150 cursor-pointer ${
                          currentTime >= word.start && currentTime < word.end
                            ? 'bg-blue-100 text-blue-700 font-medium' // Tô sáng từ hiện tại
                            : 'bg-transparent hover:bg-gray-100'     // Hiệu ứng hover nhẹ nhàng hơn
                          } ${
                            word.isKeyword // Tô đậm nếu từ được đánh dấu là từ khóa
                              ? 'font-bold text-red-600' // Màu đỏ đậm cho từ khóa
                              : ''
                          }`}
                        onClick={() => handleWordClick(word.start)}
                      >
                        {word.text}{' '}
                      </span>
                    ))}
                  </p>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[400px]">
                <p className="text-gray-500 text-lg">No transcript available for this day.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}