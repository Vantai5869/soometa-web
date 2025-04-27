// src/app/practice/exam/page.tsx
import ExamCard from './components/ExamCard';
import styles from './page.module.css'; // Tạo file CSS riêng cho trang này

interface Exam {
  id: string;
  title: string;
  level: string;
  questionCount: number;
  // Thêm các thuộc tính khác của đề thi
}

const DUMMY_EXAMS: Exam[] = [
  { id: '1', title: 'TOPIK I - Lần 1', level: 'Sơ cấp', questionCount: 70 },
  { id: '2', title: 'TOPIK I - Lần 2', level: 'Sơ cấp', questionCount: 70 },
  { id: '3', title: 'TOPIK II - Lần 1', level: 'Trung cấp', questionCount: 100 },
  { id: '4', title: 'TOPIK II - Lần 2', level: 'Cao cấp', questionCount: 100 },
  { id: '5', title: 'TOPIK I - Đặc biệt', level: 'Sơ cấp', questionCount: 70 },
  // Thêm các đề thi khác nếu bạn muốn
];

export default function ExamListPage() {
  return (
    <div className={styles.container}>
      <h1>Luyện Thi Theo Đề</h1>
      <div className={styles.examGrid}>
        {DUMMY_EXAMS.map((exam) => (
          <ExamCard key={exam.id} exam={exam} />
        ))}
      </div>
    </div>
  );
}