// app/exams/[examId]/page.tsx
import fs from 'fs/promises';
import path from 'path';
import { notFound } from 'next/navigation';
import ExamViewerWrapper from '../../components/ExamViewerWrapper'; // Điều chỉnh đường dẫn nếu cần
import type { ExamData } from '../../components/types'; // Điều chỉnh đường dẫn nếu cần
import { Metadata, ResolvingMetadata } from 'next';

// Interface cho props của Page component, params là Promise
interface ExamPageProps {
  params: Promise<{ // <<<< ĐẶT LẠI THÀNH PROMISE THEO YÊU CẦU
    examId: string;
  }>;
}

// Đường dẫn đến file JSON chứa dữ liệu đề thi
// Đảm bảo file này là 'data.json' hoặc 'exams.json' tùy theo file thực tế của bạn
const EXAMS_DATA_PATH: string = path.join(process.cwd(), 'data', 'data.json'); // GIỮ NGUYÊN 'data.json' như code bạn cung cấp

async function getAllExams(): Promise<ExamData[]> {
  try {
    const fileContent: string = await fs.readFile(EXAMS_DATA_PATH, 'utf-8');
    const allExamsData: ExamData[] = JSON.parse(fileContent);
    if (!Array.isArray(allExamsData)) {
        console.error("Lỗi getAllExams: Dữ liệu đọc từ file không phải là một mảng.");
        // throw new Error("Định dạng dữ liệu đề thi không hợp lệ."); // Cân nhắc throw lỗi để build fail nếu dữ liệu lỗi
        return []; // Hoặc trả về mảng rỗng để build không bị dừng
    }
    return allExamsData;
  } catch (error: any) {
    console.error("Lỗi trong getAllExams (đọc hoặc parse file JSON):", error.message);
    return []; 
  }
}

async function getExamData(examId: string): Promise<ExamData | null> {
  try {
    const allExamsData = await getAllExams();
    const exam = allExamsData.find(e => e.id.toString() === examId.toString());
    return exam || null;
  } catch (error: any) {
    console.error(`Lỗi khi lấy dữ liệu cho exam ${examId}:`, error.message);
    return null;
  }
}

export async function generateStaticParams(): Promise<{ examId: string }[]> {
   try {
        const allExamsData = await getAllExams();
        return allExamsData.map(exam => ({ examId: exam.id.toString() }));
   } catch (error: any) {
        console.error("Lỗi khi tạo static params:", error.message);
        return []; 
   }
}

export async function generateMetadata(
  { params }: { params: Promise<{ examId: string }> }, // <<<< ĐẶT LẠI THÀNH PROMISE
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params; // <<<< THÊM AWAIT
  const examId = resolvedParams.examId; 
  const exam = await getExamData(examId);

  if (!exam) {
    return {
      title: 'Đề thi không tồn tại - TopikGo',
      description: 'Rất tiếc, đề thi bạn đang tìm kiếm không có trên Topikgo.com.',
      alternates: {
        canonical: `https://topikgo.com/exams/${examId}`,
      },
      robots: { 
        index: false,
        follow: true,
        nocache: true,
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
    `${exam.source || ''}`, 
    `${exam.year_description}`
  ].map(kw => kw.toLowerCase());
  examKeywords = [...new Set(examKeywords.filter(kw => kw && kw.trim() !== ''))];

  const examUrl = `https://topikgo.com/exams/${examId}`;
  const imageUrl = `https://topikgo.com/topikgo-og-image.png`; // Giả sử bạn có trường image_url trong ExamData

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
      siteName: 'Topikgo.com',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `Luyện thi TOPIK ${exam.level} ${exam.skill} - ${exam.exam_number_description} tại Topikgo.com`,
        },
      ],
      locale: 'vi_VN',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [imageUrl],
    },
  };
}

// Page component
export default async function ExamPage({ params }: ExamPageProps) {
  const resolvedParams = await params; // <<<< THÊM AWAIT
  const examId = resolvedParams.examId;
  const examData = await getExamData(examId);

  if (!examData) {
    notFound(); 
  }

  return (
     <ExamViewerWrapper examData={examData} />
  );
}