'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import styles from './EnhancedTranscriptPlayer.module.css';
import { transAudio } from './../../data/audio-transcript-data'; // Đảm bảo đường dẫn này đúng

// --- Giữ lại các Interface cần thiết ---
export interface WordData {
  text: string;
  start: number;
  end: number;
  confidence?: number;
  speaker?: string;
}

export interface UtteranceData {
  speaker: string;
  text: string;
  start: number;
  end: number;
  confidence: number;
  words: WordData[];
}

export interface SpeechTranscriptionData {
  id: string;
  audio_url: string;
  text: string;
  utterances: UtteranceData[];
  confidence: number;
  audio_duration: number;
  [key: string]: any;
}

interface EnhancedTranscriptPlayerProps {
  audioUrl: string;
  componentId?: string;
}

const audioRefs: HTMLAudioElement[] = [];

// --- BỎ hàm fetchTranslation cục bộ ---
// async function fetchTranslation(word: string): Promise<{ translation: string; examples: string[] }> { ... }

// --- BỎ Interface PopupState ---
// interface PopupState { ... }

const EnhancedTranscriptPlayer: React.FC<EnhancedTranscriptPlayerProps> = ({
  audioUrl,
  componentId = 'unknown',
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  // --- BỎ popupRef ---
  // const popupRef = useRef<HTMLDivElement>(null);
  const [transcriptionData, setTranscriptionData] = useState<SpeechTranscriptionData | null>(null);
  const [currentWordStartTime, setCurrentWordStartTime] = useState<number | null>(null);
  // --- BỎ state popup ---
  // const [popup, setPopup] = useState<PopupState>({ ... });

  const [isTranscriptVisible, setIsTranscriptVisible] = useState(true); // Mặc định hiện transcript nếu muốn
  const [error, setError] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [hasFetchedTranscript, setHasFetchedTranscript] = useState(false);
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);

  // --- Các useEffect cho audioRefs, fetchTranscriptionData, xử lý lỗi audio (GIỮ NGUYÊN) ---
  useEffect(() => {
    if (audioRef.current) {
      audioRefs.push(audioRef.current);
    }
    return () => {
      if (audioRef.current) {
        const index = audioRefs.indexOf(audioRef.current);
        if (index > -1) {
          audioRefs.splice(index, 1);
        }
      }
    };
  }, []);

  useEffect(() => {
    const fetchTranscriptionData = async () => {
      if (!audioUrl) {
        setError('Không có URL audio để tải transcript.');
        setTranscriptionData(null);
        return;
      }
      try {
        const allData: SpeechTranscriptionData[] = transAudio; // Dùng dữ liệu local
        const matchedData = allData.find((item) => item.audio_url === audioUrl);
        if (matchedData) {
          setTranscriptionData(matchedData);
          setError(null);
        } else {
          // console.warn(`Component ${componentId} - No transcription data found for:`, audioUrl);
          // setError('Không tìm thấy dữ liệu transcript cho audio này.'); // Bỏ lỗi này nếu không muốn hiển thị khi không có transcript
          setTranscriptionData(null);
        }
      } catch (err) {
        console.error(`Component ${componentId} - Error processing local transcription data:`, err);
        setError(err instanceof Error ? err.message : 'Lỗi xử lý dữ liệu transcript.');
        setTranscriptionData(null);
      }
    };

    // Fetch ngay khi có audioUrl và transcript đang hiển thị (hoặc luôn fetch nếu không có nút toggle)
    if (audioUrl && isTranscriptVisible && !hasFetchedTranscript) {
        fetchTranscriptionData();
        setHasFetchedTranscript(true);
    } else if (audioUrl && !isTranscriptVisible && hasFetchedTranscript) {
        // Nếu transcript bị ẩn sau khi đã fetch, có thể reset hasFetchedTranscript để fetch lại khi hiện
        // Hoặc giữ nguyên để không fetch lại. Tùy theo logic mong muốn.
        // setHasFetchedTranscript(false);
    } else if (!audioUrl) {
        setTranscriptionData(null);
        setHasFetchedTranscript(false);
        setError(null);
    }
  }, [audioUrl, isTranscriptVisible, hasFetchedTranscript, componentId]);

  useEffect(() => {
    setCurrentWordStartTime(null);
    setAudioError(null);
    setIsAudioLoaded(false);
    const audioElement = audioRef.current;

    const onAudioError = (e: Event) => {
      let errorMessage = 'Lỗi không xác định với audio.';
      if (audioElement?.error) {
        switch (audioElement.error.code) {
          case MediaError.MEDIA_ERR_ABORTED: errorMessage = 'Tải audio bị hủy.'; break;
          case MediaError.MEDIA_ERR_NETWORK: errorMessage = 'Lỗi mạng khi tải audio.'; break;
          case MediaError.MEDIA_ERR_DECODE: errorMessage = 'Audio hỏng hoặc định dạng không hỗ trợ.'; break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED: errorMessage = 'Không thể tải audio.'; break;
          default: errorMessage = `Lỗi audio. Mã: ${audioElement.error.code}`;
        }
      }
      console.error(`Component ${componentId} - Audio error event:`, e, "URL:", audioUrl);
      setAudioError(errorMessage);
      setIsAudioLoaded(false);
    };
    const onCanPlay = () => { setIsAudioLoaded(true); setAudioError(null); };
    const onLoadedMetadata = () => {};
    const onStalled = () => { console.warn(`Component ${componentId} - Audio stalled:`, audioUrl); };

    if (audioElement && audioUrl) {
      audioElement.removeEventListener('error', onAudioError);
      audioElement.removeEventListener('canplay', onCanPlay);
      audioElement.removeEventListener('loadedmetadata', onLoadedMetadata);
      audioElement.removeEventListener('stalled', onStalled);

      audioElement.addEventListener('error', onAudioError);
      audioElement.addEventListener('canplay', onCanPlay);
      audioElement.addEventListener('loadedmetadata', onLoadedMetadata);
      audioElement.addEventListener('stalled', onStalled);

      if (audioElement.currentSrc !== audioUrl) {
        audioElement.src = audioUrl;
        audioElement.load();
      }
      audioElement.pause();
    } else if (!audioUrl) {
      if (audioElement) { audioElement.src = ''; audioElement.load(); }
      // setAudioError('Không có URL audio.'); // Có thể không cần hiển thị lỗi này nếu audioUrl là tùy chọn
    }
    return () => {
      if (audioElement) {
        audioElement.removeEventListener('error', onAudioError);
        audioElement.removeEventListener('canplay', onCanPlay);
        audioElement.removeEventListener('loadedmetadata', onLoadedMetadata);
        audioElement.removeEventListener('stalled', onStalled);
      }
    };
  }, [audioUrl, componentId]);

  // --- BỎ useEffect handleClickOutside cho popup cũ ---
  // useEffect(() => { ... }, [popup.isOpen]);

  // --- uniqueSpeakers, displayStructure, handleTimeUpdate, playAudio (GIỮ NGUYÊN) ---
   const uniqueSpeakers = useMemo(() => {
    if (!transcriptionData?.utterances || !Array.isArray(transcriptionData.utterances)) return 0;
    const speakers = new Set(transcriptionData.utterances.map((u) => u?.speaker).filter(Boolean));
    return speakers.size;
  }, [transcriptionData]);

  const displayStructure = useMemo(() => {
    if (!transcriptionData) return [];
    if (!Array.isArray(transcriptionData.utterances) || transcriptionData.utterances.length === 0) {
      if (transcriptionData.text && typeof transcriptionData.text === 'string') {
        return [{ key: 'fallback', speaker: 'System', wordsForDisplay: [{ text: transcriptionData.text, start: 0, end: transcriptionData.audio_duration || 0 }]}];
      }
      return [];
    }
    try {
      return transcriptionData.utterances.map((utterance, index) => {
        const words = (Array.isArray(utterance.words) && utterance.words.length > 0)
          ? utterance.words.filter(w => w && typeof w.text === 'string' && typeof w.start === 'number' && typeof w.end === 'number')
          : (utterance.text && typeof utterance.text === 'string')
            ? [{ text: utterance.text, start: utterance.start ?? 0, end: utterance.end ?? 0, speaker: utterance.speaker ?? 'Unknown' }]
            : [];
        return {
          key: `utt-${index}-${utterance.speaker || 'S'}-${utterance.start ?? 0}`,
          speaker: utterance.speaker || (words.length > 0 && words[0].speaker) || 'S', // Ưu tiên speaker từ utterance, rồi đến word đầu tiên
          wordsForDisplay: words,
        };
      }).filter(segment => segment && segment.wordsForDisplay.length > 0);
    } catch (e) {
      console.error(`Component ${componentId} - Error during displayStructure:`, e);
      return [];
    }
  }, [transcriptionData, componentId]);

  const handleTimeUpdate = () => {
    if (!audioRef.current || !transcriptionData?.utterances) {
      if (currentWordStartTime !== null) setCurrentWordStartTime(null);
      return;
    }
    const currentTimeMs = audioRef.current.currentTime * 1000;
    let newCurrentWordStart: number | null = null;

    for (const segment of displayStructure) {
      for (const word of segment.wordsForDisplay) {
        if (currentTimeMs >= word.start && currentTimeMs <= word.end) {
          newCurrentWordStart = word.start;
          break;
        }
      }
      if (newCurrentWordStart !== null) break;
    }
    if (newCurrentWordStart !== currentWordStartTime) {
      setCurrentWordStartTime(newCurrentWordStart);
    }
  };

  const playAudio = () => { // Đổi tên từ playAudio (nếu trước đó là tên khác)
    if (audioRef.current) {
      audioRefs.forEach((otherAudio) => {
        if (otherAudio !== audioRef.current && !otherAudio.paused) {
          otherAudio.pause();
        }
      });
      audioRef.current.play().catch((err) => {
        setAudioError('Không thể phát audio: ' + (err instanceof Error ? err.message : String(err)));
      });
    } else {
      setAudioError('Không thể phát audio: Thiếu tham chiếu audio.');
    }
  };
  
  // --- BỎ handleWordClick ---
  // const handleWordClick = async (...) => { ... };

  const toggleTranscript = () => {
    setIsTranscriptVisible((prev) => !prev);
    // Logic fetch lại transcript khi hiện đã nằm trong useEffect của fetchTranscriptionData
  };
  
  // --- Phần Render Lỗi (Giữ nguyên hoặc tùy chỉnh) ---
  if (audioError && !isAudioLoaded && audioUrl) { // Chỉ hiện lỗi nếu có audioUrl
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>Lỗi Audio: {audioError}</p>
        <button onClick={() => { /* retry logic */ }} className={styles.toggleButton}>Thử lại Audio</button>
      </div>
    );
  }
  // Không hiển thị gì nếu không có audioUrl, trừ khi bạn muốn có placeholder
  if (!audioUrl && !componentId.startsWith("fallback")) { // Giả sử componentId fallback không cần audio
      return <div className={styles.playerContainer}><p className="text-xs text-gray-400 italic p-2 text-center">Không có audio cho phần này.</p></div>;
  }


  return (
    <div className={styles.playerContainer}>
      {audioUrl && ( // Chỉ hiển thị audio controls nếu có audioUrl
        <div className={styles.audioContainer}>
          <audio
            ref={audioRef}
            controls
            onTimeUpdate={handleTimeUpdate}
            className={styles.audioPlayer}
            preload="metadata"
            aria-label={`Audio player for ${componentId}`}
            onPlay={() => playAudio()} // Gọi playAudio để dừng các audio khác
          />
          {/* Nút Hiện/Ẩn Transcript có thể không cần nếu transcript luôn hiện hoặc bạn có logic khác */}
          {transcriptionData && ( // Chỉ hiện nút nếu có dữ liệu transcript
             <button
                onClick={toggleTranscript}
                className={styles.toggleButton}
                aria-expanded={isTranscriptVisible}
             >
                {isTranscriptVisible ? 'Ẩn Transcript' : 'Hiện Transcript'}
             </button>
          )}
        </div>
      )}

      {/* THÊM data-selectable-area="true" VÀO ĐÂY */}
      <div
        className={`${styles.transcriptDisplayArea} ${isTranscriptVisible && transcriptionData ? '' : styles.hidden}`}
        aria-live="polite"
        data-selectable-area="true" // CHO PHÉP BÔI ĐEN Ở ĐÂY
      >
        {isTranscriptVisible && error && ( // Lỗi fetch transcript
            <div className={styles.errorContainer}><p className={styles.errorMessage}>Lỗi Transcript: {error}</p></div>
        )}
        {isTranscriptVisible && !error && !transcriptionData && hasFetchedTranscript && audioUrl && ( // Đã fetch nhưng không có data
            <p className={styles.noContent}>Không có nội dung transcript cho audio này.</p>
        )}
         {isTranscriptVisible && !error && !transcriptionData && !hasFetchedTranscript && audioUrl && ( // Chưa fetch/đang fetch
            <div className={styles.loading}>Đang tải transcript...</div>
        )}

        {isTranscriptVisible && transcriptionData && displayStructure.length > 0 && (
          displayStructure.map((segment) => (
            <div
              key={segment.key}
              className={`${styles.utteranceBlock} ${styles[`speaker_${segment.speaker?.toString().replace(/\s+/g, '_') || 'unknown'}`] || styles.speaker_unknown} ${uniqueSpeakers <= 1 ? styles.hideSpeakerLabel : ''}`}
            >
              {uniqueSpeakers > 1 && <span className={styles.speakerLabel}>Người nói {segment.speaker}:</span>}
              <p className={styles.sentence}>
                {segment.wordsForDisplay.map((word, wordIndex) => (
                  <span
                    key={`${segment.key}-word-${wordIndex}-${word.start}`}
                    data-start-time={word.start}
                    className={`${styles.word} ${currentWordStartTime === word.start ? styles.highlightedWord : ''}`}
                    // --- BỎ onClick và onKeyDown cho word click ---
                    // onClick={(e) => handleWordClick(word.text, word.start, e)}
                    // onKeyDown={(e) => { ... }}
                    // role="button" // Không còn là button
                    // tabIndex={0} // Không cần focus nữa
                    aria-label={`Từ ${word.text} lúc ${Number(word.start / 1000).toFixed(1)}s`} // Giữ lại aria-label nếu hữu ích
                  >
                    {word.text}{' '}
                  </span>
                ))}
              </p>
            </div>
          ))
        )}
      </div>
      {/* --- BỎ PHẦN RENDER POPUP CŨ --- */}
      {/* {popup.isOpen && ( ... )} */}
    </div>
  );
};

export default EnhancedTranscriptPlayer;