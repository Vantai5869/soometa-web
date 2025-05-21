// types.ts
export interface Option {
    id?: string;
    text?: string;
    image_src?: string;
    alt?: string;
    is_correct: boolean; // Although not used in this render logic, keep for data integrity
}

export interface QuestionContent {
    type: string;
    value?: string; // For text, audio_prompt, instruction
    src?: string; // For image
    alt?: string; // For image
    items?: { marker: string, text: string }[]; // For ordering_task
    main_passage?: string; // For insertion_task
    sentence_to_insert?: string; // For insertion_task
}

export interface SharedContent extends QuestionContent {}

export interface Question {
    id: string;
    number: number;
    points: number;
    option_type?: string; // 'text' or 'image'
    content: QuestionContent;
    options: Option[] | null | undefined;
    question_audio_url?: string;
}

export interface InstructionGroup {
    type: string; // e.g., 'multiple_choice', 'ordering', 'insertion'
    instruction: string; // e.g., "[1~3] 다음을 듣고..."
    example?: any; // Structure not fully defined, keep as any for now
    questions: Question[] | null | undefined;
    shared_content?: SharedContent | null;
    group_audio_url?: string;
}

export interface Exam {
    id: string;
    year_description: string;
    exam_number_description: string;
    source: string;
    level: string;
    skill: string;
    audio_url?: string; // Main exam audio, not group audio
    instruction_groups: InstructionGroup[] | null | undefined;
}


// Interfaces used internally by the components
export interface ReactSelectOption {
    value: string;
    label: string;
}

export interface PracticeConfig {
    level: string;
    skill: string;
    examId: string;
    selectedInstructions: string[];
}

// Interface for a group enriched with exam context, used for display
export interface DisplayGroup extends InstructionGroup {
    examId: string;
    examLevel: string;
    examSkill: string;
}