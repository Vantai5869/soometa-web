// app/sitemap.ts
import { MetadataRoute } from 'next';
import fs from 'fs/promises'; // Cần thiết để đọc file
import path from 'path';     // Cần thiết để tạo đường dẫn file
// Bỏ import crypto vì không còn giải mã
// import crypto, { DecipherGCM } from 'crypto';

// Định nghĩa interface tối thiểu cho ExamData cần thiết cho sitemap
interface ExamDataForSitemap {
  id: string; // Chỉ cần id để tạo URL
  // Bạn có thể thêm lastModified cho từng exam nếu có thông tin này trong exams.json
  // lastModified?: string | Date; 
}

// --- Bỏ hàm decryptDataForSitemap ---

// Đường dẫn đến file JSON chứa dữ liệu đề thi
const EXAMS_DATA_PATH_SITEMAP: string = path.join(process.cwd(), 'data', 'data.json');

async function getAllExamIdsForSitemap(): Promise<string[]> {
    // Không cần encryptionKey nữa
    console.log("Sitemap: Đang đọc dữ liệu đề thi từ file JSON...");
    try {
        // Đọc nội dung file JSON
        const fileContent = await fs.readFile(EXAMS_DATA_PATH_SITEMAP, 'utf-8');
        console.log("Sitemap: Đã đọc file JSON thành công.");

        // Parse chuỗi JSON
        const allExamsData: ExamDataForSitemap[] = JSON.parse(fileContent);
        console.log(`Sitemap: Đã parse ${allExamsData.length} đề thi từ dữ liệu.`);

        if (!Array.isArray(allExamsData) || allExamsData.length === 0) {
            console.warn("Sitemap: Không tìm thấy dữ liệu đề thi hoặc dữ liệu không phải là mảng sau khi parse.");
            return [];
        }
        
        // Lấy danh sách các ID và lọc bỏ các ID không hợp lệ (null, undefined, hoặc không phải string)
        const ids = allExamsData
                        .map(exam => exam.id)
                        .filter(id => id && typeof id === 'string')
                        .map(id => id.toString()); // Đảm bảo tất cả ID là string
        
        console.log(`Sitemap: Đã trích xuất ${ids.length} ID đề thi hợp lệ.`);
        return ids;

    } catch (error: any) {
        console.error("Lỗi khi tạo Sitemap trong hàm getAllExamIdsForSitemap (đọc hoặc parse file JSON):", error.message);
        return []; // Quan trọng: Trả về mảng rỗng khi có lỗi để không làm hỏng toàn bộ sitemap
    }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://topikgo.com'; // Đảm bảo đây là domain chính xác của bạn

  // Lấy ngày hiện tại một lần để sử dụng cho lastModified của các trang tĩnh
  const currentDate = new Date().toISOString();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/exams`, // Trang danh sách đề thi
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/practice`, // Trang luyện theo dạng
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    // Thêm các URL tĩnh khác ở đây nếu có
    // Ví dụ: 
    // { url: `${baseUrl}/about-us`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    // { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.4 },
  ];

  let examRoutes: MetadataRoute.Sitemap = [];
  try {
    const examIds = await getAllExamIdsForSitemap();
    console.log(`Sitemap: Đang tạo route cho ${examIds.length} đề thi.`);

    examRoutes = examIds.map(id => ({
      url: `${baseUrl}/exams/${id}`,
      // Nếu bạn có thông tin lastModified cho từng exam trong file exams.json, hãy dùng nó ở đây
      // Ví dụ: examObject = allExamsData.find(e => e.id === id); lastModified: examObject.lastModified || currentDate
      lastModified: currentDate, 
      changeFrequency: 'weekly', // Hoặc 'monthly'/'yearly' nếu nội dung đề thi ít thay đổi
      priority: 0.9, // Ưu tiên cao cho các trang chi tiết đề thi
    }));
  } catch (error: any) { // Mặc dù getAllExamIdsForSitemap đã xử lý lỗi, vẫn nên có catch ở đây
      console.error("Sitemap: Lỗi không mong muốn khi map examIds thành routes:", error.message);
  }

  const allRoutes = [...staticRoutes, ...examRoutes];
  console.log(`Sitemap: Tổng số route được tạo: ${allRoutes.length}`);
  
  if (allRoutes.length === staticRoutes.length && examRoutes.length === 0 && (await getAllExamIdsForSitemap()).length > 0) {
      // Cảnh báo nếu không có exam routes nào được tạo ra dù có exam IDs
      console.warn("Sitemap: Không có exam routes nào được tạo mặc dù có exam IDs. Kiểm tra logic map examIds.");
  }
  
  if (allRoutes.length === 0) {
      console.warn("Sitemap: Mảng allRoutes trống. Trả về trang chủ làm tối thiểu.");
      return [{ url: baseUrl, lastModified: new Date().toISOString(), changeFrequency: 'daily', priority: 1.0 }];
  }

  return allRoutes;
}