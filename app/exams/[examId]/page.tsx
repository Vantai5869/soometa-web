// app/exams/[examId]/page.tsx
import fs from 'fs/promises'; // Sử dụng fs/promises để đọc file bất đồng bộ
import path from 'path';
import { notFound } from 'next/navigation';
import ExamViewerWrapper from '../../components/ExamViewerWrapper'; // Điều chỉnh đường dẫn nếu cần
import type { ExamData } from '../../components/types'; // Điều chỉnh đường dẫn nếu cần
import { Metadata, ResolvingMetadata } from 'next';

// Interface cho props của Page component
interface ExamPageProps {
  params: {
    examId: string; // params giờ là object trực tiếp
  };
}

// Đường dẫn đến file JSON chứa dữ liệu đề thi
// Đặt file exams.json trong thư mục data ở gốc dự án của bạn
const EXAMS_DATA_PATH: string = path.join(process.cwd(), 'data', 'data.json');

// Hàm mới để đọc tất cả dữ liệu đề thi từ file JSON
async function getAllExams(): Promise<ExamData[]> {
  try {
    const fileContent: string = await fs.readFile(EXAMS_DATA_PATH, 'utf-8');
    const allExamsData: ExamData[] = JSON.parse(fileContent);
    if (!Array.isArray(allExamsData)) {
        console.error("Lỗi getAllExams: Dữ liệu đọc từ file không phải là một mảng.");
        throw new Error("Định dạng dữ liệu đề thi không hợp lệ.");
    }
    return allExamsData;
  } catch (error: any) {
    console.error("Lỗi trong getAllExams (đọc hoặc parse file JSON):", error.message);
    // Nếu file không tồn tại hoặc không parse được, có thể trả về mảng rỗng hoặc throw lỗi tùy theo yêu cầu
    // throw new Error(`Không thể tải dữ liệu đề thi. Chi tiết: ${error.message}`);
    return []; // Trả về mảng rỗng để tránh crash build nếu file lỗi/thiếu
  }
}

// Hàm lấy dữ liệu cho một đề thi cụ thể
async function getExamData(examId: string): Promise<ExamData | null> {
  try {
    const allExamsData = await getAllExams();
    // Tìm exam dựa trên examId. Đảm bảo kiểu dữ liệu của e.id và examId khớp (cả hai là string)
    const exam = allExamsData.find(e => e.id.toString() === examId.toString());
    return exam || null;
  } catch (error: any) {
    console.error(`Lỗi khi lấy dữ liệu cho exam ${examId}:`, error.message);
    return null;
  }
}

// Hàm tạo các params tĩnh cho các trang đề thi (Build-time generation)
export async function generateStaticParams(): Promise<{ examId: string }[]> {
   try {
        const allExamsData = await getAllExams();
        // Đảm bảo exam.id là string
        return allExamsData.map(exam => ({ examId: exam.id.toString() }));
   } catch (error: any) {
        console.error("Lỗi khi tạo static params:", error.message);
        return []; // Trả về mảng rỗng nếu có lỗi để build không bị dừng
   }
}

// Hàm tạo metadata động cho SEO
export async function generateMetadata(
  { params }: { params: { examId: string } }, // params giờ là object trực tiếp
  parent: ResolvingMetadata
): Promise<Metadata> {
  const examId = params.examId; 
  const exam = await getExamData(examId);

  if (!exam) {
    return {
      title: 'Đề thi không tồn tại - TopikGo',
      description: 'Rất tiếc, đề thi bạn đang tìm kiếm không có trên Topikgo.com.',
      alternates: {
        canonical: `https://topikgo.com/exams/${examId}`,
      },
      robots: { // Thêm robots noindex nếu trang không tìm thấy
        index: false,
        follow: true,
        nocache: true,
      },
    };
  }

  // Tạo title, description, keywords từ dữ liệu exam (giữ nguyên logic của bạn)
  const title = `Luyện thi ${exam.level} ${exam.skill} - ${exam.exam_number_description} (${exam.year_description}) - Topikgo`;
  const description = `Luyện tập và chuẩn bị cho kỳ thi TOPIK ${exam.level} với đề thi kỹ năng ${exam.skill} (${exam.exam_number_description} - ${exam.year_description}) trên Topikgo.com. Tài liệu ôn thi TOPIK toàn diện, cập nhật và hiệu quả.`;
  
  let examKeywords = [
    `đề thi topik ${exam.exam_number_description.replace('제', '').replace('회', '').trim()}`,
    `topik ${exam.level.replace('TOPIK ', '').trim()}`,
    `luyện thi topik ${exam.skill}`,
    `topik ${exam.year_description.replace('년도 TOPIK', '').trim()}`,
    'topikgo',
    `${exam.exam_number_description} ${exam.skill}`,
    `${exam.source || ''}`, // Xử lý nếu source có thể undefined
    `${exam.year_description}`
  ].map(kw => kw.toLowerCase()); // Chuẩn hóa keywords
  examKeywords = [...new Set(examKeywords.filter(kw => kw && kw.trim() !== ''))];

  const examUrl = `https://topikgo.com/exams/${examId}`;
  // Sử dụng ảnh mặc định hoặc ảnh cụ thể của đề thi nếu có
  const imageUrl =`https://topikgo.com/topikgo-og-image.png`; // Cập nhật ảnh OG

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
      siteName: 'Topikgo.com', // Thêm .com nếu đó là tên site chính thức
      images: [
        {
          url: imageUrl,
          width: 1200, // Kích thước chuẩn cho OG image
          height: 630,
          alt: `Luyện thi TOPIK ${exam.level} ${exam.skill} - ${exam.exam_number_description} tại Topikgo.com`,
        },
      ],
      locale: 'vi_VN',
      type: 'article', // Hoặc 'website' nếu phù hợp hơn
      // publishedTime: exam.createdAt || new Date().toISOString(), // Ngày tạo/cập nhật đề thi
      // authors: ['Topikgo Team'],
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [imageUrl],
      // site: '@YourTwitterHandle', // Nếu có
      // creator: '@CreatorTwitterHandle',
    },
  };
}

// Page component
export default async function ExamPage({ params }: ExamPageProps) {
  // params giờ là object trực tiếp, không cần await
  const examId = params.examId;
  const examData = await getExamData(examId);

  if (!examData) {
    notFound(); // Next.js sẽ hiển thị trang 404 chuẩn của nó hoặc not-found.tsx của bạn
  }

  return (
     <ExamViewerWrapper examData={examData} />
  );
}