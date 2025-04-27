// src/components/Navbar.tsx
import Link from 'next/link';
import styles from './Navbar.module.css'; // Tạo file CSS riêng cho Navbar

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        <Link href="/">
          {/* Thay thế bằng logo thực tế của bạn */}
          <span>TOPIK Prep</span>
        </Link>
      </div>
      <ul className={styles.navList}>
        <li>
          <Link href="/practice/exam">Luyện Thi Theo Đề</Link>
        </li>
        <li>
          <Link href="/practice/type">Luyện Thi Theo Dạng</Link>
        </li>
        <li>
          <Link href="/study">Phòng Học Tập</Link>
        </li>
        <li>
          <Link href="/materials">Tài Liệu</Link>
        </li>
        {/* Thêm các liên kết khác nếu cần */}
      </ul>
      {/* Có thể thêm nút đăng nhập/đăng ký ở đây */}
    </nav>
  );
}