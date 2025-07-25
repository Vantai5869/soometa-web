'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { topikISessions, topikIISessions, ExamSession, ExamFile } from '@/data/download-data';
import { api } from '@/lib/configAxios';

interface DownloadStats {
  [examFileId: string]: number;
}

type ExamFileWithSession = ExamFile & { sessionName: string; sessionId: string };

function getAllExamFiles(): ExamFileWithSession[] {
  const allSessions = [...topikISessions, ...topikIISessions];
  return allSessions.flatMap(session => session.exams.map(exam => ({
    ...exam,
    sessionName: session.name,
    sessionId: session.id
  })));
}

export default function DownloadStatsPage() {
  const [stats, setStats] = useState<DownloadStats>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const data = await api.get('/download-stats');
        if (data.success) setStats(data.data || {});
        else setStats({});
      } catch {
        setStats({});
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const allFiles = getAllExamFiles();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Thống kê lượt download các đề thi</h1>
      {loading ? (
        <div>Đang tải thống kê...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-slate-300">
            <thead>
              <tr className="bg-slate-100">
                <th className="px-3 py-2 border">Tên đề</th>
                <th className="px-3 py-2 border">Kỳ thi</th>
                <th className="px-3 py-2 border">Số lượt download</th>
                <th className="px-3 py-2 border">Xem đề</th>
              </tr>
            </thead>
            <tbody>
              {allFiles.map(file => (
                <tr key={file.id}>
                  <td className="px-3 py-2 border">{file.name}</td>
                  <td className="px-3 py-2 border">{file.sessionName}</td>
                  <td className="px-3 py-2 border text-center">{stats[file.id] || 0}</td>
                  <td className="px-3 py-2 border text-center">
                    <Link href={file.driveLink} target="_blank" className="text-blue-600 underline">Xem</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 