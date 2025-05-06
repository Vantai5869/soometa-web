// app/practice-by-type/PracticeByTypeClient.tsx
'use client';

// Thêm useRef
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
// Import React Select
import Select, { MultiValue } from 'react-select';

// --- Định nghĩa Types (Giữ nguyên từ code bạn cung cấp) ---
export interface Option { id?: string; text?: string; image_src?: string; alt?: string; is_correct: boolean; }
export interface QuestionContent { type: string; value?: string; src?: string; alt?: string; items?: { marker: string, text: string }[]; main_passage?: string; sentence_to_insert?: string; }
export interface SharedContent extends QuestionContent { /* ... */ }
export interface Question { id: string; number: number; points: number; option_type?: string; content: QuestionContent; options: Option[] | null | undefined; question_audio_url?: string; } // Có question_audio_url
export interface InstructionGroup { type: string; instruction: string; example?: any; questions: Question[] | null | undefined; shared_content?: SharedContent | null; group_audio_url?: string; } // Có group_audio_url
export interface Exam { id: string; year_description: string; exam_number_description: string; source: string; level: string; skill: string; audio_url?: string; instruction_groups: InstructionGroup[] | null | undefined; }
export interface QuestionWithContext extends Question { examId: string; examLevel: string; examSkill: string; originalInstruction: string; }
interface InstructionTypeInfo { identifier: string; displayText: string; sortOrder?: number; }
interface ReactSelectOption { value: string; label: string; }
interface PracticeConfig { level: string; skill: string; examId: string; selectedInstructions: string[]; }
interface DisplayGroup extends InstructionGroup { examId: string; examLevel: string; examSkill: string; }
// --- Kết thúc định nghĩa Types ---


// --- Helper Functions ---
function extractFirstNumber(instruction: string | null | undefined): number | undefined {
    if (!instruction) return undefined;
    const rangeMatch = instruction.match(/\[\s*(\d+)\s*[～~]/); if (rangeMatch && rangeMatch[1]) return parseInt(rangeMatch[1], 10);
    const singleMatch = instruction.match(/\[\s*(\d+)\s*\]/); if (singleMatch && singleMatch[1]) return parseInt(singleMatch[1], 10);
    return undefined;
}
function simpleCleanHtml(htmlString: string | undefined): string {
    if (!htmlString) return "";
    return htmlString.replace(/<br\s*\/?>/gi, ' ').replace(/<p.*?>/gi, ' ').replace(/<\/p>/gi, ' ').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}
function normalizeInstruction(instruction: string | undefined): string {
    if (!instruction) return "";
    let core = simpleCleanHtml(instruction);
    core = core.replace(/\[\s*\d+\s*([～~]\s*\d+\s*)?\]/g, ''); // Xóa khoảng số
    core = core.replace(/^※\s*/, '');
    core = core.replace(/<보기>와 같이\s*/, '');
    core = core.replace(/고르십시오.?$/, '');
    core = core.replace(/다음(?:을|의) (?:듣고|읽고|보고|글을 읽고|대화를 듣고|강연을 듣고|교양 프로그램을 듣고|뉴스를 듣고|다음을 보고|그림을 보고)\s*/, '');
    core = core.replace(/가장 알맞은 것을\s*/, '알맞은 것을 ');
    core = core.replace(/무엇에 대한 (?:이야기|광고|안내문|설명)인지\s*/, '무엇에 대한 것인지 ');
    core = core.replace(/들은 내용과 (?:같은|다른) 것을\s*/, '내용과 일치하는 것을 ');
    core = core.replace(/남자의 중심 생각|여자의 중심 생각/, '중심 생각');
    core = core.replace(/\s+/g, ' ').trim();
    return core || instruction; // Trả về gốc nếu core rỗng
}
 const renderContent = (content: QuestionContent | SharedContent | undefined | null, isShared: boolean = false): React.ReactNode => {
    if (!content || typeof content !== 'object' || !('type' in content)) return null;
    const formatValue = (value: string | undefined): string => { /* ... như trước ... */ };
    try {
        switch (content.type) {
            case 'text': case 'text_with_insertion_points': if (typeof content.value !== 'string') return null; const textBaseStyle = "text-[1.05em] leading-relaxed whitespace-pre-wrap break-words text-gray-700"; const passageStyle = `p-4 md:p-5 bg-gray-50 rounded-md ${textBaseStyle}`; const questionTextStyle = `text-[1.1em] leading-relaxed whitespace-pre-wrap break-words text-gray-800`; const finalClassName = `prose prose-sm max-w-none ${isShared ? passageStyle : (content.value.includes('\n') || content.value.length > 100 ? passageStyle : questionTextStyle)}`; if (typeof window !== 'undefined') { return <div className={finalClassName} dangerouslySetInnerHTML={{ __html: formatValue(content.value) }} />; } else { return <div className={finalClassName}>{simpleCleanHtml(formatValue(content.value))}</div>; }
            case 'image': const imgClassName = `block my-4 mx-auto border border-gray-200 rounded max-h-[250px] md:max-h-[300px] w-auto h-auto object-contain ${isShared ? 'md:max-w-md lg:max-w-lg' : 'max-w-xs sm:max-w-sm md:max-w-md'}`; return content.src ? <img src={content.src} alt={content.alt || 'Hình ảnh'} className={imgClassName} loading="lazy" onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => (e.currentTarget.outerHTML = `<span class="text-red-600">[Ảnh lỗi: ${simpleCleanHtml(content.alt)}]</span>`)} /> : '[Thiếu nguồn ảnh]';
            case 'audio_prompt': return <div className="my-4 p-3 text-center italic text-blue-700 bg-blue-50 border border-blue-200 rounded">🎧 [{content.value || 'Nghe và làm theo yêu cầu'}] 🎧</div>;
            case 'instruction': if (!isShared && typeof content.value === 'string') { return <div className="my-2 text-base italic text-gray-600">{content.value}</div>; } return null;
            case 'ordering_task': if (!isShared && Array.isArray(content.items)) { return ( <div className="my-4 space-y-2 rounded border border-gray-100 bg-gray-50 p-3 md:p-4">{content.items.map((item, idx) => item?.marker && item?.text ? (<div key={idx} className="flex items-baseline text-base bg-white p-2 rounded border border-gray-200"><span className="font-bold text-gray-700 mr-3 w-5 text-center flex-shrink-0">{item.marker}</span><span className="flex-1 leading-relaxed whitespace-pre-wrap break-words">{item.text}</span></div>) : null)}</div> ); } return null;
            case 'insertion_task': if (!isShared) { const passageHtml = typeof content.main_passage === 'string' ? formatValue(content.main_passage) : ''; const sentenceToInsert = typeof content.sentence_to_insert === 'string' ? content.sentence_to_insert : ''; if (passageHtml && sentenceToInsert) { const passageDiv = typeof window !== 'undefined' ? <div className="p-4 border border-gray-200 rounded bg-gray-50 text-base leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: passageHtml }}></div> : <div className="p-4 border border-gray-200 rounded bg-gray-50 text-base leading-relaxed prose prose-sm max-w-none">{simpleCleanHtml(passageHtml)}</div>; return (<div className="my-4 space-y-3"><div className="p-3 rounded border border-yellow-200 bg-yellow-50 text-base italic font-medium text-gray-800"><strong className="font-semibold text-gray-900 not-italic mr-1">Chèn câu:</strong>{sentenceToInsert}</div>{passageDiv}</div>); } else if (sentenceToInsert) { return <div className="my-2 text-base italic text-gray-700"><strong className="font-semibold text-gray-900 not-italic mr-1">Chèn câu:</strong>{sentenceToInsert} (Xem đoạn văn ở trên)</div>; } } return null;
            default: console.warn("Unknown content type:", content?.type); return null;
        }
    } catch (error) { console.error("Lỗi render content:", content, error); return <div className="text-red-500 italic">[Lỗi hiển thị nội dung]</div>; }
 };
// --- Kết thúc Helper Functions ---

// --- Hàm Helper đọc Local Storage ---
const getInitialStateFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
    if (typeof window !== 'undefined') { try { const savedValue = localStorage.getItem(key); if (savedValue) { const parsedValue = JSON.parse(savedValue); if (typeof defaultValue === 'object' && defaultValue !== null && typeof parsedValue === 'object' && parsedValue !== null) { return { ...defaultValue, ...parsedValue } as T; } return parsedValue as T; } } catch (error) { console.error(`Lỗi đọc LS key "${key}":`, error); localStorage.removeItem(key); } } return defaultValue;
};
// --- Kết thúc Hàm Helper đọc Local Storage ---




// --- Component Chính ---
const PracticeByTypeClient: React.FC<PracticeByTypeClientProps> = ({ allExams }) => {
  const LOCAL_STORAGE_KEY = 'practiceTypeConfig_v5_reactSelectUI'; // Giữ key này

  // --- State ---
  const [selectedLevel, setSelectedLevel] = useState<string>(() => getInitialStateFromLocalStorage<PracticeConfig>(LOCAL_STORAGE_KEY, { level: 'TOPIK Ⅰ' } as PracticeConfig).level );
  const [selectedSkill, setSelectedSkill] = useState<string>(() => getInitialStateFromLocalStorage<PracticeConfig>(LOCAL_STORAGE_KEY, { skill: '듣기' } as PracticeConfig).skill );
  const [selectedExamId, setSelectedExamId] = useState<string>(() => getInitialStateFromLocalStorage<PracticeConfig>(LOCAL_STORAGE_KEY, { examId: 'all' } as PracticeConfig).examId );
  const [selectedInstructions, setSelectedInstructions] = useState<string[]>(() => getInitialStateFromLocalStorage<PracticeConfig>(LOCAL_STORAGE_KEY, { selectedInstructions: [] } as PracticeConfig).selectedInstructions );
  const [hasHydrated, setHasHydrated] = useState(false);
  const [practiceAnswers, setPracticeAnswers] = useState<{[key: string]: number}>({});
  // *** THÊM: State quản lý audio ***
  const [activeAudioPlayer, setActiveAudioPlayer] = useState<HTMLAudioElement | null>(null);

  // --- Effect Load/Save ---
  useEffect(() => { setHasHydrated(true); }, []);
  useEffect(() => { if (hasHydrated) { try { const config: PracticeConfig = { level: selectedLevel, skill: selectedSkill, examId: selectedExamId, selectedInstructions: selectedInstructions }; localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config)); } catch (error) { console.error("Lỗi lưu LS:", error); } } }, [selectedLevel, selectedSkill, selectedExamId, selectedInstructions, hasHydrated]);
  // --- Kết thúc Effect Load/Save ---


  // --- Các hook useMemo (Giữ nguyên logic) ---
  const filteredExamsByLevelSkill = useMemo((): Exam[] => { if (!allExams) return []; return allExams.filter(exam => exam && exam.level === selectedLevel && exam.skill === selectedSkill); }, [selectedLevel, selectedSkill, allExams]);
  const examsToProcess = useMemo((): Exam[] => { if (selectedExamId === 'all') { return filteredExamsByLevelSkill ?? []; } else { const specificExam = filteredExamsByLevelSkill?.find(e => e?.id === selectedExamId); return specificExam ? [specificExam] : []; } }, [selectedExamId, filteredExamsByLevelSkill]);
  const instructionTypeOptions = useMemo((): ReactSelectOption[] => { const instructionsMap = new Map<string, InstructionTypeInfo>(); (examsToProcess ?? []).forEach(exam => { if (exam && Array.isArray(exam.instruction_groups)) { exam.instruction_groups.forEach(group => { if (group?.instruction) { const coreKey = normalizeInstruction(group.instruction); if (coreKey && !instructionsMap.has(coreKey)) { const cleanedOriginalText = simpleCleanHtml(group.instruction); const sortOrderValue = extractFirstNumber(group.instruction); instructionsMap.set(coreKey, { identifier: group.instruction, displayText: cleanedOriginalText.length > 90 ? cleanedOriginalText.substring(0, 90) + '...' : cleanedOriginalText, sortOrder: sortOrderValue }); } } }); } }); const sortedTypes = Array.from(instructionsMap.values()).sort((a, b) => { const orderA = a.sortOrder ?? Infinity; const orderB = b.sortOrder ?? Infinity; if (orderA !== Infinity && orderB !== Infinity) { return orderA - orderB; } if (orderA !== Infinity) return -1; if (orderB !== Infinity) return 1; return a.displayText.localeCompare(b.displayText); }); return sortedTypes.map(typeInfo => ({ value: typeInfo.identifier, label: typeInfo.displayText })); }, [examsToProcess]);
   const groupsToDisplay = useMemo((): DisplayGroup[] => { if (selectedInstructions.length === 0) return []; const displayGroups: DisplayGroup[] = []; const selectedCoreKeys = selectedInstructions.map(inst => normalizeInstruction(inst)); (examsToProcess ?? []).forEach(exam => { if (exam && Array.isArray(exam.instruction_groups)) { exam.instruction_groups.forEach(group => { if (group) { const groupCoreKey = normalizeInstruction(group.instruction); if (groupCoreKey && selectedCoreKeys.includes(groupCoreKey)) { if (Array.isArray(group.questions) && group.questions.length > 0) { const validQuestions = group.questions.filter(q => q && Array.isArray(q.options)); if (validQuestions.length > 0) { displayGroups.push({ ...group, questions: validQuestions, examId: exam.id, examLevel: exam.level, examSkill: exam.skill }); } } } } }); } }); return displayGroups.sort((a, b) => { /* ... Sắp xếp group ... */ }); }, [selectedInstructions, examsToProcess]);
  // --- Kết thúc useMemo ---


  // --- Event Handlers ---
  const handleLevelChange = (event: React.ChangeEvent<HTMLSelectElement>) => { setSelectedLevel(event.target.value); setSelectedExamId('all'); setSelectedInstructions([]); setPracticeAnswers({}); };
  const handleSkillChange = (event: React.ChangeEvent<HTMLSelectElement>) => { setSelectedSkill(event.target.value); setSelectedExamId('all'); setSelectedInstructions([]); setPracticeAnswers({}); };
  // Giữ nguyên handler KHÔNG reset instruction khi đổi exam
  const handleExamChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedExamId(event.target.value);
      // KHÔNG reset selectedInstructions ở đây
      setPracticeAnswers({});
  };
  const handlePracticeAnswerSelect = (uniqueQuestionId: string, optionIndex: number) => { setPracticeAnswers(prev => ({...prev, [uniqueQuestionId]: optionIndex})); };
  const handleMultiInstructionChange = (selectedOptions: MultiValue<ReactSelectOption>) => { const selectedValues = selectedOptions ? selectedOptions.map(option => option.value) : []; setSelectedInstructions(selectedValues); setPracticeAnswers({}); };
  // *** THÊM: Handler quản lý audio ***
  const handleAudioPlay = (event: React.SyntheticEvent<HTMLAudioElement, Event>) => { const currentPlayer = event.currentTarget; if (activeAudioPlayer && activeAudioPlayer !== currentPlayer) { activeAudioPlayer.pause(); } setActiveAudioPlayer(currentPlayer); };
  // --- Kết thúc Event Handlers ---


  // --- Marker cho các lựa chọn ---
  const optionMarkers = ['①', '②', '③', '④'];


  // --- Conditional Rendering ---
  if (!hasHydrated) {
      // Placeholder
      return ( <div className="font-sans p-4 md:p-8 bg-gray-100 min-h-screen animate-pulse"> <div className="h-8 bg-gray-300 rounded w-1/4 mb-6 mx-auto"></div> <div className="bg-white p-6 rounded-lg shadow-md mb-8 space-y-4 md:space-y-0 md:grid md:grid-cols-3 md:gap-6"> <div className="h-10 bg-gray-200 rounded"></div> <div className="h-10 bg-gray-200 rounded"></div> <div className="h-10 bg-gray-200 rounded"></div> </div> <div className="bg-white p-6 rounded-lg shadow-md mb-6"> <div className="h-6 bg-gray-300 rounded w-1/3 mb-3"></div> <div className="h-12 bg-gray-200 rounded"></div> </div> </div> );
  }

  // --- JSX Render Chính ---
  return (
    <div className="font-sans max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-8">
      <h1 className="text-center text-[#212529] text-2xl md:text-3xl font-semibold mb-10 md:mb-12">
        Luyện tập theo dạng yêu cầu
      </h1>

      {/* --- Bộ lọc (Layout cũ) --- */}
      <div className="bg-white p-5 md:p-6 rounded-lg shadow-md mb-8 space-y-5 md:space-y-0 md:grid md:grid-cols-3 md:gap-6">
         <div className="filter-item"> <label htmlFor="level-select" className="block mb-1.5 text-sm font-medium text-gray-700">Cấp độ:</label> <select id="level-select" value={selectedLevel} onChange={handleLevelChange} className="w-full py-2 px-3 border border-gray-300 rounded-md bg-white text-base shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"> <option value="TOPIK Ⅰ">TOPIK I</option> <option value="TOPIK Ⅱ">TOPIK II</option> </select> </div>
         <div className="filter-item"> <label htmlFor="skill-select" className="block mb-1.5 text-sm font-medium text-gray-700">Kỹ năng:</label> <select id="skill-select" value={selectedSkill} onChange={handleSkillChange} className="w-full py-2 px-3 border border-gray-300 rounded-md bg-white text-base shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"> <option value="듣기">Nghe (듣기)</option> <option value="읽기">Đọc (읽기)</option> </select> </div>
         <div className="filter-item"> <label htmlFor="exam-select" className="block mb-1.5 text-sm font-medium text-gray-700">Kỳ thi ({filteredExamsByLevelSkill?.length ?? 0}):</label> <select id="exam-select" value={selectedExamId} onChange={handleExamChange} className="w-full py-2 px-3 border border-gray-300 rounded-md bg-white text-base shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"> <option value="all">-- Tất cả phù hợp --</option> {(filteredExamsByLevelSkill ?? []).map((exam) => exam && (<option key={exam.id} value={exam.id}>({exam.id}) {exam.year_description} {exam.exam_number_description}</option>))} </select> </div>
      </div>

      {/* --- Chọn Dạng Câu Hỏi (SỬ DỤNG REACT-SELECT) --- */}
      <div className="bg-white p-5 md:p-6 rounded-lg shadow-md mb-6">
          <label htmlFor="instruction-select-react" className="block mb-2 text-base font-medium text-[#343a40]"> Chọn dạng yêu cầu (có thể chọn nhiều): </label>
          <Select inputId="instruction-select-react" instanceId="instruction-select-instance" isMulti options={instructionTypeOptions} value={instructionTypeOptions.filter(option => selectedInstructions.includes(option.value))} onChange={handleMultiInstructionChange} placeholder="Tìm hoặc chọn dạng yêu cầu..." noOptionsMessage={() => "Không có dạng nào"} isDisabled={instructionTypeOptions.length === 0} className="text-base react-select-container" classNamePrefix="react-select" styles={{ control: (base, state) => ({ ...base, minHeight: '42px', borderColor: state.isFocused ? '#4f46e5' : '#d1d5db', boxShadow: state.isFocused ? '0 0 0 1px #4f46e5' : '0 1px 2px 0 rgba(0,0,0,0.05)', '&:hover': { borderColor: state.isFocused ? '#4f46e5' : '#a5b4fc'}, borderRadius: '0.375rem' }), multiValue: (base) => ({ ...base, backgroundColor: '#e0e7ff', borderRadius: '0.25rem' }), multiValueLabel: (base) => ({ ...base, color: '#3730a3', fontSize: '0.875rem' }), multiValueRemove: (base) => ({ ...base, color: '#4f46e5', ':hover': { backgroundColor: '#c7d2fe', color: '#312e81'} }), menu: (base) => ({ ...base, zIndex: 20 }) }} />
          {instructionTypeOptions.length === 0 && ( <div className="text-gray-500 italic mt-2 text-sm">Không tìm thấy dạng yêu cầu nào cho lựa chọn bộ lọc hiện tại.</div> )}
      </div>


      {/* --- Hiển Thị Câu Hỏi THEO GROUP --- */}
      {selectedInstructions.length > 0 ? (
        <div className="bg-white p-6 md:p-8 lg:p-10 rounded-lg shadow-md mt-8">
          {/* Hiển thị instruction chi tiết đã chọn */}
          {/* <div className="mb-8 p-4 bg-indigo-50 border-l-4 border-indigo-400 text-indigo-800 rounded">
             <p className="text-base font-medium mb-3 text-indigo-700">Yêu cầu chi tiết của các dạng đã chọn:</p>
             {hasHydrated && selectedInstructions.length > 0 ? (selectedInstructions.map((instruction, index) => (<div key={index} className="text-sm p-2 mb-2 bg-white/70 border border-indigo-100 rounded prose prose-sm max-w-none leading-snug" dangerouslySetInnerHTML={{ __html: instruction }} />))) : hasHydrated ? (<p className="text-sm italic">Chưa chọn dạng yêu cầu nào.</p>) : (<div className="h-5 animate-pulse bg-indigo-200 rounded w-1/2"></div>)}
             <p className="text-sm font-normal mt-3 pt-3 border-t border-indigo-200 text-gray-600">{selectedExamId === 'all' ? `Hiển thị câu hỏi thuộc các dạng đã chọn từ tất cả đề ${selectedLevel} - ${selectedSkill}.`: `Hiển thị câu hỏi thuộc các dạng đã chọn từ đề ${selectedExamId}.`}</p>
          </div> */}

          <h2 className="text-xl font-semibold mb-6 text-gray-700">Danh sách câu hỏi</h2>

           {/* Lặp qua CÁC GROUP đã lọc */}
          {(groupsToDisplay ?? []).length > 0 ? (
             groupsToDisplay.map((group, groupIndex) => {
                 if (!group) return null;
                 const questionsInGroupToDisplay = (Array.isArray(group.questions) ? group.questions.filter(q => q && Array.isArray(q.options)) : []) as Question[];
                 if (questionsInGroupToDisplay.length === 0) { return null; }
                 // *** THÊM: Kiểm tra audio cho group ***
                 const showGroupAudio = selectedSkill === '듣기' && group.group_audio_url;

                 return (
                     <div key={`${group.examId}-group-${groupIndex}`} className="instructionGroup mb-10 md:mb-12 pt-5 border-t border-gray-200 first:border-t-0 first:pt-0">
                        {/* *** THÊM: Hiển thị GROUP AUDIO nếu có *** */}
                        {showGroupAudio && (
                            <div className="mb-4 audio-player-container">
                                <p className="text-sm font-medium text-gray-600 mb-1">Audio cho nhóm câu hỏi:</p>
                                <audio src={group.group_audio_url} controls controlsList="nodownload" className="w-full h-[45px]" preload="metadata" onPlay={handleAudioPlay}>Trình duyệt không hỗ trợ audio.</audio>
                            </div>
                        )}
                        {/* Hiển thị SHARED CONTENT */}
                        {group.shared_content && (<div className="mb-6 md:mb-8 shared-content-area">{hasHydrated ? renderContent(group.shared_content, true) : <div className="p-3 border rounded bg-gray-100 animate-pulse h-24"></div>}</div>)}

                        {/* Lặp qua câu hỏi trong group */}
                        {questionsInGroupToDisplay.map((question) => {
                            if (!question) return null;
                            const uniqueQuestionId = `${group.examId}-${question.id}`;
                            const questionNumber = question.number;
                            const isImageOptions = question.option_type === 'image';
                            const currentSelectionIndex = practiceAnswers[uniqueQuestionId];
                            // *** THÊM: Kiểm tra audio cho câu hỏi đơn lẻ ***
                            const showQuestionAudio = selectedSkill === '듣기' && question.question_audio_url;

                            return (
                                 <div key={uniqueQuestionId} id={`question-block-${uniqueQuestionId}`} className="questionBlock mb-6" data-option-type={isImageOptions ? 'image' : 'text'}>
                                    {/* Phần đầu câu hỏi */}
                                    <div className="questionHeader flex items-baseline mb-3 pb-1"> <span className="questionNumber font-semibold text-[1.1em] text-gray-800 mr-2">{questionNumber}.</span> {question.points > 0 && <span className="questionPoints text-sm text-gray-500 mr-3">({question.points} điểm)</span>} <span className="text-xs text-gray-400 ml-auto">Đề: {group.examId}</span> </div>
                                     {/* *** THÊM: Audio cho câu hỏi đơn lẻ *** */}
                                    {showQuestionAudio && (
                                        <div className="mb-3 audio-player-container-small">
                                            <audio src={question.question_audio_url} controls controlsList="nodownload" className="w-full h-[40px]" preload="metadata" onPlay={handleAudioPlay}>Trình duyệt không hỗ trợ audio.</audio>
                                        </div>
                                     )}
                                    {/* Nội dung câu hỏi */}
                                    <div className="questionContent mb-4"> {hasHydrated ? renderContent(question.content, false) : <div className="h-10 animate-pulse bg-gray-200 rounded w-3/4"></div>} </div>
                                    {/* Danh sách lựa chọn */}
                                    {Array.isArray(question.options) ? (<ul className={`optionsList list-none p-0 m-0 grid gap-x-6 gap-y-2 ${isImageOptions ? 'grid-cols-2 gap-y-4 gap-x-4 max-w-md' : 'grid-cols-1'}`}> {question.options.map((opt: Option | null, index: number) => { if (!opt) return null; const isSelected = currentSelectionIndex === index; let liClassName = `optionItem rounded-lg cursor-pointer transition duration-150 ease-in-out group relative flex items-baseline text-left border ${ isSelected ? 'bg-indigo-50 border-indigo-400 ring-1 ring-indigo-400' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300' } ${ isImageOptions ? 'flex-col items-center justify-center text-center p-3' : 'p-3' }`; const inputId = `q-${uniqueQuestionId}-o-${index}`; return ( <li key={opt.id || `opt-${question.id}-${index}`} className={liClassName} onClick={() => handlePracticeAnswerSelect(uniqueQuestionId, index)}> <input type="radio" name={`q-${uniqueQuestionId}`} id={inputId} value={index} checked={isSelected} onChange={() => handlePracticeAnswerSelect(uniqueQuestionId, index)} className="absolute opacity-0 pointer-events-none peer" /> <label htmlFor={inputId} className={`flex-1 cursor-pointer w-full ${isImageOptions ? 'flex flex-col items-center' : 'flex items-baseline'}`}> <span className={`marker font-medium mr-2 w-6 text-center flex-shrink-0 text-[1.05em] leading-relaxed ${isImageOptions ? 'mb-2 w-full text-sm' : ''} ${isSelected ? 'text-indigo-700 font-semibold' : 'text-gray-600 group-hover:text-indigo-600'}`}>{optionMarkers[index % optionMarkers.length]}</span> <div className={`content ${isImageOptions ? '' : 'flex-1'}`}> {isImageOptions && opt.image_src ? (<img src={opt.image_src} alt={opt.alt || `Lựa chọn ${index + 1}`} className="optionImage max-w-[110px] max-h-[110px] border rounded-md mx-auto block object-contain bg-white" onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => (e.currentTarget.outerHTML = `[Ảnh lỗi]`)} />) : (<span className={`optionText text-base leading-relaxed whitespace-pre-wrap break-words ${isSelected ? 'text-indigo-900 font-medium' : 'text-gray-700 group-hover:text-gray-900'}`}>{opt.text || `Lựa chọn ${index + 1}`}</span>)}</div> </label> </li> ); })} </ul> ) : ( <p className="text-red-500 text-sm italic mt-2">Lỗi: Không có lựa chọn cho câu hỏi này.</p> )}
                                 </div>
                            );
                        })}
                     </div>
                 );
             })
          ) : ( <div className="text-gray-500 italic py-4">Không tìm thấy câu hỏi nào phù hợp với các lựa chọn của bạn.</div> )}
        </div>
      ) : ( <div className="text-center text-gray-500 mt-16 text-lg bg-white p-8 rounded-lg shadow"> Vui lòng chọn các bộ lọc và ít nhất một dạng yêu cầu từ danh sách ở trên. </div> )}
    </div>
  );
};

export default PracticeByTypeClient;