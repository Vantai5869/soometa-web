// app/exams/page.tsx
import Link from 'next/link';
import fs from 'fs/promises'; // Sử dụng fs/promises cho async/await
import path from 'path';
// Bỏ import crypto vì không còn dùng giải mã
// import crypto, { DecipherGCM } from 'crypto'; 

// --- Interfaces ---
interface ExamData {
  id: string; // Đảm bảo id là string hoặc number nhất quán với cách bạn dùng trong link
  year_description: string;
  exam_number_description: string;
  source?: string; // Có thể optional
  level: string;
  skill: string;
  audio_url?: boolean;
  // instruction_groups không cần thiết cho trang danh sách này, nhưng vẫn giữ trong ExamData nếu nó là cấu trúc đầy đủ
  instruction_groups?: any[];
  image_url?: string; // Thêm nếu bạn có ảnh cho mỗi đề thi (dùng cho metadata sau này)
  // Thêm các trường khác nếu ExamData của bạn có
}

interface ExamListItem {
  id: string;
  source?: string;
  year_description: string;
  exam_number_description: string;
  level: string;
  skill: string;
  audio_url: boolean;
}

// --- Bỏ hàm decryptData ---

// Đường dẫn đến file JSON chứa dữ liệu đề thi
const EXAMS_DATA_PATH: string = path.join(process.cwd(), 'data', 'data.json');

// --- Cập nhật getExamList để đọc từ file JSON ---
async function getExamList(): Promise<ExamListItem[]> {
  try {
    // Đọc nội dung file JSON
    const fileContent: string = await fs.readFile(EXAMS_DATA_PATH, 'utf-8');

    // Parse chuỗi JSON
    const allExamsData: ExamData[] = JSON.parse(fileContent);

    // Kiểm tra xem có phải là mảng không
    if (!Array.isArray(allExamsData)) {
      console.error("Lỗi getExamList: Dữ liệu từ exams.json không phải là một mảng.");
      return [];
    }

    // Map sang ExamListItem
    const examList: ExamListItem[] = allExamsData.map(exam => ({
      id: exam.id.toString(), // Đảm bảo id là string cho Link href
      year_description: exam.year_description,
      exam_number_description: exam.exam_number_description,
      source: exam.source || '', // Có thể là undefined, nên dùng || để đảm bảo là string
      level: exam.level,
      skill: exam.skill,
      audio_url: exam.audio_url ?? false,
    }));
    return examList;

  } catch (error: any) {
    console.error("Lỗi trong getExamList (đọc hoặc parse file exams.json):", error.message);
    return []; // Trả về mảng rỗng nếu có lỗi
  }
}

// --- Component Trang (Giữ nguyên logic hiển thị) ---
export default async function ExamsPage() {
  const exams: ExamListItem[] = await getExamList();
  // Nhóm theo năm
  const examsByYear: { [year: string]: ExamListItem[] } = {};
  exams.forEach(exam => {
    const year = exam.year_description;
    if (!examsByYear[year]) {
      examsByYear[year] = [];
    }
    examsByYear[year].push(exam);
  });

  // Sắp xếp năm theo thứ tự giảm dần
  const sortedYears = Object.keys(examsByYear).sort((a, b) => {
    const yearA = parseInt(a.match(/\d+/)?.[0] || "0", 10); // Trích xuất số từ chuỗi năm
    const yearB = parseInt(b.match(/\d+/)?.[0] || "0", 10);
    if (!isNaN(yearA) && !isNaN(yearB) && yearA !== yearB) {
      return yearB - yearA; // Sắp xếp số giảm dần
    }
    return b.localeCompare(a); // Nếu không phải số hoặc số bằng nhau, so sánh chuỗi
  });


  // Logic xử lý level
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
    if (!sub && major) sub = '';
    else if (!major && sub === levelString) sub = levelString;
    return { major, sub };
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 md:px-8 lg:px-16 xl:px-24 py-12 lg:py-16">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 md:mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 tracking-tight">
            Danh sách Đề thi TOPIK
          </h1>
          <p className="mt-3 text-lg text-slate-600 max-w-2xl mx-auto">
            Chọn một đề thi để xem thông tin chi tiết và bắt đầu luyện tập kỹ năng đọc và nghe của bạn.
          </p>
        </header>

        {exams.length > 0 ? (
          sortedYears.map((year) => (
            <section key={year} className="mb-12 md:mb-16 last:mb-0">
              <h2 className="inline-block bg-sky-100 text-sky-700 px-4 py-2 sm:px-6 sm:py-2.5 rounded-lg font-semibold text-xl sm:text-2xl lg:text-3xl mb-8 sm:mb-10 shadow-sm">
                {year}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-7">
                {examsByYear[year].map((exam) => {
                  const { major: majorLevel, sub: subLevel } = parseLevel(exam.level);

                  return (
                    <Link
                      href={`/exams/${exam.id}`} // exam.id đã được đảm bảo là string
                      key={exam.id}
                      className="block group h-full"
                    >
                      <div
                        className="bg-white border border-slate-200 rounded-xl overflow-hidden h-full flex flex-col transition-all duration-300 ease-in-out group-hover:border-sky-500 group-hover:shadow-xl group-hover:-translate-y-1"
                      >
                        {/* Khu vực nội dung chính của card: thêm items-center và text-center cho các phần tử con */}
                        <div className="p-5 md:p-6 flex-grow flex flex-col items-center"> {/* Căn giữa các khối con */}
                          <p className="text-xs text-slate-500 mb-1.5 block text-center"> {/* Căn giữa text */}
                            {exam.year_description}
                            {/* {exam.source ? `Nguồn: ${exam.source}`: ''} */}
                          </p>
                          <h3 className="text-md md:text-lg font-semibold text-slate-900 mb-2 leading-tight group-hover:text-sky-600 transition-colors duration-200 text-center"> {/* Căn giữa text */}
                            {exam.exam_number_description}
                          </h3>
                          {/* flex-grow sẽ cố gắng chiếm không gian dọc, text-center sẽ căn giữa nội dung bên trong */}
                          <p className="text-sm font-medium text-slate-600 mb-3 flex-grow text-center"> {/* Căn giữa text */}
                            {exam.source ? exam.source : ''}
                          </p>
                          {/* Căn giữa nhóm các thẻ tags */}
                          <div className="flex flex-wrap justify-center gap-2 text-xs mt-auto pt-3 border-t border-slate-100 w-full">
                            {majorLevel && <span className="inline-block px-2.5 py-1 bg-sky-100 text-sky-700 border border-sky-200 rounded-md font-medium">{majorLevel}</span>}
                            {subLevel && subLevel.trim() !== '' && <span className="inline-block px-2.5 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-md font-medium">{subLevel}</span>}
                            <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-md font-medium">{exam.skill}</span>
                          </div>
                        </div>

                        {/* Phần footer giữ nguyên, đã có justify-between */}
                        <div className="border-t border-slate-200 mt-auto px-5 md:px-6 py-3.5 md:py-4 flex justify-between items-center bg-slate-50 group-hover:bg-sky-50 transition-colors duration-200">
                          <span className={`text-xs font-medium ${exam.audio_url ? 'text-green-600' : 'text-amber-600'}`}> {/* Giữ nguyên logic exam.audio_url của bạn */}
                            {exam?.audio_url ? "Có Audio" : "Không có Audio"}
                          </span>
                          <span className="inline-flex items-center text-sm font-semibold text-sky-600 group-hover:text-sky-700 transition-colors duration-200">
                            Xem chi tiết
                            <svg className="ml-1.5 h-4 w-4 transition-transform duration-200 ease-in-out group-hover:translate-x-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
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
          <div className="text-center py-16">
            <svg className="mx-auto h-16 w-16 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-slate-800">Không tìm thấy đề thi nào</h3>
            <p className="mt-2 text-sm text-slate-500">
              Hiện tại chưa có dữ liệu đề thi. Vui lòng kiểm tra lại sau.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}