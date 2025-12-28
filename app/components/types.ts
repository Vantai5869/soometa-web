// components/types.ts

export type Skill = '읽기' | '듣기';
export type Level = 'TOPIK Ⅰ' | 'TOPIK Ⅱ';

export interface Option {
  id: string;
  text?: string;
  image_src?: string;
  alt?: string;
  is_correct: boolean;
}

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

export interface Question {
  id: string;
  number: number;
  points?: number;
  content: QuestionContent;
  options: Option[];
  option_type?: 'image';
  fill_in_blank_marker?: string;
  question_audio_url?: string;
}

export interface Example {
  title: string;
  question_text: string;
  options: Array<{ text: string; is_correct: boolean }>;
}

export interface SharedContentText { type: 'text'; value: string; }
export interface SharedContentImage { type: 'image'; src: string; alt: string; }
export interface SharedContentTextInsertion { type: 'text_with_insertion_points'; value: string; markers: string[]; }

export type SharedContent =
    | SharedContentText
    | SharedContentImage
    | SharedContentTextInsertion;

export interface InstructionGroup {
  type: 'instruction_group';
  instruction: string;
  example?: Example;
  shared_content?: SharedContent;
  questions: Question[]; // Luôn là mảng Question
  group_audio_url?: string;
}

// Bỏ duration_minutes
export interface ExamData {
  audio_url: string | undefined;
  id: string;
  year_description: string;
  exam_number_description: string;
  source: string;
  level: Level;
  skill: Skill;
  instruction_groups: InstructionGroup[]; // Luôn là mảng InstructionGroup
}

export interface SelectedAnswers {
  [questionNumber: number]: number | undefined;
}

export interface CorrectAnswersMap {
    [questionNumber: number]: number; // Luôn là number nếu tồn tại key
}

// Type cho danh sách đề thi
export interface ExamListItem {
    id: string;
    year_description: string;
    exam_number_description: string;
    level: Level;
    skill: Skill;
}

