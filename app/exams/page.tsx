// app/exams/page.tsx
import Link from 'next/link';
import fs from 'fs/promises';
import path from 'path';
// Không cần import CSS Module

// --- Interfaces (Giữ nguyên) ---
interface ExamData {
    id: string;
    year_description: string;
    exam_number_description: string;
    source: string;
    level: string;
    skill: string;
    has_audio?: boolean;
    instruction_groups: any[];
}

interface ExamListItem {
  id: string;
  year_description: string;
  exam_number_description: string;
  level: string;
  skill: string;
  has_audio: boolean;
}

// --- getExamList (Giữ nguyên) ---
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
      has_audio: exam.has_audio ?? false,
    }));
    return examList;
  } catch (error) {
    console.error("Error reading or parsing data.json:", error);
    return [];
  }
}

// --- Component Trang ---
export default async function ExamsPage() {
  const exams: ExamListItem[] = await getExamList();

  // Nhóm theo năm (Giữ nguyên)
  const examsByYear: { [year: string]: ExamListItem[] } = {};
  exams.forEach(exam => {
    const year = exam.year_description;
    if (!examsByYear[year]) {
      examsByYear[year] = [];
    }
    examsByYear[year].push(exam);
  });
  const sortedYears = Object.keys(examsByYear).sort((a, b) => parseInt(b) - parseInt(a));

  // Logic xử lý level (Giữ nguyên)
  const parseLevel = (levelString: string): { major: string; sub: string } => {
      let major = '';
      let sub = levelString;
      if (levelString.includes('TOPIK I') && !levelString.includes('TOPIK II')) {
          major = 'TOPIK I';
          sub = levelString.replace('TOPIK I', '').trim();
      } else if (levelString.includes('TOPIK II')) {
          major = 'TOPIK II';
          sub = levelString.replace('TOPIK II', '').trim();
      }
      if (!sub) sub = levelString;
      return { major, sub };
  }
  // ---------------------------------------------

  return (
    // Container trang - Nền trắng, padding ngang lớn
    <div className="min-h-screen bg-white px-8 md:px-16 lg:px-24 py-16 lg:py-20">
      <div className="max-w-7xl mx-auto">
        {exams.length > 0 ? (
          sortedYears.map((year) => (
            <section key={year} className="mb-16 last:mb-0">
              {/* Tiêu đề Năm - Đổi thành background xám nhạt, padding dọc lớn hơn */}
              <h2 className="inline-block bg-gray-100 text-gray-800 px-6 py-2.5 rounded-md font-bold text-2xl lg:text-3xl mb-10"> {/* Đã thay đổi */}
                {year}  
              </h2>
              {/* Grid đề thi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
                {examsByYear[year].map((exam) => {
                  const { major: majorLevel, sub: subLevel } = parseLevel(exam.level);

                  return (
                    // Thẻ Link - chỉ còn group và block
                    <Link
                      href={`/exams/${exam.id}`}
                      key={exam.id}
                      className="block group h-full"
                    >
                      <div
                        // Thẻ Card - Áp dụng bo góc và overflow tại đây
                        className="bg-white border border-gray-200 rounded-xl overflow-hidden h-full flex flex-col transition duration-200 ease-in-out group-hover:border-blue-300 group-hover:shadow-sm" /* Đã chuyển rounded-xl, overflow-hidden vào đây */
                      >
                        {/* Card Body */}
                        <div className="p-6 flex-grow">
                          <p className="text-xs text-gray-400 mb-2 block">
                            {exam.year_description}
                          </p>
                          <h3 className="text-lg font-semibold text-gray-800 mb-1">
                            {exam.exam_number_description}
                          </h3>
                          <p className="text-base font-semibold text-gray-800 mb-4">
                            한국어능력시험
                          </p>
                          {/* Meta Tags */}
                          <div className="flex flex-wrap gap-1.5 text-xs mt-3">
                            {majorLevel && <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md font-medium">{majorLevel}</span>}
                            {subLevel && <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md font-medium">{subLevel}</span>}
                            <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-600 border border-gray-200 rounded-md font-medium">{exam.skill}</span>
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="border-t border-gray-100 mt-auto px-6 py-4 flex justify-between items-center bg-white">
                           <span className="text-xs font-medium text-gray-500">
                            {exam.has_audio ? "음성지원" : ""}
                          </span>
                          <span className="inline-flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700 transition-colors duration-200">
                            문제 풀기
                            <svg className="ml-1.5 h-4 w-4 transition-transform duration-200 ease-in-out group-hover:translate-x-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                            </svg>
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))
        ) : (
           <p className="text-center text-gray-500 mt-12">
            데이터를 로드할 수 없거나 시험 데이터가 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}