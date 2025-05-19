// app/exams/[examId]/page.tsx
import fs from 'fs/promises';
import path from 'path';
import { notFound } from 'next/navigation';
import ExamViewerWrapper from '../../components/ExamViewerWrapper'; // Điều chỉnh đường dẫn nếu cần
import type { ExamData } from '../../components/types'; // Điều chỉnh đường dẫn nếu cần
import crypto, { DecipherGCM } from 'crypto';
import { Metadata, ResolvingMetadata } from 'next';

// Interface này dành riêng cho ExamPage component của bạn nếu params là Promise
interface ExamPageSpecificProps {
  params: Promise<{
    examId: string;
  }>;
}

// --- Hàm giải mã (Giữ nguyên) ---
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

    let decrypted: string = decipher.update(encryptedDataVal.toString('hex'), 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error: any) {
    console.error("Lỗi giải mã nghiêm trọng trong hàm decryptData:", error.message);
    throw new Error(`Không thể giải mã dữ liệu. Chi tiết: ${error.message}`);
  }
}
// --- Kết thúc hàm giải mã ---

const ENCRYPTED_FILE_PATH: string = path.join(process.cwd(), 'encrypted_data', 'data.enc');

async function getAndDecryptAllExams(): Promise<ExamData[]> {
  const encryptionKey: string | undefined = process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    console.error("Error in getAndDecryptAllExams: ENCRYPTION_KEY không được thiết lập.");
    throw new Error("Lỗi cấu hình server: Thiếu khóa mã hóa.");
  }

  try {
    const encryptedFileContent: string = await fs.readFile(ENCRYPTED_FILE_PATH, 'utf-8');
    const decryptedJsonString: string = decryptData(encryptedFileContent, encryptionKey);
    const allExamsData: ExamData[] = JSON.parse(decryptedJsonString) as ExamData[];
    return allExamsData;
  } catch (error: any) {
    console.error("Error in getAndDecryptAllExams (reading, decrypting, or parsing):", error.message);
    throw new Error(`Không thể xử lý dữ liệu đề thi. Chi tiết: ${error.message}`);
  }
}

async function getExamData(examId: string): Promise<ExamData | null> {
  try {
    const allExamsData = await getAndDecryptAllExams();
    const exam = allExamsData.find(e => e.id === examId);
    return exam || null;
  } catch (error: any) {
    console.error(`Error getting data for exam ${examId}:`, error.message);
    return null;
  }
}

export async function generateStaticParams(): Promise<{ examId: string }[]> {
   try {
        const allExamsData = await getAndDecryptAllExams();
        return allExamsData.map(exam => ({ examId: exam.id }));
   } catch (error: any) {
        console.error("Error generating static params:", error.message);
        return [];
   }
}

// --- HÀM GENERATE METADATA CHO SEO ĐỘNG ---
// Next.js truyền params cho generateMetadata dưới dạng object trực tiếp
export async function generateMetadata(
  params: Promise<{
    examId: string;
  }>,
  // { params }: { params: { examId: string } }, // Kiểu dữ liệu chuẩn cho params trong generateMetadata
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params; // Bước 1: Await `params`
  const examId = resolvedParams.examId; 
  const exam = await getExamData(examId);

  if (!exam) {
    return {
      title: 'Đề thi không tồn tại - Topikgo',
      description: 'Rất tiếc, đề thi bạn đang tìm kiếm không có trên Topikgo.com.',
      alternates: {
        canonical: `https://topikgo.com/exams/${examId}`, // Dù không tìm thấy, vẫn nên có canonical
      },
    };
  }

  const title = `Luyện thi ${exam.level} ${exam.skill} - ${exam.exam_number_description} (${exam.year_description}) - Topikgo`;
  const description = `Luyện tập và chuẩn bị cho kỳ thi TOPIK ${exam.level} với đề thi kỹ năng ${exam.skill} (${exam.exam_number_description} - ${exam.year_description}) trên Topikgo.com. Tài liệu ôn thi TOPIK toàn diện, cập nhật và hiệu quả.`;
  
  let examKeywords = [
    `đề thi topik ${exam.exam_number_description.replace('제', '').replace('회', '').trim()}`,
    `topik ${exam.level.replace('TOPIK ', '').trim()}`,
    `luyện thi topik ${exam.skill}`,
    `topik ${exam.year_description.replace('년도 TOPIK', '').trim()}`,
    'topikgo',
    `${exam.exam_number_description} ${exam.skill}`,
    `${exam.source}`,
    `${exam.year_description}`
  ];
  examKeywords = [...new Set(examKeywords.filter(kw => kw && kw.trim() !== ''))];

  const examUrl = `https://topikgo.com/exams/${examId}`;
  const imageUrl = `https://topikgo.com/topikgo.png`; // Ảnh mặc định cho đề thi, bạn nên tạo ảnh này

  return {
    title: title,
    description: description,
    keywords: examKeywords,
    alternates: {
      canonical: examUrl,
    },
    openGraph: {
      title: title,
      description: description,
      url: examUrl,
      siteName: 'Topikgo',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `Đề thi ${exam.level} ${exam.skill} - ${exam.exam_number_description} tại Topikgo.com`,
        },
      ],
      locale: 'vi_VN',
      type: 'article', // Phù hợp cho trang chi tiết đề thi
      // Có thể thêm các thuộc tính article nếu cần
      // publishedTime: exam.publishDate, // Nếu có thông tin ngày đăng đề thi
      // authors: ['Topikgo Team'],
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [imageUrl],
    },
  };
}
// --- KẾT THÚC HÀM GENERATE METADATA ---


// Page component của bạn, giữ nguyên cách bạn dùng `await params` nếu cần
export default async function ExamPage({ params }: ExamPageSpecificProps) {
  const { examId } = await params;
  const examData = await getExamData(examId);

  if (!examData) {
    notFound();
  }

  return (
     <ExamViewerWrapper examData={examData} />
  );
}