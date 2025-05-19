'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import ExamViewer from './ExamViewer';
import ExamSidebar from './ExamSidebar';
import CountdownTimer from './CountdownTimer';
import styles from './../exams/Exam.module.css';
import type {
  ExamData,
  SelectedAnswers,
  CorrectAnswersMap,
  Level,
  Skill,
  Question,
  InstructionGroup,
  ExplanationData,
  Option,
  ExplanationContent,
} from './types';

// --- Helper Function: Lấy thời gian thi (giây) ---
const getDurationInSeconds = (level?: Level, skill?: Skill): number => {
  const DEFAULT_DURATION_SECONDS = 60 * 60;
  if (typeof level !== 'string' || typeof skill !== 'string') {
    return DEFAULT_DURATION_SECONDS;
  }
  if (level === 'TOPIK Ⅰ') {
    return skill === '읽기' ? 60 * 60 : skill === '듣기' ? 40 * 60 : DEFAULT_DURATION_SECONDS;
  }
  if (level === 'TOPIK Ⅱ') {
    return skill === '읽기' ? 70 * 60 : skill === '듣기' ? 60 * 60 : DEFAULT_DURATION_SECONDS;
  }
  return DEFAULT_DURATION_SECONDS;
};

// --- API Functions ---
async function fetchTranslation(textToTranslate: string): Promise<string> {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: 'translate', text: textToTranslate }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }

    return data.result || 'Không có bản dịch.';
  } catch (error) {
    console.error('Translation API error:', error);
    throw error instanceof Error ? error : new Error('Lỗi khi gọi API dịch');
  }
}

async function fetchChatResponse(questionContext: string, userQuery: string): Promise<string> {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: 'chat', context: questionContext, query: userQuery }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }

    return data.result || 'Không có phản hồi từ AI.';
  } catch (error) {
    console.error('Chat API error:', error);
    throw error instanceof Error ? error : new Error('Lỗi khi gọi API chat');
  }
}

// --- Props Interface ---
interface ExamViewerWrapperProps {
  examData: ExamData | null;
}

// --- Component ---
const ExamViewerWrapper: React.FC<ExamViewerWrapperProps> = ({ examData }) => {
  // --- State Variables ---
  const [selectedAnswers, setSelectedAnswers] = useState<SelectedAnswers>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [explanationData, setExplanationData] = useState<ExplanationData>({});

  // --- Memoized Calculations ---
  const initialDuration: number = useMemo(
    () => (examData ? getDurationInSeconds(examData.level, examData.skill) : 0),
    [examData]
  );

  const correctAnswersMap: CorrectAnswersMap = useMemo((): CorrectAnswersMap => {
    const map: CorrectAnswersMap = {};
    if (!examData?.instruction_groups || !Array.isArray(examData.instruction_groups)) return map;
    examData.instruction_groups.forEach((group: InstructionGroup | null | undefined) => {
      group?.questions?.forEach((q: Question | null | undefined) => {
        if (!q?.options || !Array.isArray(q.options) || typeof q.number !== 'number') return;
        const correctIndex = q.options.findIndex(opt => opt?.is_correct);
        if (correctIndex !== -1) {
          map[q.number] = correctIndex;
        }
      });
    });
    return map;
  }, [examData]);

  const totalQuestions: number = useMemo((): number => {
    if (!examData?.instruction_groups || !Array.isArray(examData.instruction_groups)) return 0;
    return examData.instruction_groups.reduce(
      (acc, group) => acc + (Array.isArray(group?.questions) ? group.questions.length : 0),
      0
    );
  }, [examData]);

  // --- Callback Handlers ---
  const handleAnswerSelect = useCallback(
    (questionNumber: number, optionIndex: number): void => {
      if (isSubmitted) return;
      setSelectedAnswers(prev => ({ ...prev, [questionNumber]: optionIndex }));
    },
    [isSubmitted]
  );

  const handleSubmit = useCallback(
    (isTimeout: boolean = false): void => {
      setIsSubmitted(prevIsSubmitted => {
        if (prevIsSubmitted) return true;
        let currentScore: number = 0;
        if (examData?.instruction_groups) {
          examData.instruction_groups.forEach(group => {
            group?.questions?.forEach(q => {
              if (q && typeof q.number === 'number') {
                const correctIndex = correctAnswersMap[q.number];
                const selectedIndex = selectedAnswers[q.number];
                if (
                  selectedIndex !== undefined &&
                  typeof correctIndex === 'number' &&
                  selectedIndex === correctIndex
                ) {
                  currentScore++;
                }
              }
            });
          });
        }
        setScore(currentScore);
        if (isTimeout) {
          alert('Đã hết giờ làm bài! Bài thi của bạn đã được nộp tự động.');
        }
        return true;
      });
    },
    [examData, selectedAnswers, correctAnswersMap]
  );

  const handleScrollToQuestion = useCallback((questionNumber: number): void => {
    const element = document.getElementById(`question-block-${questionNumber}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // --- Handlers for Inline Explanation/Chat ---
  const handleFetchTranslation = useCallback(
    async (questionNumber: number, question: Question) => {
      if (typeof questionNumber !== 'number' || !question) return;
      const currentExplanation = explanationData[questionNumber];
      if (currentExplanation?.translation || currentExplanation?.isLoadingTranslation) return;

      setExplanationData(prev => ({
        ...prev,
        [questionNumber]: { ...currentExplanation, isLoadingTranslation: true, translationError: undefined },
      }));

      let textToTranslate = '';
      const parentGroup = examData?.instruction_groups?.find(g =>
        g?.questions?.some(qItem => qItem?.number === questionNumber)
      );
      if (
        parentGroup?.shared_content?.type === 'text' ||
        parentGroup?.shared_content?.type === 'text_with_insertion_points'
      ) {
        textToTranslate += parentGroup.shared_content.value + '\n\n[Câu hỏi]\n';
      }
      if (question.content?.type === 'text' || question.content?.type === 'instruction') {
        textToTranslate += question.content.value + '\n\n';
      } else if (question.content?.type === 'image') {
        textToTranslate += `[Hình ảnh: ${question.content.alt}]\n\n`;
      } else if (question.content?.type === 'audio_prompt') {
        textToTranslate += `[Câu hỏi nghe]\n\n`;
      }
      textToTranslate += ' [Lựa chọn]\n';
      const optionMarkers = ['①', '②', '③', '④'];
      question.options?.forEach((opt, index) => {
        if (opt?.text) {
          textToTranslate += `${optionMarkers[index]} ${opt.text}\n`;
        } else if (opt?.image_src) {
          textToTranslate += `${optionMarkers[index]} [Hình ảnh: ${opt.alt}]\n`;
        }
      });
      textToTranslate = textToTranslate.trim();

      if (!textToTranslate) {
        setExplanationData(prev => ({
          ...prev,
          [questionNumber]: {
            ...(prev[questionNumber] ?? {}),
            isLoadingTranslation: false,
            translationError: 'Không có nội dung text để dịch.',
          },
        }));
        return;
      }

      try {
        const translationResult = await fetchTranslation(textToTranslate);
        setExplanationData(prev => ({
          ...prev,
          [questionNumber]: { ...prev[questionNumber], isLoadingTranslation: false, translation: translationResult },
        }));
      } catch (error) {
        console.error('Translation error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Không thể tải bản dịch.';
        setExplanationData(prev => ({
          ...prev,
          [questionNumber]: {
            ...prev[questionNumber],
            isLoadingTranslation: false,
            translationError: errorMessage,
          },
        }));
      }
    },
    [examData]
  );

  const handleSendChatMessage = useCallback(
    async (questionNumber: number, question: Question, userQuery: string) => {
      if (typeof questionNumber !== 'number' || !question || !userQuery) return;

      setExplanationData((prev: ExplanationData): ExplanationData => {
        const currentExplanation = prev[questionNumber];
        const currentHistory = currentExplanation?.chatHistory || [];
        return {
          ...prev,
          [questionNumber]: {
            ...(currentExplanation ?? {}),
            chatHistory: [...currentHistory, { sender: 'user', message: userQuery }],
            isChatLoading: true,
            chatError: undefined,
          },
        };
      });

      let questionContext = `Câu hỏi ${questionNumber}: ${JSON.stringify(question.content)}`;
      const parentGroup = examData?.instruction_groups?.find(g =>
        g?.questions?.some(q => q?.number === questionNumber)
      );
      if (
        parentGroup?.shared_content?.type === 'text' ||
        parentGroup?.shared_content?.type === 'text_with_insertion_points'
      ) {
        questionContext = parentGroup.shared_content.value + '\n\n' + questionContext;
      }

      try {
        const aiResponse = await fetchChatResponse(questionContext.substring(0, 1000), userQuery);
        setExplanationData((prev: ExplanationData): ExplanationData => {
          const currentExplanation = prev[questionNumber];
          const currentHistory = currentExplanation?.chatHistory || [];
          return {
            ...prev,
            [questionNumber]: {
              ...currentExplanation,
              chatHistory: [...currentHistory, { sender: 'ai', message: aiResponse }],
              isChatLoading: false,
            },
          };
        });
      } catch (error) {
        console.error('Chat error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Lỗi kết nối đến AI';
        setExplanationData((prev: ExplanationData): ExplanationData => {
          const currentHistory = prev[questionNumber]?.chatHistory || [];
          return {
            ...prev,
            [questionNumber]: {
              ...prev[questionNumber],
              chatHistory: [...currentHistory, { sender: 'ai', message: `[Lỗi: ${errorMessage}]` }],
              isChatLoading: false,
              chatError: errorMessage,
            },
          };
        });
      }
    },
    [examData]
  );

  // --- useEffect reset state chính khi đổi đề ---
  useEffect(() => {
    if (examData) {
      setSelectedAnswers({});
      setIsSubmitted(false);
      setScore(0);
      setExplanationData({});
    }
  }, [examData]);

  if (!examData) {
    return <div className={styles.loading}>Đang tải dữ liệu đề thi...</div>;
  }

  // --- JSX Rendering ---
  return (
    <div className={`${styles.appContainer} ${isSubmitted ? styles.submitted : ''}`}>
      <div className={styles.mainContent}>
        <h1 className={styles.examTitle}>
          {examData.exam_number_description} TOPIK {examData.level} -{' '}
          {examData.skill === '읽기' ? 'Đọc' : 'Nghe'} ({examData.year_description})
        </h1>
        <ExamViewer
          instructionGroups={examData.instruction_groups}
          skill={examData.skill} // << Truyền skill
          audioUrl={examData?.audio_url} // << Truyền audioUrl
          selectedAnswers={selectedAnswers}
          isSubmitted={isSubmitted}
          correctAnswersMap={correctAnswersMap}
          onAnswerSelect={handleAnswerSelect}
        />

        <div className={`${styles.submissionArea} ${styles.mobileSubmitArea}`}>
          <CountdownTimer
            key={`mobile-timer-${examData.id}`}
            initialDurationSeconds={initialDuration}
            onTimeout={() => handleSubmit(true)}
            isSubmitted={isSubmitted}
            className={styles.timerDisplayMobile}
          />
          {!isSubmitted ? (
            <button
              id="submit-btn-mobile"
              onClick={() => handleSubmit(false)}
              className={`${styles.submitButton} ${styles.submitButtonMobile}`}
              disabled={isSubmitted}
            >
              Nộp bài
            </button>
          ) : (
            <div id="score-container-mobile" className={styles.scoreDisplay}>
              Kết quả: {score} / {totalQuestions}
            </div>
          )}
        </div>
      </div>

      <ExamSidebar
        instructionGroups={examData.instruction_groups}
        selectedAnswers={selectedAnswers}
        isSubmitted={isSubmitted}
        correctAnswersMap={correctAnswersMap}
        onScrollToQuestion={handleScrollToQuestion}
        timerComponent={
          <CountdownTimer
            key={`sidebar-timer-${examData.id}`}
            initialDurationSeconds={initialDuration}
            onTimeout={() => handleSubmit(true)}
            isSubmitted={isSubmitted}
          />
        }
        onSubmit={() => handleSubmit(false)}
        score={score}
        totalQuestions={totalQuestions}
      />
    </div>
  );
};

export default ExamViewerWrapper;