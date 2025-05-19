'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import ExamViewer from './ExamViewer'; // Giả sử ExamViewer.tsx đã được cập nhật
import ExamSidebar from './ExamSidebar';
import CountdownTimer from './CountdownTimer';
import styles from './../exams/Exam.module.css';
import type {
  ExamData,
  SelectedAnswers,
  CorrectAnswersMap,
  Level,
  Skill,
  Question, // Vẫn cần cho correctAnswersMap và tính điểm
  InstructionGroup, // Vẫn cần
  // ExplanationData, // Không cần state này nữa
  // Option, // Có thể vẫn cần nếu Question type dùng
  // ExplanationContent, // Không cần nữa
} from './types';

// --- Helper Function: Lấy thời gian thi (giây) ---
const getDurationInSeconds = (level?: Level, skill?: Skill): number => {
  const DEFAULT_DURATION_SECONDS = 60 * 60; // 1 giờ mặc định
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

// --- API Functions (Đã được chuyển vào InteractiveChatPanel hoặc không còn cần ở đây) ---
// async function fetchTranslation(textToTranslate: string): Promise<string> { ... } // BỎ
// async function fetchChatResponse(questionContext: string, userQuery: string): Promise<string> { ... } // BỎ

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
  // const [explanationData, setExplanationData] = useState<ExplanationData>({}); // BỎ STATE NÀY

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
        if (prevIsSubmitted) return true; // Chỉ submit một lần
        let currentScore: number = 0;
        if (examData?.instruction_groups) {
          examData.instruction_groups.forEach(group => {
            group?.questions?.forEach(q => {
              if (q && typeof q.number === 'number' && correctAnswersMap[q.number] !== undefined) {
                const correctIndex = correctAnswersMap[q.number];
                const selectedIndex = selectedAnswers[q.number];
                if (selectedIndex === correctIndex) {
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

  // --- Handlers for Inline Explanation/Chat (ĐÃ BỊ LOẠI BỎ) ---
  // const handleFetchTranslation = useCallback(...) // BỎ
  // const handleSendChatMessage = useCallback(...) // BỎ

  // --- useEffect reset state chính khi đổi đề ---
  useEffect(() => {
    if (examData) {
      setSelectedAnswers({});
      setIsSubmitted(false);
      setScore(0);
      // setExplanationData({}); // BỎ
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
          skill={examData.skill}
          audioUrl={examData?.audio_url}
          selectedAnswers={selectedAnswers}
          isSubmitted={isSubmitted}
          correctAnswersMap={correctAnswersMap}
          onAnswerSelect={handleAnswerSelect}
          // explanationData={explanationData} // BỎ PROP NÀY
          // onFetchTranslation={handleFetchTranslation} // BỎ PROP NÀY
          // onSendChatMessage={handleSendChatMessage} // BỎ PROP NÀY (đã comment ở code bạn cung cấp)
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