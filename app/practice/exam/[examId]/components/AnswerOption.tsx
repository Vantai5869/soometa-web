// src/app/practice/exam/[examId]/components/AnswerOption.tsx
import styles from './AnswerOption.module.css';

interface OptionProps {
  option: {
    id: string;
    text: string;
  };
}

export default function AnswerOption({ option }: OptionProps) {
  return (
    <li className={styles.option}>
      <label>
        <input type="radio" name="answer" value={option.id} /> {/* Cần xử lý logic chọn đáp án */}
        {option.text}
      </label>
    </li>
  );
}