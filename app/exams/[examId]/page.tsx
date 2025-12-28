// app/exams/[examId]/page.tsx
import fs from 'fs/promises';
import path from 'path';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { ExamData } from '../../components/types';
import { Metadata, ResolvingMetadata } from 'next';
import { ClockIcon, AcademicCapIcon, SpeakerWaveIcon, DocumentTextIcon, PlayIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import CommentSection from '../../components/CommentSection';

// Interface cho props của Page component, params là Promise
interface ExamPageProps {
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
        canonical: `https://topikgo.com/exams/${examId}`,
      },
      robots: { 
        index: false,
        follow: true,
        nocache: true,
      },
    };
  }

  const title = `Thông tin đề thi ${exam.level} ${exam.skill} - ${exam.exam_number_description} (${exam.year_description}) - Topikgo`;
  const description = `Xem thông tin chi tiết về đề thi TOPIK ${exam.level} kỹ năng ${exam.skill} (${exam.exam_number_description} - ${exam.year_description}) trên Topikgo.com.`;
  
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
          alt: `Thông tin đề thi TOPIK ${exam.level} ${exam.skill} - ${exam.exam_number_description} tại Topikgo.com`,
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

// Hàm tính toán thời gian làm bài dựa trên level và skill
function getExamDuration(level: string, skill: string): string {
  const isTopik1 = level.includes('Ⅰ') || level.includes('I');
  const isTopik2 = level.includes('Ⅱ') || level.includes('II');

  if (isTopik1) {
    if (skill === '듣기' || skill.toLowerCase() === 'nghe') return '40 phút';
    if (skill === '읽기' || skill.toLowerCase() === 'đọc') return '60 phút';
  } else if (isTopik2) {
    if (skill === '듣기' || skill.toLowerCase() === 'nghe') return '60 phút';
    if (skill === '읽기' || skill.toLowerCase() === 'đọc') return '70 phút';
    if (skill === '쓰기' || skill.toLowerCase() === 'viết') return '50 phút';
  }
  
  return '60 phút';
}

// Hàm tính số câu hỏi
function getQuestionCount(examData: ExamData): number {
  if (!examData.instruction_groups) return 0;
  return examData.instruction_groups.reduce((total, group) => {
    return total + (group.questions?.length || 0);
  }, 0);
}

// Page component
export default async function ExamInfoPage({ params }: ExamPageProps) {
  const resolvedParams = await params;
  const examId = resolvedParams.examId;
  const examData = await getExamData(examId);

  if (!examData) {
    notFound(); 
  }

  const questionCount = getQuestionCount(examData);
  const examDuration = getExamDuration(examData.level, examData.skill);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-sm text-slate-500 mb-8">
          <Link href="/exams" className="hover:text-slate-700 transition-colors">
            Danh sách đề thi
          </Link>
          <ChevronRightIcon className="h-4 w-4" />
          <span className="text-slate-700 font-medium">{examData.exam_number_description}</span>
        </nav>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            {examData.exam_number_description}
          </h1>
          <p className="text-xl text-slate-600">
            {examData.year_description} • {examData.source || 'Đề thi chính thức'}
          </p>
        </div>

        {/* Exam Info Card */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-8">
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column - Basic Info */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">Thông tin đề thi</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <AcademicCapIcon className="h-6 w-6 text-blue-600" />
                      <div>
                        <p className="text-sm text-slate-500">Cấp độ</p>
                        <p className="font-semibold text-slate-900">{examData.level}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <DocumentTextIcon className="h-6 w-6 text-green-600" />
                      <div>
                        <p className="text-sm text-slate-500">Kỹ năng</p>
                        <p className="font-semibold text-slate-900">{examData.skill}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <ClockIcon className="h-6 w-6 text-purple-600" />
                      <div>
                        <p className="text-sm text-slate-500">Thời gian làm bài</p>
                        <p className="font-semibold text-slate-900">{examDuration}</p>
                      </div>
                    </div>

                    {examData.audio_url && (
                      <div className="flex items-center space-x-3">
                        <SpeakerWaveIcon className="h-6 w-6 text-orange-600" />
                        <div>
                          <p className="text-sm text-slate-500">Audio</p>
                          <p className="font-semibold text-green-600">Có sẵn</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Stats */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">Thống kê đề thi</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-blue-600">{questionCount}</p>
                      <p className="text-sm text-blue-700">Câu hỏi</p>
                    </div>
                    
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {examData.instruction_groups?.length || 0}
                      </p>
                      <p className="text-sm text-green-700">Phần thi</p>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-900 mb-2">Hướng dẫn làm bài</h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Đọc kỹ hướng dẫn trước khi bắt đầu</li>
                    <li>• Quản lý thời gian làm bài hiệu quả</li>
                    <li>• Có thể xem lại và sửa đáp án</li>
                    <li>• Kết quả sẽ được lưu sau khi hoàn thành</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link
            href={`/exams/${examId}/take`}
            className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors duration-200 transform hover:-translate-y-0.5"
          >
            <PlayIcon className="h-5 w-5 mr-2" />
            Bắt đầu làm bài
          </Link>
          
          <Link
            href="/exams"
            className="inline-flex items-center justify-center px-8 py-4 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors duration-200"
          >
            Quay lại danh sách
          </Link>
        </div>

        {/* Comments Section */}
        <CommentSection examId={examId} />
      </div>
    </div>
  );
}