import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { api } from '@/lib/configAxios';

ChartJS.register(ArcElement, Tooltip, Legend);

interface StatisticPieChartProps {
  userId: string;
  hardcodedInstructions: Record<string, Record<string, string[]>>;
  selectedLevel: string;
  selectedSkill: string;
  refreshKey?: any;
}

// --- Reusable hook for statistics ---
export function parseQuestionId(questionId: string) {
  // Ví dụ: 41-II-listening-test_2
  const match = questionId.match(/^\d+-(I|II)-(listening|reading)-test_(\d+)$/i);
  if (!match) return null;
  const [, levelRaw, skillRaw, numStr] = match;
  const level = levelRaw === 'I' ? 'TOPIK Ⅰ' : 'TOPIK Ⅱ';
  const skill = skillRaw === 'listening' ? '듣기' : '읽기';
  const number = parseInt(numStr, 10);
  return { level, skill, number };
}

export function usePracticeStatistics(userId: string, hardcodedInstructions: Record<string, Record<string, string[]>>, selectedLevel: string, selectedSkill: string, refreshKey?: any) {
  const [practiceHistory, setPracticeHistory] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!userId) return;
    setLoading(true);
    api.get('/practice-history')
      .then(data => {
        if (data.history) setPracticeHistory(data.history);
        else setPracticeHistory([]);
      })
      .catch(() => setPracticeHistory([]))
      .finally(() => setLoading(false));
  }, [userId, refreshKey]);

  // Hàm lấy instruction cho 1 questionId dựa vào hardcodedInstructions
  function getInstructionForQuestion(questionId: string, instructions: string[]): string | undefined {
    const match = questionId.match(/test[_-](\d+)/);
    if (!match) return undefined;
    const qNum = parseInt(match[1], 10);
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

  const instructionList = React.useMemo(() => {
    return (hardcodedInstructions[selectedLevel]?.[selectedSkill] || []).filter(Boolean);
  }, [selectedLevel, selectedSkill, hardcodedInstructions]);

  const instructionStats = React.useMemo(() => {
    const stats: Record<string, { total: number; correct: number }> = {};
    instructionList.forEach(instruction => {
      stats[instruction] = { total: 0, correct: 0 };
    });
    // Lọc practiceHistory theo đúng level/skill
    const filteredHistory = practiceHistory.filter(h => {
      const parsed = parseQuestionId(h.questionId);
      return parsed && parsed.level === selectedLevel && parsed.skill === selectedSkill;
    });
    filteredHistory.forEach(h => {
      const instr = getInstructionForQuestion(h.questionId, instructionList);
      if (instr && stats[instr]) {
        stats[instr].total++;
        if (h.isCorrect) stats[instr].correct++;
      }
    });
    return stats;
  }, [practiceHistory, instructionList, selectedLevel, selectedSkill]);

  const filteredInstructions = Object.keys(instructionStats).filter(instr => instructionStats[instr].total > 0);

  return {
    loading,
    instructionList,
    instructionStats,
    filteredInstructions,
    practiceHistory,
  };
}

export const StatisticPieChart: React.FC<StatisticPieChartProps> = ({ userId, hardcodedInstructions, selectedLevel, selectedSkill, refreshKey }) => {
  const { loading, instructionStats, filteredInstructions } = usePracticeStatistics(userId, hardcodedInstructions, selectedLevel, selectedSkill, refreshKey);

  const pieData = React.useMemo(() => {
    const labels = filteredInstructions;
    const data = labels.map(instr => instructionStats[instr].total);
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
  }, [filteredInstructions, instructionStats]);

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'right' as const, labels: { font: { size: 15 }, boxWidth: 22 } },
      tooltip: {
        callbacks: {
          label: function(context: import('chart.js').TooltipItem<'pie'>) {
            const label = context.label || '';
            const value = context.raw as number;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percent = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} câu (${percent}%)`;
          }
        }
      },
      title: { display: false }
    }
  };

  if (loading) return <div className="text-center py-8">Đang tải thống kê...</div>;

  return (
    <div className="bg-white rounded-xl border border-gray-200 text-gray-800 max-w-3xl mx-auto shadow-sm p-6 my-8">
      <h2 className="text-lg font-semibold mb-4 text-center">Thống kê theo từng dạng</h2>
      {filteredInstructions.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-gray-500 py-12">
          <svg width="48" height="48" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#f3f4f6"/><path d="M8 12h4m0 0h4m-4 0v4m0-4V8" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <div className="mt-3 text-lg font-medium">Chưa có dữ liệu thống kê. Hãy luyện tập để xem thống kê!</div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row md:items-center gap-8">
          <div className="w-full md:w-1/2 flex justify-center">
            <Pie
              data={pieData}
              options={pieOptions}
              height={320}
            />
          </div>
          <div className="w-full md:w-1/2 overflow-x-auto">
            <table className="w-full text-sm mb-6 border rounded-lg overflow-hidden">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="py-2 px-2 text-left">Dạng</th>
                  <th className="py-2 px-2 text-left">Số câu đã làm</th>
                  <th className="py-2 px-2 text-left">Tỉ lệ đúng</th>
                </tr>
              </thead>
              <tbody>
                {filteredInstructions.map(instruction => {
                  const stat = instructionStats[instruction];
                  const percent = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
                  let percentClass = 'text-gray-700';
                  if (percent >= 70) percentClass = 'text-green-600 font-semibold';
                  else if (percent >= 40) percentClass = 'text-yellow-600 font-semibold';
                  else percentClass = 'text-red-600 font-semibold';
                  return (
                    <tr key={instruction} className="border-b last:border-0 hover:bg-blue-50/30 transition">
                      <td className="py-2 px-2 font-medium text-gray-700">{instruction}</td>
                      <td className="py-2 px-2">{stat.total}</td>
                      <td className={`py-2 px-2 ${percentClass}`}>{stat.total > 0 ? `${percent}%` : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatisticPieChart; 