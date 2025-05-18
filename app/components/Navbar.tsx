// src/components/Navbar.tsx
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';
import { useState, useEffect } from 'react'; // Import useState và useEffect

export default function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State quản lý menu di động

  const isActive = (href: string): boolean => {
    if (href === '/') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  // Hàm đóng/mở menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Hàm đóng menu (ví dụ khi click vào link hoặc overlay)
  const closeMenu = () => {
    setIsMenuOpen(false);
  }

  // Đóng menu khi đường dẫn thay đổi (người dùng click link)
  useEffect(() => {
    closeMenu();
  }, [pathname]);

  // Thêm/xóa class vào body để ngăn cuộn khi menu mở (tùy chọn)
  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    // Cleanup function
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [isMenuOpen]);


  return (
    // Thêm class khi menu mở để có thể style navbar nếu cần
    <nav className={`${styles.navbar} ${isMenuOpen ? styles.navbarOpen : ''}`}>
      <div className={styles.logo}>
        <Link href="/" className={isActive('/') ? styles.activeLink : ''}>
            <span>SOOMETA</span>
        </Link>
      </div>

      {/* --- Menu cho Desktop --- */}
      <ul className={styles.navList}>
        <li><Link href="/exams" className={isActive('/exams') ? styles.activeLink : ''}>Luyện Thi Theo Đề</Link></li>
        <li><Link href="/practice" className={isActive('/practice/type') ? styles.activeLink : ''}>Luyện Thi Theo Dạng</Link></li>
        {/* <li><Link href="/study" className={isActive('/study') ? styles.activeLink : ''}>Phòng Học Tập</Link></li> */}
        {/* <li><Link href="/materials" className={isActive('/materials') ? styles.activeLink : ''}>Tài Liệu</Link></li> */}
      </ul>

      {/* --- Nút Hamburger cho Mobile --- */}
      {/* Thêm class 'open' vào nút để có thể tạo hiệu ứng X */}
      <button
        className={`${styles.hamburgerButton} ${isMenuOpen ? styles.open : ''}`}
        onClick={toggleMenu}
        aria-label={isMenuOpen ? "Đóng menu" : "Mở menu"} // Cải thiện accessibility
        aria-expanded={isMenuOpen} // Cải thiện accessibility
      >
        <span className={styles.hamburgerLine}></span>
        <span className={styles.hamburgerLine}></span>
        <span className={styles.hamburgerLine}></span>
      </button>

      {/* --- Menu Dọc cho Mobile --- */}
      <div className={`${styles.mobileMenu} ${isMenuOpen ? styles.open : ''}`}>
         {/* Nút đóng có thể không cần nếu hamburger đã chuyển thành X */}
         {/* <button className={styles.closeButton} onClick={closeMenu} aria-label="Đóng menu">&times;</button> */}
         <ul>
            {/* Lặp lại các link, không cần onClick={closeMenu} vì đã có useEffect theo dõi pathname */}
            <li><Link href="/" className={isActive('/') ? styles.mobileActiveLink : ''}>Trang Chủ</Link></li>
            <li><Link href="/exams" className={isActive('/exams') ? styles.mobileActiveLink : ''}>Luyện Thi Theo Đề</Link></li>
            <li><Link href="/practice/type" className={isActive('/practice/type') ? styles.mobileActiveLink : ''}>Luyện Thi Theo Dạng</Link></li>
            <li><Link href="/study" className={isActive('/study') ? styles.mobileActiveLink : ''}>Phòng Học Tập</Link></li>
            <li><Link href="/materials" className={isActive('/materials') ? styles.mobileActiveLink : ''}>Tài Liệu</Link></li>
         </ul>
      </div>

      {/* Lớp phủ mờ phía sau menu khi mở */}
      {isMenuOpen && <div className={styles.overlay} onClick={closeMenu}></div>}

    </nav>
  );
}