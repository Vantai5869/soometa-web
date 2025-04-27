// src/app/practice/exam/[examId]/components/NavigationButtons.tsx
import styles from './NavigationButtons.module.css';

export default function NavigationButtons() {
  return (
    <div className={styles.buttonContainer}>
      <button>Câu trước</button>
      <button>Câu sau</button>
      {/* Có thể thêm nút "Nộp bài" sau */}
    </div>
  );
}