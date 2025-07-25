import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const HISTORY_PATH = path.join(process.cwd(), 'data', 'practice-history.json');

// POST: Lưu lịch sử làm bài (theo questionId, mỗi questionId có correctUsers, wrongUsers)
export async function POST(request: NextRequest) {
  try {
    console.log('Practice history POST request received');
    
    const body = await request.json();
    const { userId, questionId, answer, isCorrect, timestamp } = body;
    
    console.log('Request data:', { userId, questionId, answer, isCorrect, timestamp });
    
    if (!userId || !questionId || typeof answer === 'undefined' || typeof isCorrect === 'undefined') {
      console.error('Missing required fields:', { userId, questionId, answer, isCorrect });
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: { userId: !!userId, questionId: !!questionId, answer: typeof answer, isCorrect: typeof isCorrect }
      }, { status: 400 });
    }
    
    console.log('Reading history file from:', HISTORY_PATH);
    let history: Record<string, any> = {};
    try {
      const file = await fs.readFile(HISTORY_PATH, 'utf-8');
      history = JSON.parse(file);
      console.log('Successfully loaded history, total questions:', Object.keys(history).length);
    } catch (fileError: any) {
      console.log('No existing history file or invalid JSON, creating new one:', fileError.message);
      history = {};
    }
    
    if (!history[questionId]) {
      history[questionId] = { correctUsers: [], wrongUsers: [], answers: [] };
      console.log('Created new entry for questionId:', questionId);
    }
    
    // Xoá userId khỏi cả 2 mảng trước khi thêm lại
    const wasInCorrect = history[questionId].correctUsers.includes(userId);
    const wasInWrong = history[questionId].wrongUsers.includes(userId);
    
    history[questionId].correctUsers = history[questionId].correctUsers.filter((id: string) => id !== userId);
    history[questionId].wrongUsers = history[questionId].wrongUsers.filter((id: string) => id !== userId);
    
    // Xoá bản ghi cũ của user trong answers
    history[questionId].answers = Array.isArray(history[questionId].answers)
      ? history[questionId].answers.filter((a: any) => a.userId !== userId)
      : [];
    // Thêm bản ghi mới vào answers
    history[questionId].answers.push({ userId, answer, isCorrect, timestamp });
    
    if (isCorrect) {
      history[questionId].correctUsers.push(userId);
      console.log(`User ${userId} answered correctly for question ${questionId}`);
    } else {
      history[questionId].wrongUsers.push(userId);
      console.log(`User ${userId} answered incorrectly for question ${questionId}`);
    }
    
    console.log('Writing updated history to file...');
    await fs.writeFile(HISTORY_PATH, JSON.stringify(history, null, 2), 'utf-8');
    console.log('Practice history saved successfully');
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Practice history POST error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message,
      type: error.name
    }, { status: 500 });
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
    // Duyệt toàn bộ file, trả về các câu user đã làm cùng đáp án đã chọn
    const userHistory: any[] = [];
    Object.entries(history).forEach(([questionId, q]: [string, any]) => {
      if (Array.isArray(q.answers)) {
        const answerObj = q.answers.find((a: any) => a.userId === userId);
        if (answerObj) {
          userHistory.push({ questionId, ...answerObj });
        }
      }
    });
    return NextResponse.json({ success: true, data: userHistory });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 