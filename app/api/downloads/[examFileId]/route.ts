import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const STATS_PATH = path.join(process.cwd(), 'data', 'download-stats.json');

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ examFileId: string }> }
) {
  const { examFileId } = await params;
  if (!examFileId) {
    return NextResponse.json({ error: 'examFileId is required' }, { status: 400 });
  }
  try {
    // Đọc file stats
    let stats: Record<string, number> = {};
    try {
      const file = await fs.readFile(STATS_PATH, 'utf-8');
      stats = JSON.parse(file);
    } catch {
      stats = {};
    }
    // Tăng lượt download
    stats[examFileId] = (stats[examFileId] || 0) + 1;
    // Ghi lại file
    await fs.writeFile(STATS_PATH, JSON.stringify(stats, null, 2), 'utf-8');
    return NextResponse.json({ success: true, count: stats[examFileId] });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 