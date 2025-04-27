// src/app/layout.tsx
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import './globals.css'; // Import CSS toàn cục

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ứng Dụng Luyện Thi TOPIK',
  description: 'Luyện thi TOPIK hiệu quả với nhiều đề thi và tài liệu hữu ích.',
  // Thêm các meta tag khác nếu cần
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="vi">
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}