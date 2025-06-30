// app/my-progress/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Import nếu bạn cần redirect
import { useAuthStore } from './../store/authStore'; // Điều chỉnh đường dẫn cho chính xác

// Import cho Chart.js và react-chartjs-2
import { Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TooltipItem,      // Kiểu cho context của tooltip callback
  ChartOptions,     // Kiểu chính cho options của Chart
  ScriptableContext, // Cho các giá trị có thể là hàm (ví dụ: backgroundColor)
  ChartData,        // Kiểu cho data của Chart
  ChartDataset      // Kiểu cho dataset
} from 'chart.js';

import { usePracticeStatistics, parseQuestionId } from '../practice/StatisticPieChart';
import { hardcodedInstructions } from '../practice/PracticeByTypeClient';
import InstructionStatsChart from '../components/InstructionStatsChart';

// Đăng ký các thành phần cần thiết cho Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const NEXT_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// --- Types ---
interface ScoreProgressionItem {
  date: string; // ISO date string
  examName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
}
interface ProgressData {
  totalExamsTaken: number;
  overallAverageScorePercentage: number;
  averageBySkill: Record<string, number>;
  averageByLevel: Record<string, number>;
  scoreProgression: ScoreProgressionItem[];
}

// --- Helper Components (Inline cho đầy đủ) ---
const StatCard: React.FC<{ title: string; value: string | number; unit?: string, className?: string, icon?: React.ReactNode }> = 
  ({ title, value, unit, className, icon }) => (
  <div className={`bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-between min-h-[120px] ${className}`}>
    <div className="flex items-start justify-between mb-1">
        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</h3>
        {icon && <div className="text-slate-400 dark:text-slate-500 opacity-70">{icon}</div>}
    </div>
    <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-slate-100">
      {value}{unit && <span className="text-base font-normal ml-1">{unit}</span>}
    </p>
  </div>
);

const BookOpenIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>;
const ChartBarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;
const SkillIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>;
const LevelIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" /></svg>;
// --- Hết Helper Components ---


export default function MyProgressPage() {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.currentUser);
  const isLoadingAuth = useAuthStore((state) => state._isLoadingAuth); // Sử dụng _isLoadingAuth
  const logout = useAuthStore((state) => state.logout);
  const openLoginModal = useAuthStore(state => state.openLoginModal);
  const router = useRouter();
  
  const [hasAttemptedInitialFetch, setHasAttemptedInitialFetch] = useState(false);

  // Thêm state chọn level/skill nếu muốn cho phép người dùng chọn
  const [selectedLevel, setSelectedLevel] = useState('TOPIK Ⅰ');
  const [selectedSkill, setSelectedSkill] = useState('듣기');

  // Thống kê dạng câu (dùng chung hook)
  const { loading: loadingStats, instructionStats, filteredInstructions } = usePracticeStatistics(
    currentUser?._id || '',
    hardcodedInstructions,
    selectedLevel,
    selectedSkill
  );

  // Fetch all practiceHistory once for the user
  const { practiceHistory } = usePracticeStatistics(
    currentUser?._id || '',
    hardcodedInstructions,
    'TOPIK Ⅰ', // dummy, chỉ cần lấy practiceHistory
    '듣기'
  );

  const fetchProgressData = useCallback(async () => {
    // isClient đã được kiểm tra ở useEffect gọi hàm này
    const currentToken = useAuthStore.getState().token;
    const user = useAuthStore.getState().currentUser;

    if (!currentToken || !user) {
      if (isClient) { // Chỉ set lỗi và mở modal nếu đã ở client
          setError("Bạn cần đăng nhập để xem tiến độ học tập.");
          if (!user && !currentToken) { 
            openLoginModal(() => { 
                setHasAttemptedInitialFetch(false); // Cho phép fetch lại khi login thành công
                setIsLoading(true); // Reset để UI loading hiển thị đúng
                setError(null); // Xóa lỗi cũ
            });
          }
      }
      setIsLoading(false); 
      return;
    }

    setIsLoading(true); 
    setError(null);
    try {
      const response = await fetch(`${NEXT_API_BASE_URL}/progress-stats`, {
        headers: { 'Authorization': `Bearer ${currentToken}` },
      });
      if (response.status === 401 || response.status === 403) {
        if(isClient) alert("Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.");
        logout(); 
        openLoginModal(() => { setHasAttemptedInitialFetch(false); setIsLoading(true); setError(null);});
        setIsLoading(false); // Đặt ở đây để UI không bị kẹt nếu throw Error
        throw new Error("Unauthorized"); 
      }
      if (!response.ok) {
        const errData = await response.json().catch(() => ({message: "Lỗi không xác định từ server"}));
        throw new Error(errData.message || `Lỗi API: ${response.statusText}`);
      }
      const data: ProgressData = await response.json();
      setProgressData(data);
    } catch (err: any) {
      if (err.message !== "Unauthorized") {
        setError(err.message || 'Không thể tải dữ liệu tiến độ.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isClient, logout, openLoginModal]);

  useEffect(() => {
    if (isClient && !isLoadingAuth) { 
      if (currentUser && token) {
        if (!hasAttemptedInitialFetch && !error) { 
            fetchProgressData();
            setHasAttemptedInitialFetch(true);
        }
      } else {
        if (!error) setError("Vui lòng đăng nhập để xem tiến độ học tập của bạn."); // Chỉ set lỗi nếu chưa có lỗi khác
        setIsLoading(false); 
        setHasAttemptedInitialFetch(true);
      }
    }
  }, [isClient, isLoadingAuth, currentUser, token, fetchProgressData, hasAttemptedInitialFetch, error]);

  const formatDateForChart = useCallback((dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', { month: '2-digit', day: '2-digit', year: '2-digit' });
    } catch { return "N/A"; }
  }, []);
  
  const chartData = useMemo((): ChartData<'line', number[], string> => {
    if (!isClient || !progressData?.scoreProgression || progressData.scoreProgression.length === 0) {
      return { labels: [], datasets: [] as ChartDataset<'line', number[]>[] };
    }
    const sortedProgression = [...progressData.scoreProgression].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const datasetItem: ChartDataset<'line', number[]> = {
        label: 'Điểm luyện thi (%)',
        data: sortedProgression.map(p => p.percentage),
        fill: true,
        borderColor: 'rgb(59, 130, 246)', 
        backgroundColor: (context: ScriptableContext<"line">) => {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) return 'rgba(59, 130, 246, 0.1)';
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)');
          return gradient;
        },
        tension: 0.3, 
        pointRadius: 4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointHoverRadius: 7,
        pointHoverBorderWidth: 2,
        pointHoverBackgroundColor: 'rgb(59, 130, 246)',
        pointHoverBorderColor: '#fff',
    };

    return {
      labels: sortedProgression.map(p => formatDateForChart(p.date)),
      datasets: [datasetItem],
    };
  }, [progressData, isClient, formatDateForChart]);

  const chartOptions = useMemo((): ChartOptions<'line'> => {
    if (!isClient) return { responsive: true, maintainAspectRatio: false };
    
    const isDarkMode = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const tickColor = isDarkMode ? '#94a3b8' : '#6b7280'; 
    const titleColor = isDarkMode ? '#e2e8f0' : '#1f2937'; 
    const legendColor = isDarkMode ? '#cbd5e1' : '#4b5563'; 
    const gridColor = isDarkMode ? 'rgba(71, 85, 105, 0.2)' : 'rgba(226, 232, 240, 0.4)';

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
          labels: { font: { size: 12, family: 'Inter, system-ui, sans-serif' }, color: legendColor, padding: 20 }
        },
        title: {
          display: true,
          text: 'Biểu đồ Tiến độ Điểm số Theo Thời Gian',
          font: { size: 18, weight: 600, family: 'Inter, system-ui, sans-serif' }, // weight là number
          padding: { top: 10, bottom: 25 },
          color: titleColor
        },
        tooltip: {
          enabled: true,
          backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(17, 24, 39, 0.9)',
          titleColor: '#fff',
          bodyColor: '#e5e7eb',
          titleFont: { size: 13, weight: 'bold' as const, family: 'Inter, system-ui, sans-serif' },
          bodyFont: { size: 12, family: 'Inter, system-ui, sans-serif' },
          padding: 12, cornerRadius: 6, boxPadding: 4,
          borderColor: isDarkMode ? 'rgba(100,116,139,0.5)' : 'rgba(107,114,128,0.3)',
          borderWidth: 1,
          callbacks: {
              label: function(context: TooltipItem<'line'>) { 
                  let labelParts: string[] = [];
                  const datasetLabelText = context.dataset.label || '';
                  if (datasetLabelText) { 
                    labelParts.push(`${datasetLabelText}: ${context.parsed.y !== null ? context.parsed.y + '%' : 'N/A'}`);
                  } else if (context.parsed.y !== null) {
                    labelParts.push(`${context.parsed.y}%`);
                  }
                  
                  const dataIndex = context.dataIndex;
                  // Đảm bảo progressData và scoreProgression tồn tại
                  if (progressData && progressData.scoreProgression && dataIndex < progressData.scoreProgression.length) {
                    const sortedProgressionForTooltip = [...progressData.scoreProgression].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                    const examName = sortedProgressionForTooltip[dataIndex]?.examName;
                    if (examName) {
                        labelParts.push(`Đề: ${examName.length > 35 ? examName.substring(0, 32) + '...' : examName}`);
                    }
                  }
                  return labelParts;
              }
          }
        }
      },
      scales: {
        y: {
            beginAtZero: true,
            max: 100,
            ticks: { /* ... */ },
            grid: { 
              color: gridColor, 
              // drawBorder: false, // XÓA DÒNG NÀY
            },
            border: { // THÊM HOẶC SỬA ĐỐI TƯỢNG NÀY
              display: false, // Ẩn đường viền của trục Y
              // dash: [5, 5], // Ví dụ: làm đường viền đứt nét
              // color: 'red',
              // width: 1
            }
          },
          // Tương tự cho trục x nếu cần
          x: {
            ticks: { /* ... */ },
            grid: { 
              display: false // Ẩn các đường lưới của trục X
            },
            border: {
                display: false // Ẩn đường viền của trục X
            }
          }
      },
      interaction: { mode: 'index' as const, intersect: false },
      elements: {
        line: { tension: 0.3 },
        point: { radius: 3, hoverRadius: 6, hoverBorderWidth: 2, backgroundColor: 'rgb(59, 130, 246)' }
      }
    };
  }, [progressData, isClient]); 

  // ---- RENDER LOGIC ----
  if (!isClient || isLoadingAuth) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-900 p-4">
        <svg className="mx-auto h-12 w-12 text-sky-500 dark:text-sky-400 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        <p className="mt-4 text-lg font-medium">
            {!isClient ? "Đang khởi tạo..." : "Đang kiểm tra đăng nhập..."}
        </p>
      </div>
    );
  }
  
  if (isLoading && !error && !progressData) { // Chỉ hiển thị loading này khi đang fetch lần đầu
    return (
      <div className="flex flex-col min-h-screen items-center justify-center text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-900 p-4">
        <svg className="mx-auto h-12 w-12 text-sky-500 dark:text-sky-400 animate-spin"  xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        <p className="mt-4 text-lg font-medium">Đang tải dữ liệu tiến độ...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 md:p-8 text-center min-h-screen flex flex-col justify-center items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100 mb-8">Tiến Độ Học Tập</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-md max-w-lg w-full" role="alert">
          <strong className="font-bold block text-lg mb-2">Lỗi!</strong>
          <span className="block"> {error}</span>
           {(error.includes("Vui lòng đăng nhập") || error.includes("Phiên hết hạn") || error.includes("Bạn cần đăng nhập")) && (
             <button 
                onClick={() => openLoginModal(() => { setHasAttemptedInitialFetch(false); setError(null); setIsLoading(true); })}
                className="mt-6 px-6 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 transition-colors font-medium"
            >Đăng nhập</button>
           )}
        </div>
      </div>
    );
  }
  
  if (!progressData || progressData.totalExamsTaken === 0) {
    return (
      <div className="container mx-auto p-6 md:p-8 text-center min-h-[calc(100vh-200px)] flex flex-col justify-center items-center">
         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-20 h-20 text-slate-400 dark:text-slate-500 mb-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12A2.25 2.25 0 0020.25 14.25V5.25A2.25 2.25 0 0018 3H6a2.25 2.25 0 00-2.25 2.25v.75M16.5 3.75V.75M18.75 3a2.25 2.25 0 00-2.25-2.25H9.75A2.25 2.25 0 007.5 3v1.5M15 13.5H9" />
        </svg>
        <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-3">Chưa có dữ liệu tiến độ</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
          Hãy bắt đầu làm bài thi để theo dõi sự tiến bộ của bạn và xem các phân tích chi tiết tại đây nhé!
        </p>
        <Link href="/exams" className="px-6 py-2.5 bg-sky-600 text-white font-medium rounded-lg hover:bg-sky-700 transition-colors shadow-md">
          Bắt đầu luyện thi
        </Link>
      </div>
    );
  }

  // Đảm bảo progressData không null trước khi render nội dung chính
  return (
    <div className="container mx-auto p-4 py-8 sm:p-6 lg:p-10 dark:bg-slate-900 min-h-screen">
      <header className="mb-10 md:mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-slate-100 tracking-tight">Tiến Độ Học Tập Của Tôi</h1>
      </header>

      {progressData && ( // Double check progressData is not null
        <>
            <section className="mb-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard title="Tổng bài đã làm" value={progressData.totalExamsTaken} icon={<BookOpenIcon />} className="bg-sky-50 dark:bg-sky-800/60 border border-sky-200 dark:border-sky-700"/>
                <StatCard title="Điểm TB chung" value={progressData.overallAverageScorePercentage} unit="%" icon={<ChartBarIcon />} className="bg-emerald-50 dark:bg-emerald-800/60 border border-emerald-200 dark:border-emerald-700"/>
                {Object.entries(progressData.averageBySkill).map(([skill, avgScore]) => (
                    <StatCard key={`skill-${skill}`} title={`TB Kỹ năng ${skill}`} value={avgScore} unit="%" icon={<SkillIcon />} className="bg-indigo-50 dark:bg-indigo-800/60 border border-indigo-200 dark:border-indigo-700" />
                ))}
                 {Object.entries(progressData.averageByLevel).map(([level, avgScore]) => (
                    <StatCard key={`level-${level}`} title={`TB Cấp độ ${level}`} value={avgScore} unit="%" icon={<LevelIcon />} className="bg-amber-50 dark:bg-amber-800/60 border border-amber-200 dark:border-amber-700" />
                ))}
            </section>

            <section className="mb-12">
                <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 dark:text-slate-200 mb-6 text-center sm:text-left">Biểu đồ tiến độ điểm số (%)</h2>
                <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-xl h-72 sm:h-80 md:h-96 border border-gray-200 dark:border-slate-700">
                {(isClient && progressData.scoreProgression && progressData.scoreProgression.length > 1 && chartData.datasets.length > 0 && chartData.datasets[0]?.data?.length > 0) ? (
                    <Line options={chartOptions} data={chartData} />
                ) : (
                    <p className="text-center text-gray-500 dark:text-slate-400 h-full flex items-center justify-center">
                    {(isClient && progressData.scoreProgression && progressData.scoreProgression.length <= 1) ? "Cần ít nhất 2 bài làm để vẽ biểu đồ tiến độ." : "Không đủ dữ liệu hoặc đang tải biểu đồ..."}
                    </p>
                )}
                </div>
            </section>

            <section>
                <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 dark:text-slate-200 mb-6 text-center sm:text-left">Lịch sử làm bài gần đây</h2>
                {progressData.scoreProgression && progressData.scoreProgression.length > 0 ? (
                    <div className="overflow-x-auto bg-white dark:bg-slate-800 shadow-xl rounded-xl border border-gray-200 dark:border-slate-700">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-100 dark:bg-slate-700">
                                <tr>
                                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Ngày làm</th>
                                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Tên đề thi</th>
                                    <th className="px-4 py-3.5 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Điểm</th>
                                    <th className="px-4 py-3.5 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Tỷ lệ (%)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                                {[...progressData.scoreProgression].reverse().slice(0, 10).map((session, index) => ( 
                                    <tr key={`${session.date}-${index}-${session.examName}`} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">{formatDateForChart(session.date)}</td>
                                        <td className="px-4 py-3 text-slate-700 dark:text-slate-200 font-medium max-w-xs truncate" title={session.examName}>{session.examName}</td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-right">{session.score}/{session.totalQuestions}</td>
                                        <td className="px-4 py-3 text-sky-600 dark:text-sky-400 text-right font-semibold">{session.percentage}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {progressData.scoreProgression.length > 10 && (
                            <div className="p-4 text-center border-t border-slate-200 dark:border-slate-700">
                                <Link href="/history" className="text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 font-medium text-sm transition-colors">
                                    Xem tất cả lịch sử làm bài &rarr;
                                </Link>
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-gray-500 dark:text-slate-400 py-6 text-center">Chưa có bài làm nào được ghi lại.</p>
                )}
            </section>
        </>
      )}
      {/* Thống kê dạng câu cho tất cả kỹ năng và cấp độ */}
      <section className="my-12">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 dark:text-slate-200 mb-10 text-center sm:text-left">Thống kê theo từng dạng (Tất cả kỹ năng & cấp độ)</h2>
        <div className="grid grid-cols-1 gap-10">
          {['TOPIK Ⅰ', 'TOPIK Ⅱ'].map(level =>
            ['듣기', '읽기'].map(skill => {
              const hasData = practiceHistory.some(h => {
                const parsed = parseQuestionId(h.questionId);
                return parsed && parsed.level === level && parsed.skill === skill;
              });
              if (!hasData) return null;
              return (
                <div key={level + '-' + skill} className="mb-8">
                  <h3 className="text-lg font-bold mb-2 text-center">{level} - {skill}</h3>
                  <InstructionStatsChart
                    userId={currentUser?._id || ''}
                    hardcodedInstructions={hardcodedInstructions}
                    selectedLevel={level}
                    selectedSkill={skill}
                  />
                </div>
              );
            })
          )}
        </div>
      </section>
      <div className="mt-12 text-center w-full">
        <Link href="/exams" className="px-6 py-3 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors shadow-md">
          Tiếp tục luyện thi
        </Link>
      </div>
    </div>
  );
}