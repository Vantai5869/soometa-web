// src/app/layout.tsx
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import UserActivityTracker from './components/UserActivityTracker';
import ResizableLayout from './components/ResizableLayout';
import './globals.css'; // Import CSS toàn cục
import { cookies } from 'next/headers';

import { Metadata } from 'next';

export const metadata: Metadata = {
  // === THÔNG TIN CƠ BẢN CHO TOÀN TRANG WEB ===
  title: {
    default: 'Topikgo - Luyện Thi TOPIK Online Hiệu Quả', // Tiêu đề mặc định
    template: '%s | Topikgo', // Mẫu tiêu đề cho các trang con, ví dụ: "Đề thi TOPIK I Nghe 제96회 | Topikgo"
  },
  description: 'Topikgo - Nền tảng luyện thi TOPIK I & II trực tuyến với hàng ngàn câu hỏi, đề thi thử TOPIK sát với đề thật, giải thích chi tiết và lộ trình học cá nhân hóa. Cải thiện kỹ năng Nghe, Đọc, Viết tiếng Hàn hiệu quả.',
  keywords: ['luyện thi topik', 'topik online', 'đề thi topik', 'học tiếng hàn topik', 'topikgo', 'topik i', 'topik ii', 'đề topik mới nhất', 'eps topik'], // Từ khóa chung cho website

  // === THẺ OG (OPEN GRAPH) CHO CHIA SẺ MẠNG XÃ HỘI (Facebook, Zalo,...) ===
  openGraph: {
    title: {
      default: 'Topikgo - Luyện Thi TOPIK Online Hiệu Quả',
      template: '%s | Topikgo',
    },
    description: 'Luyện thi TOPIK I & II hiệu quả với Topikgo. Truy cập ngay để thử sức với các đề thi mới nhất và tài liệu ôn tập phong phú!',
    url: 'https://topikgo.com', // Tên miền của bạn
    siteName: 'Topikgo',
    images: [
      {
        url: 'https://topikgo.com/favicon.png', // URL tuyệt đối đến ảnh preview mặc định (ví dụ: logo hoặc ảnh trang chủ)
        width: 1200,
        height: 630,
        alt: 'Topikgo - Luyện thi TOPIK hiệu quả',
      },
    ],
    locale: 'vi_VN',
    type: 'website',
  },

  // === THẺ TWITTER CARD CHO CHIA SẺ TRÊN TWITTER ===
  twitter: {
    card: 'summary_large_image', // Loại card, 'summary_large_image' thường tốt hơn
    title: {
      default: 'Topikgo - Luyện Thi TOPIK Online Hiệu Quả',
      template: '%s | Topikgo',
    },
    description: 'Nền tảng luyện thi TOPIK toàn diện, giúp bạn tự tin chinh phục kỳ thi tiếng Hàn. Đề thi đa dạng, giải thích chi tiết.',
    // siteId: '@YourTwitterHandle', // (Tùy chọn) Twitter handle của website
    // creator: '@CreatorTwitterHandle', // (Tùy chọn) Twitter handle của người tạo nội dung
    images: ['https://topikgo.com/twitter-image.png'], // URL tuyệt đối đến ảnh preview cho Twitter
  },

  // === CÁC THẺ META QUAN TRỌNG KHÁC ===
  robots: { // Hướng dẫn robots của công cụ tìm kiếm
    index: true, // Cho phép index trang
    follow: true, // Cho phép theo dõi các liên kết từ trang
    // googleBot: { // Có thể chỉ định riêng cho Googlebot nếu muốn
    //   index: true,
    //   follow: true,
    //   noimageindex: true,
    // },
  },
  authors: [{ name: 'Topikgo Team', url: 'https://topikgo.com' }],
  creator: 'Topikgo Team',
  publisher: 'Topikgo',

  // Favicon - Nên đặt các file favicon trong thư mục /public
  // Next.js có quy ước cho favicon: /public/favicon.ico, /public/icon.png, /public/apple-icon.png
  // Hoặc bạn có thể khai báo trực tiếp ở đây nếu cần:
  icons: {
    icon: '/favicon.ico', // Đường dẫn tới favicon chính
    shortcut: '/favicon.png', // (Tùy chọn)
    apple: '/favicon.png', // (Tùy chọn) cho thiết bị Apple
    // other: [ // (Tùy chọn)
    //   {
    //     rel: 'icon', // Ví dụ: các kích thước khác
    //     url: '/icon-32x32.png',
    //     sizes: '32x32',
    //   },
    // ],
  },

  // (Tùy chọn) Canonical URL cho trang chủ (nếu layout này là layout gốc)
  // alternates: {
  //   canonical: 'https://topikgo.com',
  // },

  // (Tùy chọn) Màu chủ đề cho trình duyệt trên thiết bị di động
  // themeColor: '#ffffff',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const cookieStore = await cookies();
  
  // Read layout cookies
  const layoutCookie = cookieStore.get('resizable-layout:layout');
  const collapsedCookie = cookieStore.get('resizable-layout:collapsed');

  let defaultLayout = 20; // Default right panel size
  let defaultCollapsed = false;

  try {
    if (layoutCookie) {
      const layout = JSON.parse(layoutCookie.value);
      if (Array.isArray(layout) && layout.length > 1) {
        defaultLayout = layout[1]; // Index 1 is the right panel
      }
    }
    if (collapsedCookie) {
      defaultCollapsed = collapsedCookie.value === 'true';
    }
  } catch (e) {
    console.error('Error parsing layout cookies', e);
  }

  return (
    <html lang="vi">
      <body className="relative min-h-screen">
        {/* Global Gradient Background */}
        <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-cyan-50 -z-50" />
        
        {/* Dot Pattern Overlay */}
        <div 
          className="fixed inset-0 -z-40 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle, #cbd5e1 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />
        
        {/* Animated Gradient Orbs */}
        <div className="fixed top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-200/40 to-cyan-200/40 rounded-full blur-3xl -z-30 animate-pulse pointer-events-none" style={{ animationDuration: '4s' }} />
        <div className="fixed bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-emerald-200/30 to-blue-200/30 rounded-full blur-3xl -z-30 animate-pulse pointer-events-none" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        
        <ResizableLayout
          defaultLayout={defaultLayout}
          defaultCollapsed={defaultCollapsed}
          leftContent={
            <>
              <Navbar />
              <main>{children}</main>
              <Footer />
              <UserActivityTracker />
            </>
          }
        />
      </body>
    </html>
  );
}