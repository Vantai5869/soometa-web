import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const HISTORY_PATH = path.join(process.cwd(), 'data', 'practice-history.json');

// POST: Lưu lịch sử làm bài (theo questionId, mỗi questionId có correctUsers, wrongUsers)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, questionId, answer, isCorrect, timestamp } = body;
    if (!userId || !questionId || typeof answer === 'undefined' || typeof isCorrect === 'undefined') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    let history: Record<string, any> = {};
    try {
      const file = await fs.readFile(HISTORY_PATH, 'utf-8');
      history = JSON.parse(file);
    } catch { history = {}; }
    if (!history[questionId]) {
      history[questionId] = { correctUsers: [], wrongUsers: [] };
    }
    // Xoá userId khỏi cả 2 mảng trước khi thêm lại
    history[questionId].correctUsers = history[questionId].correctUsers.filter((id: string) => id !== userId);
    history[questionId].wrongUsers = history[questionId].wrongUsers.filter((id: string) => id !== userId);
    if (isCorrect) {
      history[questionId].correctUsers.push(userId);
    } else {
      history[questionId].wrongUsers.push(userId);
    }
    await fs.writeFile(HISTORY_PATH, JSON.stringify(history, null, 2), 'utf-8');
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET: Lấy lịch sử làm bài theo userId (duyệt toàn bộ file)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    let history: Record<string, any> = {};
    try {
      const file = await fs.readFile(HISTORY_PATH, 'utf-8');
      history = JSON.parse(file);
    } catch { history = {}; }
    // Duyệt toàn bộ file, trả về các câu user đã làm
    const userHistory: any[] = [];
    Object.entries(history).forEach(([questionId, q]: [string, any]) => {
      if (Array.isArray(q.correctUsers) && q.correctUsers.includes(userId)) {
        userHistory.push({ questionId, isCorrect: true });
      } else if (Array.isArray(q.wrongUsers) && q.wrongUsers.includes(userId)) {
        userHistory.push({ questionId, isCorrect: false });
      }
    });
    return NextResponse.json({ success: true, data: userHistory });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 