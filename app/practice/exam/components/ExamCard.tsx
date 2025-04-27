// src/app/practice/exam/components/ExamCard.tsx
import Link from 'next/link';
import styles from './ExamCard.module.css';

interface Exam {
  id: string;
  title: string;
  level: string;
  questionCount: number;
  // Thêm các thuộc tính khác của đề thi
}

interface ExamCardProps {
  exam: Exam;
}

export default function ExamCard({ exam }: ExamCardProps) {
  return (
    <Link href={`/practice/exam/${exam.id}`} className={styles.card}>
      <h3>{exam.title}</h3>
      <p>Cấp độ: {exam.level}</p>
      <p>Số câu hỏi: {exam.questionCount}</p>
      {/* Thêm các thông tin khác bạn muốn hiển thị */}
    </Link>
  );
}