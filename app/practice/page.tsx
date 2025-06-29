// app/practice-by-type/page.tsx
import fs from 'fs/promises';
import path from 'path';
import PracticeByTypeClient from './PracticeByTypeClient'; // Đảm bảo đường dẫn này đúng
import { Exam } from './types';
// Bỏ import crypto vì không còn dùng giải mã
// import crypto, { DecipherGCM } from 'crypto';

// // --- Định nghĩa Types (Giữ nguyên) ---
// export interface Option { id?: string; text?: string; image_src?: string; alt?: string; is_correct: boolean; }
// export interface QuestionContent { type: string; value?: string; src?: string; alt?: string; items?: { marker: string, text: string }[]; main_passage?: string; sentence_to_insert?: string; }
// export interface SharedContent extends QuestionContent {}
// export interface Question { id: string; number: number; points: number; option_type?: string; content: QuestionContent; options: Option[] | null | undefined; question_audio_url?: string; }
// export interface InstructionGroup { type: string; instruction: string; example?: any; questions: Question[] | null | undefined; shared_content?: SharedContent | null; group_audio_url?: string; }
// export interface Exam { 
//   id: string; 
//   year_description: string; 
//   exam_number_description: string; 
//   source?: string; // source có thể optional
//   level: string; 
//   skill: string; 
//   audio_url?: string; 
//   instruction_groups: InstructionGroup[] | null | undefined; 
//   // Thêm các trường khác nếu có trong dữ liệu JSON của bạn
// }
// export interface QuestionWithContext extends Question { 
//   examId: string; 
//   examLevel: string; 
//   examSkill: string; 
//   originalInstruction: string; 
// }
// --- Kết thúc định nghĩa Types ---

// --- Bỏ hàm decryptData ---

// Đường dẫn đến file JSON chứa dữ liệu đề thi
const EXAMS_DATA_PATH: string = path.join(process.cwd(), 'data', 'data.json');

// --- Hàm đọc và LỌC dữ liệu từ file JSON ---
async function getFilteredExamData(): Promise<Exam[]> {
  const EXCLUDED_IDS_PREFIX = [ "35-", "36-","37-"]; // Các ID cần loại bỏ (bắt đầu bằng)

  try {
    // Đọc nội dung file JSON
    const fileContent: string = await fs.readFile(EXAMS_DATA_PATH, 'utf-8');

    // Parse chuỗi JSON
    const allExamsData: Exam[] = JSON.parse(fileContent);

    // Kiểm tra xem có phải là mảng không
    if (!Array.isArray(allExamsData)) {
        console.error("Lỗi getFilteredExamData: Dữ liệu từ exams.json không phải là một mảng.");
        return [];
    }

    // Lọc bỏ các đề thi không mong muốn
    const filteredData = allExamsData.filter(exam =>
        exam && typeof exam.id === 'string' && // Đảm bảo exam và exam.id tồn tại và là string
        !EXCLUDED_IDS_PREFIX.some(prefix => exam.id.startsWith(prefix))
    );

    return filteredData;
  } catch (error: any) { // Sử dụng any hoặc unknown cho error trong JS thuần hoặc TS với noImplicitAny: false
    console.error("Lỗi trong getFilteredExamData (đọc, parse hoặc lọc file exams.json):", error.message);
    return []; // Trả về mảng rỗng nếu có lỗi
  }
}
// --- Kết thúc hàm đọc và lọc dữ liệu ---


// --- Server Component chính ---
export default async function PracticeByTypePage() {
  // Lấy dữ liệu ĐÃ LỌC (từ file JSON)
  const filteredExams = await getFilteredExamData();

  if (!filteredExams || filteredExams.length === 0) {
    return (
        <div className="container mx-auto p-8 min-h-screen flex flex-col items-center justify-center">
            <div className="text-center">
                <svg className="mx-auto h-16 w-16 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="mt-4 text-xl font-semibold text-red-700">Không Tải Được Dữ Liệu Đề Thi</h3>
                <p className="mt-2 text-base text-gray-600">
                    Không thể tải hoặc không có dữ liệu đề thi phù hợp sau khi lọc.
                    Vui lòng kiểm tra lại file <code className="bg-gray-200 px-1 rounded">data/exams.json</code> hoặc thử lại sau.
                </p>
            </div>
        </div>
    );
  }

  // Truyền dữ liệu đã lọc sang Client Component
  return (
    <PracticeByTypeClient allExams={filteredExams} />
  );
}
// --- Kết thúc Server Component chính ---