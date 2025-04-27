// components/types.ts (hoặc @types/exam.d.ts)

// Các kiểu cơ bản
export type Skill = '읽기' | '듣기';
export type Level = 'TOPIK Ⅰ' | 'TOPIK Ⅱ';

// Lựa chọn trả lời
export interface Option {
  id: string; // ID thường có dạng a<QuestionNum>_<OptionNum>
  text?: string;
  image_src?: string;
  alt?: string;
  is_correct: boolean;
}

// Nội dung câu hỏi (mở rộng)
export interface ContentText { type: 'text'; value: string; }
export interface ContentImage { type: 'image'; src: string; alt: string; }
export interface ContentAudioPrompt { type: 'audio_prompt'; value?: string; }
export interface ContentInstruction { type: 'instruction'; value: string; }
export interface ContentOrderingTask { type: 'ordering_task'; items: Array<{ marker: string; text: string }>; }
export interface ContentInsertionTask { type: 'insertion_task'; sentence_to_insert: string; main_passage: string; markers: string[]; }

export type QuestionContent =
  | ContentText
  | ContentImage
  | ContentAudioPrompt
  | ContentInstruction
  | ContentOrderingTask
  | ContentInsertionTask;

// Câu hỏi
export interface Question {
  id: string; // ID thường có dạng test_<QuestionNum>
  number: number;
  points?: number;
  content: QuestionContent; // Sử dụng union type ở trên
  options: Option[];
  option_type?: 'image';
  fill_in_blank_marker?: string; // Ví dụ: '㉠', '(…)'
}

// Ví dụ
export interface Example {
  title: string;
  question_text: string;
  options: Array<{ text: string; is_correct: boolean }>;
}

// Nội dung dùng chung
export interface SharedContentText { type: 'text'; value: string; }
export interface SharedContentImage { type: 'image'; src: string; alt: string; }
export interface SharedContentTextInsertion { type: 'text_with_insertion_points'; value: string; markers: string[]; }

export type SharedContent =
    | SharedContentText
    | SharedContentImage
    | SharedContentTextInsertion;

// Nhóm hướng dẫn
export interface InstructionGroup {
  type: 'instruction_group';
  instruction: string;
  example?: Example;
  shared_content?: SharedContent;
  questions: Question[];
}

// Toàn bộ dữ liệu đề thi
export interface ExamData {
  id: string;
  year_description: string;
  exam_number_description: string;
  source: string;
  level: Level;
  skill: Skill;
  instruction_groups: InstructionGroup[];
}

// State quản lý câu trả lời
export interface SelectedAnswers {
  [questionNumber: number]: number | undefined; // key: question number, value: 0-based option index
}

// Map đáp án đúng
export interface CorrectAnswersMap {
    [questionNumber: number]: number; // key: question number, value: 0-based correct option index
}