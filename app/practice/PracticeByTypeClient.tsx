'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Select, { MultiValue } from 'react-select';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

// Import types from the new types.ts file
import { Exam, InstructionGroup, Question, Option, QuestionContent, SharedContent, ReactSelectOption, PracticeConfig, DisplayGroup } from './types'; // Adjust import path

// Import helper functions from the new utils.ts file
import { extractRange, isNumberInRange, normalizeInstruction } from './utils';

// Import new components
import PracticeFilters from './PracticeFilters'; // Adjust import path
import PracticeQuestionList from './PracticeQuestionList'; // Adjust import path
import { useAuthStore } from '../store/authStore';
import { usePracticeStatistics, parseQuestionId, StatisticPieChart } from './StatisticPieChart';
import { api } from '@/lib/configAxios';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

// --- HARDCODED INSTRUCTIONS DATA ---
export const hardcodedInstructions: { [level: string]: { [skill: string]: string[] } } = {
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

const FILTER_ALL = 'all';
const FILTER_DONE = 'done';
const FILTER_UNDONE = 'undone';
const FILTER_STATISTIC = 'statistic';

const FILTER_LABELS: Record<string, string> = {
    [FILTER_ALL]: 'Tất cả',
    [FILTER_DONE]: 'Các câu đã làm',
    [FILTER_UNDONE]: 'Các câu chưa làm',
    [FILTER_STATISTIC]: 'Thống kê',
};

// Hàm gọi API lưu lịch sử
  async function savePracticeHistory({ questionId, answer, isCorrect }: { questionId: string, answer: number, isCorrect: boolean }) {
    try {
      const res = await api.post('/practice-history', {
        questionId,
        answer,
        isCorrect,
        timestamp: new Date().toISOString()
      });
      return res;
    } catch (error: any) {
      console.error('Error saving practice history:', error);
      throw error;
    }
  }

// Hàm lấy instruction cho 1 questionId dựa vào hardcodedInstructions
function getInstructionForQuestion(questionId: string, skill: string, instructions: string[]): string | undefined {
  // questionId ví dụ: 41-I-listening-test_1
  // skill ví dụ: '듣기'
  // instructions: hardcodedInstructions[level][skill]
  // Tách số câu
  const match = questionId.match(/test[_-](\d+)/);
  if (!match) return undefined;
  const qNum = parseInt(match[1], 10);
  // Tìm instruction phù hợp
  for (const instr of instructions) {
    const rangeMatch = instr.match(/\[(\d+)~(\d+)\]/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      if (qNum >= start && qNum <= end) return instr;
    }
  }
  return undefined;
}

const PracticeByTypeClient: React.FC<PracticeByTypeClientProps> = ({ allExams }) => {
    const LOCAL_STORAGE_KEY = 'practiceTypeConfig_v5_reactSelectUI';

    const initialConfig = useMemo(() => getInitialStateFromLocalStorage<PracticeConfig>(LOCAL_STORAGE_KEY, { level: 'TOPIK Ⅰ', skill: '듣기', examId: 'all', selectedInstructions: [] }), []);

    const [selectedLevel, setSelectedLevel] = useState<string>(initialConfig.level);
    const [selectedSkill, setSelectedSkill] = useState<string>(initialConfig.skill);
    const [selectedExamId, setSelectedExamId] = useState<string>(initialConfig.examId);
    const [selectedInstructions, setSelectedInstructions] = useState<string[]>(initialConfig.selectedInstructions);
    const [activeAudioPlayer, setActiveAudioPlayer] = useState<HTMLAudioElement | null>(null);
    const [practiceHistory, setPracticeHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const { currentUser, openLoginModal } = useAuthStore();
    const [activeFilter, setActiveFilter] = useState<string>(FILTER_ALL);

    const [hasHydrated, setHasHydrated] = useState(false);
    const [localAnsweredIds, setLocalAnsweredIds] = useState<Set<string>>(new Set());
    const [pendingAnsweredIds, setPendingAnsweredIds] = useState<Set<string>>(new Set());
    const [pendingPracticeHistory, setPendingPracticeHistory] = useState<any[]>([]);

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

    // Khi user đã đăng nhập và trang đã hydrate, fetch lịch sử và set lại practiceHistory
    useEffect(() => {
      if (hasHydrated && currentUser?._id) {
        setLoadingHistory(true);
        api.get('/practice-history')
          .then(data => {
            if (data.history && Array.isArray(data.history)) {
              setPracticeHistory(data.history);
            } else {
              setPracticeHistory([]);
            }
          })
          .catch(() => setPracticeHistory([]))
          .finally(() => setLoadingHistory(false));
      }
    }, [hasHydrated, currentUser]);

    // Thống kê
    const stats = useMemo(() => {
      const total = practiceHistory.length;
      const correct = practiceHistory.filter(h => h.isCorrect).length;
      const wrong = total - correct;
      const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
      return { total, correct, wrong, percent };
    }, [practiceHistory]);

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
        if (currentUser?._id) {
            let foundQuestion: Question | undefined;
            for (const group of groupsToDisplay) {
                if (!Array.isArray(group.questions)) continue;
                const q = group.questions.find(q => (group.examId || '') + '-' + q.id === uniqueQuestionId);
                if (q) {
                    foundQuestion = q;
                    break;
                }
            }
            if (foundQuestion && Array.isArray(foundQuestion.options) && foundQuestion.options[optionIndex]) {
                const isCorrect = !!foundQuestion.options[optionIndex].is_correct;
                if (activeFilter === FILTER_UNDONE) {
                    // Chỉ lưu tạm, chưa cập nhật vào practiceHistory/localAnsweredIds
                    setPendingAnsweredIds(prev => new Set(prev).add(uniqueQuestionId));
                    setPendingPracticeHistory(prev => {
                        const filtered = prev.filter(h => h.questionId !== uniqueQuestionId);
                        return [...filtered, { userId: currentUser._id, questionId: uniqueQuestionId, answer: optionIndex, isCorrect, timestamp: new Date().toISOString() }];
                    });
                } else {
                    // Cập nhật ngay như cũ
                    setPracticeHistory(prev => {
                        const filtered = prev.filter(h => h.questionId !== uniqueQuestionId);
                        return [...filtered, { userId: currentUser._id, questionId: uniqueQuestionId, answer: optionIndex, isCorrect, timestamp: new Date().toISOString() }];
                    });
                    setLocalAnsweredIds(prev => new Set(prev).add(uniqueQuestionId));
                }
                savePracticeHistory({
                    questionId: uniqueQuestionId,
                    answer: optionIndex,
                    isCorrect
                });
            }
        }
    }, [currentUser, groupsToDisplay, activeFilter]);

    // Khi chuyển tab khỏi FILTER_UNDONE, merge pending vào state chính
    useEffect(() => {
        if (activeFilter !== FILTER_UNDONE && (pendingAnsweredIds.size > 0 || pendingPracticeHistory.length > 0)) {
            setLocalAnsweredIds(prev => {
                const merged = new Set(prev);
                pendingAnsweredIds.forEach(id => merged.add(id));
                return merged;
            });
            setPracticeHistory(prev => {
                const filtered = prev.filter(h => !pendingAnsweredIds.has(h.questionId));
                return [...filtered, ...pendingPracticeHistory];
            });
            setPendingAnsweredIds(new Set());
            setPendingPracticeHistory([]);
        }
    }, [activeFilter]);

    // Cập nhật filteredGroupsToDisplay để chỉ lọc theo practiceHistory, localAnsweredIds, pending khi ở FILTER_UNDONE
    const filteredGroupsToDisplay = useMemo(() => {
        if (!groupsToDisplay) return [];
        let doneSet = new Set([
            ...practiceHistory.map(h => h.questionId),
            ...localAnsweredIds
        ]);
        if (activeFilter === FILTER_UNDONE) {
            // Khi ở tab chưa làm, chưa loại bỏ các câu vừa làm tạm thời
            doneSet = new Set([
                ...practiceHistory.map(h => h.questionId),
                ...localAnsweredIds,
                // KHÔNG thêm pendingAnsweredIds vào doneSet ở đây
            ]);
        }
        return groupsToDisplay.map(group => ({
            ...group,
            questions: Array.isArray(group.questions) ? group.questions.filter(q => {
                const examId = group.examId || '';
                const uniqueId = examId + '-' + q.id;
                if (activeFilter === FILTER_DONE) return doneSet.has(uniqueId);
                if (activeFilter === FILTER_UNDONE) return !doneSet.has(uniqueId);
                return true;
            }) : []
        })).filter(group => Array.isArray(group.questions) && group.questions.length > 0);
    }, [groupsToDisplay, practiceHistory, localAnsweredIds, activeFilter]);

    // Khi đổi bộ đề, reset localAnsweredIds
    useEffect(() => {
      setLocalAnsweredIds(new Set());
    }, [selectedInstructions, selectedLevel, selectedSkill, selectedExamId, hasHydrated]);

    // Fetch all practiceHistory once for the user
    const { practiceHistory: practiceHistoryStats } = usePracticeStatistics(
      currentUser?._id || '',
      hardcodedInstructions,
      'TOPIK Ⅰ', // dummy, just to get practiceHistory
      '듣기',
      activeFilter
    );

    const pieData = useMemo(() => {
      const labels = practiceHistoryStats.map(h => h.questionId);
      const data = labels.map(id => {
        const parsed = parseQuestionId(id);
        return parsed && parsed.level === selectedLevel && parsed.skill === selectedSkill ? 1 : 0;
      });
      return {
        labels,
        datasets: [
          {
            data,
            backgroundColor: [
              '#3b82f6', '#10b981', '#f59e42', '#ef4444', '#a78bfa', '#f472b6', '#facc15', '#38bdf8', '#34d399', '#fb7185', '#6366f1', '#fbbf24', '#eab308', '#14b8a6', '#8b5cf6', '#f87171', '#f472b6', '#fcd34d', '#60a5fa', '#4ade80', '#fbbf24', '#f87171', '#a3e635', '#f472b6', '#f59e42', '#fbbf24', '#f472b6', '#f87171', '#a78bfa', '#f59e42'
            ],
            borderWidth: 2,
            borderColor: '#fff',
            hoverOffset: 8,
          }
        ]
      };
    }, [practiceHistoryStats, selectedLevel, selectedSkill]);

    const pieOptions = {
      responsive: true,
      plugins: {
        legend: { position: 'right' as const, labels: { font: { size: 15 }, boxWidth: 22 } },
        tooltip: {
          callbacks: {
            label: function(context: import('chart.js').TooltipItem<'pie'>) {
              const label = context.label || '';
              const value = Number(context.raw);
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percent = total > 0 ? Math.round((value / total) * 100) : 0;
              return `${label}: ${value} câu (${percent}%)`;
            }
          }
        },
        title: { display: false }
      }
    };

    const getAnsweredIndex = useCallback((uniqueQuestionId: string) => {
      if (activeFilter === FILTER_UNDONE) {
        const pending = pendingPracticeHistory.find((h: any) => h.questionId === uniqueQuestionId);
        if (pending) return pending.answer;
      }
      const done = practiceHistory.find((h: any) => h.questionId === uniqueQuestionId);
      if (done && typeof done.answer !== 'undefined') return done.answer;
      return undefined;
    }, [practiceHistory, pendingPracticeHistory, activeFilter]);

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
        <div>
            <div data-selectable-area="true" className="font-sans max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-8">
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
                {/* Thêm 4 option radio filter dưới đây */}
                <div className="flex justify-center gap-6 mt-6 mb-8">
                    {[FILTER_ALL, FILTER_DONE, FILTER_UNDONE, FILTER_STATISTIC].map(f => (
                        <label key={f} className={`flex items-center cursor-pointer font-medium text-base ${activeFilter === f ? 'text-blue-700' : 'text-gray-600'}`}>
                            <input
                                type="radio"
                                name="practice-filter"
                                value={f}
                                checked={activeFilter === f}
                                onChange={() => setActiveFilter(f)}
                                className="accent-blue-600 mr-2"
                            />
                            {FILTER_LABELS[f]}
                        </label>
                    ))}
                </div>
                {/* Hiển thị nút đăng nhập nếu chưa đăng nhập và chọn filter cần đăng nhập */}
                {(['done', 'undone', 'statistic'].includes(activeFilter) && !currentUser) && (
                  <div className="flex flex-col items-center mb-8">
                    <button
                      onClick={() => openLoginModal()}
                      className="px-6 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 transition-colors font-medium mt-2"
                    >
                      Đăng nhập để sử dụng tính năng này
                    </button>
                  </div>
                )}
                {activeFilter === FILTER_STATISTIC ? (
                    <section className="my-12">
                      <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 dark:text-slate-200 mb-10 text-center sm:text-left">Thống kê theo từng dạng (Tất cả kỹ năng & cấp độ)</h2>
                      <div className="grid grid-cols-1 gap-10">
                        {['TOPIK Ⅰ', 'TOPIK Ⅱ'].map(level =>
                          ['듣기', '읽기'].map(skill => {
                            const hasData = practiceHistoryStats.some(h => {
                              const parsed = parseQuestionId(h.questionId);
                              return parsed && parsed.level === level && parsed.skill === skill;
                            });
                            if (!hasData) return null;
                            return (
                              <div key={level + '-' + skill} className="mb-8">
                                <h3 className="text-lg font-bold mb-2 text-center">{level} - {skill}</h3>
                                <StatisticPieChart
                                  userId={currentUser?._id || ''}
                                  hardcodedInstructions={hardcodedInstructions}
                                  selectedLevel={level}
                                  selectedSkill={skill}
                                  refreshKey={activeFilter}
                                />
                              </div>
                            );
                          })
                        )}
                      </div>
                    </section>
                ) : (
                    selectedInstructions.length > 0 ? (
                        <>
                            <PracticeQuestionList
                                groupsToDisplay={filteredGroupsToDisplay}
                                handlePracticeAnswerSelect={handlePracticeAnswerSelect}
                                selectedSkill={selectedSkill}
                                selectedExamId={selectedExamId}
                                selectedLevel={selectedLevel}
                                selectedSkillForMessage={selectedSkill}
                                getAnsweredIndex={getAnsweredIndex}
                            />
                        </>
                    ) : (
                        <div className="text-center text-gray-600 mt-16 text-lg bg-white p-8 rounded-lg shadow-sm">
                            Vui lòng chọn ít nhất một dạng yêu cầu để bắt đầu luyện tập.
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default PracticeByTypeClient;