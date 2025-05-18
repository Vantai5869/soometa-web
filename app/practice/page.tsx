// app/practice-by-type/page.tsx
import fs from 'fs/promises';
import path from 'path';
import PracticeByTypeClient from './PracticeByTypeClient';
import crypto, { DecipherGCM } from 'crypto'; // Thêm crypto

// --- Định nghĩa Types (Giữ nguyên như trước) ---
export interface Option { id?: string; text?: string; image_src?: string; alt?: string; is_correct: boolean; }
export interface QuestionContent { type: string; value?: string; src?: string; alt?: string; items?: { marker: string, text: string }[]; main_passage?: string; sentence_to_insert?: string; }
export interface SharedContent extends QuestionContent {}
export interface Question { id: string; number: number; points: number; option_type?: string; content: QuestionContent; options: Option[] | null | undefined; question_audio_url?: string; }
export interface InstructionGroup { type: string; instruction: string; example?: any; questions: Question[] | null | undefined; shared_content?: SharedContent | null; group_audio_url?: string; }
export interface Exam { id: string; year_description: string; exam_number_description: string; source: string; level: string; skill: string; audio_url?: string; instruction_groups: InstructionGroup[] | null | undefined; }
export interface QuestionWithContext extends Question { examId: string; examLevel: string; examSkill: string; originalInstruction: string; }
// --- Kết thúc định nghĩa Types ---

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


// --- Hàm đọc, GIẢI MÃ và LỌC dữ liệu ---
async function getFilteredExamData(): Promise<Exam[]> {
  const EXCLUDED_IDS_PREFIX = ["96-", "35-", "36-"]; // Các ID cần loại bỏ (bắt đầu bằng)

  // 1. ĐƯỜNG DẪN ĐẾN FILE ĐÃ MÃ HÓA CỦA BẠN
  // !!! QUAN TRỌNG: THAY ĐỔI ĐƯỜNG DẪN NÀY cho đúng với file mã hóa của bạn !!!
  // Ví dụ: nếu file mã hóa của bạn là 'data.enc' trong thư mục 'encrypted_data'
  const ENCRYPTED_FILE_PATH: string = path.join(process.cwd(), 'encrypted_data', 'data.enc');

  // 2. Lấy khóa giải mã từ biến môi trường
  const encryptionKey: string | undefined = process.env.ENCRYPTION_KEY;

  if (!encryptionKey) {
    console.error("Error in getFilteredExamData: ENCRYPTION_KEY không được thiết lập trong biến môi trường.");
    return []; // Trả về mảng rỗng nếu thiếu khóa
  }

  try {
    // 3. Đọc nội dung file đã mã hóa
    const encryptedFileContent: string = await fs.readFile(ENCRYPTED_FILE_PATH, 'utf-8');

    // 4. Giải mã dữ liệu
    const decryptedJsonString: string = decryptData(encryptedFileContent, encryptionKey);

    // 5. Parse chuỗi JSON đã giải mã
    const allExamsData: Exam[] = JSON.parse(decryptedJsonString) as Exam[];

    // Lọc bỏ các đề thi không mong muốn (logic lọc giữ nguyên)
    const filteredData = allExamsData.filter(exam =>
        exam && typeof exam.id === 'string' && !EXCLUDED_IDS_PREFIX.some(prefix => exam.id.startsWith(prefix))
    );

    return filteredData;
  } catch (error: any) {
    // Xử lý lỗi đọc file, giải mã, hoặc parse JSON
    console.error("Lỗi trong getFilteredExamData (đọc, giải mã, parse hoặc lọc):", error.message);
    return []; // Trả về mảng rỗng nếu lỗi
  }
}
// --- Kết thúc hàm đọc, giải mã và lọc dữ liệu ---


// --- Server Component chính (Logic giữ nguyên) ---
export default async function PracticeByTypePage() {
  // Lấy dữ liệu ĐÃ LỌC (và đã giải mã)
  const filteredExams = await getFilteredExamData();

  if (!filteredExams || filteredExams.length === 0) {
    return <div className="p-8 text-center text-red-600">Lỗi: Không thể tải hoặc không có dữ liệu đề thi phù hợp sau khi giải mã và lọc.</div>;
  }

  // Truyền dữ liệu đã lọc sang Client Component
  return (
    <PracticeByTypeClient allExams={filteredExams} />
  );
}
// --- Kết thúc Server Component chính ---