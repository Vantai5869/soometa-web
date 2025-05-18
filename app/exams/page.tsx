// app/exams/page.tsx
import Link from 'next/link';
import fs from 'fs/promises'; // Sử dụng fs/promises cho async/await
import path from 'path';
import crypto, { DecipherGCM } from 'crypto'; // Thêm crypto

// --- Interfaces (Giữ nguyên) ---
interface ExamData {
    id: string;
    year_description: string;
    exam_number_description: string;
    source: string;
    level: string;
    skill: string;
    has_audio?: boolean;
    instruction_groups: any[]; // Bạn có thể định nghĩa kiểu cụ thể hơn cho instruction_groups nếu muốn
}

interface ExamListItem {
  id: string;
  year_description: string;
  exam_number_description: string;
  level: string;
  skill: string;
  has_audio: boolean;
}

// --- Hàm giải mã (Thêm vào đây hoặc import từ utils) ---
function decryptData(encryptedString: string, keyHex: string): string {
  try {
    const key: Buffer = Buffer.from(keyHex, 'hex');
    const parts: string[] = encryptedString.split(':');
    if (parts.length !== 3) {
      console.error('Lỗi giải mã: Định dạng dữ liệu mã hóa không hợp lệ. Cần iv:authTag:data');
      throw new Error('Định dạng dữ liệu mã hóa không hợp lệ.');
    }
    const iv: Buffer = Buffer.from(parts[0], 'hex');
    const authTag: Buffer = Buffer.from(parts[1], 'hex');
    const encryptedDataVal: Buffer = Buffer.from(parts[2], 'hex');

    const decipher: DecipherGCM = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted: string = decipher.update(encryptedDataVal, undefined, 'utf8'); // Sửa lỗi ở đây
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error: any) {
    console.error("Lỗi giải mã nghiêm trọng trong hàm decryptData:", error.message);
    throw new Error(`Không thể giải mã dữ liệu. Khóa có thể sai hoặc dữ liệu đã bị hỏng/thay đổi. Chi tiết: ${error.message}`);
  }
}
// --- Kết thúc hàm giải mã ---


// --- getExamList (Cập nhật để giải mã dữ liệu) ---
async function getExamList(): Promise<ExamListItem[]> {
  // 1. ĐƯỜNG DẪN ĐẾN FILE ĐÃ MÃ HÓA CỦA BẠN
  // !!! QUAN TRỌNG: THAY ĐỔI ĐƯỜNG DẪN NÀY cho đúng với file mã hóa của bạn !!!
  // Ví dụ: nếu file mã hóa của bạn là 'data.enc' trong thư mục 'encrypted_data'
  const ENCRYPTED_FILE_PATH: string = path.join(process.cwd(), 'encrypted_data', 'data.enc');

  // 2. Lấy khóa giải mã từ biến môi trường
  const encryptionKey: string | undefined = process.env.ENCRYPTION_KEY;

  if (!encryptionKey) {
    console.error("Error in getExamList: ENCRYPTION_KEY không được thiết lập trong biến môi trường.");
    return []; // Trả về mảng rỗng nếu thiếu khóa
  }

  try {
    // 3. Đọc nội dung file đã mã hóa
    const encryptedFileContent: string = await fs.readFile(ENCRYPTED_FILE_PATH, 'utf-8');

    // 4. Giải mã dữ liệu
    const decryptedJsonString: string = decryptData(encryptedFileContent, encryptionKey);

    // 5. Parse chuỗi JSON đã giải mã
    const allExamsData: ExamData[] = JSON.parse(decryptedJsonString) as ExamData[];

    // Logic map sang ExamListItem giữ nguyên
    const examList: ExamListItem[] = allExamsData.map(exam => ({
      id: exam.id,
      year_description: exam.year_description,
      exam_number_description: exam.exam_number_description,
      level: exam.level,
      skill: exam.skill,
      has_audio: exam.has_audio ?? false, // Giữ nullish coalescing
    }));
    return examList;

  } catch (error: any) {
    // Xử lý lỗi đọc file, giải mã, hoặc parse JSON
    console.error("Error in getExamList (reading, decrypting, or parsing encrypted data):", error.message);
    return []; // Trả về mảng rỗng nếu có lỗi
  }
}

// --- Component Trang (Giữ nguyên logic hiển thị) ---
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
  // Sắp xếp năm theo thứ tự giảm dần
  const sortedYears = Object.keys(examsByYear).sort((a, b) => {
    // Cố gắng parse thành số để so sánh, nếu không phải số thì so sánh chuỗi
    const yearA = parseInt(a, 10);
    const yearB = parseInt(b, 10);
    if (!isNaN(yearA) && !isNaN(yearB)) {
        return yearB - yearA;
    }
    return b.localeCompare(a); // Fallback cho trường hợp không phải số (ví dụ "Năm Đặc Biệt")
  });


  // Logic xử lý level (Giữ nguyên)
  const parseLevel = (levelString: string): { major: string; sub: string } => {
      let major = '';
      let sub = levelString; // Mặc định sub là toàn bộ chuỗi
      if (levelString.includes('TOPIK I') && !levelString.includes('TOPIK II')) {
          major = 'TOPIK I';
          sub = levelString.replace('TOPIK I', '').trim();
      } else if (levelString.includes('TOPIK II')) {
          major = 'TOPIK II';
          sub = levelString.replace('TOPIK II', '').trim();
      }
      // Nếu sau khi replace, sub rỗng, thì có thể level chỉ là "TOPIK I" hoặc "TOPIK II"
      // Hoặc nếu không khớp 'TOPIK I'/'TOPIK II', sub vẫn là levelString ban đầu.
      if (!sub && major) sub = ''; // Nếu chỉ có major level, sub là rỗng.
      else if (!major && sub === levelString) sub = levelString; // Nếu không có major, sub là chính nó.

      return { major, sub };
  }
  // ---------------------------------------------

  return (
    <div className="min-h-screen bg-white px-4 sm:px-6 md:px-8 lg:px-16 xl:px-24 py-12 lg:py-16"> {/* Điều chỉnh padding cho các màn hình */}
      <div className="max-w-7xl mx-auto">
        {exams.length > 0 ? (
          sortedYears.map((year) => (
            <section key={year} className="mb-12 md:mb-16 last:mb-0">
              <h2 className="inline-block bg-gray-100 text-gray-800 px-4 py-2 sm:px-6 sm:py-2.5 rounded-md font-bold text-xl sm:text-2xl lg:text-3xl mb-8 sm:mb-10">
                {year}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-7"> {/* Thêm responsive cho lg và xl */}
                {examsByYear[year].map((exam) => {
                  const { major: majorLevel, sub: subLevel } = parseLevel(exam.level);

                  return (
                    <Link
                      href={`/exams/${exam.id}`}
                      key={exam.id}
                      className="block group h-full"
                    >
                      <div
                        className="bg-white border border-gray-200 rounded-xl overflow-hidden h-full flex flex-col transition duration-200 ease-in-out group-hover:border-blue-400 group-hover:shadow-lg" /* Tăng cường hiệu ứng hover */
                      >
                        <div className="p-5 md:p-6 flex-grow"> {/* Điều chỉnh padding */}
                          <p className="text-xs text-gray-500 mb-1.5 block"> {/* Giảm margin */}
                            {exam.year_description}
                          </p>
                          <h3 className="text-md md:text-lg font-semibold text-gray-900 mb-1 leading-tight group-hover:text-blue-600"> {/* Thay đổi màu khi hover */}
                            {exam.exam_number_description}
                          </h3>
                          <p className="text-sm md:text-base font-medium text-gray-700 mb-3"> {/* Giảm kích thước font */}
                            한국어능력시험
                          </p>
                          <div className="flex flex-wrap gap-1.5 text-xs mt-auto"> {/* Đẩy tag xuống dưới nếu có thể */}
                            {majorLevel && <span className="inline-block px-2 py-0.5 sm:px-2.5 sm:py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md font-medium">{majorLevel}</span>}
                            {subLevel && subLevel.trim() !== '' && <span className="inline-block px-2 py-0.5 sm:px-2.5 sm:py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-md font-medium">{subLevel}</span>} {/* Thêm màu khác và kiểm tra subLevel rỗng */}
                            <span className="inline-block px-2 py-0.5 sm:px-2.5 sm:py-1 bg-gray-100 text-gray-600 border border-gray-200 rounded-md font-medium">{exam.skill}</span>
                          </div>
                        </div>

                        <div className="border-t border-gray-200 mt-auto px-5 md:px-6 py-3 md:py-4 flex justify-between items-center bg-gray-50 group-hover:bg-gray-100"> {/* Thay đổi màu nền footer khi hover */}
                           <span className="text-xs font-medium text-gray-600">
                            {exam.has_audio ? "음성지원" : "음성 없음"} {/* Rõ ràng hơn khi không có audio */}
                          </span>
                          <span className="inline-flex items-center text-sm font-semibold text-blue-600 group-hover:text-blue-700 transition-colors duration-200">
                            문제 풀기
                            <svg className="ml-1.5 h-4 w-4 transition-transform duration-200 ease-in-out group-hover:translate-x-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"> {/* Giảm translate-x */}
                               <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /> {/* Thay đổi icon mũi tên */}
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
           <div className="text-center py-16"> {/* Thêm padding cho thông báo lỗi */}
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-sm font-semibold text-gray-900">시험 데이터 없음</h3>
            <p className="mt-1 text-sm text-gray-500">
              데이터를 로드할 수 없거나 현재 시험 데이터가 없습니다. 나중에 다시 시도해 주세요.
            </p>
           </div>
        )}
      </div>
    </div>
  );
}