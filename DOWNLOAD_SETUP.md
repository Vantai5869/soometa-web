# Hướng Dẫn Thiết Lập Trang Tải Đề

## Tổng Quan
Trang "Tải Đề" cho phép người dùng tải xuống các đề thi TOPIK chính thức từ các kỳ thi gần đây. Trang này được chia thành 2 tab: TOPIK I và TOPIK II.

## Cấu Trúc Dữ Liệu

### File: `data/download-data.ts`

Dữ liệu được tổ chức thành 2 mảng chính:
- `topikISessions`: Chứa các kỳ thi TOPIK I
- `topikIISessions`: Chứa các kỳ thi TOPIK II

Mỗi session có cấu trúc:
```typescript
interface ExamSession {
  id: string;
  name: string;
  date: string;
  description: string;
  exams: ExamFile[];
}
```

Mỗi exam có cấu trúc:
```typescript
interface ExamFile {
  id: string;
  name: string;
  type: 'TOPIK I' | 'TOPIK II';
  size: string;
  driveLink: string; // Link Google Drive duy nhất
  description?: string;
}
```

## Tính Năng Chính

### 1. Preview Trực Tiếp
- Sử dụng `PdfViewerModal` component để xem PDF trực tiếp trên web
- Tự động chuyển đổi Google Drive link thành preview URL
- Hỗ trợ loading state và error handling

### 2. Download Tự Động
- Tự động tạo download link từ Google Drive link
- Sử dụng hàm `createDownloadLink()` để chuyển đổi
- Download trực tiếp với tên file phù hợp

### 3. Xử Lý Link Drive
- Chỉ cần 1 link Google Drive duy nhất cho mỗi file
- Tự động tạo preview và download URL từ link gốc
- Hỗ trợ fallback nếu link không hợp lệ

## Cách Thêm Đề Thi Mới

### 1. Thêm Session Mới
```typescript
{
  id: 'topik-92-i', // ID duy nhất
  name: 'Đề thi TOPIK I - Kỳ 92',
  date: 'Tháng 7/2024',
  description: 'Kỳ thi TOPIK I lần thứ 92 - Đề thi chính thức',
  exams: [
    {
      id: 'topik-92-i-1',
      name: 'Đề thi TOPIK I - Kỳ 92',
      type: 'TOPIK I',
      size: '15.5 MB',
      driveLink: 'https://drive.google.com/file/d/YOUR_FILE_ID/view?usp=drive_link',
      description: 'Đề thi TOPIK I chính thức kỳ 92'
    }
  ]
}
```

### 2. Thêm Vào Mảng Tương Ứng
- TOPIK I: Thêm vào `topikISessions`
- TOPIK II: Thêm vào `topikIISessions`

## Components

### 1. PdfViewerModal
- Modal để xem PDF trực tiếp
- Tự động tạo preview URL từ drive link
- Có nút download và mở trong Drive
- Hỗ trợ loading và error states

### 2. Download Page
- Hiển thị danh sách sessions theo tab
- Responsive design với grid layout
- Navigation đến trang chi tiết session

### 3. Session Detail Page
- Hiển thị danh sách exams trong session
- Nút preview và download cho từng exam
- Breadcrumb navigation

## API Endpoints

Không cần API endpoints vì tất cả dữ liệu được lưu trữ locally trong file `download-data.ts`.

## Cách Hoạt Động

1. **Preview**: Chuyển đổi drive link thành preview URL (`/preview`)
2. **Download**: Chuyển đổi drive link thành download URL (`/uc?export=download`)
3. **Fallback**: Nếu không thể tạo URL, sử dụng link gốc

## Lưu Ý Quan Trọng

1. **Link Drive**: Chỉ cần 1 link Google Drive duy nhất cho mỗi file
2. **File ID**: Tự động extract file ID từ drive link
3. **Permissions**: Đảm bảo file trên Drive có quyền "Anyone with the link can view"
4. **File Format**: Hỗ trợ PDF files
5. **Size Limit**: Không có giới hạn kích thước file

## Troubleshooting

### Preview Không Hoạt Động
- Kiểm tra quyền file trên Google Drive
- Đảm bảo file là PDF
- Thử mở link trực tiếp trên Drive

### Download Không Hoạt Động
- Kiểm tra file ID trong link
- Đảm bảo file không bị xóa
- Thử tải thủ công từ Drive

### Performance
- Sử dụng lazy loading cho modal
- Optimize PDF loading
- Cache preview URLs nếu cần 