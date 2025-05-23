'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Select, { MultiValue } from 'react-select';

// Import types from the new types.ts file
import { Exam, InstructionGroup, Question, Option, QuestionContent, SharedContent, ReactSelectOption, PracticeConfig, DisplayGroup } from './types'; // Adjust import path

// Import helper functions from the new utils.ts file
import { extractRange, isNumberInRange, normalizeInstruction } from './utils';

// Import new components
import PracticeFilters from './PracticeFilters'; // Adjust import path
import PracticeQuestionList from './PracticeQuestionList'; // Adjust import path


// --- HARDCODED INSTRUCTIONS DATA ---
const hardcodedInstructions: { [level: string]: { [skill: string]: string[] } } = {
    'TOPIK Ⅱ': {
        '듣기': [
          "[1~3] 다음을 듣고 가장 알맞은 그림 또는 그래프를 고르십시오.",
          "[4~8] 다음을 듣고 이어질 수 있는 말로 가장 알맞은 것을 고르십시오.",
          "[9~12] 다음을 듣고 여자가 이어서 할 행동으로 가장 알맞은 것을 고르십시오.",
          "[13~16] 다음을 듣고 들은 내용과 같은 것을 고르십시오.",
          "[17~20] 다음을 듣고 남자의 중심 생각으로 가장 알맞은 것을 고르십시오.",
          "[21~36] 다음을 듣고 물음에 답하십시오.",
          "[37~50] 다음은 (교양 프로그램/강연/다큐멘터리)입니다. 잘 듣고 물음에 답하십시오."
        ],
        '읽기': [
          "[1~2] ( )에 들어갈 말로 가장 알맞은 것을 고르십시오.",
          "[3~4] 밑줄 친 부분과 의미가 가장 비슷한 것을 고르십시오.",
          "[5~8] 다음은 무엇에 대한 글인지 고르십시오.",
          "[9~12] 다음 글 또는 그래프의 내용과 같은 것을 고르십시오.",
          "[13~15] 다음을 순서에 맞게 배열한 것을 고르십시오.",
          "[16~18] ( )에 들어갈 말로 가장 알맞은 것을 고르십시오.",
          "[19~24] 다음을 읽고 물음에 답하십시오.",
          "[25~27] 다음 신문 기사의 제목을 가장 잘 설명한 것을 고르십시오.",
          "[28~31] ( )에 들어갈 말로 가장 알맞은 것을 고르십시오.",
          "[32~34] 다음을 읽고 글의 내용과 같은 것을 고르십시오.",
          "[35~38] 다음을 읽고 글의 주제로 가장 알맞은 것을 고르십시오.",
          "[39~41] 주어진 문장이 들어갈 곳으로 가장 알맞은 것을 고르십시오.",
          "[42~47] 다음을 읽고 물음에 답하십시오.",
          "[48~50] 다음을 읽고 물음에 답하십시오."
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
          "[34~39] <보기>와 같이 ( )에 들어갈 말로 가장 알맞은 것을 고르십시오.",
          "[40~42] 다음을 읽고 맞지 않는 것을 고르십시오.",
          "[43~45] 다음을 읽고 내용이 같은 것을 고르십시오.",
          "[46~48] 다음을 읽고 중심 생각을 고르십시오.",
          "[49~56] 다음을 읽고 물음에 답하십시오.",
          "[57~58] 다음을 순서에 맞게 배열한 것을 고르십시오.",
          "[59~70] 다음을 읽고 물음에 답하십시오."
        ]
      }
};

// --- Helper Functions (for Local Storage and Data Filtering) ---
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
             console.error("Failed to parse localStorage data:", error);
             localStorage.removeItem(key); // Clear potentially corrupted data
        }
    }
    return defaultValue;
};

interface PracticeByTypeClientProps {
    allExams: Exam[] | null | undefined;
}

// --- Component Chính ---
const PracticeByTypeClient: React.FC<PracticeByTypeClientProps> = ({ allExams }) => {
    const LOCAL_STORAGE_KEY = 'practiceTypeConfig_v5_reactSelectUI';

    const initialConfig = useMemo(() => getInitialStateFromLocalStorage<PracticeConfig>(LOCAL_STORAGE_KEY, { level: 'TOPIK Ⅰ', skill: '듣기', examId: 'all', selectedInstructions: [] }), []);

    const [selectedLevel, setSelectedLevel] = useState<string>(initialConfig.level);
    const [selectedSkill, setSelectedSkill] = useState<string>(initialConfig.skill);
    const [selectedExamId, setSelectedExamId] = useState<string>(initialConfig.examId);
    const [selectedInstructions, setSelectedInstructions] = useState<string[]>(initialConfig.selectedInstructions);
    const [practiceAnswers, setPracticeAnswers] = useState<{ [key: string]: number }>({});
    const [activeAudioPlayer, setActiveAudioPlayer] = useState<HTMLAudioElement | null>(null);

    const [hasHydrated, setHasHydrated] = useState(false);

    useEffect(() => {
        setHasHydrated(true);
        return () => {
            if (activeAudioPlayer) {
                activeAudioPlayer.pause();
                setActiveAudioPlayer(null);
            }
        };
    }, []);

    useEffect(() => {
         if (hasHydrated) {
             setPracticeAnswers({});
         }
    }, [selectedInstructions, selectedLevel, selectedSkill, selectedExamId, hasHydrated]);

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
            } catch (error) {
                console.error("Failed to save state to localStorage:", error);
            }
        }
    }, [selectedLevel, selectedSkill, selectedExamId, selectedInstructions, hasHydrated]);

     useEffect(() => {
        const playerToClean = activeAudioPlayer;
        return () => {
            if (playerToClean && !playerToClean.paused) {
                playerToClean.pause();
            }
        };
     }, [activeAudioPlayer]);

     const handleAudioPlay = useCallback((event: React.SyntheticEvent<HTMLAudioElement>) => {
         const currentPlayer = event.currentTarget;
         if (activeAudioPlayer && activeAudioPlayer !== currentPlayer) {
             activeAudioPlayer.pause();
         }
         setActiveAudioPlayer(currentPlayer);
     }, [activeAudioPlayer]);


    const filteredExamsByLevelSkill = useMemo((): Exam[] => {
        if (!allExams) return [];
        return allExams.filter(exam => exam?.level === selectedLevel && exam?.skill === selectedSkill && exam?.instruction_groups && exam.instruction_groups.length > 0) || [];
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
        const validSelectedInstructions = selectedInstructions.filter(instr => instructionsForLevelSkill.includes(instr));
        if (validSelectedInstructions.length !== selectedInstructions.length) {
             setSelectedInstructions(validSelectedInstructions);
        }

        return instructionsForLevelSkill.map(instruction => ({
            value: instruction,
            label: normalizeInstruction(instruction)
        }));
    }, [selectedLevel, selectedSkill, selectedInstructions]);

    const groupsToDisplay = useMemo((): DisplayGroup[] => {
        const selectedRanges: { start: number, end: number }[] = selectedInstructions
            .map(extractRange)
            .filter((range): range is { start: number, end: number } => range !== undefined);

        if (selectedRanges.length === 0) {
             return [];
        }

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
                        Array.isArray(q.options) && q.options.length > 0 && !!q.content?.type
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

    const handlePracticeAnswerSelect = useCallback((uniqueQuestionId: string, optionIndex: number) => {
        setPracticeAnswers(prev => ({ ...prev, [uniqueQuestionId]: optionIndex }));
    }, []);


    if (!hasHydrated) {
        // Removed bg-gray-50 from the loading state container
        return (
            <div className="font-sans p-4 md:p-8 min-h-screen animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-6 mx-auto"></div>
                <div className="bg-white p-6 rounded-lg shadow-sm mb-8 space-y-4 md:space-y-0 md:grid md:grid-cols-3 md:gap-6">
                    <div className="h-10 bg-gray-100 rounded"></div>
                    <div className="h-10 bg-gray-100 rounded"></div>
                    <div className="h-10 bg-gray-100 rounded"></div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-3"></div>
                    <div className="h-12 animate-pulse bg-gray-100 rounded"></div>
                     <div className="h-8 animate-pulse bg-gray-100 rounded mt-3 w-1/2"></div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="h-48 animate-pulse bg-gray-100 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        // Removed bg-gray-50 from the main container
        <div data-selectable-area="true" className="font-sans max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-8">
            <h1 className="text-center text-gray-800 text-2xl md:text-3xl font-bold mb-10 md:mb-12">
                Luyện tập theo dạng yêu cầu
            </h1>

            <PracticeFilters
                selectedLevel={selectedLevel}
                setSelectedLevel={setSelectedLevel}
                selectedSkill={selectedSkill}
                setSelectedSkill={setSelectedSkill}
                selectedExamId={selectedExamId}
                setSelectedExamId={setSelectedExamId}
                selectedInstructions={selectedInstructions}
                setSelectedInstructions={setSelectedInstructions}
                filteredExamsByLevelSkill={filteredExamsByLevelSkill}
                instructionTypeOptions={instructionTypeOptions}
            />

            {selectedInstructions.length > 0 ? (
                <>
                    <PracticeQuestionList
                        groupsToDisplay={groupsToDisplay}
                        practiceAnswers={practiceAnswers}
                        handlePracticeAnswerSelect={handlePracticeAnswerSelect}
                        selectedSkill={selectedSkill}
                        // handleAudioPlay={handleAudioPlay}
                        selectedExamId={selectedExamId}
                        selectedLevel={selectedLevel}
                        selectedSkillForMessage={selectedSkill}
                    />
                </>
            ) : (
                <div className="text-center text-gray-600 mt-16 text-lg bg-white p-8 rounded-lg shadow-sm">
                    Vui lòng chọn ít nhất một dạng yêu cầu để bắt đầu luyện tập.
                </div>
            )}
        </div>
    );
};

export default PracticeByTypeClient;