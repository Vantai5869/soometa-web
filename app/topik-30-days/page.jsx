'use client';

import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import transcriptData from '../../data/topik-30-days.json';

export default function Home() {
  const [selectedDay, setSelectedDay] = useState(1); // Bắt đầu từ Day 1
  const [currentTime, setCurrentTime] = useState(0);
  const [viewMode, setViewMode] = useState('pdf'); // Mặc định là PDF
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      const newTime = audio.currentTime * 1000; // Chuyển sang milliseconds
      setCurrentTime(newTime);
      requestAnimationFrame(updateTime);
    };

    audio.addEventListener('play', () => requestAnimationFrame(updateTime));
    audio.addEventListener('pause', () => cancelAnimationFrame(updateTime));
    audio.addEventListener('ended', () => setCurrentTime(0));

    return () => {
      audio.removeEventListener('play', updateTime);
      audio.removeEventListener('pause', updateTime);
      audio.removeEventListener('ended', () => setCurrentTime(0));
    };
  }, [selectedDay]);

  // Lấy transcript dựa trên ngày (index + 1 = day)
  const selectedTranscript = transcriptData[selectedDay - 1] || {};
  const utterances = selectedTranscript.utterances?.[0] || {};
  const words = utterances.words || [];
  const title = utterances.text?.match(/데이 \d+/)?.[0] || `Day ${selectedDay}`;


  // Xử lý nhấp vào từ
  const handleWordClick = (startTime) => {
    if (audioRef.current) {
      audioRef.current.currentTime = startTime / 1000; // Chuyển milliseconds thành giây
      audioRef.current.play();
    }
  };

  return (
    <>
      <Head>
        <title>TOPIK in 30 Days Transcripts</title>
        <meta name="description" content="TOPIK in 30 Days Transcript Viewer" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex h-screen bg-gray-100">
        {/* Thanh bên trái */}
        <div className="w-1/4 bg-white shadow-md overflow-y-auto">
          <div className="p-4">
            <h1 className="text-xl font-semibold mb-4 text-gray-800">TOPIK in 30 Days</h1>
            <ul>
              {transcriptData.map((_, index) => (
                <li
                  key={index}
                  className={`p-2 cursor-pointer rounded-md hover:bg-gray-200 ${selectedDay === index + 1 ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}
                  onClick={() => {
                    setSelectedDay(index + 1);
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                    setCurrentTime(0);
                  }}
                >
                  Day {index + 1}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Nội dung bên phải */}
        <div className="w-3/4 p-6 overflow-y-auto">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">{title}</h2>
          <audio
            ref={audioRef}
            controls
            src={selectedTranscript.audio_url}
            className="w-full mb-6 rounded-md"
          ></audio>
          <div className="flex space-x-2 mb-4">
            <button
              className={`px-4 py-2 rounded-md font-medium ${viewMode === 'pdf' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-blue-600 hover:text-white transition-colors duration-200`}
              onClick={() => setViewMode('pdf')}
            >
              PDF
            </button>
            <button
              className={`px-4 py-2 rounded-md font-medium ${viewMode === 'transcript' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-blue-600 hover:text-white transition-colors duration-200`}
              onClick={() => setViewMode('transcript')}
            >
              Transcript
            </button>
          </div>
          <div className="bg-white p-6 rounded-md shadow-md">
            {viewMode === 'pdf' ? (
              <iframe
                src="https://drive.google.com/file/d/1hmZlCYFE5s034vjWCfKh3qWALkgqHIv_/preview"
                width="100%"
                height="600px"
                title="PDF Viewer"
                className="border-none"
              ></iframe>
            ) : words.length > 0 ? (
              <p className="text-gray-800 leading-relaxed">
                {words.map((word, index) => (
                  <span
                    key={index}
                    className={`inline-block mx-0.5 px-0.5 border-2 transition-all duration-200 cursor-pointer hover:bg-blue-50 focus:outline focus:outline-blue-200 ${currentTime >= word.start && currentTime < word.end ? '!border-blue-500' : 'border-transparent'}`}
                    onClick={() => handleWordClick(word.start)}
                  >
                    {word.text}
                  </span>
                ))}
              </p>
            ) : (
              <p className="text-gray-500">No transcript available for this day.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}