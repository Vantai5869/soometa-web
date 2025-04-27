// src/app/practice/exam/[examId]/components/Question.tsx
import AnswerOption from './AnswerOption';
import styles from './Question.module.css';

interface Option {
  id: string;
  text: string;
  isCorrect?: boolean; // Tùy chọn
}

interface QuestionProps {
  question: {
    id: string;
    text: string;
    options: Option[];
    explanation?: string; // Tùy chọn
  };
  questionNumber: number;
}

export default function Question({ question, questionNumber }: QuestionProps) {
  return (
    <div className={styles.questionContainer}>
      <h3>Câu {questionNumber}: {question.text}</h3>
      <ul className={styles.optionsList}>
        {question.options.map((option) => (
          <AnswerOption key={option.id} option={option} />
        ))}
      </ul>
      {/* Có thể thêm phần giải thích sau khi người dùng chọn đáp án */}
    </div>
  );
}