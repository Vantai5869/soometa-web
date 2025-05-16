  'use client';

  import React, { useState, useRef, useEffect, useMemo } from 'react';
  import { GoogleGenerativeAI } from '@google/generative-ai';
  import styles from './EnhancedTranscriptPlayer.module.css';

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

  const genAI = new GoogleGenerativeAI('AIzaSyAD-DPPuCS-rdQjR-qqmrlh6jwF5c7An0Y');
  async function fetchTranslation(word: string): Promise<{ translation: string; examples: string[] }> {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `
        Cung cấp nghĩa của từ "${word}" bằng tiếng Việt một cách ngắn gọn và 1-2 ví dụ sử dụng từ này trong câu bằng tiếng Hàn cùng bản dịch tiếng Việt.
        Trả về định dạng JSON:
        {
          "translation": "nghĩa tiếng Việt",
          "examples": [
            "câu tiếng Hàn - bản dịch tiếng Việt",
            "câu tiếng Hàn - bản dịch tiếng Việt"
          ]
        }
      `;
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const jsonResponse = JSON.parse(responseText.replace(/```json\n|\n```/g, ''));
      return {
        translation: jsonResponse.translation || 'Không có nghĩa.',
        examples: jsonResponse.examples || [],
      };
    } catch (error) {
      console.error('Lỗi khi gọi Gemini Flash:', error);
      return { translation: 'Không thể tra từ.', examples: [] };
    }
  }
  interface PopupState {
    isOpen: boolean;
    word: string;
    translation: string;
    examples: string[];
    position: { top: number; left: number };
  }

  const EnhancedTranscriptPlayer: React.FC<EnhancedTranscriptPlayerProps> = ({ audioUrl, componentId = 'unknown' }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const [transcriptionData, setTranscriptionData] = useState<SpeechTranscriptionData | null>(null);
    const [currentWordStartTime, setCurrentWordStartTime] = useState<number | null>(null);
    const [popup, setPopup] = useState<PopupState>({ isOpen: false, word: '', translation: '', examples: [], position: { top: 0, left: 0 } });
    const [isTranscriptVisible, setIsTranscriptVisible] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [audioError, setAudioError] = useState<string | null>(null);
    const [hasFetchedTranscript, setHasFetchedTranscript] = useState(false);
    const [isAudioLoaded, setIsAudioLoaded] = useState(false);

    console.log(`Component ${componentId} - Audio URL:`, audioUrl);

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
          console.log(`Component ${componentId} - Fetching transcription data for:`, audioUrl);
          const response = await fetch('/audio-transcript-data.json');
          if (!response.ok) {
            throw new Error(`Lỗi tải transcript. Status: ${response.status}`);
          }
          const data: SpeechTranscriptionData[] = await response.json();
          const matchedData = data.find((item) => item.audio_url === audioUrl);
          if (matchedData) {
            setTranscriptionData(matchedData);
            setError(null);
          } else {
            console.warn(`Component ${componentId} - No transcription data found for:`, audioUrl);
            setError('Không tìm thấy dữ liệu transcript cho audio này.');
            setTranscriptionData(null);
          }
        } catch (err) {
          console.error(`Component ${componentId} - Error fetching transcription data:`, err);
          setError('Lỗi tải dữ liệu transcript.');
          setTranscriptionData(null);
        }
      };

      if (isTranscriptVisible && !hasFetchedTranscript) {
        fetchTranscriptionData();
        setHasFetchedTranscript(true);
      }
    }, [isTranscriptVisible, hasFetchedTranscript, audioUrl, componentId]);

    useEffect(() => {
      setCurrentWordStartTime(null);
      setAudioError(null);
      setIsAudioLoaded(false);
      const audioElement = audioRef.current;

      const onAudioError = (e: Event) => {
        let errorMessage = 'Lỗi không xác định với audio.';
        if (audioElement && audioElement.error) {
          console.error(`Component ${componentId} - Audio error object:`, audioElement.error);
          switch (audioElement.error.code) {
            case MediaError.MEDIA_ERR_ABORTED:
              errorMessage = 'Tải audio bị hủy.';
              break;
            case MediaError.MEDIA_ERR_NETWORK:
              errorMessage = 'Lỗi mạng khi tải audio. Kiểm tra kết nối hoặc CORS.';
              break;
            case MediaError.MEDIA_ERR_DECODE:
              errorMessage = 'Audio hỏng hoặc định dạng không hỗ trợ.';
              break;
            case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
              errorMessage = 'Không thể tải audio. Kiểm tra URL, định dạng, hoặc CORS.';
              break;
            default:
              errorMessage = `Lỗi audio. Mã: ${audioElement.error.code}`;
          }
        }
        console.error(`Component ${componentId} - Audio error event:`, e);
        setAudioError(errorMessage);
        setIsAudioLoaded(false);
      };

      const onCanPlay = () => {
        console.log(`Component ${componentId} - Audio can play:`, audioUrl);
        setIsAudioLoaded(true);
      };

      const onLoadedMetadata = () => {
        if (audioElement) {
          console.log(`Component ${componentId} - Audio metadata loaded:`, audioUrl, `Duration: ${audioElement.duration}s`);
        }
      };

      const onStalled = () => {
        console.warn(`Component ${componentId} - Audio stalled:`, audioUrl);
        setAudioError('Audio bị ngưng tải. Kiểm tra mạng.');
        setIsAudioLoaded(false);
      };

      if (audioElement && audioUrl) {
        console.log(`Component ${componentId} - Starting audio load:`, audioUrl);
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
        console.warn(`Component ${componentId} - No audioUrl, resetting audio.`);
        if (audioElement) {
          audioElement.src = '';
          audioElement.load();
        }
        setAudioError('Không có URL audio.');
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

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
          setPopup({ isOpen: false, word: '', translation: '', examples: [], position: { top: 0, left: 0 } });
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
      if (!transcriptionData?.utterances) return 0;
      const speakers = new Set(transcriptionData.utterances.map((u) => u.speaker));
      return speakers.size;
    }, [transcriptionData]);

    const displayStructure = useMemo(() => {
      if (!transcriptionData?.utterances || transcriptionData.utterances.length === 0) {
        return transcriptionData?.text
          ? [{ key: 'fallback', speaker: 'Unknown', wordsForDisplay: [{ text: transcriptionData.text, start: 0, end: 0, confidence: 0, speaker: 'Unknown' }] }]
          : [];
      }

      return transcriptionData.utterances.map((utterance: UtteranceData, index: number) => {
        if (!utterance) return null;

        const wordsForDisplay: WordData[] = utterance.words && utterance.words.length > 0
          ? utterance.words.filter(
              (word): word is WordData =>
                word &&
                typeof word.text === 'string' &&
                word.text.trim() !== '' &&
                typeof word.start === 'number' &&
                typeof word.end === 'number'
            )
          : utterance.text
          ? [{ text: utterance.text, start: utterance.start || 0, end: utterance.end || 0, confidence: utterance.confidence || 0, speaker: utterance.speaker || 'Unknown' }]
          : [];

        return {
          key: `utt-${index}-${utterance.speaker || 'unknown'}-${utterance.start || 0}`,
          speaker: utterance.speaker || 'Unknown',
          wordsForDisplay,
        };
      }).filter((segment): segment is { key: string; speaker: string; wordsForDisplay: WordData[] } => segment !== null);
    }, [transcriptionData]);

    const handleTimeUpdate = () => {
      if (!audioRef.current || !transcriptionData?.utterances) {
        if (currentWordStartTime !== null) setCurrentWordStartTime(null);
        return;
      }
      const currentTimeMs = audioRef.current.currentTime * 1000;
      let newCurrentWordStart: number | null = null;

      for (const segment of displayStructure) {
        for (const word of segment.wordsForDisplay) {
          if (typeof word.start === 'number' && typeof word.end === 'number' && currentTimeMs >= word.start && currentTimeMs <= word.end) {
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

    const playAudio = () => {
      if (audioRef.current) {
        audioRefs.forEach((otherAudio) => {
          if (otherAudio !== audioRef.current && !otherAudio.paused) {
            otherAudio.pause();
            console.log(`Component ${componentId} - Paused other audio`);
          }
        });
        console.log(`Component ${componentId} - Attempting to play audio`);
        audioRef.current.play().catch((err) => {
          console.error(`Component ${componentId} - Error playing audio:`, err);
          setAudioError('Không thể phát audio: ' + err.message);
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
        setCurrentWordStartTime(startTime);
        playAudio();
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

      const { translation, examples } = await fetchTranslation(wordText);
      setPopup((prev) => ({
        ...prev,
        word: wordText,
        translation,
        examples,
      }));
    };

    const toggleTranscript = () => {
      setIsTranscriptVisible((prev) => !prev);
    };

    if (audioError) {
      return (
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>Lỗi: {audioError}</p>
          <button
            onClick={() => {
              setAudioError(null);
              setIsAudioLoaded(false);
              if (audioRef.current && audioUrl) {
                console.log(`Component ${componentId} - Retrying audio load:`, audioUrl);
                audioRef.current.src = audioUrl;
                audioRef.current.load();
              }
            }}
            className={styles.toggleButton}
          >
            Thử lại
          </button>
        </div>
      );
    }

    if (error && !transcriptionData) {
      return (
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>Lỗi: {error}</p>
          <button onClick={toggleTranscript} className={styles.toggleButton}>
            {isTranscriptVisible ? 'Ẩn Transcript' : 'Hiện Transcript'}
          </button>
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
            preload="auto"
            aria-label={`Audio player for ${componentId}`}
          />
          <button
            onClick={toggleTranscript}
            className={styles.toggleButton}
            aria-label={isTranscriptVisible ? 'Ẩn transcript' : 'Hiện transcript'}
          >
            {isTranscriptVisible ? 'Ẩn Transcript' : 'Hiện Transcript'}
          </button>
        </div>
        <div className={`${styles.transcriptDisplayArea} ${isTranscriptVisible ? '' : styles.hidden}`}>
          {isTranscriptVisible && !transcriptionData && hasFetchedTranscript && (
            <p className={styles.noContent}>Không có nội dung transcript để hiển thị.</p>
          )}
          {isTranscriptVisible && transcriptionData && displayStructure.length > 0 ? (
            displayStructure.map((segment) => (
              <div
                key={segment.key}
                className={`${styles.utteranceBlock} ${styles[`speaker_${segment.speaker}`] || styles.speaker_unknown} ${
                  uniqueSpeakers <= 1 ? styles.hideSpeakerLabel : ''
                }`}
                role="region"
                aria-label={`Segment spoken by ${segment.speaker}`}
              >
                {uniqueSpeakers > 1 && <span className={styles.speakerLabel}>Người nói {segment.speaker}:</span>}
                <p className={styles.sentence}>
                  {segment.wordsForDisplay.map((word: WordData, wordIndex: number) => {
                    if (!word || typeof word.text !== 'string' || typeof word.start !== 'number') {
                      console.warn(`Component ${componentId} - Invalid word data:`, word);
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
                        aria-label={`Chi tiết từ ${word.text} tại ${word.start / 1000} giây`}
                      >
                        {word.text}{' '}
                      </span>
                    );
                  })}
                </p>
              </div>
            ))
          ) : (
            isTranscriptVisible && <div className={styles.loading}>Đang tải dữ liệu transcript...</div>
          )}
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
              {popup.examples.length > 0 && (
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