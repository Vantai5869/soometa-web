import fs from 'fs/promises';
import path from 'path';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ExamViewerWrapper from '../../../components/ExamViewerWrapper';
import type { ExamData } from '../../../components/types';
import { Metadata, ResolvingMetadata } from 'next';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

// Interface cho props của Page component
interface ExamTakePageProps {
  params: Promise<{
    examId: string;
  }>;
}

// Đường dẫn đến file JSON chứa dữ liệu đề thi
const EXAMS_DATA_PATH: string = path.join(process.cwd(), 'data', 'data.json');

async function getAllExams(): Promise<ExamData[]> {
  try {
    const fileContent: string = await fs.readFile(EXAMS_DATA_PATH, 'utf-8');
    const allExamsData: ExamData[] = JSON.parse(fileContent);
    if (!Array.isArray(allExamsData)) {
        console.error("Lỗi getAllExams: Dữ liệu đọc từ file không phải là một mảng.");
        return [];
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
  { params }: { params: Promise<{ examId: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const examId = resolvedParams.examId; 
  const exam = await getExamData(examId);

  if (!exam) {
    return {
      title: 'Đề thi không tồn tại - TopikGo',
      description: 'Rất tiếc, đề thi bạn đang tìm kiếm không có trên Topikgo.com.',
      alternates: {
        canonical: `https://topikgo.com/exams/${examId}/take`,
      },
      robots: { 
        index: false,
        follow: true,
        nocache: true,
      },
    };
  }

  const title = `Làm bài thi ${exam.level} ${exam.skill} - ${exam.exam_number_description} (${exam.year_description}) - Topikgo`;
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

  const examUrl = `https://topikgo.com/exams/${examId}/take`;
  const imageUrl = `https://topikgo.com/topikgo-og-image.png`;

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
          alt: `Làm bài thi TOPIK ${exam.level} ${exam.skill} - ${exam.exam_number_description} tại Topikgo.com`,
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
export default async function ExamTakePage({ params }: ExamTakePageProps) {
  const resolvedParams = await params;
  const examId = resolvedParams.examId;
  const examData = await getExamData(examId);

  if (!examData) {
    notFound(); 
  }

  return (
    <div>
      {/* Breadcrumb Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center space-x-2 text-sm text-slate-500">
          <Link href="/exams" className="hover:text-slate-700 transition-colors">
            Danh sách đề thi
          </Link>
          <ChevronRightIcon className="h-4 w-4" />
          <Link href={`/exams/${examId}`} className="hover:text-slate-700 transition-colors">
            {examData.exam_number_description}
          </Link>
          <ChevronRightIcon className="h-4 w-4" />
          <span className="text-slate-700 font-medium">Làm bài</span>
        </nav>
      </div>
      
      <ExamViewerWrapper examData={examData} />
    </div>
  );
} 