// app/sitemap.ts
import { MetadataRoute } from 'next';
import fs from 'fs/promises'; // Cần thiết để đọc file
import path from 'path';     // Cần thiết để tạo đường dẫn file
import crypto, { DecipherGCM } from 'crypto'; // Cần thiết cho việc giải mã

// --- Đảm bảo bạn có các định nghĩa này ---
interface ExamData {
  id: string;
  // Thêm các trường khác từ cấu trúc ExamData của bạn nếu cần cho logic sitemap
  // Ví dụ: year_description, exam_number_description, level, skill
  [key: string]: any; // Cho phép các thuộc tính khác
}

// --- Hàm giải mã (Đã có trong page.tsx, bạn có thể import hoặc định nghĩa lại ở đây/utils) ---
function decryptDataForSitemap(encryptedString: string, keyHex: string): string {
    // Copy code hàm decryptData của bạn vào đây, hoặc tốt hơn là import từ một file utils chung
    // Đảm bảo xử lý lỗi cẩn thận
    try {
        const key: Buffer = Buffer.from(keyHex, 'hex');
        const parts: string[] = encryptedString.split(':');
        if (parts.length !== 3) {
            console.error('Sitemap Decrypt Error: Invalid format.');
            throw new Error('Định dạng dữ liệu mã hóa không hợp lệ.');
        }
        const iv: Buffer = Buffer.from(parts[0], 'hex');
        const authTag: Buffer = Buffer.from(parts[1], 'hex');
        const encryptedDataVal: Buffer = Buffer.from(parts[2], 'hex');

        const decipher: DecipherGCM = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);

        let decrypted: string = decipher.update(encryptedDataVal.toString('hex'), 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error: any) {
        console.error("Sitemap Decrypt Error:", error.message);
        throw error;
    }
}

const ENCRYPTED_FILE_PATH_SITEMAP = path.join(process.cwd(), 'encrypted_data', 'data.enc');

async function getAllExamIdsForSitemap(): Promise<string[]> {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
        console.error("Sitemap Generation Error: ENCRYPTION_KEY is not set. Sitemap will be incomplete.");
        return [];
    }
    console.log("Sitemap: Attempting to read and decrypt exam data...");
    try {
        const encryptedFileContent = await fs.readFile(ENCRYPTED_FILE_PATH_SITEMAP, 'utf-8');
        console.log("Sitemap: Encrypted file read successfully.");

        const decryptedJsonString = decryptDataForSitemap(encryptedFileContent, encryptionKey);
        console.log("Sitemap: Data decrypted successfully.");

        const allExamsData: ExamData[] = JSON.parse(decryptedJsonString);
        console.log(`Sitemap: Parsed ${allExamsData.length} exams from data.`);

        if (!Array.isArray(allExamsData) || allExamsData.length === 0) {
            console.warn("Sitemap: No exam data found or data is not an array after parsing.");
            return [];
        }
        
        const ids = allExamsData.map(exam => exam.id).filter(id => id && typeof id === 'string');
        console.log(`Sitemap: Extracted ${ids.length} valid exam IDs.`);
        return ids;

    } catch (error: any) {
        console.error("Sitemap Generation Error in getAllExamIdsForSitemap:", error.message);
        return []; // Quan trọng: Trả về mảng rỗng khi có lỗi để không làm hỏng toàn bộ sitemap
    }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://topikgo.com';

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    // Thêm các URL tĩnh khác ở đây nếu có
    // Ví dụ: { url: `${baseUrl}/about-us`, lastModified: new Date(), changeFrequency: 'monthly' },
  ];

  let examRoutes: MetadataRoute.Sitemap = [];
  try {
    const examIds = await getAllExamIdsForSitemap(); // Gọi hàm lấy tất cả ID
    console.log(`Sitemap: Generating routes for ${examIds.length} exams.`);

    examRoutes = examIds.map(id => ({
      url: `${baseUrl}/exams/${id}`,
      lastModified: new Date(), // Nên cập nhật ngày này nếu bạn có thông tin ngày sửa đổi của từng đề
      changeFrequency: 'weekly',
      priority: 0.9,
    }));
  } catch (error) {
      // Lỗi này không nên xảy ra nếu getAllExamIdsForSitemap đã xử lý lỗi và trả về mảng rỗng
      console.error("Sitemap: Unexpected error mapping examIds to routes", error);
  }

  const allRoutes = [...staticRoutes, ...examRoutes];
  console.log(`Sitemap: Total routes generated: ${allRoutes.length}`);
  
  if (allRoutes.length === 0) {
      // Đảm bảo sitemap không bao giờ trống hoàn toàn, ít nhất là trang chủ
      console.warn("Sitemap: All routes array is empty. Returning homepage as minimum.");
      return [{ url: baseUrl, lastModified: new Date() }];
  }

  return allRoutes;
}