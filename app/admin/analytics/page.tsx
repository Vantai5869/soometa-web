// app/admin/analytics/page.tsx
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useAuthStore, UserData } from '../../store/authStore'; // Import UserData
import { useRouter } from 'next/navigation';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar // Giữ lại nếu bạn muốn dùng BarChart
} from 'recharts';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

// Kiểu dữ liệu cho thông tin người dùng được trả về từ backend
interface UserInfoForStats {
  _id: string;
  email: string;
  name?: string; // Tên có thể không có
  role: 'user' | 'admin';
  subscriptionTier?: 'nomo' | 'premium' | null;
}

// Kiểu dữ liệu cho một mục thống kê hàng ngày từ API của bạn (Cập nhật)
interface DailyStats {
  date: string; // Ngày ở định dạng ISO string
  uniqueUsersCount: number; // Đã đổi tên để phản ánh rõ ràng hơn
  firstVisitTime: string; // Thời gian truy cập đầu tiên của nhóm
  lastVisitTime: string; // Thời gian truy cập cuối cùng của nhóm
  users: UserInfoForStats[]; // Mảng chứa thông tin của những người dùng duy nhất trong ngày
}

export default function AdminAnalyticsPage() {
  const { currentUser, token, _isLoadingAuth } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State để quản lý việc mở/đóng danh sách người dùng cho từng ngày
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  // Redirection và kiểm tra quyền admin (giữ nguyên)
  useEffect(() => {
    if (!_isLoadingAuth) {
      if (!currentUser || currentUser.role !== 'admin') {
        router.push('/');
      } else {
        fetchAnalyticsData();
      }
    }
  }, [currentUser, _isLoadingAuth, router]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const NEXT_PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${NEXT_PUBLIC_API_BASE_URL}/analytics/daily-user-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Lỗi khi tải dữ liệu thống kê.');
      }

      const data: DailyStats[] = await response.json();
      data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi không xác định.');
      console.error('Fetch analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(() => {
    return stats.map(s => ({
      name: format(new Date(s.date), 'dd/MM', { locale: vi }),
      'Người dùng duy nhất': s.uniqueUsersCount,
    }));
  }, [stats]);

  if (loading) {
    return (
      <div className="container mx-auto p-8 text-center text-gray-700 dark:text-gray-300">
        Đang tải dữ liệu thống kê...
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8 text-center text-red-600 dark:text-red-400">
        Lỗi: {error}. Vui lòng thử lại.
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div className="container mx-auto p-8 text-center text-gray-700 dark:text-gray-300">
        Chưa có dữ liệu thống kê nào để hiển thị.
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">Thống Kê Lượt Truy Cập Người Dùng Đã Đăng Nhập</h1>

      <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Biểu đồ Người Dùng Duy Nhất Hàng Ngày</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" className="dark:stroke-slate-600"/>
            <XAxis dataKey="name" stroke="#666" className="dark:stroke-slate-400" />
            <YAxis stroke="#666" className="dark:stroke-slate-400"/>
            <Tooltip
                contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    padding: '8px',
                    color: '#333'
                }}
                itemStyle={{ color: '#333' }}
                labelStyle={{ color: '#333' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Line
              type="monotone"
              dataKey="Người dùng duy nhất"
              stroke="#82ca9d"
              activeDot={{ r: 8 }}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Dữ liệu Chi tiết Người Dùng Truy Cập</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-300">
                  Ngày
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-300">
                  Người dùng duy nhất
                </th>
                 <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-300">
                  Truy cập lần đầu
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-300">
                  Truy cập lần cuối
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-300">
                  Chi tiết người dùng
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-slate-800 dark:divide-slate-700">
              {stats.map((stat) => (
                <React.Fragment key={stat.date}>
                  <tr className="hover:bg-gray-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {format(new Date(stat.date), 'PPPP', { locale: vi })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {stat.uniqueUsersCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {format(new Date(stat.firstVisitTime), 'p', { locale: vi })} {/* Chỉ hiển thị giờ */}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {format(new Date(stat.lastVisitTime), 'p', { locale: vi })} {/* Chỉ hiển thị giờ */}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {stat.users.length > 0 && (
                        <button
                          onClick={() => setExpandedDate(expandedDate === stat.date ? null : stat.date)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200"
                        >
                          {expandedDate === stat.date ? 'Ẩn' : 'Xem'} ({stat.users.length})
                        </button>
                      )}
                    </td>
                  </tr>
                  {/* Hàng chi tiết người dùng, chỉ hiển thị khi expandedDate khớp */}
                  {expandedDate === stat.date && stat.users.length > 0 && (
                    <tr className="bg-gray-100 dark:bg-slate-700">
                      <td colSpan={5} className="p-4">
                        <h4 className="text-md font-semibold mb-2 text-gray-800 dark:text-gray-200">
                          Danh sách người dùng truy cập ngày {format(new Date(stat.date), 'dd/MM/yyyy', { locale: vi })}:
                        </h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {stat.users.map((user) => (
                            <li key={user._id} className="text-sm text-gray-700 dark:text-gray-300">
                              <span className="font-medium">{user.name || user.email}</span>
                              {user.name && user.email && ` (${user.email})`}
                              {user.role === 'admin' && (
                                <span className="ml-2 px-1.5 py-0.5 text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100 rounded-full">Admin</span>
                              )}
                              {user.role === 'user' && user.subscriptionTier === 'premium' && (
                                <span className="ml-2 px-1.5 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100 rounded-full">Premium</span>
                              )}
                              {user.role === 'user' && user.subscriptionTier === 'nomo' && (
                                <span className="ml-2 px-1.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100 rounded-full">Nomo User</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}