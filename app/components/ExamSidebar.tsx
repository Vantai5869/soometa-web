// components/ExamSidebar.tsx
'use client';

import React from 'react'; // Import React để sử dụng React.ReactNode
import styles from '../exams/Exam.module.css'; // Đảm bảo đường dẫn đúng
// Import các kiểu cần thiết từ file types của bạn
import type { InstructionGroup, Question, SelectedAnswers, CorrectAnswersMap } from './types'; // Đảm bảo đường dẫn đúng

// Định nghĩa kiểu cho props của ExamSidebar
interface ExamSidebarProps {
  instructionGroups: InstructionGroup[];
  selectedAnswers: SelectedAnswers;
  isSubmitted: boolean;
  correctAnswersMap: CorrectAnswersMap;
  onScrollToQuestion: (questionNumber: number) => void;
  timerComponent: React.ReactNode; // <<<< ĐÂY LÀ PROP QUAN TRỌNG ĐÃ THÊM
  onSubmit: () => void;
  score: number;
  totalQuestions: number;
}

const ExamSidebar: React.FC<ExamSidebarProps> = ({
  instructionGroups,
  selectedAnswers,
  isSubmitted,
  correctAnswersMap,
  onScrollToQuestion,
  timerComponent, // Nhận prop timerComponent
  onSubmit,
  score,
  totalQuestions
}) => {
  // Gom tất cả câu hỏi từ các group lại để dễ map
  const allQuestions: Question[] = instructionGroups.flatMap(group => group.questions || []); // Thêm || [] để phòng trường hợp questions là undefined

  return (
    <div id="sidebar" className={styles.sidebar}>
      {/* Khu vực Đồng hồ và Nút Nộp bài */}
      <div className={styles.sidebarActionArea}>
         {/* Render component timer được truyền vào */}
         {timerComponent}

        {!isSubmitted ? (
            <button
                onClick={onSubmit} // Gọi hàm onSubmit từ props
                className={`${styles.submitButton} ${styles.submitButtonSidebar}`}
                disabled={isSubmitted} // Disabled khi đã nộp
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
        {allQuestions.map((q: Question) => { // Thêm kiểu Question
          // Kiểm tra phòng trường hợp q không hợp lệ (dù không nên xảy ra nếu data đúng)
          if (!q || typeof q.number !== 'number') {
              console.warn("Invalid question object found in sidebar map:", q);
              return null;
          }
          const questionNumber = q.number;
          const selectedOptionIndex = selectedAnswers[questionNumber];
          const correctAnswerIndex = correctAnswersMap[questionNumber];
          let stateClass = '';

          if (isSubmitted) {
            if (selectedOptionIndex !== undefined) { // Nếu đã trả lời
              // Chỉ so sánh nếu correctAnswerIndex là một số
              stateClass = (typeof correctAnswerIndex === 'number' && selectedOptionIndex === correctAnswerIndex)
                           ? styles.navCorrect
                           : styles.navIncorrect;
            } else { // Nếu chưa trả lời
              stateClass = styles.navUnanswered;
            }
          } else if (selectedOptionIndex !== undefined) { // Chưa nộp, đã trả lời
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