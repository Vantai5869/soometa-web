// app/practice-by-type/page.tsx
import fs from 'fs/promises';
import path from 'path';
import PracticeByTypeClient from './PracticeByTypeClient';

// --- Định nghĩa Types (Giữ nguyên như trước) ---
export interface Option { id?: string; text?: string; image_src?: string; alt?: string; is_correct: boolean; }
export interface QuestionContent { type: string; value?: string; src?: string; alt?: string; items?: { marker: string, text: string }[]; main_passage?: string; sentence_to_insert?: string; }
export interface SharedContent extends QuestionContent {}
export interface Question { id: string; number: number; points: number; option_type?: string; content: QuestionContent; options: Option[] | null | undefined; question_audio_url?: string; }
export interface InstructionGroup { type: string; instruction: string; example?: any; questions: Question[] | null | undefined; shared_content?: SharedContent | null; group_audio_url?: string; }
export interface Exam { id: string; year_description: string; exam_number_description: string; source: string; level: string; skill: string; audio_url?: string; instruction_groups: InstructionGroup[] | null | undefined; }
export interface QuestionWithContext extends Question { examId: string; examLevel: string; examSkill: string; originalInstruction: string; }
// --- Kết thúc định nghĩa Types ---


// --- Hàm đọc và LỌC dữ liệu ---
async function getFilteredExamData(): Promise<Exam[]> {
  const EXCLUDED_IDS_PREFIX = ["96-", "35-", "36-"]; // Các ID cần loại bỏ (bắt đầu bằng)
  try {
    const filePath = path.join(process.cwd(), 'data', 'data.json');
    const jsonData = await fs.readFile(filePath, 'utf-8');
    const allExamsData: Exam[] = JSON.parse(jsonData);

    // Lọc bỏ các đề thi không mong muốn
    const filteredData = allExamsData.filter(exam =>
        exam && typeof exam.id === 'string' && !EXCLUDED_IDS_PREFIX.some(prefix => exam.id.startsWith(prefix))
    );

    return filteredData;
  } catch (error) {
    console.error("Lỗi đọc hoặc lọc file data.json:", error);
    return []; // Trả về mảng rỗng nếu lỗi
  }
}
// --- Kết thúc hàm đọc và lọc dữ liệu ---


// --- Server Component chính ---
export default async function PracticeByTypePage() {
  // Lấy dữ liệu ĐÃ LỌC
  const filteredExams = await getFilteredExamData();

  if (!filteredExams || filteredExams.length === 0) {
    return <div className="p-8 text-center text-red-600">Lỗi: Không thể tải hoặc không có dữ liệu đề thi phù hợp sau khi lọc.</div>;
  }

  // Truyền dữ liệu đã lọc sang Client Component
  return (
    <PracticeByTypeClient allExams={filteredExams} />
  );
}
// --- Kết thúc Server Component chính ---