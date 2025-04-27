// components/ExamViewerWrapper.tsx
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import ExamViewer from './ExamViewer';
import ExamSidebar from './ExamSidebar';
import CountdownTimer from './CountdownTimer';
import styles from './../exams/Exam.module.css'; // Đảm bảo đường dẫn đúng
import type { ExamData, SelectedAnswers, CorrectAnswersMap, Level, Skill, Question, Option, InstructionGroup } from './types'; // Đảm bảo đường dẫn đúng

// --- Helper Functions ---
const getDurationInSeconds = (level?: Level, skill?: Skill): number => {
    const DEFAULT_DURATION_SECONDS = 60 * 60;
    if (typeof level !== 'string' || typeof skill !== 'string' ) {
        console.warn(`Kiểu dữ liệu Level hoặc Skill không hợp lệ:`, level, skill, `. Sử dụng thời gian mặc định.`);
        return DEFAULT_DURATION_SECONDS;
    }
    if (level === 'TOPIK Ⅰ') { return skill === '읽기' ? 60 * 60 : (skill === '듣기' ? 40 * 60 : DEFAULT_DURATION_SECONDS); }
    if (level === 'TOPIK Ⅱ') { return skill === '읽기' ? 70 * 60 : (skill === '듣기' ? 60 * 60 : DEFAULT_DURATION_SECONDS); }
    console.warn(`Không xác định được thời gian cho tổ hợp: ${level}, ${skill}. Sử dụng thời gian mặc định.`);
    return DEFAULT_DURATION_SECONDS;
};

// --- Props Interface ---
interface ExamViewerWrapperProps {
  examData: ExamData | null;
}

// --- Component ---
const ExamViewerWrapper: React.FC<ExamViewerWrapperProps> = ({ examData }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<SelectedAnswers>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);

  // --- Memoized Calculations ---
  const initialDuration = useMemo(() => {
      if (!examData) return 0;
      return getDurationInSeconds(examData.level, examData.skill);
  }, [examData]);

  const correctAnswersMap: CorrectAnswersMap = useMemo((): CorrectAnswersMap => {
    const map: CorrectAnswersMap = {};
    if (!examData?.instruction_groups) return map;
    examData.instruction_groups.forEach((group: InstructionGroup) => {
      if (!group?.questions || !Array.isArray(group.questions)) return;
      group.questions.forEach((q: Question) => {
        if (!q?.options || !Array.isArray(q.options)) { return; }
        const correctIndex: number = q.options.findIndex((opt: Option) => opt && opt.is_correct);
        if (correctIndex !== -1) { map[q.number] = correctIndex; }
        else { /* console.warn(`Q ${q?.number}: No correct answer`); */ } // Bỏ log này để đỡ rối console
      });
    });
    return map;
  }, [examData]);

  const totalQuestions: number = useMemo((): number => {
    let count: number = 0;
    if (!examData?.instruction_groups) return 0;
    examData.instruction_groups.forEach((group: InstructionGroup) => {
      if (group?.questions && Array.isArray(group.questions)) { count += group.questions.length; }
    });
    return count;
  }, [examData]);

  // --- Callback Handlers ---
  const handleAnswerSelect = useCallback((questionNumber: number, optionIndex: number): void => {
    if (isSubmitted) return; // Không cho chọn sau khi nộp
    setSelectedAnswers(prev => ({
      ...prev,
      [questionNumber]: optionIndex,
    }));
  }, [isSubmitted]);

  const handleSubmit = useCallback((isTimeout: boolean = false): void => {
      setIsSubmitted(prevIsSubmitted => {
          if (prevIsSubmitted) return true; // Đã nộp rồi

          console.log("Running handleSubmit. isTimeout:", isTimeout);

          let currentScore: number = 0;
          if (examData?.instruction_groups) {
               examData.instruction_groups.forEach(group => {
                 if (group?.questions && Array.isArray(group.questions)) {
                     group.questions.forEach(q => {
                       const correctIndex: number | undefined = correctAnswersMap[q.number];
                       // Lấy state selectedAnswers MỚI NHẤT bằng cách dùng nó từ closure của useCallback
                       const selectedIndex: number | undefined = selectedAnswers[q.number];
                       if (selectedIndex !== undefined && typeof correctIndex === 'number' && selectedIndex === correctIndex) {
                           currentScore++;
                       }
                     });
                 }
               });
          }
          setScore(currentScore);
          console.log("Score calculated:", currentScore); // Log điểm số

          if (isTimeout) { alert("Đã hết giờ làm bài! Bài thi của bạn đã được nộp tự động."); }
          return true; // Cập nhật isSubmitted
      });
  }, [examData, selectedAnswers, correctAnswersMap, setIsSubmitted, setScore]); // Cần selectedAnswers ở đây


  const handleScrollToQuestion = useCallback((questionNumber: number): void => {
      const element = document.getElementById(`question-block-${questionNumber}`);
      if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
  }, []);

  // --- useEffect reset state khi đổi đề ---
   useEffect(() => {
     // Chỉ reset khi có examData mới và khác ID cũ (nếu cần tối ưu hơn)
     console.log(`Exam data changed to ${examData?.id}. Resetting states.`);
     setSelectedAnswers({});
     setIsSubmitted(false);
     setScore(0);
   }, [examData]); // Chỉ chạy khi examData thay đổi


   if (!examData) {
       return <div className={styles.loading}>Đang tải dữ liệu đề thi...</div>;
   }

  // --- JSX Rendering ---
  return (
    // *** QUAN TRỌNG: Thêm class submitted vào đây ***
    <div className={`${styles.appContainer} ${isSubmitted ? styles.submitted : ''}`}>
      <div className={styles.mainContent}>
        <h1 className={styles.examTitle}>
            {examData.exam_number_description} TOPIK {examData.level} - {examData.skill === '읽기' ? 'Đọc' : 'Nghe'} ({examData.year_description})
        </h1>
        <ExamViewer
          instructionGroups={examData.instruction_groups}
          selectedAnswers={selectedAnswers}
          isSubmitted={isSubmitted} // Truyền isSubmitted xuống
          correctAnswersMap={correctAnswersMap} // Truyền map đáp án đúng xuống
          onAnswerSelect={handleAnswerSelect}
        />
        {/* Mobile Submit Area */}
        <div className={`${styles.submissionArea} ${styles.mobileSubmitArea}`}>
            <CountdownTimer
                key={`mobile-timer-${examData.id}`}
                initialDurationSeconds={initialDuration}
                onTimeout={() => handleSubmit(true)}
                isSubmitted={isSubmitted} // Truyền isSubmitted xuống Timer
                className={styles.timerDisplayMobile}
            />
           {!isSubmitted ? (
               <button id="submit-btn-mobile" onClick={() => handleSubmit(false)} className={`${styles.submitButton} ${styles.submitButtonMobile}`} disabled={isSubmitted}>
                 Nộp bài
               </button>
           ) : (
               <div id="score-container-mobile" className={styles.scoreDisplay}>
                   Kết quả: {score} / {totalQuestions}
               </div>
           )}
        </div>
      </div>

      {/* Sidebar */}
      <ExamSidebar
        instructionGroups={examData.instruction_groups}
        selectedAnswers={selectedAnswers}
        isSubmitted={isSubmitted} // Truyền isSubmitted xuống
        correctAnswersMap={correctAnswersMap} // Truyền map đáp án đúng xuống
        onScrollToQuestion={handleScrollToQuestion}
        timerComponent={
            <CountdownTimer
                key={`sidebar-timer-${examData.id}`}
                initialDurationSeconds={initialDuration}
                onTimeout={() => handleSubmit(true)}
                isSubmitted={isSubmitted} // Truyền isSubmitted xuống Timer
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