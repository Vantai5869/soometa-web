// app/components/EnhancedTranscriptPlayer.tsx
'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import styles from './EnhancedTranscriptPlayer.module.css';
import {transAudio} from './../../data/audio-transcript-data'

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
  text: string; // Fallback text if utterances are not available
  utterances: UtteranceData[];
  confidence: number;
  audio_duration: number;
  [key: string]: any; // For any other potential properties
}

interface EnhancedTranscriptPlayerProps {
  audioUrl: string;
  componentId?: string;
}

const audioRefs: HTMLAudioElement[] = []; // To manage multiple audio players on a page

// Hàm gọi API route để tra từ (đã được chuyển ra ngoài component)
async function fetchTranslation(word: string): Promise<{ translation: string; examples: string[] }> {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task: 'getWordTranslation',
        word: word,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `Lỗi ${response.status} từ server.` }));
      console.error('Lỗi khi gọi API route /api/gemini:', response.status, errorData);
      throw new Error(errorData.error || `Không thể kết nối đến server dịch (mã: ${response.status})`);
    }

    const data = await response.json();
    return {
      translation: data.translation || 'Không có nghĩa.',
      examples: data.examples || [],
    };
  } catch (error) {
    console.error('Lỗi trong quá trình fetchTranslation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Không thể tra từ do lỗi không xác định.';
    return { translation: `Lỗi: ${errorMessage}`, examples: [] };
  }
}

interface PopupState {
  isOpen: boolean;
  word: string;
  translation: string;
  examples: string[];
  position: { top: number; left: number };
}

const EnhancedTranscriptPlayer: React.FC<EnhancedTranscriptPlayerProps> = ({
  audioUrl,
  componentId = 'unknown', // Default componentId for logging/debugging
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [transcriptionData, setTranscriptionData] = useState<SpeechTranscriptionData | null>(null);
  const [currentWordStartTime, setCurrentWordStartTime] = useState<number | null>(null);
  const [popup, setPopup] = useState<PopupState>({
    isOpen: false,
    word: '',
    translation: '',
    examples: [],
    position: { top: 0, left: 0 },
  });
  const [isTranscriptVisible, setIsTranscriptVisible] = useState(false);
  const [error, setError] = useState<string | null>(null); // For transcription loading errors
  const [audioError, setAudioError] = useState<string | null>(null); // For audio element errors
  const [hasFetchedTranscript, setHasFetchedTranscript] = useState(false);
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);

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
        setTranscriptionData(null); // Reset data
        return;
      }
      // console.log(`Component ${componentId} - Attempting to fetch transcription data for:`, audioUrl);
      try {
        // Giả sử file này nằm trong thư mục /public
       
        const allData: SpeechTranscriptionData[] = transAudio;
        const matchedData = allData.find((item) => item.audio_url === audioUrl);

        if (matchedData) {
          // console.log(`Component ${componentId} - Transcription data found:`, matchedData);
          setTranscriptionData(matchedData);
          setError(null); // Clear previous errors
        } else {
          console.warn(`Component ${componentId} - No transcription data found for:`, audioUrl);
          setError('Không tìm thấy dữ liệu transcript cho audio này.');
          setTranscriptionData(null); // Reset data
        }
      } catch (err) {
        console.error(`Component ${componentId} - Error fetching transcription data:`, err);
        setError(err instanceof Error ? err.message : 'Lỗi tải dữ liệu transcript không xác định.');
        setTranscriptionData(null); // Reset data
      }
    };

    if (isTranscriptVisible && !hasFetchedTranscript) {
      fetchTranscriptionData();
      setHasFetchedTranscript(true);
    }
  }, [isTranscriptVisible, hasFetchedTranscript, audioUrl, componentId]);

  useEffect(() => {
    // Reset states when audioUrl changes
    setCurrentWordStartTime(null);
    setAudioError(null);
    setIsAudioLoaded(false);

    const audioElement = audioRef.current;

    const onAudioError = (e: Event) => {
      let errorMessage = 'Lỗi không xác định với audio.';
      if (audioElement?.error) {
        // console.error(`Component ${componentId} - Audio error object:`, audioElement.error);
        switch (audioElement.error.code) {
          case MediaError.MEDIA_ERR_ABORTED: errorMessage = 'Tải audio bị hủy.'; break;
          case MediaError.MEDIA_ERR_NETWORK: errorMessage = 'Lỗi mạng khi tải audio. Kiểm tra kết nối hoặc CORS.'; break;
          case MediaError.MEDIA_ERR_DECODE: errorMessage = 'Audio hỏng hoặc định dạng không hỗ trợ.'; break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED: errorMessage = 'Không thể tải audio. Kiểm tra URL, định dạng, hoặc CORS.'; break;
          default: errorMessage = `Lỗi audio. Mã: ${audioElement.error.code}`;
        }
      }
      console.error(`Component ${componentId} - Audio error event:`, e, "URL:", audioUrl);
      setAudioError(errorMessage);
      setIsAudioLoaded(false);
    };
    const onCanPlay = () => {
      // console.log(`Component ${componentId} - Audio can play:`, audioUrl);
      setIsAudioLoaded(true);
      setAudioError(null); // Clear previous errors if any
    };
    const onLoadedMetadata = () => {
      // if (audioElement) console.log(`Component ${componentId} - Audio metadata loaded:`, audioUrl, `Duration: ${audioElement.duration}s`);
    };
    const onStalled = () => {
      console.warn(`Component ${componentId} - Audio stalled (tải bị ngưng):`, audioUrl);
      // setAudioError('Audio bị ngưng tải. Kiểm tra mạng.'); // Có thể gây khó chịu nếu chỉ là tạm thời
      // setIsAudioLoaded(false);
    };

    if (audioElement && audioUrl) {
      // console.log(`Component ${componentId} - Setting up audio element for URL:`, audioUrl);
      // Xóa các event listener cũ trước khi thêm mới để tránh bị gọi nhiều lần
      audioElement.removeEventListener('error', onAudioError);
      audioElement.removeEventListener('canplay', onCanPlay);
      audioElement.removeEventListener('loadedmetadata', onLoadedMetadata);
      audioElement.removeEventListener('stalled', onStalled);

      audioElement.addEventListener('error', onAudioError);
      audioElement.addEventListener('canplay', onCanPlay);
      audioElement.addEventListener('loadedmetadata', onLoadedMetadata);
      audioElement.addEventListener('stalled', onStalled);

      if (audioElement.currentSrc !== audioUrl) {
        // console.log(`Component ${componentId} - Setting new src and loading:`, audioUrl);
        audioElement.src = audioUrl;
        audioElement.load(); // Quan trọng: gọi load() sau khi thay đổi src
      }
      audioElement.pause(); // Đảm bảo audio không tự phát
    } else if (!audioUrl) {
      // console.warn(`Component ${componentId} - No audioUrl provided, resetting audio element.`);
      if (audioElement) {
        audioElement.src = ''; // Reset src
        audioElement.load(); // Kêu gọi load để áp dụng thay đổi
      }
      setAudioError('Không có URL audio.');
    }

    return () => {
      if (audioElement) {
        // console.log(`Component ${componentId} - Cleaning up audio event listeners for URL:`, audioUrl);
        audioElement.removeEventListener('error', onAudioError);
        audioElement.removeEventListener('canplay', onCanPlay);
        audioElement.removeEventListener('loadedmetadata', onLoadedMetadata);
        audioElement.removeEventListener('stalled', onStalled);
        // Không nên set src = '' ở đây vì có thể ảnh hưởng đến việc audio khác đang dùng lại ref (ít khả năng với mảng audioRefs)
        // và cũng không cần thiết nếu component unmount.
      }
    };
  }, [audioUrl, componentId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setPopup((prev) => ({ ...prev, isOpen: false }));
      }
    };
    if (popup.isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [popup.isOpen]);

  const uniqueSpeakers = useMemo(() => {
    if (!transcriptionData?.utterances || !Array.isArray(transcriptionData.utterances)) return 0;
    const speakers = new Set(transcriptionData.utterances.map((u) => u?.speaker).filter(Boolean));
    return speakers.size;
  }, [transcriptionData]);

  // Cập nhật useMemo cho displayStructure để mạnh mẽ hơn
  const displayStructure = useMemo(() => {
    // console.log(`Component ${componentId} - Recalculating displayStructure. transcriptionData available: ${!!transcriptionData}`);
    if (!transcriptionData) {
      // console.log(`Component ${componentId} - displayStructure: transcriptionData is null/undefined, returning [].`);
      return [];
    }

    if (!Array.isArray(transcriptionData.utterances) || transcriptionData.utterances.length === 0) {
      // console.log(`Component ${componentId} - displayStructure: utterances is not an array or is empty. Checking for fallback text.`);
      if (transcriptionData.text && typeof transcriptionData.text === 'string') {
        // console.log(`Component ${componentId} - displayStructure: Using fallback text.`);
        return [{
          key: 'fallback',
          speaker: 'Unknown',
          wordsForDisplay: [{
            text: transcriptionData.text,
            start: 0,
            end: 0,
            confidence: 0,
            speaker: 'Unknown'
          }]
        }];
      } else {
        // console.log(`Component ${componentId} - displayStructure: No fallback text, returning [].`);
        return [];
      }
    }

    // console.log(`Component ${componentId} - displayStructure: Processing utterances array.`);
    try {
      const mappedUtterances = transcriptionData.utterances.map((utterance: UtteranceData, index: number) => {
        if (!utterance || typeof utterance !== 'object' || utterance === null) {
          console.warn(`Component ${componentId} - Invalid utterance at index ${index}:`, utterance);
          return null;
        }

        const wordsForDisplay: WordData[] = (Array.isArray(utterance.words) && utterance.words.length > 0)
          ? utterance.words.filter(
              (word): word is WordData =>
                word &&
                typeof word.text === 'string' &&
                typeof word.start === 'number' &&
                typeof word.end === 'number'
            )
          : (utterance.text && typeof utterance.text === 'string')
          ? [{
              text: utterance.text,
              start: utterance.start ?? 0,
              end: utterance.end ?? 0,
              confidence: utterance.confidence ?? 0,
              speaker: utterance.speaker ?? 'Unknown'
            }]
          : [];

        return {
          key: `utt-${index}-${utterance.speaker || 'unknown'}-${utterance.start ?? 0}`,
          speaker: utterance.speaker || 'Unknown',
          wordsForDisplay,
        };
      });

      const finalStructure = mappedUtterances.filter(
          (segment): segment is { key: string; speaker: string; wordsForDisplay: WordData[] } => segment !== null
      );
      // console.log(`Component ${componentId} - displayStructure: Successfully processed. Result length: ${finalStructure.length}`);
      return finalStructure;

    } catch (e) {
      console.error(`Component ${componentId} - Error during displayStructure utterance processing:`, e);
      console.error("Lỗi xảy ra với transcriptionData:", transcriptionData);
      return []; // Luôn trả về một mảng rỗng nếu có lỗi bên trong
    }
  }, [transcriptionData]);

  const handleTimeUpdate = () => {
    if (!audioRef.current || !transcriptionData?.utterances || !Array.isArray(transcriptionData.utterances)) {
      if (currentWordStartTime !== null) setCurrentWordStartTime(null);
      return;
    }
    const currentTimeMs = audioRef.current.currentTime * 1000;
    let newCurrentWordStart: number | null = null;

    // displayStructure đã được tính toán và lọc, nên an toàn để duyệt
    for (const segment of displayStructure) {
      if (segment?.wordsForDisplay && Array.isArray(segment.wordsForDisplay)) {
        for (const word of segment.wordsForDisplay) {
          if (typeof word.start === 'number' && typeof word.end === 'number' && currentTimeMs >= word.start && currentTimeMs <= word.end) {
            newCurrentWordStart = word.start;
            break;
          }
        }
      }
      if (newCurrentWordStart !== null) break;
    }

    if (newCurrentWordStart !== currentWordStartTime) {
      setCurrentWordStartTime(newCurrentWordStart);
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      audioRefs.forEach((otherAudio) => {
        if (otherAudio !== audioRef.current && !otherAudio.paused) {
          otherAudio.pause();
          // console.log(`Component ${componentId} - Paused other audio`);
        }
      });
      // console.log(`Component ${componentId} - Attempting to play audio`);
      audioRef.current.play().catch((err) => {
        console.error(`Component ${componentId} - Error playing audio:`, err);
        setAudioError('Không thể phát audio: ' + (err instanceof Error ? err.message : String(err)));
      });
    } else {
      console.warn(`Component ${componentId} - Cannot play audio: audioRef missing`);
      setAudioError('Không thể phát audio: Thiếu tham chiếu audio.');
    }
  };

  const handleWordClick = async (wordText: string, startTime: number | undefined, event: React.MouseEvent<HTMLSpanElement>) => {
    event.stopPropagation();
    if (audioRef.current && typeof startTime === 'number') {
      audioRef.current.currentTime = startTime / 1000;
      // setCurrentWordStartTime(startTime); // Không cần thiết vì onTimeUpdate sẽ xử lý
      playAudio(); // Gọi play sau khi tua
    }
    const rect = event.currentTarget.getBoundingClientRect();
    setPopup({
      isOpen: true,
      word: wordText,
      translation: 'Đang tải bản dịch...',
      examples: [],
      position: {
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
      },
    });

    const translationResult = await fetchTranslation(wordText);
    setPopup((prev) => ({
      ...prev,
      // Giữ nguyên word nếu request cũ hơn chưa xong, đảm bảo word đúng với popup hiện tại
      word: prev.isOpen && prev.word === wordText ? wordText : prev.word,
      translation: translationResult.translation,
      examples: translationResult.examples,
    }));
  };

  const toggleTranscript = () => {
    setIsTranscriptVisible((prev) => !prev);
    if (!isTranscriptVisible && !hasFetchedTranscript) { // Nếu sắp hiện và chưa fetch
        // fetchTranscriptionData sẽ được gọi bởi useEffect [isTranscriptVisible, hasFetchedTranscript]
    }
  };

  if (audioError && !isAudioLoaded) { // Chỉ hiển thị lỗi audio nghiêm trọng nếu audio chưa thể play
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>Lỗi Audio: {audioError}</p>
        <button
          onClick={() => {
            setAudioError(null); // Reset lỗi
            setIsAudioLoaded(false);
            if (audioRef.current && audioUrl) {
              // console.log(`Component ${componentId} - Retrying audio load:`, audioUrl);
              audioRef.current.src = audioUrl; // Set lại src
              audioRef.current.load(); // Yêu cầu tải lại
            }
          }}
          className={styles.toggleButton}
        >
          Thử lại Audio
        </button>
      </div>
    );
  }

  // Lỗi tải transcript (khác với lỗi audio)
  if (error && isTranscriptVisible) { // Chỉ hiển thị lỗi transcript nếu người dùng muốn xem transcript
      return (
        <div className={styles.playerContainer}> {/* Vẫn giữ playerContainer để có nút hiện/ẩn */}
            <div className={styles.audioContainer}>
                <audio ref={audioRef} controls onTimeUpdate={handleTimeUpdate} className={styles.audioPlayer} preload="metadata" aria-label={`Audio player for ${componentId}`} />
                <button onClick={toggleTranscript} className={styles.toggleButton} aria-label={isTranscriptVisible ? 'Ẩn transcript' : 'Hiện transcript'}>
                    {isTranscriptVisible ? 'Ẩn Transcript' : 'Hiện Transcript'}
                </button>
            </div>
            <div className={`${styles.transcriptDisplayArea} ${styles.errorContainer}`}>
                <p className={styles.errorMessage}>Lỗi Transcript: {error}</p>
                {/* Không cần nút thử lại ở đây vì fetch được trigger bởi isTranscriptVisible */}
            </div>
        </div>
      );
  }


  if (!audioUrl) {
    return <div className={styles.errorContainer}><p className={styles.errorMessage}>Không có URL âm thanh.</p></div>;
  }

  return (
    <div className={styles.playerContainer}>
      <div className={styles.audioContainer}>
        <audio
          ref={audioRef}
          controls
          onTimeUpdate={handleTimeUpdate}
          className={styles.audioPlayer}
          preload="metadata" // 'metadata' là đủ, 'auto' có thể tốn băng thông hơn
          aria-label={`Audio player for ${componentId}`}
          // src được quản lý trong useEffect
        />
        <button
          onClick={toggleTranscript}
          className={styles.toggleButton}
          aria-label={isTranscriptVisible ? 'Ẩn transcript' : 'Hiện transcript'}
          aria-expanded={isTranscriptVisible}
        >
          {isTranscriptVisible ? 'Ẩn Transcript' : 'Hiện Transcript'}
        </button>
      </div>

      <div className={`${styles.transcriptDisplayArea} ${isTranscriptVisible ? '' : styles.hidden}`} aria-live="polite">
        {isTranscriptVisible && !transcriptionData && !error && hasFetchedTranscript && (
          <p className={styles.noContent}>Không có nội dung transcript để hiển thị cho audio này.</p>
        )}
        {isTranscriptVisible && !transcriptionData && !error && !hasFetchedTranscript && (
          <div className={styles.loading}>Đang tải dữ liệu transcript...</div>
        )}

        {/* Sửa lỗi: Thêm kiểm tra `displayStructure &&` */}
        {isTranscriptVisible && transcriptionData && displayStructure && displayStructure.length > 0 ? (
          displayStructure.map((segment) => (
            <div
              key={segment.key}
              className={`${styles.utteranceBlock} ${styles[`speaker_${segment.speaker.toString().replace(/\s+/g, '_')}`] || styles.speaker_unknown} ${
                uniqueSpeakers <= 1 ? styles.hideSpeakerLabel : ''
              }`}
              role="region"
              aria-label={`Segment spoken by ${segment.speaker}`}
            >
              {uniqueSpeakers > 1 && <span className={styles.speakerLabel}>Người nói {segment.speaker}:</span>}
              <p className={styles.sentence}>
                {segment.wordsForDisplay.map((word: WordData, wordIndex: number) => {
                  if (!word || typeof word.text !== 'string' || typeof word.start !== 'number') {
                    // console.warn(`Component ${componentId} - Invalid word data in render:`, word);
                    return null;
                  }
                  return (
                    <span
                      key={`${segment.key}-word-${wordIndex}-${word.start}`}
                      data-start-time={word.start}
                      className={`${styles.word} ${
                        currentWordStartTime === word.start ? styles.highlightedWord : ''
                      }`}
                      onClick={(e) => handleWordClick(word.text, word.start, e)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') handleWordClick(word.text, word.start, e as any);
                      }}
                      role="button"
                      aria-label={`Chi tiết từ ${word.text} tại ${Number(word.start / 1000).toFixed(1)} giây`}
                    >
                      {word.text}{' '}
                    </span>
                  );
                })}
              </p>
            </div>
          ))
        ) : null } {/* Nếu không có displayStructure.length > 0 thì không render gì ở đây (các trường hợp khác đã được xử lý ở trên) */}


        {popup.isOpen && (
          <div
            ref={popupRef}
            className={styles.popup}
            style={{ top: popup.position.top, left: popup.position.left }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="popupWord"
            aria-describedby="popupTranslation popupExamples"
          >
            <div id="popupWord" className={styles.popupWord}>{popup.word}</div>
            <div id="popupTranslation" className={styles.popupTranslation}>{popup.translation}</div>
            {popup.examples && popup.examples.length > 0 && (
              <div id="popupExamples" className={styles.popupExamples}>
                <strong>Ví dụ:</strong>
                {popup.examples.map((example, index) => (
                  <div key={index} className={styles.popupExampleItem}>
                    {example}
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setPopup((prev) => ({ ...prev, isOpen: false }))}
              className={styles.closePopupButton}
              aria-label="Đóng popup"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedTranscriptPlayer;