// app/documents/page.tsx
import fs from 'fs/promises';
import path from 'path';
import DocumentBrowser from './components/DocumentBrowser'; // Import Client Component
import { Metadata } from 'next';

// Định nghĩa Type (cần nhất quán với Client Component)
interface DocumentLinkItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  skill?: string;
  googleDriveLink: string;
  fileType: string;
  year?: number;
}

const DOCUMENTS_DATA_PATH = path.join(process.cwd(), 'data', 'document_links.json');

async function getDocumentLinks(): Promise<DocumentLinkItem[]> {
  try {
    const fileContent = await fs.readFile(DOCUMENTS_DATA_PATH, 'utf-8');
    const documents: DocumentLinkItem[] = JSON.parse(fileContent);
    if (!Array.isArray(documents)) return [];
    return documents;
  } catch (error) {
    console.error("Lỗi khi đọc data/document_links.json:", error);
    return [];
  }
}

export const metadata: Metadata = {
  title: 'Kho Tài Liệu TOPIK - TopikGo',
  description: 'Tải xuống các đề thi TOPIK, tài liệu ngữ pháp, từ vựng và các tài liệu học tiếng Hàn hữu ích khác từ TopikGo.',
  // ... (metadata khác như trước)
};

export default async function DocumentsPageContainer() {
  const documents = await getDocumentLinks();

  return (
    <div className="container mx-auto p-6 md:p-10 lg:p-12 dark:bg-slate-900 min-h-screen">
      <header className="mb-10 text-center border-b pb-8 border-gray-200 dark:border-slate-700">
        <h1 className="text-4xl md:text-5xl font-bold text-sky-600 dark:text-sky-400 tracking-tight">
          Kho Tài Liệu
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Nguồn tài liệu PDF phong phú để hỗ trợ bạn trên hành trình chinh phục TOPIK.
        </p>
      </header>
      
      <DocumentBrowser initialDocuments={documents} />
    </div>
  );
}