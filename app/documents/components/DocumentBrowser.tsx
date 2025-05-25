// app/documents/components/DocumentBrowser.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';

// --- Định nghĩa Type ---
// Type này KHÔNG cần previewImageUrl nữa
interface DocumentLinkItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  skill?: string;
  googleDriveLink: string; // Vẫn cần link này để trang view sử dụng
  fileType: string;
  year?: number;
}

interface DocumentBrowserProps {
  initialDocuments: DocumentLinkItem[];
}

// --- Icons ---
const SearchIcon = React.memo(() => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-400 dark:text-gray-500"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" /></svg>);
SearchIcon.displayName = 'SearchIcon';

const ViewDocumentIcon = React.memo(() => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1.5"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>);
ViewDocumentIcon.displayName = 'ViewDocumentIcon';

const PdfFileIcon = React.memo(() => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0"><path fillRule="evenodd" d="M5.22 10.22a.75.75 0 011.06 0L10 13.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 11.28a.75.75 0 010-1.06z" clipRule="evenodd" /><path fillRule="evenodd" d="M2.5 5.5A2.5 2.5 0 015 3h6.25a.75.75 0 010 1.5H5a1 1 0 00-1 1v1.5H2.5v-2.5zm10 0A2.5 2.5 0 0115 3h.75a2.25 2.25 0 012.25 2.25v.75h-1.5V5.5a1 1 0 00-1-1h-.75a.75.75 0 01-.75-.75zM2.5 10.75V12A2.25 2.25 0 004.75 14.25h.25v-1.518a3.255 3.255 0 01.042-.243l.107-.43a1.75 1.75 0 013.114-.895l.095.19a3.25 3.25 0 006.222 0l.095-.19a1.75 1.75 0 013.114.895l.107.43c.017.07.033.135.042.243V14.25h.25A2.25 2.25 0 0017.5 12v-1.25h-1.5v1.25a1 1 0 01-1 1h-1.5v.01a.75.75 0 01-1.5 0V12a.75.75 0 00-.75-.75h-3.5a.75.75 0 00-.75.75v.01a.75.75 0 01-1.5 0V12a1 1 0 01-1-1v-1.25H2.5z" clipRule="evenodd" /></svg>);
PdfFileIcon.displayName = 'PdfFileIcon';
// --- Hết Icons ---


const TABS = [
  { name: 'Tất cả', value: 'all' },
  { name: 'TOPIK I', value: 'TOPIK I' },
  { name: 'TOPIK II', value: 'TOPIK II' },
  { name: 'Tài liệu khác', value: 'other' },
];

const getDocumentTabValue = (docCategory: string | undefined): string => {
    if (!docCategory) return 'other'; // Nếu category không có, mặc định là 'other'
    const upperCategory = docCategory.toUpperCase();
    if (upperCategory.includes('TOPIK I') && !upperCategory.includes('TOPIK II')) return 'TOPIK I';
    if (upperCategory.includes('TOPIK II')) return 'TOPIK II';
    return 'other';
};

const DocumentBrowser: React.FC<DocumentBrowserProps> = ({ initialDocuments }) => {
  // initialDocuments được truyền từ Server Component, không cần setDocuments nếu danh sách này không thay đổi ở client
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const filteredDocuments = useMemo(() => {
    let docs = initialDocuments ? [...initialDocuments] : []; 
    
    if (activeTab !== 'all') {
      docs = docs.filter(doc => getDocumentTabValue(doc.category) === activeTab);
    }

    if (searchTerm.trim() !== '') {
      const lowerSearchTerm = searchTerm.toLowerCase();
      docs = docs.filter(doc => 
        doc.title.toLowerCase().includes(lowerSearchTerm) ||
        (doc.description && doc.description.toLowerCase().includes(lowerSearchTerm)) ||
        doc.category.toLowerCase().includes(lowerSearchTerm) ||
        (doc.skill && doc.skill.toLowerCase().includes(lowerSearchTerm))
      );
    }
    return docs;
  }, [initialDocuments, activeTab, searchTerm]);

  if (!isClient) { 
    // Placeholder đơn giản trong khi chờ client mount để tránh hydration mismatch
    // Hoặc bạn có thể render một phần UI tĩnh không phụ thuộc client state
    return (
        <div className="py-10 text-center text-gray-500 dark:text-gray-400">
            Đang tải danh sách tài liệu...
        </div>
    );
  }

  return (
    <div className="w-full">
      {/* Tabs và Search Bar */}
      <div className="mb-8 sticky top-0 z-10 bg-slate-50 dark:bg-slate-900/80 backdrop-blur-md py-4 shadow-sm -mx-4 px-4 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8 lg:-mx-12 lg:px-12 xl:-mx-16 xl:px-16">
        <div className="max-w-4xl mx-auto"> {/* Tăng max-width cho vừa hơn */}
            <div className="mb-4 flex flex-wrap items-center justify-center border-b border-gray-200 dark:border-slate-700">
            {TABS.map(tab => (
                <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-3 sm:px-4 py-2.5 text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-50 rounded-t-md
                            ${activeTab === tab.value 
                                ? 'border-b-2 border-sky-500 text-sky-600 dark:text-sky-400 bg-white dark:bg-slate-800' 
                                : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-slate-600'
                            }`}
                >
                {tab.name}
                </button>
            ))}
            </div>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon />
                </div>
                <input
                    type="search"
                    placeholder="Tìm kiếm tài liệu theo tên, mô tả, loại..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-md 
                            leading-5 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 
                            placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none 
                            focus:ring-1 focus:ring-sky-500 focus:border-sky-500 sm:text-sm shadow-sm"
                />
            </div>
        </div>
      </div>

      {/* Danh sách tài liệu */}
      {filteredDocuments.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-16 text-lg">
          Không tìm thấy tài liệu nào phù hợp với tìm kiếm của bạn.
        </p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
          {filteredDocuments.map((doc) => (
            <li 
                key={doc.id} 
                className="bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 border border-slate-200 dark:border-slate-700 flex flex-col"
            >
              <div className="p-5 flex-grow">
                <div className="flex items-start mb-2">
                  {doc.fileType.toUpperCase() === 'PDF' && <PdfFileIcon />}
                  {/* Bạn có thể thêm các icon khác cho các fileType khác */}
                  <h3 className="text-md font-semibold text-gray-800 dark:text-slate-100 leading-tight ml-1.5 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                    {doc.title}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mb-3">
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full">{doc.category}</span>
                  {doc.skill && <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full">{doc.skill}</span>}
                  {doc.year && <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full">Năm {doc.year}</span>}
                </div>
                {doc.description && (
                  <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed line-clamp-3 mb-3">
                    {doc.description}
                  </p>
                )}
              </div>
              <div className="px-5 py-4 bg-slate-50 dark:bg-slate-700/50 border-t border-slate-100 dark:border-slate-700 mt-auto">
                <Link
                  href={`/documents/${doc.id}/view`} // Điều hướng đến trang xem chi tiết
                  className="inline-flex items-center justify-center w-full px-4 py-2.5 border border-transparent text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-sky-500 transition-colors shadow-sm hover:shadow-md"
                >
                  <ViewDocumentIcon />
                  Xem Tài Liệu
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
export default DocumentBrowser;