// app/documents/[documentId]/view/page.tsx
import fs from 'fs/promises';
import path from 'path';
import { notFound } from 'next/navigation';
import { Metadata, ResolvingMetadata } from 'next';
import Link from 'next/link';
import ShareButtonClient from './../../components/ShareButtonClient'; // Đảm bảo đường dẫn đúng

// --- Định nghĩa Type ---
interface DocumentLinkItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  skill?: string;
  googleDriveLink: string;
  previewImageUrl?: string; 
  fileType: string;
  year?: number;
}

const DOCUMENTS_DATA_PATH = path.join(process.cwd(), 'data', 'document_links.json');

async function getAllDocuments(): Promise<DocumentLinkItem[]> {
  try {
    const fileContent = await fs.readFile(DOCUMENTS_DATA_PATH, 'utf-8');
    const documents: DocumentLinkItem[] = JSON.parse(fileContent);
    return Array.isArray(documents) ? documents : [];
  } catch (error) {
    console.error("Lỗi khi đọc data/document_links.json trong trang view:", error);
    return [];
  }
}

async function getDocumentById(documentId: string): Promise<DocumentLinkItem | undefined> {
  const documents = await getAllDocuments();
  return documents.find(doc => doc.id === documentId);
}

export async function generateStaticParams() {
  const documents = await getAllDocuments();
  return documents.map((doc) => ({
    documentId: doc.id,
  }));
}

// --- SỬA TYPE CHO PARAMS ---
type Props = {
  params: Promise<{ documentId: string }>; // params giờ là một Promise
};

export async function generateMetadata({ params: paramsPromise }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const params = await paramsPromise; // <<<< THÊM AWAIT Ở ĐÂY
  const documentId = params.documentId;
  const doc = await getDocumentById(documentId);

  const siteBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://topikgo.com";

  if (!doc) {
    return {
      title: "Không tìm thấy tài liệu - TopikGo",
      description: "Tài liệu bạn tìm kiếm không tồn tại.",
      robots: { index: false, follow: true },
    };
  }

  const pageUrl = `${siteBaseUrl}/documents/${doc.id}/view`;
  const ogImageUrl = doc.previewImageUrl || `${siteBaseUrl}/default-document-og.png`; 

  return {
    title: `${doc.title} - Xem Tài Liệu | TopikGo`,
    description: doc.description || `Xem và tải tài liệu ${doc.title} tại TopikGo.`,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: `${doc.title} | TopikGo`,
      description: doc.description || `Tài liệu TOPIK hữu ích: ${doc.title}.`,
      url: pageUrl,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: doc.title }],
      type: 'article',
      siteName: 'TopikGo',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${doc.title} | TopikGo`,
      description: doc.description || `Tài liệu TOPIK hữu ích: ${doc.title}.`,
      images: [ogImageUrl],
    },
  };
}

// --- Icons (Giữ nguyên như trước) ---
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2"><path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l3.25 3.5a.75.75 0 001.09 0l3.25-3.5a.75.75 0 10-1.09-1.03l-2.955 3.128V2.75z" /><path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" /></svg>;
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-1"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" /></svg>;
const ErrorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-red-400 mb-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6H10v2.25A7.5 7.5 0 0010 18c0 4.142 3.358 7.5 7.5 7.5s7.5-3.358 7.5-7.5A7.5 7.5 0 0010 3V1.5m0 12.75H3.75M3.75 12.75c0-4.142 3.358-7.5 7.5-7.5M12.75 3v1.5M16.5 3.75V.75M18.75 3a2.25 2.25 0 00-2.25-2.25H9.75A2.25 2.25 0 007.5 3v1.5M15 13.5H9" /></svg>;

// --- Page Component ---
export default async function DocumentViewPage({ params: paramsPromise }: Props) { // Đổi tên params thành paramsPromise
  const params = await paramsPromise; // <<<< THÊM AWAIT Ở ĐÂY
  const documentId = params.documentId;
  const doc = await getDocumentById(documentId);

  if (!doc) {
    notFound();
  }

  const getGoogleDriveFileId = (url: string): string | null => {
    const patterns = [
      /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
      /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) return match[1];
    }
    return null;
  };

  const fileId = getGoogleDriveFileId(doc.googleDriveLink);
  const embedUrl = fileId ? `https://drive.google.com/file/d/${fileId}/preview` : doc.googleDriveLink;
  const downloadLink = fileId ? `https://drive.google.com/uc?export=download&id=${fileId}` : doc.googleDriveLink;
  
  const siteBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://topikgo.com";
  const currentPageUrl = `${siteBaseUrl}/documents/${doc.id}/view`;

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-40 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-1 min-w-0"> 
              <Link href="/documents" className="inline-flex items-center text-sm font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 transition-colors">
                <BackIcon />
                Quay lại Kho Tài Liệu
              </Link>
              <h1 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-100 mt-1 truncate" title={doc.title}>
                {doc.title}
              </h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3 ml-4 shrink-0">
              <ShareButtonClient titleToShare={doc.title} urlToShare={currentPageUrl} />
              <a
                href={downloadLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-sky-500 transition-colors"
              >
                <DownloadIcon />
                Tải về
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow w-full py-6 sm:py-8">
        <div className="container mx-auto px-2 sm:px-4 lg:px-6">
          {fileId ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl overflow-hidden border border-gray-300 dark:border-slate-700">
                <iframe
                    src={embedUrl}
                    className="w-full h-[calc(100vh-10rem)] sm:h-[calc(100vh-12rem)] md:h-[calc(100vh-10rem)] border-0"
                    title={`Xem tài liệu: ${doc.title}`}
                    allowFullScreen
                    loading="lazy"
                >
                    <p className="p-8 text-center text-slate-600 dark:text-slate-300">
                    Trình duyệt của bạn không hỗ trợ iframe để xem PDF. 
                    Hãy <a href={doc.googleDriveLink} target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400 underline hover:text-sky-700">tải về tại đây</a>.
                    </p>
                </iframe>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-800 p-8 sm:p-12 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 text-center">
                <ErrorIcon/>
                <p className="text-lg font-medium text-red-600 dark:text-red-400 mb-3 mt-2">Không thể hiển thị bản xem trước</p>
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                  Đã có lỗi xảy ra khi cố gắng tạo link xem trước cho tài liệu này. 
                  Bạn có thể thử mở trực tiếp trên Google Drive.
                </p>
                <a
                    href={doc.googleDriveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
                >
                    Mở trên Google Drive
                </a>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}