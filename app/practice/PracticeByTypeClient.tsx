'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Select, { MultiValue } from 'react-select';
import DOMPurify from 'dompurify';
import EnhancedTranscriptPlayer from '../components/EnhancedTranscriptPlayer';

// --- Định nghĩa Types ---
export interface Option { id?: string; text?: string; image_src?: string; alt?: string; is_correct: boolean; }
export interface QuestionContent { type: string; value?: string; src?: string; alt?: string; items?: { marker: string, text: string }[]; main_passage?: string; sentence_to_insert?: string; }
export interface SharedContent extends QuestionContent {}
export interface Question { id: string; number: number; points: number; option_type?: string; content: QuestionContent; options: Option[] | null | undefined; question_audio_url?: string; }
export interface InstructionGroup { type: string; instruction: string; example?: any; questions: Question[] | null | undefined; shared_content?: SharedContent | null; group_audio_url?: string; }
export interface Exam { id: string; year_description: string; exam_number_description: string; source: string; level: string; skill: string; audio_url?: string; instruction_groups: InstructionGroup[] | null | undefined; }

interface ReactSelectOption { value: string; label: string; }
interface PracticeConfig { level: string; skill: string; examId: string; selectedInstructions: string[]; }
interface DisplayGroup extends InstructionGroup { examId: string; examLevel: string; examSkill: string; }

interface PracticeByTypeClientProps {
    allExams: Exam[] | null | undefined;
}

// --- HARDCODED INSTRUCTIONS DATA ---
const hardcodedInstructions: { [level: string]: { [skill: string]: string[] } } = {
  'TOPIK Ⅱ': {
    '듣기': [
      "[1~3] 다음을 듣고 가장 알맞은 그림 또는 그래프를 고르십시오.",
      "[4~8] 다음을 듣고 이어질 수 있는 말로 가장 알맞은 것을 고르십시오.",
      "[9~12] 다음을 듣고 여자가 이어서 할 hành động으로 가장 알맞은 것을 고르십시오.",
      "[13~16] 다음을 듣고 들은 내용과 같은 것을 고르십시오.",
      "[17~20] 다음을 듣고 남자의 중심 생각으로 가장 알맞은 것을 고르십시오.",
      "[21~36] 다음을 듣고 물음에 답하십시오.",
      "[37~50] 다음은 (교양 프로그램/강연/다큐멘터리)입니다. 잘 듣고 물음에 답하십시오."
    ],
    '읽기': [
      "[1~2] ( )에 들어갈 말로 가장 알맞은 것을 고르십시오.",
      "[3~4] 밑줄 친 부분과 의미가 가장 비슷한 것을 고르십시오.",
      "[5~8] 다음은 무엇에 대한 글인지 고르십시오.",
      "[9~12] 다음 글 hoặc 그래프의 내용과 같은 것을 고르십시오.",
      "[13~15] 다음을 순서에 맞게 배열한 것을 고르십시오.",
      "[16~18] ( )에 들어갈 말로 가장 알맞은 것을 고르십시오.",
      "[19~24] 다음을 읽고 물음 với 답하십시오.",
      "[25~27] 다음 신문 기사의 제목을 가장 잘 설명한 것을 고르십시오.",
      "[28~31] ( )에 들어갈 말로 가장 알맞은 것을 고르십시오.",
      "[32~34] 다음을 읽고 글의 내용과 같은 것을 고르십시오.",
      "[35~38] 다음을 읽고 글의 주제로 가장 알맞은 것을 고르십시오.",
      "[39~41] 주어진 문장이 들어갈 곳으로 가장 알맞은 것을 고르십시오.",
      "[42~47] 다음을 읽고 물음에 답하십시오.",
      "[48~50] 다음을 đọc고 물음에 답하십시오."
    ]
  },
  'TOPIK Ⅰ': {
    '듣기': [
      "[1~4] 다음을 듣고 <보기>와 같이 물음에 맞는 대답을 고르십시오.",
      "[5~6] 다음을 듣고 <보기>와 같이 이어지는 말을 고르십시오.",
      "[7~10] 여기는 어디입니까? <보기>와 같이 알맞은 것을 고르십시오.",
      "[11~14] 다음은 무엇에 대해 말하고 있습니까? <보기>와 같이 알맞은 것을 고르십시오.",
      "[15~16] 다음 대화를 듣고 알맞은 그림을 고르십시오.",
      "[17~21] 다음을 듣고 <보기>와 같이 대화 내용과 같은 것을 고르십시오.",
      "[22~24] 다음을 듣고 여자의 중심 생각을 고르십시오.",
      "[25~30] 다음을 듣고 물음에 답하십시오."
    ],
    '읽기': [
      "[31~33] 무엇에 대한 이야기입니까? <보기>와 같이 알맞은 것을 고르십시오.",
      "[34~39] <보기>와 같이 ( )에 들어갈 말로 nhất 알맞은 것을 고르십시오.",
      "[40~42] 다음을 읽고 맞지 않는 것을 고르십시오.",
      "[43~45] 다음을 읽고 내용이 같은 것을 고르십시오.",
      "[46~48] 다음을 읽고 중심 생각을 고르십시오.",
      "[49~56] 다음을 읽고 물음에 답하십시오.",
      "[57~58] 다음을 순서에 맞게 배열한 것을 고르십시오.",
      "[59~70] 다음을 읽고 물음에 답하십시오."
    ]
  }
};

// --- Helper Functions ---

// Hàm trích xuất khoảng số [start~end] hoặc số đơn [number] từ chuỗi instruction
function extractRange(instruction: string | undefined): { start: number, end: number } | undefined {
    if (!instruction) return undefined;
    try {
        // Regex tìm khoảng số [start~end] hoặc [start-end]
        const rangeMatch = instruction.match(/\[\s*(\d+)\s*[~～-]\s*(\d+)\s*\]/);
        if (rangeMatch && rangeMatch[1] && rangeMatch[2]) {
            const start = parseInt(rangeMatch[1], 10);
            const end = parseInt(rangeMatch[2], 10);
            if (!isNaN(start) && !isNaN(end) && start <= end) {
                return { start, end };
            }
        }
        // Regex tìm số đơn [number]
        const singleMatch = instruction.match(/\[\s*(\d+)\s*\]/);
        if (singleMatch && singleMatch[1]) {
            const singleNum = parseInt(singleMatch[1], 10);
            if (!isNaN(singleNum)) {
                return { start: singleNum, end: singleNum };
            }
        }
    } catch (error) {
        console.error(`Error parsing range in instruction: "${instruction}"`, error);
    }
    return undefined;
}

// Hàm kiểm tra xem một số có nằm trong bất kỳ khoảng nào trong danh sách không
function isNumberInRange(number: number | undefined, ranges: { start: number, end: number }[]): boolean {
    if (number === undefined || number === null || isNaN(number)) return false;
    return ranges.some(range => number >= range.start && number <= range.end);
}

// Hàm chuẩn hóa instruction string (chỉ dùng cho label hiển thị)
function normalizeInstruction(instruction: string | undefined): string {
    if (!instruction) return "";
    const cleaned = simpleCleanHtml(instruction)
        .replace(/^※\s*/, '')
        .replace(/<보기>와 같이\s*/, '')
        .replace(/고르십시오.?$/, '')
        .replace(/\s+/g, ' ')
        .trim();
    return cleaned || simpleCleanHtml(instruction);
}

// Hàm làm sạch HTML cơ bản (dùng cho label và server-side rendering)
function simpleCleanHtml(htmlString: string | undefined): string {
    if (!htmlString) return "";
    return htmlString
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<p.*?>/gi, ' ')
        .replace(/<\/p>/gi, ' ')
        .replace(/<[^>]*>/g, '')
        .replace(/ |\u00A0/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

// Hàm định dạng giá trị văn bản cho dangerouslySetInnerHTML
function formatValue(value: string | undefined): string {
    if (!value) return "";
    const sanitized = DOMPurify.sanitize(value, { USE_PROFILES: { html: true }, ALLOWED_TAGS: ['br', 'p', 'strong', 'em', 'u'] });
    return sanitized.replace(/\n/g, '<br/>');
}

// Hàm hiển thị nội dung dựa trên content.type
const renderContent = (content: QuestionContent | SharedContent | undefined | null, isShared: boolean = false): React.ReactNode => {
    if (!content || typeof content !== 'object' || !('type' in content)) return null;

    try {
        switch (content.type) {
            case 'text':
            case 'text_with_insertion_points':
                if (typeof content.value !== 'string') return null;
                const textBaseStyle = "text-[1.05em] leading-relaxed whitespace-pre-wrap break-words text-gray-700";
                const passageStyle = `p-4 md:p-5 bg-gray-50 rounded-md ${textBaseStyle}`;
                const questionTextStyle = `text-[1.1em] leading-relaxed whitespace-pre-wrap break-words text-gray-800`;
                const finalClassName = `prose prose-sm max-w-none ${isShared ? passageStyle : (content.value.includes('\n') || content.value.length > 100 ? passageStyle : questionTextStyle)}`;

                if (typeof window !== 'undefined') {
                    return <div className={finalClassName} dangerouslySetInnerHTML={{ __html: formatValue(content.value) }} />;
                } else {
                    return <div className={finalClassName}>{simpleCleanHtml(content.value)}</div>;
                }

            case 'image':
                const imgClassName = `block my-4 mx-auto border border-gray-200 rounded max-h-[250px] md:max-h-[300px] w-auto h-auto object-contain ${isShared ? 'md:max-w-md lg:max-w-lg' : 'max-w-xs sm:max-w-sm md:max-w-md'}`;
                return content.src ? (
                    <img
                        src={content.src}
                        alt={content.alt || 'Hình ảnh'}
                        className={imgClassName}
                        loading="lazy"
                        onError={(e) => { e.currentTarget.outerHTML = `<span class="text-red-600 italic">[Ảnh lỗi: ${simpleCleanHtml(content.alt)}]</span>`; }}
                    />
                ) : '[Thiếu nguồn ảnh]';

            case 'audio_prompt':
                return <div className="my-4 p-3 text-center italic text-blue-700 bg-blue-50 border border-blue-200 rounded">🎧 [{content.value || 'Nghe và làm theo yêu cầu'}] 🎧</div>;

            case 'instruction':
                if (!isShared && typeof content.value === 'string') {
                    return <div className="my-2 text-base italic text-gray-600">{content.value}</div>;
                }
                return null;

            case 'ordering_task':
                if (!isShared && Array.isArray(content.items)) {
                    return (
                        <div className="my-4 space-y-2 rounded border border-gray-100 bg-gray-50 p-3 md:p-4">
                            {content.items.map((item, idx) => item?.marker && item?.text ? (
                                <div key={idx} className="flex items-baseline text-base bg-white p-2 rounded border border-gray-200">
                                    <span className="font-bold text-gray-700 mr-3 w-5 text-center flex-shrink-0">{item.marker}</span>
                                    <span className="flex-1 leading-relaxed whitespace-pre-wrap break-words">{item.text}</span>
                                </div>
                            ) : null)}
                        </div>
                    );
                }
                return null;

            case 'insertion_task':
                if (!isShared) {
                    const passageHtml = typeof content.main_passage === 'string' ? formatValue(content.main_passage) : '';
                    const sentenceToInsert = typeof content.sentence_to_insert === 'string' ? content.sentence_to_insert : '';

                    if (passageHtml && sentenceToInsert) {
                        const passageDiv = typeof window !== 'undefined' ? (
                            <div className="p-4 border border-gray-200 rounded bg-gray-50 text-base leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: passageHtml }}></div>
                        ) : (
                            <div className="p-4 border border-gray-200 rounded bg-gray-50 text-base leading-relaxed prose prose-sm max-w-none">{simpleCleanHtml(passageHtml)}</div>
                        );

                        return (
                            <div className="my-4 space-y-3">
                                <div className="p-3 rounded border border-yellow-200 bg-yellow-50 text-base italic font-medium text-gray-800">
                                    <strong className="font-semibold text-gray-900 not-italic mr-1">Chèn câu:</strong>
                                    {sentenceToInsert}
                                </div>
                                {passageDiv}
                            </div>
                        );
                    } else if (sentenceToInsert) {
                        return (
                            <div className="my-2 text-base italic text-gray-700">
                                <strong className="font-semibold text-gray-900 not-italic mr-1">Chèn câu:</strong>
                                {sentenceToInsert} (Xem đoạn văn ở trên)
                            </div>
                        );
                    }
                }
                return null;

            default:
                return null;
        }
    } catch (error) {
        return <div className="text-red-500 italic">Lỗi hiển thị nội dung. Vui lòng thử lại.</div>;
    }
};

// Helper kiểm tra cấu trúc PracticeConfig
const isPracticeConfig = (value: any): value is PracticeConfig => {
    return (
        value != null &&
        typeof value === 'object' &&
        typeof value.level === 'string' &&
        typeof value.skill === 'string' &&
        typeof value.examId === 'string' &&
        Array.isArray(value.selectedInstructions) &&
        value.selectedInstructions.every((instr: any) => typeof instr === 'string')
    );
};

// Helper đọc initial state từ Local Storage
const getInitialStateFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
    if (typeof window !== 'undefined') {
        try {
            const savedValue = localStorage.getItem(key);
            if (savedValue) {
                const parsedValue = JSON.parse(savedValue);
                if (isPracticeConfig(parsedValue)) {
                    return { ...defaultValue, ...parsedValue } as T;
                }
            }
        } catch (error) {
            localStorage.removeItem(key);
        }
    }
    return defaultValue;
};

// --- Component Chính ---
const PracticeByTypeClient: React.FC<PracticeByTypeClientProps> = ({ allExams }) => {
    const LOCAL_STORAGE_KEY = 'practiceTypeConfig_v5_reactSelectUI';

    const initialConfig = useMemo(() => getInitialStateFromLocalStorage<PracticeConfig>(LOCAL_STORAGE_KEY, { level: 'TOPIK Ⅰ', skill: '듣기', examId: 'all', selectedInstructions: [] }), []);

    const [selectedLevel, setSelectedLevel] = useState<string>(initialConfig.level);
    const [selectedSkill, setSelectedSkill] = useState<string>(initialConfig.skill);
    const [selectedExamId, setSelectedExamId] = useState<string>(initialConfig.examId);
    const [selectedInstructions, setSelectedInstructions] = useState<string[]>(initialConfig.selectedInstructions);
    const [hasHydrated, setHasHydrated] = useState(false);
    const [practiceAnswers, setPracticeAnswers] = useState<{ [key: string]: number }>({});
    const [activeAudioPlayer, setActiveAudioPlayer] = useState<HTMLAudioElement | null>(null);

    useEffect(() => {
        setHasHydrated(true);
    }, []);

    useEffect(() => {
        setPracticeAnswers({});
    }, [selectedInstructions, selectedLevel, selectedSkill, selectedExamId]);

    useEffect(() => {
        if (hasHydrated) {
            try {
                const config: PracticeConfig = {
                    level: selectedLevel,
                    skill: selectedSkill,
                    examId: selectedExamId,
                    selectedInstructions: selectedInstructions
                };
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
            } catch (error) {}
        }
    }, [selectedLevel, selectedSkill, selectedExamId, selectedInstructions, hasHydrated]);

    useEffect(() => {
        return () => {
            if (activeAudioPlayer) {
                activeAudioPlayer.pause();
            }
        };
    }, [activeAudioPlayer]);

    const filteredExamsByLevelSkill = useMemo((): Exam[] => {
        if (!allExams) return [];
        return allExams.filter(exam => exam?.level === selectedLevel && exam?.skill === selectedSkill) || [];
    }, [selectedLevel, selectedSkill, allExams]);

    const examsToProcess = useMemo((): Exam[] => {
        if (selectedExamId === 'all') {
            return filteredExamsByLevelSkill;
        }
        const specificExam = filteredExamsByLevelSkill.find(e => e?.id === selectedExamId);
        return specificExam ? [specificExam] : [];
    }, [selectedExamId, filteredExamsByLevelSkill]);

    const instructionTypeOptions = useMemo((): ReactSelectOption[] => {
        const instructionsForLevelSkill = hardcodedInstructions[selectedLevel]?.[selectedSkill] || [];
        return instructionsForLevelSkill.map(instruction => ({
            value: instruction,
            label: normalizeInstruction(instruction)
        }));
    }, [selectedLevel, selectedSkill]);

    const groupsToDisplay = useMemo((): DisplayGroup[] => {
        const selectedRanges: { start: number, end: number }[] = selectedInstructions
            .map(extractRange)
            .filter((range): range is { start: number, end: number } => range !== undefined);

        if (selectedRanges.length === 0) return [];

        const displayGroups: DisplayGroup[] = [];

        examsToProcess.forEach(exam => {
            if (!exam?.instruction_groups) return;

            const sortedGroups = [...exam.instruction_groups].sort((a, b) => {
                const rangeA = extractRange(a?.instruction);
                const rangeB = extractRange(b?.instruction);
                const startA = rangeA ? rangeA.start : Infinity;
                const startB = rangeB ? rangeB.start : Infinity;
                return startA - startB;
            });

            sortedGroups.forEach(group => {
                if (!group?.questions) return;

                const validQuestions = group.questions
                    .filter((q): q is Question => 
                        q != null &&
                        isNumberInRange(q.number, selectedRanges) &&
                        Array.isArray(q.options) && q.options.length > 0 && q.content?.type
                    )
                    .sort((a, b) => a.number - b.number);

                if (validQuestions.length > 0) {
                    displayGroups.push({
                        ...group,
                        questions: validQuestions,
                        examId: exam.id,
                        examLevel: exam.level,
                        examSkill: exam.skill
                    });
                }
            });
        });

        return displayGroups.sort((a, b) => {
            const rangeA = extractRange(a?.instruction);
            const rangeB = extractRange(b?.instruction);
            const startA = rangeA ? rangeA.start : Infinity;
            const startB = rangeB ? rangeB.start : Infinity;
            if (startA !== startB) return startA - startB;
            return a.examId.localeCompare(b.examId);
        });
    }, [selectedInstructions, examsToProcess]);

    const handleLevelChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
        const newLevel = event.target.value;
        setSelectedLevel(newLevel);
        setSelectedSkill(newLevel === 'TOPIK Ⅰ' ? '듣기' : selectedSkill);
        setSelectedExamId('all');
        setSelectedInstructions([]);
    }, [selectedSkill]);

    const handleSkillChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
        const newSkill = event.target.value;
        setSelectedSkill(newSkill);
        setSelectedExamId('all');
        setSelectedInstructions([]);
    }, []);

    const handleExamChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
        const newExamId = event.target.value;
        setSelectedExamId(newExamId);
    }, []);

    const handlePracticeAnswerSelect = useCallback((uniqueQuestionId: string, optionIndex: number) => {
        setPracticeAnswers(prev => ({ ...prev, [uniqueQuestionId]: optionIndex }));
    }, []);

    const handleMultiInstructionChange = useCallback((selectedOptions: MultiValue<ReactSelectOption>) => {
        const selectedValues = selectedOptions ? selectedOptions.map(option => option.value) : [];
        setSelectedInstructions(selectedValues);
    }, []);

    const handleAudioPlay = useCallback((event: React.SyntheticEvent<HTMLAudioElement>) => {
        const currentPlayer = event.currentTarget;
        if (activeAudioPlayer && activeAudioPlayer !== currentPlayer) {
            activeAudioPlayer.pause();
        }
        setActiveAudioPlayer(currentPlayer);
    }, [activeAudioPlayer]);

    const optionMarkers = ['①', '②', '③', '④'];

    if (!hasHydrated) {
        return (
            <div className="font-sans p-4 md:p-8 bg-gray-100 min-h-screen animate-pulse">
                <div className="h-8 bg-gray-300 rounded w-1/4 mb-6 mx-auto"></div>
                <div className="bg-white p-6 rounded-lg shadow-md mb-8 space-y-4 md:space-y-0 md:grid md:grid-cols-3 md:gap-6">
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                    <div className="h-6 bg-gray-300 rounded w-1/3 mb-3"></div>
                    <div className="h-12 animate-pulse bg-gray-200 rounded"></div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="h-48 animate-pulse bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="font-sans max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-8">
            <h1 className="text-center text-[#212529] text-2xl md:text-3xl font-semibold mb-10 md:mb-12">
                Luyện tập theo dạng yêu cầu
            </h1>

            <div className="bg-white p-5 md:p-6 rounded-lg shadow-md mb-8 space-y-5 md:space-y-0 md:grid md:grid-cols-3 md:gap-6">
                <div className="filter-item">
                    <label htmlFor="level-select" className="block mb-1.5 text-sm font-medium text-gray-700">Cấp độ:</label>
                    <select id="level-select" value={selectedLevel} onChange={handleLevelChange} className="w-full py-2 px-3 border border-gray-300 rounded-md bg-white text-base shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500">
                        <option value="TOPIK Ⅰ">TOPIK I</option>
                        <option value="TOPIK Ⅱ">TOPIK II</option>
                    </select>
                </div>
                <div className="filter-item">
                    <label htmlFor="skill-select" className="block mb-1.5 text-sm font-medium text-gray-700">Kỹ năng:</label>
                    <select id="skill-select" value={selectedSkill} onChange={handleSkillChange} className="w-full py-2 px-3 border border-gray-300 rounded-md bg-white text-base shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500">
                        <option value="듣기">Nghe (듣기)</option>
                        <option value="읽기">Đọc (읽기)</option>
                    </select>
                </div>
                <div className="filter-item">
                    <label htmlFor="exam-select" className="block mb-1.5 text-sm font-medium text-gray-700">Kỳ thi ({filteredExamsByLevelSkill.length}):</label>
                    <select id="exam-select" value={selectedExamId} onChange={handleExamChange} className="w-full py-2 px-3 border border-gray-300 rounded-md bg-white text-base shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500">
                        <option value="all">-- Tất cả phù hợp --</option>
                        {filteredExamsByLevelSkill.map((exam) => (
                            <option key={exam.id} value={exam.id}>
                                ({exam.id}) {exam.year_description} {exam.exam_number_description}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-white p-5 md:p-6 rounded-lg shadow-md mb-6">
                <label htmlFor="instruction-select-react" className="block mb-2 text-base font-medium text-[#343a40]"> Chọn dạng yêu cầu (có thể chọn nhiều): </label>
                <Select
                    inputId="instruction-select-react"
                    instanceId="instruction-select-instance"
                    isMulti
                    options={instructionTypeOptions}
                    value={instructionTypeOptions.filter(option => selectedInstructions.includes(option.value))}
                    onChange={handleMultiInstructionChange}
                    placeholder="Tìm hoặc chọn dạng yêu cầu..."
                    noOptionsMessage={() => "Không có dạng nào"}
                    isDisabled={instructionTypeOptions.length === 0}
                    className="text-base react-select-container"
                    classNamePrefix="react-select"
                    styles={{
                        control: (base, state) => ({
                            ...base,
                            minHeight: '42px',
                            borderColor: state.isFocused ? '#4f46e5' : '#d1d5db',
                            boxShadow: state.isFocused ? '0 0 0 1px #4f46e5' : '0 1px 2px 0 rgba(0,0,0,0.05)',
                            '&:hover': { borderColor: state.isFocused ? '#4f46e5' : '#a5b4fc' },
                            borderRadius: '0.375rem'
                        }),
                        multiValue: (base) => ({ ...base, backgroundColor: '#e0e7ff', borderRadius: '0.25rem' }),
                        multiValueLabel: (base) => ({ ...base, color: '#3730a3', fontSize: '0.875rem' }),
                        multiValueRemove: (base) => ({ ...base, color: '#4f46e5', ':hover': { backgroundColor: '#c7d2fe', color: '#312e81' } }),
                        menu: (base) => ({ ...base, zIndex: 20 })
                    }}
                />
                {instructionTypeOptions.length === 0 && (
                    <div className="text-gray-500 italic mt-2 text-sm">
                        Không tìm thấy dạng yêu cầu cho "{selectedLevel} - {selectedSkill}". Vui lòng chọn cấp độ hoặc kỹ năng khác.
                    </div>
                )}
            </div>

            {selectedInstructions.length > 0 ? (
                <div className="bg-white p-6 md:p-8 lg:p-10 rounded-lg shadow-md mt-8">
                    <h2 className="text-xl font-semibold mb-6 text-gray-700">Danh sách câu hỏi</h2>
                    {groupsToDisplay.length > 0 ? (
                        groupsToDisplay.map((group, groupIndex) => {
                            const questionsInGroupToDisplay = group.questions as Question[];
                            const showGroupAudio = selectedSkill === '듣기' && group.group_audio_url;

                            return (
                                <div key={`${group.examId}-group-${groupIndex}`} className="instructionGroup mb-10 md:mb-12 pt-5 border-t border-gray-200 first:border-t-0 first:pt-0">
                                    {showGroupAudio && (
                                        <div className="mb-4 audio-player-container">
                                            <p className="text-sm font-medium text-gray-600 mb-1">Audio cho nhóm câu hỏi:</p>
                                            <EnhancedTranscriptPlayer key={group.group_audio_url||''} audioUrl={group.group_audio_url||''}/>
                                            {/* <audio src={group.group_audio_url} controls controlsList="nodownload" className="w-full h-[45px]" preload="metadata" onPlay={handleAudioPlay} aria-label="Audio cho nhóm câu hỏi">
                                                Trình duyệt của bạn không hỗ trợ phần tử audio.
                                            </audio> */}
                                        </div>
                                    )}
                                    {group.shared_content && (<div className="mb-6 md:mb-8 shared-content-area">{renderContent(group.shared_content, true)}</div>)}
                                    {questionsInGroupToDisplay.map((question) => {
                                        const uniqueQuestionId = `${group.examId}-${question.id}`;
                                        const questionNumber = question.number;
                                        const isImageOptions = question.option_type === 'image';
                                        const currentSelectionIndex = practiceAnswers[uniqueQuestionId];
                                        const showQuestionAudio = selectedSkill === '듣기' && question.question_audio_url;

                                        return (
                                            <div key={uniqueQuestionId} id={`question-block-${uniqueQuestionId}`} className="questionBlock mb-6" data-option-type={isImageOptions ? 'image' : 'text'}>
                                                <div className="questionHeader flex items-baseline mb-3 pb-1">
                                                    <span className="questionNumber font-semibold text-[1.1em] text-gray-800 mr-2">{questionNumber}.</span>
                                                    {question.points > 0 && <span className="questionPoints text-sm text-gray-500 mr-3">({question.points} điểm)</span>}
                                                    <span className="text-xs text-gray-400 ml-auto">Đề: {group.examId}</span>
                                                </div>
                                                {showQuestionAudio && (
                                                    <div className="mb-3 audio-player-container-small">
                                                        <EnhancedTranscriptPlayer  key={group.group_audio_url||''} audioUrl={question.question_audio_url||''}/>
                                                        {/* <audio src={question.question_audio_url} controls controlsList="nodownload" className="w-full h-[40px]" preload="metadata" onPlay={handleAudioPlay} aria-label="Audio cho câu hỏi">
                                                            Trình duyệt của bạn không hỗ trợ phần tử audio.
                                                        </audio> */}
                                                    </div>
                                                )}
                                                <div className="questionContent mb-4">{renderContent(question.content, false)}</div>
                                                {Array.isArray(question.options) && question.options.length > 0 ? (
                                                    <ul className={`optionsList list-none p-0 m-0 grid gap-x-6 gap-y-2 ${isImageOptions ? 'grid-cols-2 gap-y-4 gap-x-4 max-w-md' : 'grid-cols-1'}`}>
                                                        {question.options.map((opt, index) => {
                                                            if (!opt) return null;
                                                            const isSelected = currentSelectionIndex === index;
                                                            const liClassName = `optionItem rounded-lg cursor-pointer transition duration-150 ease-in-out group relative flex items-baseline text-left border ${isSelected ? 'bg-indigo-50 border-indigo-400 ring-1 ring-indigo-400' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'} ${isImageOptions ? 'flex-col items-center justify-center text-center p-3' : 'p-3'}`;
                                                            const inputId = `q-${uniqueQuestionId}-o-${index}`;

                                                            return (
                                                                <li key={opt.id || `opt-${question.id}-${index}`} className={liClassName} onClick={() => handlePracticeAnswerSelect(uniqueQuestionId, index)}>
                                                                    <input
                                                                        type="radio"
                                                                        name={`q-${uniqueQuestionId}`}
                                                                        id={inputId}
                                                                        value={index}
                                                                        checked={isSelected}
                                                                        onChange={() => handlePracticeAnswerSelect(uniqueQuestionId, index)}
                                                                        className="absolute opacity-0 pointer-events-none peer"
                                                                        aria-label={`Lựa chọn ${index + 1} cho câu hỏi ${questionNumber}`}
                                                                    />
                                                                    <label htmlFor={inputId} className={`flex-1 cursor-pointer w-full ${isImageOptions ? 'flex flex-col items-center' : 'flex items-baseline'}`}>
                                                                        <span className={`marker font-medium mr-2 w-6 text-center flex-shrink-0 text-[1.05em] leading-relaxed ${isImageOptions ? 'mb-2 w-full text-sm' : ''} ${isSelected ? 'text-indigo-700 font-semibold' : 'text-gray-600 group-hover:text-indigo-600'}`}>
                                                                            {optionMarkers[index % optionMarkers.length]}
                                                                        </span>
                                                                        <div className={`content ${isImageOptions ? '' : 'flex-1'}`}>
                                                                            {isImageOptions && opt.image_src ? (
                                                                                <img
                                                                                    src={opt.image_src}
                                                                                    alt={opt.alt || `Lựa chọn ${index + 1}`}
                                                                                    className="optionImage max-w-[110px] max-h-[110px] border rounded-md mx-auto block object-contain bg-white"
                                                                                    onError={(e) => { e.currentTarget.outerHTML = `[Ảnh lỗi]`; }}
                                                                                />
                                                                            ) : (
                                                                                <span className={`optionText text-base leading-relaxed whitespace-pre-wrap break-words ${isSelected ? 'text-indigo-900 font-medium' : 'text-gray-700 group-hover:text-gray-900'}`}>
                                                                                    {opt.text || `Lựa chọn ${index + 1}`}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </label>
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                ) : (
                                                    <p className="text-red-500 text-sm italic mt-2">Không có lựa chọn cho câu hỏi này.</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-gray-500 italic py-4">
                            Không tìm thấy câu hỏi phù hợp với các dạng yêu cầu đã chọn trong {selectedExamId === 'all' ? `các đề ${selectedLevel} - ${selectedSkill}.` : `đề ${selectedExamId}.`} Vui lòng thử lại.
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center text-gray-500 mt-16 text-lg bg-white p-8 rounded-lg shadow">
                    Vui lòng chọn ít nhất một dạng yêu cầu để bắt đầu luyện tập.
                </div>
            )}
        </div>
    );
};

export default PracticeByTypeClient;