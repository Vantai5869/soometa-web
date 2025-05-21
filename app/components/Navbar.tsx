// app/components/Navbar.tsx
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './Navbar.module.css';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import GlobalLoginModal from './GlobalLoginModal'; // Navbar sẽ render GlobalLoginModal

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const currentUser = useAuthStore((state) => state.currentUser);
  const openLoginModal = useAuthStore((state) => state.openLoginModal);
  const logout = useAuthStore((state) => state.logout);
  const isLoadingAuth = useAuthStore((state) => state._isLoadingAuth);
  const storeIsLoginModalOpen = useAuthStore((state) => state.isLoginModalOpen);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string): boolean => {
    if (href === '/') return pathname === href;
    return pathname.startsWith(href);
  };

  const toggleMobileMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMobileMenu = () => {
    setIsMenuOpen(false);
    if (isClient && !storeIsLoginModalOpen) { // Chỉ remove nếu login modal cũng không mở
        document.body.classList.remove(styles.noScroll);
    }
  };

  useEffect(() => { closeMobileMenu(); }, [pathname]);

  useEffect(() => {
    if (!isClient) return;
    if (isMenuOpen || storeIsLoginModalOpen) {
      document.body.classList.add(styles.noScroll);
    } else {
      document.body.classList.remove(styles.noScroll);
    }
    return () => {
      if (isClient) document.body.classList.remove(styles.noScroll);
    };
  }, [isMenuOpen, storeIsLoginModalOpen, isClient]);

  const handleLogoutAndCloseMenu = () => {
    logout();
    setIsUserMenuOpen(false);
    closeMobileMenu();
    if (currentUser?.role === 'admin' && pathname.startsWith('/admin')) {
      router.push('/');
    }
  };

  const handleOpenLoginAndCloseMobileMenu = () => {
    openLoginModal(); 
    closeMobileMenu();
  };

  const getDisplayEmail = (userEmail: string | null): string => {
    if (!userEmail) return '';
    const atIndex = userEmail.indexOf('@');
    let namePart = userEmail.substring(0, atIndex !== -1 ? atIndex : userEmail.length);
    if (namePart.length > 10) namePart = namePart.substring(0, 10) + '...';
    return namePart || 'User';
  };

  const toggleUserMenu = () => setIsUserMenuOpen(prev => !prev);

  useEffect(() => {
    if(!isClient) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    else document.removeEventListener('mousedown', handleClickOutside);
    return () => {
      if(isClient) document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen, isClient]);

  if (!isClient || isLoadingAuth) {
    return (
      <nav className={styles.navbar}>
        <div className={styles.logo}><Link href="/"><span>TopikGo</span></Link></div>
        <div className={styles.navRightContainer}>
          <ul className={styles.navList}>
            <li><Link href="/exams" className={isActive('/exams') ? styles.activeLink : ''}>Luyện Thi Theo Đề</Link></li>
            <li><Link href="/practice" className={isActive('/practice') ? styles.activeLink : ''}>Luyện Thi Theo Dạng</Link></li>
          </ul>
          <div className={styles.navAuth} style={{ minWidth: '100px', height: '24px', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
        </div>
        <button className={styles.hamburgerButton} aria-label="Mở menu">
          {[1,2,3].map(i => <span key={`hamb-line-load-${i}`} className={styles.hamburgerLine}></span>)}
        </button>
      </nav>
    );
  }

  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          <Link href="/" className={isActive('/') ? styles.activeLink : ''}><span>TopikGo</span></Link>
        </div>
        <div className={styles.navRightContainer}>
          <ul className={styles.navList}>
            <li><Link href="/exams" className={isActive('/exams') ? styles.activeLink : ''}>Luyện Thi Theo Đề</Link></li>
            <li><Link href="/practice" className={isActive('/practice') ? styles.activeLink : ''}>Luyện Thi Theo Dạng</Link></li>
          </ul>
          <div className={styles.navAuth} ref={userMenuRef}>
            {currentUser ? (
              <div className={styles.loggedInUserContainer}>
                <button onClick={toggleUserMenu} className={styles.userMenuButton} aria-expanded={isUserMenuOpen} aria-haspopup="true">
                  <span title={currentUser.email}>{getDisplayEmail(currentUser.email)}</span>
                  <svg className={`${styles.userMenuArrow} ${isUserMenuOpen ? styles.open : ''}`} viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M7 10l5 5 5-5H7z"></path></svg>
                </button>
                {isUserMenuOpen && (
                  <div className={styles.userDropdown}>
                    {currentUser.role === 'admin' && (<Link href="/admin/dashboard" className={styles.dropdownLinkItem} onClick={() => setIsUserMenuOpen(false)}>Trang Admin</Link>)}
                   <Link className={styles.logoutButtonDropdown} href="/history" >Lịch Sử Luyện Thi</Link>
                    <button onClick={handleLogoutAndCloseMenu} className={styles.logoutButtonDropdown}>Đăng xuất</button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => openLoginModal()} className={styles.loginButton}>Đăng nhập</button>
            )}
          </div>
        </div>
        <button className={`${styles.hamburgerButton} ${isMenuOpen ? styles.open : ''}`} onClick={toggleMobileMenu} aria-label={isMenuOpen ? "Đóng menu" : "Mở menu"} aria-expanded={isMenuOpen}>
          {[1,2,3].map(i => <span key={`hamb-line-${i}`} className={styles.hamburgerLine}></span>)}
        </button>
        {isMenuOpen && <div className={styles.overlayMobile} onClick={closeMobileMenu}></div>}
        <div className={`${styles.mobileMenu} ${isMenuOpen ? styles.open : ''}`}>
          <ul>
            <li><Link href="/" onClick={closeMobileMenu} className={isActive('/') ? styles.mobileActiveLink : ''}>Trang Chủ</Link></li>
            <li><Link href="/exams" onClick={closeMobileMenu} className={isActive('/exams') ? styles.mobileActiveLink : ''}>Luyện Thi Theo Đề</Link></li>
            <li><Link href="/practice" onClick={closeMobileMenu} className={isActive('/practice') ? styles.mobileActiveLink : ''}>Luyện Thi Theo Dạng</Link></li>
            {currentUser ? (
              <>
                {currentUser.role === 'admin' && (<li><Link href="/admin/dashboard" onClick={closeMobileMenu} className={styles.mobileAuthButton}>Trang Admin</Link></li>)}
                <li><Link href="/history" >Lịch Sử Luyện Thi</Link></li>
                <li><button onClick={handleLogoutAndCloseMenu} className={styles.mobileAuthButton}>Đăng xuất ({getDisplayEmail(currentUser.email)})</button></li>

              </>
            ) : (
              <li><button onClick={handleOpenLoginAndCloseMobileMenu} className={styles.mobileAuthButton}>Đăng nhập</button></li>
            )}
          </ul>
        </div>
      </nav>
      {/* GlobalLoginModal được render ở đây để nó là một phần của Navbar client component tree */}
      {isClient && <GlobalLoginModal />}
    </>
  );
}