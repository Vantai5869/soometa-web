// app/sitemap.ts
import { MetadataRoute } from 'next';
// Giả sử bạn có các hàm và interface cần thiết ở đây hoặc import từ file khác
// import fs from 'fs/promises';
// import path from 'path';
// import crypto, { DecipherGCM } from 'crypto'; // Nếu bạn giải mã trực tiếp ở đây
// import type { ExamData } from '../components/types'; // Điều chỉnh đường dẫn

// --- Hàm giải mã (nếu bạn đặt ở đây hoặc import) ---
// function decryptData(encryptedString: string, keyHex: string): string { /* ... code ... */ }

// --- Hàm lấy và giải mã tất cả đề thi (nếu bạn đặt ở đây hoặc import) ---
// async function getAndDecryptAllExams(): Promise<ExamData[]> { /* ... code ... */ }

async function getAllExamIdsForSitemap(): Promise<string[]> {
    // *** QUAN TRỌNG: BẠN CẦN TRIỂN KHAI LOGIC NÀY CHO ĐÚNG ***
    // Đọc file data.json đã giải mã của bạn và trả về một mảng các ID đề thi.
    // Ví dụ, nếu bạn có thể gọi hàm getAndDecryptAllExams() ở đây một cách an toàn:
    // try {
    //     const allExamsData = await getAndDecryptAllExams(); // Hàm này cần được định nghĩa hoặc import
    //     return allExamsData.map(exam => exam.id);
    // } catch (error) {
    //     console.error("Sitemap: Lỗi khi lấy exam IDs:", error);
    //     return [];
    // }
    // Vì lý do đơn giản, tạm thời trả về mảng rỗng hoặc mảng ID mẫu.
    // BẠN PHẢI THAY THẾ PHẦN NÀY.
    console.warn("Sitemap: getAllExamIdsForSitemap chưa được triển khai đầy đủ, trả về danh sách ID mẫu/rỗng.");
    return ["96-I-listening", "96-I-reading", "96-II-listening"]; // Ví dụ ID mẫu
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://topikgo.com';

  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as 'daily',
      priority: 1.0,
    },
    // { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
  ];

  let examRoutes: MetadataRoute.Sitemap = [];
  try {
    const examIds = await getAllExamIdsForSitemap();
    examRoutes = examIds.map(id => {
      if (!id || typeof id !== 'string') {
          console.warn(`Sitemap: Bỏ qua exam ID không hợp lệ: ${id}`);
          return null;
      }
      return {
        url: `${baseUrl}/exams/${id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as 'weekly',
        priority: 0.9,
      };
    }).filter(route => route !== null) as MetadataRoute.Sitemap;
  } catch (error) {
    console.error("Sitemap: Lỗi khi tạo route cho đề thi:", error);
  }
  
  const allRoutes = [...staticRoutes, ...examRoutes];

  if (allRoutes.length === staticRoutes.length && examRoutes.length === 0 && (await getAllExamIdsForSitemap()).length > 0) {
      console.warn("Sitemap: Không có route đề thi nào được tạo mặc dù có vẻ như có exam IDs. Kiểm tra logic getAllExamIdsForSitemap.");
  }


  return allRoutes;
}