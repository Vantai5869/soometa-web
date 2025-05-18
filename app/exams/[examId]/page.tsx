// app/exams/[examId]/page.tsx
import fs from 'fs/promises';
import path from 'path';
import { notFound } from 'next/navigation';
import ExamViewerWrapper from '../../components/ExamViewerWrapper'; // Adjust path if needed
import type { ExamData } from '../../components/types'; // Adjust path if needed
import crypto, { DecipherGCM } from 'crypto'; // Thêm crypto

interface PageProps {
  params: {
    examId: string;
  };
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

// --- Đường dẫn file mã hóa và khóa (để nhất quán) ---
// !!! QUAN TRỌNG: THAY ĐỔI ĐƯỜNG DẪN NÀY cho đúng với file mã hóa của bạn !!!
const ENCRYPTED_FILE_PATH: string = path.join(process.cwd(), 'encrypted_data', 'data.enc');

async function getAndDecryptAllExams(): Promise<ExamData[]> {
  const encryptionKey: string | undefined = process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    console.error("Error in getAndDecryptAllExams: ENCRYPTION_KEY không được thiết lập.");
    throw new Error("Lỗi cấu hình server: Thiếu khóa mã hóa."); // Ném lỗi để hàm gọi có thể xử lý
  }

  try {
    const encryptedFileContent: string = await fs.readFile(ENCRYPTED_FILE_PATH, 'utf-8');
    const decryptedJsonString: string = decryptData(encryptedFileContent, encryptionKey);
    const allExamsData: ExamData[] = JSON.parse(decryptedJsonString) as ExamData[];
    return allExamsData;
  } catch (error: any) {
    // Gộp lỗi đọc file, giải mã, parse JSON
    console.error("Error in getAndDecryptAllExams (reading, decrypting, or parsing):", error.message);
    throw new Error(`Không thể xử lý dữ liệu đề thi. Chi tiết: ${error.message}`); // Ném lỗi
  }
}


async function getExamData(examId: string): Promise<ExamData | null> {
  try {
    const allExamsData = await getAndDecryptAllExams();
    const exam = allExamsData.find(e => e.id === examId);
    return exam || null;
  } catch (error: any) { // Bắt lỗi từ getAndDecryptAllExams
    console.error(`Error getting data for exam ${examId}:`, error.message);
    return null; // Trả về null nếu có lỗi ở tầng trên
  }
}

export async function generateStaticParams(): Promise<{ examId: string }[]> {
   try {
        const allExamsData = await getAndDecryptAllExams();
        return allExamsData.map(exam => ({ examId: exam.id }));
   } catch (error: any) { // Bắt lỗi từ getAndDecryptAllExams
        console.error("Error generating static params:", error.message);
        return []; // Trả về mảng rỗng nếu có lỗi
   }
}

export default async function ExamPage({ params }: PageProps) {
  const { examId } = params;
  const examData = await getExamData(examId);

  if (!examData) {
    // notFound() sẽ render trang 404 mặc định của Next.js
    // hoặc trang not-found.tsx tùy chỉnh trong cùng segment (nếu có)
    notFound();
  }

  return (
     <ExamViewerWrapper examData={examData} />
  );
}