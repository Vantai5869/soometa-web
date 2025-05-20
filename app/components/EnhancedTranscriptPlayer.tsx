// EnhancedTranscriptPlayer.tsx
'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import styles from './EnhancedTranscriptPlayer.module.css'; // Tạo file CSS Module này
import { transAudio } from './../../data/audio-transcript-data'; // Đường dẫn đến dữ liệu transcript local

// --- Interfaces ---
export interface WordData {
  text: string;
  start: number; // milliseconds
  end: number;   // milliseconds
  confidence?: number;
  speaker?: string;
}

export interface UtteranceData {
  speaker: string;
  text: string;
  start: number; // milliseconds
  end: number;   // milliseconds
  confidence: number;
  words: WordData[];
}

export interface SpeechTranscriptionData {
  id: string; // ID của file transcript (nếu có)
  audio_url: string; // URL của file audio mà transcript này tương ứng
  text: string; // Toàn bộ nội dung text của transcript (có thể là fallback)
  utterances: UtteranceData[]; // Mảng các đoạn phát biểu
  confidence: number; // Độ tin cậy tổng thể của transcript
  audio_duration: number; // Thời lượng audio tính bằng giây hoặc milliseconds (cần nhất quán)
  [key: string]: any; // Cho phép các trường dữ liệu khác
}

interface EnhancedTranscriptPlayerProps {
  audioUrl: string; // URL của file audio để phát
  componentId?: string; // ID duy nhất cho mỗi instance của component, hữu ích cho debugging
}

// Mảng toàn cục (hoặc module-level) để quản lý các thẻ audio
// Giúp đảm bảo chỉ một audio được phát tại một thời điểm
const audioRefs: HTMLAudioElement[] = [];

const EnhancedTranscriptPlayer: React.FC<EnhancedTranscriptPlayerProps> = ({
  audioUrl,
  componentId = 'player', // Giá trị mặc định nếu không có componentId được truyền vào
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [transcriptionData, setTranscriptionData] = useState<SpeechTranscriptionData | null>(null);
  const [currentWordStartTime, setCurrentWordStartTime] = useState<number | null>(null);
  const [isTranscriptVisible, setIsTranscriptVisible] = useState(false); // Mặc định ẩn transcript
  const [transcriptError, setTranscriptError] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false); // State cho biết đang tải/xử lý transcript
  const [isAudioLoaded, setIsAudioLoaded] = useState(false); // State cho biết audio đã có thể phát

  // Quản lý mảng các tham chiếu audio để dừng các audio khác khi một audio mới phát
  useEffect(() => {
    const currentAudioElement = audioRef.current;
    if (currentAudioElement) {
      audioRefs.push(currentAudioElement);
    }
    return () => {
      if (currentAudioElement) {
        const index = audioRefs.indexOf(currentAudioElement);
        if (index > -1) {
          audioRefs.splice(index, 1);
        }
      }
    };
  }, []); // Chạy một lần khi component được mount

  // useEffect để tìm kiếm/xử lý dữ liệu transcript khi audioUrl thay đổi
  useEffect(() => {
    const processTranscriptionData = async () => {
      if (!audioUrl) {
        setTranscriptionData(null);
        setTranscriptError(null);
        setIsLoadingTranscript(false);
        setIsTranscriptVisible(false); // Ẩn transcript nếu không có audioUrl
        return;
      }

      setIsLoadingTranscript(true);
      setTranscriptError(null);
      setTranscriptionData(null); // Xóa dữ liệu transcript cũ trước khi tìm mới
      setIsTranscriptVisible(false); // Mặc định ẩn transcript khi bắt đầu tìm dữ liệu mới

      try {
        // Hiện tại đang dùng dữ liệu local từ transAudio
        // Nếu bạn muốn fetch từ API, hãy thay thế logic ở đây
        // Ví dụ: const response = await fetch(`/api/transcripts?audioUrl=${encodeURIComponent(audioUrl)}`);
        // const matchedData = await response.json();

        // Giả lập độ trễ nếu cần để thấy trạng thái loading (hữu ích khi debug)
        // await new Promise(resolve => setTimeout(resolve, 300)); 
        
        const allData: SpeechTranscriptionData[] = transAudio; 
        const matchedData = allData.find((item) => item.audio_url === audioUrl);
        
        if (matchedData) {
          setTranscriptionData(matchedData);
        } else {
          console.warn(`Component [${componentId}] - Không tìm thấy dữ liệu transcript cho audio:`, audioUrl);
          setTranscriptionData(null); // Đặt là null nếu không tìm thấy
          // Tùy chọn: bạn có thể setTranscriptError ở đây nếu việc không có transcript được coi là lỗi
          // setTranscriptError("Không tìm thấy dữ liệu transcript cho audio này.");
        }
      } catch (err) {
        console.error(`Component [${componentId}] - Lỗi khi xử lý dữ liệu transcript:`, err);
        setTranscriptError(err instanceof Error ? err.message : 'Lỗi không xác định khi xử lý dữ liệu transcript.');
        setTranscriptionData(null);
      } finally {
        setIsLoadingTranscript(false); // Đánh dấu đã xử lý xong
      }
    };

    processTranscriptionData();
  }, [audioUrl, componentId]); // Chạy lại khi audioUrl hoặc componentId thay đổi

  // useEffect để xử lý trạng thái và lỗi của thẻ <audio>
  useEffect(() => {
    setCurrentWordStartTime(null); // Reset từ đang được highlight
    setAudioError(null); // Reset lỗi audio cũ
    setIsAudioLoaded(false); // Đặt lại trạng thái audio chưa load
    const audioElement = audioRef.current;

    const onAudioError = (e: Event) => {
      let errorMessage = 'Lỗi không xác định với audio.';
      if (audioElement?.error) {
        switch (audioElement.error.code) {
          case MediaError.MEDIA_ERR_ABORTED: errorMessage = 'Tải audio bị hủy.'; break;
          case MediaError.MEDIA_ERR_NETWORK: errorMessage = 'Lỗi mạng khi tải audio.'; break;
          case MediaError.MEDIA_ERR_DECODE: errorMessage = 'Audio hỏng hoặc định dạng không hỗ trợ.'; break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED: errorMessage = 'Không thể tải audio từ nguồn này.'; break;
          default: errorMessage = `Lỗi audio không xác định. Mã: ${audioElement.error.code}`;
        }
      }
      console.error(`Component [${componentId}] - Sự kiện lỗi audio:`, e, "URL:", audioUrl);
      setAudioError(errorMessage);
      setIsAudioLoaded(false);
    };
    const onCanPlay = () => { setIsAudioLoaded(true); setAudioError(null); };
    const onLoadedMetadata = () => { /* Có thể cập nhật thời lượng audio ở đây nếu cần */ };
    const onStalled = () => { console.warn(`Component [${componentId}] - Audio bị dừng đột ngột (stalled):`, audioUrl); };

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
        audioElement.load(); // Yêu cầu trình duyệt tải (hoặc tải lại) audio
      }
    } else if (!audioUrl && audioElement) {
      audioElement.removeAttribute('src'); // Xóa hẳn src nếu không có audioUrl
      audioElement.load(); // Yêu cầu trình duyệt reset thẻ audio
    }
    
    return () => { // Cleanup khi component unmount hoặc audioUrl thay đổi
      if (audioElement) {
        audioElement.removeEventListener('error', onAudioError);
        audioElement.removeEventListener('canplay', onCanPlay);
        audioElement.removeEventListener('loadedmetadata', onLoadedMetadata);
        audioElement.removeEventListener('stalled', onStalled);
      }
    };
  }, [audioUrl, componentId]); // Chạy lại khi audioUrl hoặc componentId thay đổi

  // Tính toán số lượng người nói duy nhất
  const uniqueSpeakers = useMemo(() => {
    if (!transcriptionData?.utterances || !Array.isArray(transcriptionData.utterances)) return 0;
    const speakers = new Set(transcriptionData.utterances.map((u) => u?.speaker).filter(Boolean));
    return speakers.size;
  }, [transcriptionData]);

  // Chuẩn bị cấu trúc dữ liệu để hiển thị transcript
  const displayStructure = useMemo(() => {
    if (!transcriptionData) return [];
    // Nếu không có utterances, nhưng có text tổng thể, dùng text đó làm fallback
    if (!Array.isArray(transcriptionData.utterances) || transcriptionData.utterances.length === 0) {
      if (transcriptionData.text && typeof transcriptionData.text === 'string') {
        return [{ 
          key: `fallback-text-${componentId}`, 
          speaker: 'System', // Hoặc một tên mặc định
          wordsForDisplay: [{ 
            text: transcriptionData.text, 
            start: 0, 
            end: (transcriptionData.audio_duration || 1) * 1000, // Chuyển sang ms nếu cần
            speaker: 'System' 
          }]
        }];
      }
      return []; // Không có gì để hiển thị
    }
    try {
      return transcriptionData.utterances.map((utterance, index) => {
        const words = (Array.isArray(utterance.words) && utterance.words.length > 0)
          ? utterance.words.filter(w => w && typeof w.text === 'string' && typeof w.start === 'number' && typeof w.end === 'number')
          : (utterance.text && typeof utterance.text === 'string') // Fallback nếu words không có nhưng utterance.text có
            ? [{ text: utterance.text, start: utterance.start ?? 0, end: utterance.end ?? 0, speaker: utterance.speaker ?? 'Unknown' }]
            : [];
        return {
          key: `utt-${componentId}-${index}-${utterance.speaker || 'S'}-${utterance.start ?? index}`,
          speaker: utterance.speaker || (words.length > 0 && words[0].speaker) || 'S', // Ưu tiên speaker từ utterance
          wordsForDisplay: words,
        };
      }).filter(segment => segment && segment.wordsForDisplay.length > 0); // Lọc bỏ các segment rỗng
    } catch (e) {
      console.error(`Component [${componentId}] - Lỗi khi tạo displayStructure:`, e);
      setTranscriptError(e instanceof Error ? e.message : "Lỗi xử lý cấu trúc transcript.");
      return [];
    }
  }, [transcriptionData, componentId]);

  // Cập nhật từ đang được highlight dựa trên thời gian hiện tại của audio
  const handleTimeUpdate = () => {
    if (!audioRef.current || !isTranscriptVisible || !transcriptionData?.utterances) {
      if (currentWordStartTime !== null) setCurrentWordStartTime(null); // Reset nếu không có điều kiện highlight
      return;
    }
    const currentTimeMs = audioRef.current.currentTime * 1000; // Chuyển sang milliseconds
    let newCurrentWordStart: number | null = null;

    for (const segment of displayStructure) {
      for (const word of segment.wordsForDisplay) {
        // Giả sử start và end trong WordData là milliseconds
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

  // Dừng các audio khác khi audio này bắt đầu phát
  const handlePlayAudio = () => {
    if (audioRef.current) {
      audioRefs.forEach((otherAudio) => {
        if (otherAudio !== audioRef.current && !otherAudio.paused) {
          otherAudio.pause();
        }
      });
      // Trình duyệt tự play khi người dùng nhấn nút play của thẻ <audio controls>
    }
  };
  
  // Hàm bật/tắt hiển thị transcript
  const toggleTranscript = () => {
    setIsTranscriptVisible((prev) => !prev);
  };
  
  // --- Phần Render ---

  // Hiển thị lỗi nếu audio không tải được (và có audioUrl)
  if (audioError && !isAudioLoaded && audioUrl) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>Lỗi Audio: {audioError}</p>
        <button 
          onClick={() => {
            if (audioRef.current && audioUrl) {
              setAudioError(null); // Xóa lỗi cũ
              setIsAudioLoaded(false); // Đặt lại trạng thái load
              audioRef.current.src = audioUrl; 
              audioRef.current.load();
            }
          }} 
          className={styles.toggleButton} // Bạn có thể tạo style riêng cho nút retry
        >
          Thử lại Audio
        </button>
      </div>
    );
  }

  // Nếu không có audioUrl (và không phải là trường hợp đặc biệt), có thể không render gì cả
  // hoặc một placeholder nhẹ nhàng.
  // Ví dụ: componentId có thể chứa thông tin về câu hỏi/nhóm để quyết định.
  if (!audioUrl && !componentId.includes("placeholder-audio")) { 
      return (
        <div className={`${styles.playerContainer} ${styles.noAudio}`}>
            {/* <p className={styles.noAudioMessage}>Không có audio cho phần này.</p> */}
        </div>
      );
  }

  // Xác định xem có nội dung transcript thực sự không (sau khi đã load/process)
  const hasActualTranscriptContent = !isLoadingTranscript && transcriptionData && 
                                   ( (transcriptionData.utterances && transcriptionData.utterances.length > 0) || 
                                     (typeof transcriptionData.text === 'string' && transcriptionData.text.trim() !== '') );

  return (
    <div className={styles.playerContainer}>
      {audioUrl && (
        <div className={styles.audioContainer}>
          <audio
            ref={audioRef}
            controls
            onTimeUpdate={handleTimeUpdate}
            className={styles.audioPlayer}
            preload="metadata"
            aria-label={`Audio player cho ${componentId}`}
            onPlay={handlePlayAudio}
            // src={audioUrl} // src được quản lý trong useEffect
          />
          {/* Nút Hiện/Ẩn Transcript chỉ hiển thị nếu không loading VÀ có nội dung transcript */}
          {!isLoadingTranscript && hasActualTranscriptContent && (
             <button
                onClick={toggleTranscript}
                className={styles.toggleButton}
                aria-expanded={isTranscriptVisible}
             >
                {isTranscriptVisible ? 'Ẩn Transcript' : 'Hiện Transcript'}
             </button>
          )}
          {/* Hiển thị thông báo loading transcript nếu đang tải và có audioUrl */}
          {isLoadingTranscript && audioUrl && (
            <p className={styles.loadingTranscriptMessage}>Đang tìm transcript...</p>
          )}
        </div>
      )}

      <div
        className={`${styles.transcriptDisplayArea} ${isTranscriptVisible && hasActualTranscriptContent ? '' : styles.hidden}`}
        aria-live="polite" // Cho screen readers biết nội dung có thể thay đổi
        data-selectable-area="true" // Đảm bảo text có thể được bôi đen
      >
        {/* Chỉ hiển thị các thông báo/nội dung này nếu transcript được bật */}
        {isTranscriptVisible && (
            <>
                {transcriptError && ( // Lỗi khi fetch/xử lý transcript
                    <div className={styles.errorContainer}><p className={styles.errorMessage}>Lỗi Transcript: {transcriptError}</p></div>
                )}
                {!transcriptError && !isLoadingTranscript && !hasActualTranscriptContent && audioUrl && ( // Đã xử lý xong, không lỗi, nhưng không có nội dung
                    <p className={styles.noContent}>Không có nội dung transcript cho audio này.</p>
                )}
                
                {transcriptionData && displayStructure.length > 0 && (
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
                            aria-label={`Từ ${word.text} lúc ${Number(word.start / 1000).toFixed(1)}s`}
                          >
                            {word.text}{' '}
                          </span>
                        ))}
                      </p>
                    </div>
                  ))
                )}
            </>
        )}
      </div>
    </div>
  );
};

export default EnhancedTranscriptPlayer;