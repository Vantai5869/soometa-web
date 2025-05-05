// components/ExamSidebar.tsx
'use client';

import React from 'react';
import styles from './../exams/Exam.module.css';
import type { InstructionGroup, Question, SelectedAnswers, CorrectAnswersMap } from './types';

interface ExamSidebarProps {
  instructionGroups: InstructionGroup[];
  selectedAnswers: SelectedAnswers;
  isSubmitted: boolean;
  correctAnswersMap: CorrectAnswersMap;
  onScrollToQuestion: (questionNumber: number) => void;
  timerComponent: React.ReactNode; // Prop mới để nhận component timer
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
  timerComponent, // Nhận timer component
  onSubmit,
  score,
  totalQuestions
}) => {
  const allQuestions: Question[] = instructionGroups.flatMap(group => group.questions || []);

  return (
    <div id="sidebar" className={styles.sidebar}>
      {/* Khu vực Đồng hồ và Nút Nộp bài */}
      <div className={styles.sidebarActionArea}>
         {timerComponent} {/* Render component timer được truyền vào */}
        {!isSubmitted ? (
            <button
                onClick={onSubmit}
                className={`${styles.submitButton} ${styles.submitButtonSidebar}`}
                disabled={isSubmitted}
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
        {allQuestions.map((q: Question) => {
          if (!q || typeof q.number !== 'number') return null; // Kiểm tra an toàn
          const questionNumber = q.number;
          const selectedOptionIndex = selectedAnswers[questionNumber];
          const correctAnswerIndex = correctAnswersMap[questionNumber];
          let stateClass = '';

          if (isSubmitted) {
            if (selectedOptionIndex !== undefined) {
              stateClass = (typeof correctAnswerIndex === 'number' && selectedOptionIndex === correctAnswerIndex)
                           ? styles.navCorrect : styles.navIncorrect;
            } else {
              stateClass = styles.navUnanswered;
            }
          } else if (selectedOptionIndex !== undefined) {
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