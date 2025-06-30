import { getExamSessionById } from '@/data/download-data';
import SessionDetailClient from './SessionDetailClient';

interface PageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export default async function SessionDetailPage({ params }: PageProps) {
  const { sessionId } = await params;
  const session = getExamSessionById(sessionId);

  return <SessionDetailClient session={session} />;
} 