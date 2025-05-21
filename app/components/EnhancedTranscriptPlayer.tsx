// EnhancedTranscriptPlayer.tsx
'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import styles from './EnhancedTranscriptPlayer.module.css';
import { transAudio } from './../../data/audio-transcript-data'; // Đảm bảo đường dẫn này đúng

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
  id: string;
  audio_url: string;
  text: string;
  utterances: UtteranceData[];
  confidence: number;
  audio_duration: number; // Nên thống nhất đơn vị, ví dụ: giây
  [key: string]: any;
}

interface EnhancedTranscriptPlayerProps {
  audioUrl: string;
  componentId?: string;
}

// Module-level array to manage multiple active audio elements
const activeAudioElements: HTMLAudioElement[] = [];

const EnhancedTranscriptPlayer: React.FC<EnhancedTranscriptPlayerProps> = ({
  audioUrl,
  componentId = 'player',
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [transcriptionData, setTranscriptionData] = useState<SpeechTranscriptionData | null>(null);
  const [currentWordStartTime, setCurrentWordStartTime] = useState<number | null>(null);
  const [isTranscriptVisible, setIsTranscriptVisible] = useState(false);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Effect to manage the global list of active audio elements
  useEffect(() => {
    const currentAudioElement = audioRef.current;
    if (currentAudioElement && isAudioLoaded) { // Chỉ thêm vào khi audio đã có thể load
      // Tránh thêm trùng lặp
      if (!activeAudioElements.includes(currentAudioElement)) {
        activeAudioElements.push(currentAudioElement);
      }
      return () => {
        const index = activeAudioElements.indexOf(currentAudioElement);
        if (index > -1) {
          activeAudioElements.splice(index, 1);
        }
      };
    }
    return () => { };
  }, [isAudioLoaded]); // Chạy khi isAudioLoaded thay đổi


  // Effect to process transcription data when audioUrl changes
  useEffect(() => {
    const processTranscriptionData = async () => {
      if (!audioUrl) {
        setTranscriptionData(null); setTranscriptError(null);
        setIsLoadingTranscript(false); setIsTranscriptVisible(false);
        return;
      }
      setIsLoadingTranscript(true); setTranscriptError(null);
      setTranscriptionData(null); setIsTranscriptVisible(false);
      try {
        const allData: SpeechTranscriptionData[] = transAudio;
        const matchedData = allData.find((item) => item.audio_url === audioUrl);

        if (matchedData) {
          setTranscriptionData(matchedData);
        } else {
          console.warn(`Cmp [${componentId}] - No transcript for:`, audioUrl);
          setTranscriptionData(null);
        }
      } catch (err: unknown) {
        console.error(`Cmp [${componentId}] - Error processing transcription:`, err);
        setTranscriptError(err instanceof Error ? err.message : 'Lỗi xử lý transcript.');
        setTranscriptionData(null);
      } finally {
        setIsLoadingTranscript(false);
      }
    };
    processTranscriptionData();
  }, [audioUrl, componentId]);

  // Memoized display structure for rendering transcript
  const displayStructure = useMemo(() => {
    if (!transcriptionData) return [];
    if (!Array.isArray(transcriptionData.utterances) || transcriptionData.utterances.length === 0) {
      if (transcriptionData.text && typeof transcriptionData.text === 'string') {
        return [{
          key: `fallback-text-${componentId}`,
          speaker: 'System',
          wordsForDisplay: [{
            text: transcriptionData.text,
            start: 0,
            end: (transcriptionData.audio_duration || 1) * 1000, // Giả sử audio_duration là giây
            speaker: 'System'
          } as WordData] // Ép kiểu rõ ràng
        }];
      }
      return [];
    }
    try {
      return transcriptionData.utterances.map((utterance, index) => {
        const words = (Array.isArray(utterance.words) && utterance.words.length > 0)
          ? utterance.words.filter(w => w && typeof w.text === 'string' && typeof w.start === 'number' && typeof w.end === 'number')
          : (utterance.text && typeof utterance.text === 'string')
            ? [{ text: utterance.text, start: utterance.start ?? 0, end: utterance.end ?? 0, speaker: utterance.speaker ?? 'Unknown' } as WordData]
            : [];
        return {
          key: `utt-${componentId}-${index}-${utterance.speaker || 'S'}-${utterance.start ?? index}`,
          speaker: utterance.speaker || (words.length > 0 ? words[0].speaker : undefined) || 'S',
          wordsForDisplay: words,
        };
      }).filter(segment => segment && segment.wordsForDisplay.length > 0);
    } catch (e: unknown) {
      console.error(`Cmp [${componentId}] - Error creating displayStructure:`, e);
      setTranscriptError(e instanceof Error ? e.message : "Lỗi xử lý cấu trúc transcript.");
      return [];
    }
  }, [transcriptionData, componentId]);

  // Tính toán số lượng người nói duy nhất
  const uniqueSpeakers = useMemo(() => {
    if (!transcriptionData?.utterances || !Array.isArray(transcriptionData.utterances) || displayStructure.length === 0) return 0;
    const speakers = new Set<string>();
    displayStructure.forEach((segment) => { // Dùng displayStructure đã được filter
      if (segment.speaker && typeof segment.speaker === 'string') {
        speakers.add(segment.speaker);
      }
    });
    return speakers.size;
  }, [transcriptionData, displayStructure]); // Thêm displayStructure


  // Logic to update highlighted word based on audio time
  const handleTimeUpdateLogic = useCallback(() => {
    const audioElement = audioRef.current;
    // Chỉ cập nhật nếu transcript đang hiển thị và có dữ liệu
    if (!audioElement || !isTranscriptVisible || !transcriptionData || displayStructure.length === 0) {
      setCurrentWordStartTime(prevCurrentWordStartTime => prevCurrentWordStartTime !== null ? null : null);
      return;
    }

    const currentTimeMs = audioElement.currentTime * 1000;
    let newCurrentWordStart: number | null = null;

    for (const segment of displayStructure) {
      for (const word of segment.wordsForDisplay) {
        if (currentTimeMs >= word.start && currentTimeMs < word.end) {
          newCurrentWordStart = word.start;
          break;
        }
      }
      if (newCurrentWordStart !== null) break;
    }
    setCurrentWordStartTime(newCurrentWordStart);
  }, [isTranscriptVisible, transcriptionData, displayStructure]);


  // Animation loop for highlighting
  const animationLoop = useCallback(() => {
    handleTimeUpdateLogic();
    const audioElement = audioRef.current;
    if (audioElement && isPlaying && !audioElement.ended && !audioElement.paused) {
      animationFrameRef.current = requestAnimationFrame(animationLoop);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      // Cập nhật lần cuối khi dừng hẳn
      if (audioElement && (audioElement.paused || audioElement.ended)) {
        handleTimeUpdateLogic();
      }
    }
  }, [handleTimeUpdateLogic, isPlaying]);


  // Effect for managing audio element and its event listeners
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    // Reset states for new audioUrl
    setCurrentWordStartTime(null);
    setAudioError(null);
    setIsAudioLoaded(false);
    setIsPlaying(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const onAudioError = (e: Event) => {
      let msg = 'Lỗi audio không xác định.';
      if (audioElement.error) {
        switch (audioElement.error.code) {
          case MediaError.MEDIA_ERR_ABORTED: msg = 'Tải audio bị hủy.'; break;
          case MediaError.MEDIA_ERR_NETWORK: msg = 'Lỗi mạng khi tải audio.'; break;
          case MediaError.MEDIA_ERR_DECODE: msg = 'Audio hỏng hoặc định dạng không hỗ trợ.'; break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED: msg = 'Không thể tải audio từ nguồn này.'; break;
          default: msg = `Lỗi audio mã: ${audioElement.error.code}`;
        }
      }
      console.error(`Cmp [${componentId}] - Audio error:`, msg, e);
      setAudioError(msg); setIsAudioLoaded(false); setIsPlaying(false);
    };
    const onCanPlay = () => { setIsAudioLoaded(true); setAudioError(null); };
    const onStalled = () => { console.warn(`Cmp [${componentId}] - Audio stalled:`, audioUrl); };

    const handlePlayEvent = () => {
      console.log(`Cmp [${componentId}] - Audio play event`);
      setIsPlaying(true);
      activeAudioElements.forEach((otherAudio) => { // Dùng activeAudioElements
        if (otherAudio !== audioElement && !otherAudio.paused) {
          otherAudio.pause();
        }
      });
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = requestAnimationFrame(animationLoop);
    };
    const handlePauseOrEndedEvent = () => {
      console.log(`Cmp [${componentId}] - Audio pause/ended event`);
      setIsPlaying(false);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
      handleTimeUpdateLogic();
    };

    if (audioUrl) {
      audioElement.addEventListener('error', onAudioError);
      audioElement.addEventListener('canplay', onCanPlay);
      audioElement.addEventListener('stalled', onStalled);
      audioElement.addEventListener('play', handlePlayEvent);
      audioElement.addEventListener('playing', handlePlayEvent);
      audioElement.addEventListener('pause', handlePauseOrEndedEvent);
      audioElement.addEventListener('ended', handlePauseOrEndedEvent);

      // Chỉ set src và load nếu URL thực sự thay đổi để tránh reset không cần thiết
      const currentFullSrc = audioElement.currentSrc || audioElement.src;
      if (currentFullSrc !== audioUrl && !(currentFullSrc.endsWith(audioUrl)) && !(audioUrl.endsWith(currentFullSrc))) { // So sánh linh hoạt hơn một chút
        console.log(`Cmp [${componentId}] - Setting new audio src:`, audioUrl);
        audioElement.src = audioUrl;
        audioElement.load();
      } else if (!currentFullSrc && audioUrl) { // Trường hợp src rỗng ban đầu
        audioElement.src = audioUrl;
        audioElement.load();
      }
    } else {
      audioElement.removeAttribute('src');
      audioElement.load();
    }

    return () => {
      audioElement.removeEventListener('error', onAudioError);
      audioElement.removeEventListener('canplay', onCanPlay);
      audioElement.removeEventListener('stalled', onStalled);
      audioElement.removeEventListener('play', handlePlayEvent);
      audioElement.removeEventListener('playing', handlePlayEvent);
      audioElement.removeEventListener('pause', handlePauseOrEndedEvent);
      audioElement.removeEventListener('ended', handlePauseOrEndedEvent);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [audioUrl, componentId, animationLoop, handleTimeUpdateLogic]);


  const toggleTranscript = () => setIsTranscriptVisible((prev) => !prev);

  const handleWordClick = useCallback((word: WordData) => {
    const audioElement = audioRef.current;
    if (audioElement) {
      const seekTimeSeconds = word.start / 1000.0; // Đảm bảo phép chia số thực
      audioElement.currentTime = seekTimeSeconds;
      // setCurrentWordStartTime(word.start); // Không cần set ở đây nữa, animationLoop sẽ làm

      // handleTimeUpdateLogic sẽ được gọi bởi animationLoop ngay sau khi play
      // hoặc nếu audio đã play thì nó vẫn đang chạy.
      // Nếu muốn highlight ngay tức thì trước khi animationLoop chạy:
      setCurrentWordStartTime(word.start);


      if (audioElement.paused) {
        audioElement.play().catch(err => {
          console.error(`Cmp [${componentId}] - Lỗi khi phát audio sau khi tua:`, err);
          setAudioError("Không thể phát audio: " + (err instanceof Error ? err.message : String(err)));
        });
      }
    }
  }, []); // Dependencies ổn định


  // --- Render Logic ---
  if (audioError && !isAudioLoaded && audioUrl) {
    return (
      <div className={styles.playerContainer}>
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>Lỗi Audio: {audioError}</p>
          <button
            onClick={() => {
              const audioElement = audioRef.current;
              if (audioElement && audioUrl) {
                setAudioError(null); setIsAudioLoaded(false);
                // Gán lại src và load có thể không đủ nếu lỗi là do mạng hoặc file hỏng
                // Trình duyệt có thể cache lỗi.
                // Thử tạo một URL mới nếu có thể (ví dụ thêm query param ngẫu nhiên) để buộc tải lại
                // audioElement.src = audioUrl + `?retry=${Date.now()}`;
                audioElement.load();
                audioElement.play().catch(e => console.error("Retry play failed", e));
              }
            }}
            className={styles.toggleButtonBase}
          >
            Thử lại Audio
          </button>
        </div>
      </div>
    );
  }

  if (!audioUrl && !componentId.includes("placeholder-audio")) {
    return (<div className={`${styles.playerContainer} ${styles.noAudio}`}></div>);
  }

  const hasActualTranscriptContent = !isLoadingTranscript && transcriptionData &&
    ((Array.isArray(transcriptionData.utterances) && transcriptionData.utterances.length > 0) ||
      (typeof transcriptionData.text === 'string' && transcriptionData.text.trim() !== ''));

  return (
    <div className={styles.playerContainer}>
      {audioUrl && (
        <div className={styles.audioContainer}>
          <audio
            ref={audioRef}
            controls
            className={styles.audioPlayer}
            preload="metadata"
            aria-label={`Audio player cho ${componentId}`}
          />
          {!isLoadingTranscript && hasActualTranscriptContent && (
            <>
              <button onClick={toggleTranscript} className={`${styles.toggleButton} hidden md:inline-flex items-center`} aria-expanded={isTranscriptVisible} aria-label={isTranscriptVisible ? 'Ẩn Transcript' : 'Hiện Transcript'}>
                {isTranscriptVisible ? 'Ẩn Transcript' : 'Hiện Transcript'}
              </button>
              <button onClick={toggleTranscript} className={`${styles.toggleButtonIcon} md:hidden inline-flex items-center justify-center p-2`} aria-expanded={isTranscriptVisible} aria-label={isTranscriptVisible ? 'Ẩn Transcript' : 'Hiện Transcript'} title={isTranscriptVisible ? 'Ẩn Transcript' : 'Hiện Transcript'}>
                {isTranscriptVisible ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.746-1.746A10.002 10.002 0 0010 14c-2.295 0-4.413-.788-6.165-2.174a.75.75 0 00-1.085.982A11.502 11.502 0 0110 15.5c2.765 0 5.34-.933 7.401-2.501l1.318 1.318a.75.75 0 101.06-1.06L3.28 2.22zM10 5.5A4.5 4.5 0 005.5 10a.75.75 0 01-1.5 0A6 6 0 0110 4a.75.75 0 010 1.5z" /><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path d="M15.081 7.534c.54.602.968 1.293 1.281 2.03.272.64.438 1.326.438 2.043a.75.75 0 01-1.5 0c0-.539-.129-1.052-.354-1.543l-.797.797A3.98 3.98 0 0112.5 10a4.011 4.011 0 01-1.326-.267l-.813.813A2.509 2.509 0 0012.5 11a2.5 2.5 0 002.288-1.339.75.75 0 011.293.776A3.997 3.997 0 0110 13.488a.75.75 0 010-1.5 2.488 2.488 0 002.173-1.246l.001-.002-.31-.31a2.482 2.482 0 00-1.784-.73L10.6 9.9a.75.75 0 11-1.06-1.06l.147-.147A3.988 3.988 0 0115.08 7.534zM8.13 8.353L6.657 6.88a3.982 3.982 0 00-2.484 4.91A.75.75 0 013.08 11.5a2.487 2.487 0 011.533-3.044l.002-.001.31.31A2.482 2.482 0 017.5 9.5c.363 0 .71-.078 1.03-.216l-.4-.431z" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                )}
              </button>
            </>
          )}
          {isLoadingTranscript && audioUrl && (<p className={styles.loadingTranscriptMessage}>Đang tìm transcript...</p>)}
        </div>
      )}

      <div
        className={`${styles.transcriptDisplayArea} ${isTranscriptVisible && hasActualTranscriptContent ? '' : styles.hidden}`}
        aria-live="polite" data-selectable-area="true"
      >
        {isTranscriptVisible && (
          <>
            {transcriptError && (<div className={styles.errorContainer}><p className={styles.errorMessage}>Lỗi Transcript: {transcriptError}</p></div>)}
            {!transcriptError && !isLoadingTranscript && !hasActualTranscriptContent && audioUrl && (<p className={styles.noContent}>Không có nội dung transcript.</p>)}

            {/* Đảm bảo transcriptionData tồn tại trước khi map displayStructure */}
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
                        key={`${segment.key}-word-${wordIndex}-${word.start ?? wordIndex}`} // Thêm fallback key
                        className={`${styles.word} ${currentWordStartTime === word.start ? styles.highlightedWord : ''} ${styles.clickableWord}`}
                      >
                        <span
                          data-start-time={word.start} role="button"
                          tabIndex={0}
                          aria-label={`Từ ${word.text} lúc ${Number(word.start / 1000).toFixed(1)}s`} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleWordClick(word); } }} onClick={() => handleWordClick(word)}>
                          {word.text}{' '}
                        </span>
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