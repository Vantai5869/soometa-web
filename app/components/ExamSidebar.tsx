// components/ExamSidebar.tsx
'use client';

import React from 'react';
import styles from './../exams/Exam.module.css'; // Đảm bảo đường dẫn CSS đúng
import type { InstructionGroup, Question, SelectedAnswers, CorrectAnswersMap } from './types'; // Đảm bảo đường dẫn types đúng

interface ExamSidebarProps {
  instructionGroups: InstructionGroup[]; // Nên là InstructionGroup[] | undefined | null nếu có thể không có
  selectedAnswers: SelectedAnswers;
  isSubmitted: boolean;
  correctAnswersMap: CorrectAnswersMap;
  onScrollToQuestion: (questionNumber: number) => void;
  timerComponent: React.ReactNode;
  onSubmit: () => void; // Giữ nguyên là required, ExamViewerWrapper sẽ truyền () => {} nếu cần
  score: number;
  totalQuestions: number;
  isReviewing?: boolean; // THÊM PROP NÀY (optional để không phá vỡ nếu có chỗ khác dùng mà chưa truyền)
}

const ExamSidebar: React.FC<ExamSidebarProps> = ({
  instructionGroups,
  selectedAnswers,
  isSubmitted,
  correctAnswersMap,
  onScrollToQuestion,
  timerComponent,
  onSubmit,
  score,
  totalQuestions,
  isReviewing, // Nhận prop mới
}) => {
  // Xử lý an toàn nếu instructionGroups có thể là undefined hoặc null
  const allQuestions: Question[] = instructionGroups?.flatMap(group => group.questions || []) || [];

  const shouldShowSubmitButton = !isSubmitted && !isReviewing;

  return (
    <div id="sidebar" className={styles.sidebar}>
      {/* Khu vực Đồng hồ và Nút Nộp bài */}
      <div className={styles.sidebarActionArea}>
         {timerComponent} {/* Render component timer được truyền vào */}
        
        {shouldShowSubmitButton ? (
            <button
                onClick={onSubmit}
                className={`${styles.submitButton} ${styles.submitButtonSidebar}`}
                // disabled không cần thiết ở đây nữa vì button sẽ không render nếu isSubmitted hoặc isReviewing
            >
                Nộp bài
            </button>
        ) : (
            <div className={`${styles.scoreDisplay} ${styles.scoreDisplaySidebar}`}>
                Kết quả: {score} / {totalQuestions}
            </div>
        )}
      </div>

      {/* Khu vực điều hướng câu hỏi */}
      <ul className={styles.questionNavList}>
        {allQuestions.map((q: Question | null | undefined) => { // Cho phép q có thể null/undefined
          if (!q || typeof q.number !== 'number') return null; 
          const questionNumber = q.number;
          const selectedOptionIndex = selectedAnswers[questionNumber];
          const correctAnswerIndex = correctAnswersMap[questionNumber];
          let stateClass = '';

          if (isSubmitted || isReviewing) { // Cập nhật điều kiện: nếu đã nộp hoặc đang review thì hiển thị màu đúng/sai
            if (selectedOptionIndex !== undefined) {
              stateClass = (typeof correctAnswerIndex === 'number' && selectedOptionIndex === correctAnswerIndex)
                           ? styles.navCorrect : styles.navIncorrect;
            } else {
              stateClass = styles.navUnanswered; // Vẫn là chưa trả lời nếu không có lựa chọn
            }
          } else if (selectedOptionIndex !== undefined) { // Chưa nộp, chưa review, nhưng đã trả lời
             stateClass = styles.navAnswered;
          }

          return (
            <li
              key={`nav-${questionNumber}`}
              className={`${styles.questionNavItem} ${stateClass}`}
              data-question-number={questionNumber}
              onClick={() => onScrollToQuestion(questionNumber)}
              title={`Chuyển đến câu ${questionNumber}${selectedOptionIndex !== undefined ? ' (Đã chọn)' : ''}`}
            >
              <span className={styles.questionNavNumber}>{questionNumber}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ExamSidebar;