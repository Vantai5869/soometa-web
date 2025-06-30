'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Head from 'next/head';
import transcriptData from '../../data/topik-30-days.json';

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

  // Hàm xử lý sự kiện 'timeupdate'
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime * 1000);
    }
  }, []);

  // Hàm xử lý khi audio đang tua (seeking)
  const handleSeeking = useCallback(() => {
    // Logic khi audio đang tua, nếu cần
  }, []);

  // Hàm xử lý khi audio đã tua xong (seeked)
  const handleSeeked = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime * 1000);
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('seeking', handleSeeking);
    audio.addEventListener('seeked', handleSeeked);
    
    // Cleanup function
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('seeking', handleSeeking);
      audio.removeEventListener('seeked', handleSeeked);
    };
  }, [selectedDay, handleTimeUpdate, handleSeeking, handleSeeked]);

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
    let lastNumericListItem = 0; 
    let previousWordText = ''; 

    for (let i = 0; i < wordsToProcess.length; i++) {
      const word = wordsToProcess[i];
      const wordText = word.text.trim();

      if (!wordText) {
        previousWordText = wordText;
        continue;
      }

      const lastChar = wordText.slice(-1);
      let isNumericListItem = false; 
      let currentNumber = null;

      if (lastChar === '.' && wordText.length > 1) {
        const potentialNumber = parseInt(wordText.slice(0, -1), 10);
        if (!isNaN(potentialNumber) && potentialNumber > 0) {
            isNumericListItem = true;
            currentNumber = potentialNumber;
        }
      }
      
      let isStandaloneNumber = false; 
      let standaloneNumberValue = null;
      
      if (!isNumericListItem) {
          const potentialStandaloneNumber = parseInt(wordText, 10);
          if (!isNaN(potentialStandaloneNumber) && potentialStandaloneNumber > 0 && wordText === potentialStandaloneNumber.toString()) {
              isStandaloneNumber = true;
              standaloneNumberValue = potentialStandaloneNumber;
          }
      }

      let shouldStartNewSentenceHere = false;

      // BỎ QUA SỐ NGAY SAU "데이"
      if (i > 0 && previousWordText === '데이' && (isNumericListItem || isStandaloneNumber)) {
          lastNumericListItem = 0; 
          currentSentence.push({ ...word }); 
          previousWordText = wordText; 
          continue; 
      }

      if (isNumericListItem && currentNumber === lastNumericListItem + 1) {
          shouldStartNewSentenceHere = true;
          lastNumericListItem = currentNumber;
      } 
      else if (isStandaloneNumber && standaloneNumberValue === lastNumericListItem + 1) {
          shouldStartNewSentenceHere = true;
          lastNumericListItem = standaloneNumberValue;
      }
      else if (i === wordsToProcess.length - 1 && currentSentence.length > 0) {
          shouldStartNewSentenceHere = true;
      }

      if (shouldStartNewSentenceHere) {
          if (currentSentence.length > 0) {
              sentences.push({ words: currentSentence });
          }
          currentSentence = [];
      }
      
      currentSentence.push({ ...word });
      previousWordText = wordText; 
    }

    if (currentSentence.length > 0) {
      sentences.push({ words: currentSentence });
    }

    const finalSentences = sentences.map(sentence => {
        if (sentence.words.length > 1) {
            const firstWordText = sentence.words[0].text.trim();
            const lastCharOfFirstWord = firstWordText.slice(-1);
            const potentialNumberWithDot = parseInt(firstWordText.slice(0, -1), 10);
            const potentialStandaloneNumber = parseInt(firstWordText, 10);

            const isNumericListItemAtStart = (lastCharOfFirstWord === '.' && !isNaN(potentialNumberWithDot) && potentialNumberWithDot > 0);
            const isStandaloneNumberAtStart = (!isNaN(potentialStandaloneNumber) && potentialStandaloneNumber > 0 && firstWordText === potentialStandaloneNumber.toString());


            if (isNumericListItemAtStart || isStandaloneNumberAtStart) {
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

  const sentences = useMemo(() => groupWordsIntoSentences(words), [words]);

  const handleWordClick = (startTime) => {
    if (audioRef.current) {
      audioRef.current.currentTime = startTime / 1000;
      audioRef.current.play(); 
      setCurrentTime(startTime);
    }
  };

  const handleDaySelect = (day) => {
    setSelectedDay(day);
    setCurrentTime(0); 
    setIsSidebarOpen(false); 

    if (audioRef.current) {
      audioRef.current.pause();
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

        {/* Thanh bên trái (Sidebar) */}
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
                      ? 'bg-blue-100 text-blue-800 shadow-sm' 
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
          {/* Header ĐỒNG NHẤT cho cả Mobile và Desktop */}
          <div className="p-4 md:p-6 lg:p-4 bg-white shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between">
            {/* Nút menu và tiêu đề trên Mobile */}
            <div className="flex items-center mb-4 lg:mb-0 lg:w-1/3"> {/* Điều chỉnh width trên lg */}
              <button
                className="lg:hidden text-gray-600 hover:text-gray-900 mr-4"
                onClick={() => setIsSidebarOpen(true)}
              >
                <MenuIcon />
              </button>
              <h2 className="text-xl lg:text-2xl font-semibold text-gray-800 flex-grow">{title}</h2> {/* Giảm text-3xl xuống text-2xl trên lg */}
            </div>

            {/* Audio Player */}
            <audio
              ref={audioRef}
              controls
              src={selectedTranscript.audio_url}
              className="w-full lg:w-2/3 rounded-md lg:ml-4" // Điều chỉnh width và margin trên lg
              key={selectedDay}
            ></audio>
          </div>

          {/* Nút chuyển đổi chế độ xem (Tabs) */}
          <div className="mb-6 px-4 md:px-6 lg:px-8 pt-4"> {/* Thêm pt-4 để tách khỏi header */}
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
                  <p key={`sentence-${sentenceIndex}`} className="mb-4">
                    {sentenceObj.words.map((word, wordIndex) => (
                      <span
                        key={`word-${sentenceIndex}-${wordIndex}`}
                        className={`inline-block mx-0.5 px-1 py-0.5 rounded transition-colors duration-150 cursor-pointer ${
                          currentTime >= word.start && currentTime < word.end
                            ? 'bg-blue-100 text-blue-700 font-medium' 
                            : 'bg-transparent hover:bg-gray-100'     
                          } ${
                            word.isKeyword 
                              ? 'font-bold text-red-600' 
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