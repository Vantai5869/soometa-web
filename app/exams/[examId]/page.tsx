// app/exams/[examId]/page.tsx
import fs from 'fs/promises';
import path from 'path';
import { notFound } from 'next/navigation';
import ExamViewerWrapper from '../../components/ExamViewerWrapper'; // Adjust path if needed
// Import kiểu từ file types.ts
import type { ExamData } from '../../components/types.ts'; // Adjust path if needed

interface PageProps {
  params: {
    examId: string;
  };
}

async function getExamData(examId: string): Promise<ExamData | null> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'data.json');
    const jsonData = await fs.readFile(filePath, 'utf-8');
    const allExamsData: ExamData[] = JSON.parse(jsonData);
    const exam = allExamsData.find(e => e.id === examId);
    return exam || null;
  } catch (error) {
    console.error(`Error reading data for exam ${examId}:`, error);
    return null;
  }
}

export async function generateStaticParams(): Promise<{ examId: string }[]> {
   try {
        const filePath = path.join(process.cwd(), 'data', 'data.json');
        const jsonData = await fs.readFile(filePath, 'utf-8');
        const allExamsData: ExamData[] = JSON.parse(jsonData);
        return allExamsData.map(exam => ({ examId: exam.id }));
   } catch (error) {
        console.error("Error generating static params:", error);
        return [];
   }
}

export default async function ExamPage({ params }: PageProps) {
  const { examId } = params;
  const examData = await getExamData(examId);

  if (!examData) {
    notFound();
  }

  return (
     <ExamViewerWrapper examData={examData} />
  );
}