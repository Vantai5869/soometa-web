import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const STATS_PATH = path.join(process.cwd(), 'data', 'download-stats.json');

export async function GET(request: NextRequest) {
  try {
    let stats: Record<string, number> = {};
    try {
      const file = await fs.readFile(STATS_PATH, 'utf-8');
      stats = JSON.parse(file);
    } catch {
      stats = {};
    }
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 