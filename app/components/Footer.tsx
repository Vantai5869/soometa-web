// src/components/Footer.tsx
import styles from './Footer.module.css'; // Tạo file CSS riêng cho Footer

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <p>&copy; {new Date().getFullYear()} Ứng Dụng Luyện Thi TOPIK. All rights reserved.</p>
      {/* Thêm các thông tin khác như liên hệ, mạng xã hội, ... */}
    </footer>
  );
}