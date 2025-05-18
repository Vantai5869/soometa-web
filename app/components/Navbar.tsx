"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';
import { useState, useEffect, FormEvent, useRef } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [sentCode, setSentCode] = useState<string | null>(null);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loggedInUserEmail, setLoggedInUserEmail] = useState<string | null>(null); // Dùng để hiển thị UI

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const API_BASE_URL = 'https://soometa-be.onrender.com';

  useEffect(() => {
    // Kiểm tra thông tin đăng nhập từ localStorage khi component được mount
    const storedEmail = localStorage.getItem('loggedInUserEmail');
    const storedToken = localStorage.getItem('userToken'); // Kiểm tra cả token

    if (storedEmail && storedToken) { // Chỉ coi là đăng nhập nếu cả email và token đều có
      setLoggedInUserEmail(storedEmail);
    } else {
      // Nếu một trong hai thiếu, đảm bảo trạng thái đăng xuất nhất quán
      localStorage.removeItem('loggedInUserEmail');
      localStorage.removeItem('userToken');
    }
  }, []);

  const isActive = (href: string): boolean => {
    if (href === '/') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const toggleMobileMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMobileMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    closeMobileMenu();
  }, [pathname]);

  useEffect(() => {
    if (isMenuOpen || isLoginModalOpen) {
      document.body.classList.add(styles.noScroll);
    } else {
      document.body.classList.remove(styles.noScroll);
    }
    return () => {
      document.body.classList.remove(styles.noScroll);
    };
  }, [isMenuOpen, isLoginModalOpen]);

  const getOrGenerateDeviceId = (): string => {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
      });
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  };

  const handleOpenLoginModal = () => {
    setIsLoginModalOpen(true);
    setEmail('');
    setVerificationCodeInput('');
    setSentCode(null);
    setIsCodeSent(false);
    setCountdown(0);
    setErrorMessage('');
  };

  const handleCloseLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  const generateVerificationCode = (): string => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const handleSendVerificationCode = async () => {
    if (!email || !email.includes('@')) {
      setErrorMessage('Vui lòng nhập email hợp lệ.');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');
    const code = generateVerificationCode();
    setSentCode(code);

    try {
      const response = await fetch(`${API_BASE_URL}/send-mail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({message: "Lỗi không xác định"}));
        if (response.status === 403 && errorData.code === 'DEVICE_BLOCKED') {
            setErrorMessage('Thiết bị của bạn đã bị chặn truy cập. Vui lòng liên hệ hỗ trợ.');
            setIsLoginModalOpen(false);
            if (loggedInUserEmail) handleLogout(); // Đảm bảo logout nếu bị chặn
        } else {
            setErrorMessage(errorData.message || 'Không thể gửi mã xác nhận. Vui lòng thử lại.');
        }
        setSentCode(null);
        return;
      }
      setIsCodeSent(true);
      setCountdown(60);
    } catch (error: any) {
      setErrorMessage(error.message || 'Đã xảy ra lỗi mạng. Vui lòng thử lại.');
      setSentCode(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerifyCode = async () => {
    if (!verificationCodeInput || verificationCodeInput.length !== 4) {
      setErrorMessage('Mã xác nhận phải gồm 4 chữ số.');
      return;
    }
    if (verificationCodeInput !== sentCode) {
      setErrorMessage('Mã xác nhận không đúng.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    const deviceId = getOrGenerateDeviceId();

    try {
      const userResponse = await fetch(`${API_BASE_URL}/users`, { // Backend đã xử lý việc tạo mới hoặc đăng nhập user
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, deviceId, platform: 'WEB' }),
      });

      const data = await userResponse.json(); // Luôn cố gắng parse JSON

      if (userResponse.ok) { // Backend trả về 200 (login) hoặc 201 (created)
        if (data.token && data.user && data.user.email) {
          localStorage.setItem('userToken', data.token); // Lưu token JWT
          localStorage.setItem('loggedInUserEmail', data.user.email); // Lưu email từ response backend
          setLoggedInUserEmail(data.user.email); // Cập nhật state
          
          handleCloseLoginModal();
          setIsUserMenuOpen(false);
        } else {
          // Phản hồi thành công nhưng không có token hoặc user.email
          setErrorMessage('Đăng nhập thành công nhưng thiếu thông tin token. Vui lòng thử lại.');
        }
      } else {
        // Xử lý các lỗi khác từ backend (4xx, 5xx)
        if (userResponse.status === 403 && data.code === 'DEVICE_BLOCKED') {
          setErrorMessage('Thiết bị của bạn đã bị chặn đăng nhập. Vui lòng liên hệ hỗ trợ.');
          setIsLoginModalOpen(false);
        } else {
          setErrorMessage(data.message || data.error || 'Lỗi khi đăng ký hoặc xác thực người dùng.');
        }
      }
    } catch (error: any) {
      console.error('Error during user registration/login API call:', error);
      setErrorMessage('Đã có lỗi mạng hoặc lỗi không mong muốn. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('loggedInUserEmail');
    localStorage.removeItem('userToken'); // Xóa token khi logout
    setLoggedInUserEmail(null);
    setIsUserMenuOpen(false);
    // Tùy chọn: Gọi API /logout trên backend nếu có
  };

  const getDisplayEmail = (userEmail: string | null): string => {
    if (!userEmail) return '';
    const atIndex = userEmail.indexOf('@');
    let namePart = userEmail.substring(0, atIndex !== -1 ? atIndex : userEmail.length);
    if (namePart.length > 10) {
      namePart = namePart.substring(0, 10) + '...';
    }
    return namePart || 'User';
  };

  const toggleUserMenu = () => setIsUserMenuOpen(prev => !prev);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  return (
    <>
      <nav className={styles.navbar} >
        <div className={styles.logo}>
          <Link href="/" className={isActive('/') ? styles.activeLink : ''}>
            <span>SOOMETA</span>
          </Link>
        </div>

        <div className={styles.navRightContainer}>
          <ul className={styles.navList}>
            <li><Link href="/exams" className={isActive('/exams') ? styles.activeLink : ''}>Luyện Thi Theo Đề</Link></li>
            <li><Link href="/practice" className={isActive('/practice') ? styles.activeLink : ''}>Luyện Thi Theo Dạng</Link></li>
          </ul>

          <div className={styles.navAuth} ref={userMenuRef}>
            {loggedInUserEmail ? (
              <div className={styles.loggedInUserContainer}>
                <button onClick={toggleUserMenu} className={styles.userMenuButton} aria-expanded={isUserMenuOpen} aria-haspopup="true">
                  <span title={loggedInUserEmail}>{getDisplayEmail(loggedInUserEmail)}</span>
                  <svg className={`${styles.userMenuArrow} ${isUserMenuOpen ? styles.open : ''}`} viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M7 10l5 5 5-5H7z"></path></svg>
                </button>
                {isUserMenuOpen && (
                  <div className={styles.userDropdown}>
                    <button onClick={handleLogout} className={styles.logoutButtonDropdown}>Đăng xuất</button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={handleOpenLoginModal} className={styles.loginButton}>Đăng nhập</button>
            )}
          </div>
        </div>

        <button
          className={`${styles.hamburgerButton} ${isMenuOpen ? styles.open : ''}`}
          onClick={toggleMobileMenu}
          aria-label={isMenuOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={isMenuOpen}
        >
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
        </button>

        {isMenuOpen && <div className={styles.overlayMobile} onClick={closeMobileMenu}></div>}
        
        <div className={`${styles.mobileMenu} ${isMenuOpen ? styles.open : ''}`}>
          <ul>
            <li><Link href="/" onClick={closeMobileMenu} className={isActive('/') ? styles.mobileActiveLink : ''}>Trang Chủ</Link></li>
            <li><Link href="/exams" onClick={closeMobileMenu} className={isActive('/exams') ? styles.mobileActiveLink : ''}>Luyện Thi Theo Đề</Link></li>
            <li><Link href="/practice" onClick={closeMobileMenu} className={isActive('/practice') ? styles.mobileActiveLink : ''}>Luyện Thi Theo Dạng</Link></li>
            {/* <li><Link href="/study" onClick={closeMobileMenu} className={isActive('/study') ? styles.mobileActiveLink : ''}>Phòng Học Tập</Link></li> */}
            {/* <li><Link href="/materials" onClick={closeMobileMenu} className={isActive('/materials') ? styles.mobileActiveLink : ''}>Tài Liệu</Link></li> */}
             {loggedInUserEmail ? (
                <li><button onClick={() => { handleLogout(); closeMobileMenu(); }} className={styles.mobileAuthButton}>Đăng xuất ({getDisplayEmail(loggedInUserEmail)})</button></li>
            ) : (
                <li><button onClick={() => { handleOpenLoginModal(); closeMobileMenu(); }} className={styles.mobileAuthButton}>Đăng nhập</button></li>
            )}
          </ul>
        </div>
      </nav>

      {isLoginModalOpen && (
        <div className={styles.modalOverlayLogin} onClick={handleCloseLoginModal}>
          <div className={styles.loginModal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalCloseButton} onClick={handleCloseLoginModal} aria-label="Đóng modal đăng nhập">&times;</button>
            <h2>Đăng nhập / Đăng ký</h2>
            {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
            {!isCodeSent ? (
              <>
                <div className={styles.formGroup}>
                  <label htmlFor="email">Email:</label>
                  <input
                    type="email" id="email" value={email}
                    onChange={(e) => { setEmail(e.target.value); if(errorMessage) setErrorMessage('');}}
                    placeholder="Nhập email của bạn" disabled={isLoading}
                  />
                </div>
                <button onClick={handleSendVerificationCode} disabled={isLoading || !email || !email.includes('@')} className={styles.modalButtonPrimary}>
                  {isLoading ? 'Đang gửi...' : 'Lấy mã xác nhận'}
                </button>
              </>
            ) : (
              <>
                <p className={styles.infoMessage}>Một mã xác nhận đã được gửi đến {email}. Vui lòng kiểm tra hộp thư của bạn (kể cả spam).</p>
                <div className={styles.formGroup}>
                  <label htmlFor="verificationCode">Mã xác nhận (4 chữ số):</label>
                  <input
                    type="text" id="verificationCode" value={verificationCodeInput}
                    onChange={(e) => { setVerificationCodeInput(e.target.value.replace(/\D/g, '').slice(0,4)); if(errorMessage) setErrorMessage('');}}
                    placeholder="Nhập mã 4 chữ số" maxLength={4} disabled={isLoading}
                  />
                </div>
                <button onClick={handleVerifyCode} disabled={isLoading || verificationCodeInput.length !== 4} className={styles.modalButtonPrimary}>
                  {isLoading ? 'Đang xác nhận...' : 'Xác nhận'}
                </button>
                <button
                  onClick={handleSendVerificationCode}
                  disabled={isLoading || countdown > 0}
                  className={`${styles.modalButtonSecondary} ${styles.resendButton}`}
                >
                  {countdown > 0 ? `Gửi lại mã sau (${countdown}s)` : 'Gửi lại mã'}
                </button>
                 <button
                    onClick={() => {
                        setIsCodeSent(false);
                        setSentCode(null);
                        setVerificationCodeInput('');
                        setErrorMessage('');
                    }}
                    disabled={isLoading}
                    className={`${styles.modalButtonSecondary} ${styles.changeEmailButton}`}
                >
                    Thay đổi Email
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}