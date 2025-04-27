// app/exams/page.tsx
import Link from 'next/link';
import fs from 'fs/promises';
import path from 'path';
import styles from './ExamList.module.css'; // Import CSS

// Định nghĩa các kiểu dữ liệu (có thể chuyển ra file .d.ts)
interface ExamData {
    id: string;
    year_description: string;
    exam_number_description: string;
    source: string;
    level: string;
    skill: string;
    instruction_groups: any[]; // Tạm thời dùng any[], sẽ định nghĩa chi tiết hơn khi làm trang làm bài
}

interface ExamListItem {
  id: string;
  year_description: string;
  exam_number_description: string;
  level: string;
  skill: string;
}

// Hàm đọc dữ liệu - chạy trên server (thêm kiểu trả về)
async function getExamList(): Promise<ExamListItem[]> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'data.json');
    const jsonData = await fs.readFile(filePath, 'utf-8');
    // Đảm bảo parse đúng kiểu mảng ExamData[]
    const allExamsData: ExamData[] = JSON.parse(jsonData);

    // Chỉ trích xuất thông tin cần thiết
    const examList: ExamListItem[] = allExamsData.map(exam => ({
      id: exam.id,
      year_description: exam.year_description,
      exam_number_description: exam.exam_number_description,
      level: exam.level,
      skill: exam.skill,
    }));
    return examList;
  } catch (error) {
    console.error("Error reading or parsing data.json:", error);
    return []; // Trả về mảng rỗng nếu có lỗi
  }
}

// Component trang (Server Component)
// Kiểu React.FC (Function Component) không cần thiết cho Server Component đơn giản
export default async function ExamsPage() {
  const exams: ExamListItem[] = await getExamList(); // Gọi hàm lấy dữ liệu và gán kiểu

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Danh sách Đề thi TOPIK</h1>
      {exams.length > 0 ? (
        <ul className={styles.list}>
          {exams.map((exam) => (
            <li key={exam.id} className={styles.listItem}>
              <Link href={`/exams/${exam.id}`} className={styles.link}>
                  <span className={styles.examLevelSkill}>
                     {exam.level} - {exam.skill === '읽기' ? 'Đọc' : 'Nghe'}
                  </span>
                  <span className={styles.examNumberYear}>
                    ({exam.exam_number_description} - {exam.year_description})
                  </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>Không tìm thấy dữ liệu đề thi hoặc có lỗi xảy ra.</p>
      )}
    </div>
  );
}