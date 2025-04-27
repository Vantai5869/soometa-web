// src/app/practice/exam/[examId]/page.tsx
import Question from './components/Question';
import NavigationButtons from './components/NavigationButtons';
import styles from './page.module.css';

interface Option {
  id: string;
  text: string;
  isCorrect?: boolean; // Tùy chọn
}

interface QuestionType {
  id: string;
  text: string;
  options: Option[];
  explanation?: string; // Tùy chọn
}

interface ExamDetail {
  id: string;
  title: string;
  questions: QuestionType[];
  // Thêm các thuộc tính khác của đề thi chi tiết
}

const DUMMY_EXAM_DATA: ExamDetail[] = [
  {
    id: '1',
    title: 'TOPIK I - Lần 1',
    questions: [
      {
        id: 'q1-1',
        text: '다음 그림을 보고 알맞은 단어를 고르십시오.',
        options: [
          { id: 'o1-1', text: '학교' },
          { id: 'o1-2', text: '선생님' },
          { id: 'o1-3', text: '책상' },
          { id: 'o1-4', text: '의자' },
        ],
      },
      {
        id: 'q1-2',
        text: '빈칸에 알맞은 조사를 고르십시오. 저는 ( ) 학생입니다.',
        options: [
          { id: 'o2-1', text: '이' },
          { id: 'o2-2', text: '가' },
          { id: 'o2-3', text: '은' },
          { id: 'o2-4', text: '를' },
        ],
      },
      // Thêm các câu hỏi khác cho đề thi số 1
    ],
  },
  {
    id: '2',
    title: 'TOPIK I - Lần 2',
    questions: [
      {
        id: 'q2-1',
        text: '다음 그림에 대한 설명으로 알맞은 것을 고르십시오.',
        options: [
          { id: 'o3-1', text: '여자가 책을 읽고 있습니다.' },
          { id: 'o3-2', text: '남자가 커피를 마시고 있습니다.' },
          { id: 'o3-3', text: '아이들이 운동장에서 뛰어놀고 있습니다.' },
          { id: 'o3-4', text: '선생님이 학생들에게 가르치고 있습니다.' },
        ],
      },
      // Thêm các câu hỏi khác cho đề thi số 2
    ],
  },
  {
    id: '3',
    title: 'TOPIK II - Lần 1',
    questions: [
      {
        id: 'q3-1',
        text: '(가) 오늘 날씨가 참 좋네요. (나) 네, ( ) 기분이 정말 상쾌해요.',
        options: [
          { id: 'o4-1', text: '그래서' },
          { id: 'o4-2', text: '그러면' },
          { id: 'o4-3', text: '덕분에' },
          { id: 'o4-4', text: '게다가' },
        ],
      },
      // Thêm các câu hỏi khác cho đề thi số 3
    ],
  },
  {
    id: '4',
    title: 'TOPIK II - Lần 2',
    questions: [
      {
        id: 'q4-1',
        text: '다음 글의 주제로 가장 알맞은 것을 고르십시오.',
        options: [
          { id: 'o5-1', text: '스마트폰 사용의 장점' },
          { id: 'o5-2', text: '스마트폰 중독의 심각성' },
          { id: 'o5-3', text: '스마트폰 구매 시 유의사항' },
          { id: 'o5-4', text: '현대인의 스마트폰 사용 실태' },
        ],
      },
      // Thêm các câu hỏi khác cho đề thi số 4
    ],
  },
  {
    id: '5',
    title: 'TOPIK I - Đặc biệt',
    questions: [
      {
        id: 'q5-1',
        text: '다음 단어와 의미가 비슷한 것을 고르십시오: 크다',
        options: [
          { id: 'o6-1', text: '작다' },
          { id: 'o6-2', text: '넓다' },
          { id: 'o6-3', text: '높다' },
          { id: 'o6-4', text: '많다' },
        ],
      },
      // Thêm các câu hỏi khác cho đề thi số 5
    ],
  },
];

interface ExamDetailPageProps {
  params: {
    examId: string;
  };
}

export default function ExamDetailPage({ params }: ExamDetailPageProps) {
  const { examId } = params;
  const exam = DUMMY_EXAM_DATA.find((exam) => exam.id === examId);

  if (!exam) {
    return <div>Đề thi không tồn tại.</div>;
  }

  return (
    <div className={styles.container}>
      <h1>{exam.title}</h1>
      {exam.questions.map((question, index) => (
        <Question key={question.id} question={question} questionNumber={index + 1} />
      ))}
      <NavigationButtons />
      {/* Thêm các chức năng khác như nộp bài, xem kết quả sau */}
    </div>
  );
}