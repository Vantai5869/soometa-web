// app/exams/page.tsx
import Link from 'next/link';
import fs from 'fs/promises';
import path from 'path';
import styles from './ExamList.module.css'; // Sử dụng file CSS đã tinh chỉnh lần 2

// Định nghĩa các kiểu dữ liệu (Thêm has_audio)
interface ExamData {
    id: string;
    year_description: string;
    exam_number_description: string;
    source: string;
    level: string; // Ví dụ: "B", "A", "TOPIK I", "TOPIK II", "TOPIK I B"
    skill: string; // "듣기", "읽기"
    has_audio?: boolean; // Thêm trường này vào data.json nếu có
    instruction_groups: any[];
}

interface ExamListItem {
  id: string;
  year_description: string;
  exam_number_description: string;
  level: string;
  skill: string;
  has_audio: boolean; // Luôn có giá trị boolean
}

// Hàm đọc dữ liệu (Cập nhật để đọc has_audio)
async function getExamList(): Promise<ExamListItem[]> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'data.json');
    const jsonData = await fs.readFile(filePath, 'utf-8');
    const allExamsData: ExamData[] = JSON.parse(jsonData);

    const examList: ExamListItem[] = allExamsData.map(exam => ({
      id: exam.id,
      year_description: exam.year_description,
      exam_number_description: exam.exam_number_description,
      level: exam.level,
      skill: exam.skill,
      // Đọc giá trị 'has_audio', mặc định là false nếu không có
      has_audio: exam.has_audio ?? false,
    }));
    return examList;
  } catch (error) {
    console.error("Error reading or parsing data.json:", error);
    return [];
  }
}

// Component trang (Server Component)
export default async function ExamsPage() {
  const exams: ExamListItem[] = await getExamList();

  const examsByYear: { [year: string]: ExamListItem[] } = {};
  exams.forEach(exam => {
    const year = exam.year_description;
    if (!examsByYear[year]) {
      examsByYear[year] = [];
    }
    examsByYear[year].push(exam);
  });

  const sortedYears = Object.keys(examsByYear).sort((a, b) => parseInt(b) - parseInt(a));

  // --- Logic xác định TOPIK I/II và Level phụ ---
  // **QUAN TRỌNG**: Logic này cần được điều chỉnh 100% theo cấu trúc dữ liệu `level` thực tế của bạn.
  // Ví dụ: Nếu level là "TOPIK I B"
  const parseLevel = (levelString: string): { major: string; sub: string } => {
      let major = '';
      let sub = levelString; // Mặc định level phụ là toàn bộ chuỗi

      if (levelString.includes('TOPIK I') && !levelString.includes('TOPIK II')) {
          major = 'TOPIK I';
          // Cố gắng tách phần còn lại làm level phụ
          sub = levelString.replace('TOPIK I', '').trim();
      } else if (levelString.includes('TOPIK II')) {
          major = 'TOPIK II';
          sub = levelString.replace('TOPIK II', '').trim();
      }
      // Nếu sub trống sau khi tách, có thể giữ nguyên level ban đầu làm sub hoặc để trống
      if (!sub) sub = levelString; // Hoặc sub = '';

      // Nếu không có TOPIK I/II, có thể không có major level
      // if (!major) major = 'TOPIK'; // Hoặc để trống

      return { major, sub };
  }
  // ---------------------------------------------

  return (
    <div className={styles.pageContainer}>
      {exams.length > 0 ? (
        sortedYears.map((year) => (
          <section key={year} className={styles.yearSection}>
            {/* Tiêu đề năm với highlight */}
            <h2 className={styles.yearTitleWrapper}>
                <span className={styles.yearTitle}>{year}</span>
            </h2>
            <div className={styles.examGrid}>
              {examsByYear[year].map((exam) => {
                // Phân tích level trước khi render card
                const { major: majorLevel, sub: subLevel } = parseLevel(exam.level);

                return (
                  <div key={exam.id} className={styles.examCard}>
                    <div className={styles.cardBody}>
                      <p className={styles.cardYearLabel}>{exam.year_description}</p>
                      <h3 className={styles.examNumber}>{exam.exam_number_description}</h3>
                      <p className={styles.examMainTitle}>한국어능력시험</p>
                      <div className={styles.examMeta}>
                        {/* Hiển thị Major Level nếu có */}
                        {majorLevel && <span className={styles.metaTag}>{majorLevel}</span>}
                        {/* Hiển thị Sub Level nếu có */}
                        {subLevel && <span className={styles.metaTag}>{subLevel}</span>}
                        {/* Hiển thị Skill */}
                        <span className={styles.metaTag}>{exam.skill}</span>
                      </div>
                    </div>
                    <div className={styles.cardFooter}>
                       {/* Hiển thị "음성지원" nếu has_audio là true */}
                       {exam.has_audio ? (
                           <span className={styles.audioSupport}>음성지원</span>
                       ) : (
                           /* Để trống hoặc thêm phần tử giữ chỗ nếu cần căn chỉnh */
                           <span></span>
                       )}
                       <Link href={`/exams/${exam.id}`} className={styles.solveLink}>
                         문제 풀기 <span className={styles.arrow}>→</span>
                       </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      ) : (
        <p className={styles.noExamsMessage}>
          데이터를 로드할 수 없거나 시험 데이터가 없습니다.
        </p>
      )}
    </div>
  );
}