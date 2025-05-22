// app/components/Navbar.tsx
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './Navbar.module.css';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore'; // Đường dẫn đến Zustand store
import GlobalLoginModal from './GlobalLoginModal'; // Navbar sẽ render GlobalLoginModal

// --- SVG Icons (Giữ nguyên từ phiên bản trước) ---
const AdminIcon = () => <svg className="w-4 h-4 mr-2.5 text-slate-500 dark:text-slate-400 group-hover:text-current" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.566.379-1.566 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.566 2.6 1.566 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01-.947-2.287c1.566-.379 1.566-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>;
const HistoryIcon = () => <svg className="w-4 h-4 mr-2.5 text-slate-500 dark:text-slate-400 group-hover:text-current" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" /></svg>;
const VocabularyIcon = () => <svg className="w-4 h-4 mr-2.5 text-slate-500 dark:text-slate-400 group-hover:text-current" viewBox="0 0 20 20" fill="currentColor"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" /></svg>;
const GuideIcon = () => <svg className="w-4 h-4 mr-2.5 text-slate-500 dark:text-slate-400 group-hover:text-current" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>;
const LogoutIcon = () => <svg className="w-4 h-4 mr-2.5 text-slate-500 dark:text-red-400 group-hover:text-red-500 dark:group-hover:text-red-300" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2A.75.75 0 0010.75 3h-5.5A.75.75 0 004.5 4.25v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd" /><path fillRule="evenodd" d="M16.72 10.72a.75.75 0 010-1.06l-3.75-3.75a.75.75 0 111.06-1.06l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 11-1.06-1.06l3.75-3.75z" clipRule="evenodd" /></svg>;
const ProgressIcon = () => <svg className="w-4 h-4 mr-2.5 text-slate-500 dark:text-slate-400 group-hover:text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" ><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>;
// --- Hết SVG Icons ---


export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  const currentUser = useAuthStore((state) => state.currentUser);
  const openLoginModal = useAuthStore((state) => state.openLoginModal);
  const logout = useAuthStore((state) => state.logout);
  const isLoadingAuth = useAuthStore((state) => state._isLoadingAuth); // Sử dụng _isLoadingAuth
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
    // Đảm bảo body scroll lại nếu chỉ có mobile menu đóng và GlobalLoginModal cũng đang đóng
    if (isClient && !storeIsLoginModalOpen) { 
        document.body.classList.remove(styles.noScroll);
    }
  };

  useEffect(() => { 
    if(isMenuOpen) closeMobileMenu(); // Đóng mobile menu khi chuyển trang
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]); // Chỉ phụ thuộc pathname

  useEffect(() => {
    if (!isClient) return; // Chỉ chạy ở client
    if (isMenuOpen || storeIsLoginModalOpen) {
      document.body.classList.add(styles.noScroll);
    } else {
      document.body.classList.remove(styles.noScroll);
    }
    return () => { // Cleanup
      if (isClient) document.body.classList.remove(styles.noScroll);
    };
  }, [isMenuOpen, storeIsLoginModalOpen, isClient]);

  const handleLogoutAndCloseMenu = () => {
    logout();
    setIsUserMenuOpen(false);
    closeMobileMenu(); // Đóng cả mobile menu nếu đang mở
    if (currentUser?.role === 'admin' && pathname.startsWith('/admin')) {
      router.push('/');
    }
  };

  const handleOpenLoginAndCloseMobileMenu = () => {
    openLoginModal(); 
    closeMobileMenu();
  };

  const getDisplayEmail = (userEmail: string | null): string => {
    if (!userEmail) return 'User';
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
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      if(isClient) document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen, isClient]);

  // Placeholder khi đang load auth state
  if (!isClient || isLoadingAuth) {
    return (
      <nav className={styles.navbar}>
        <div className={styles.logo}><Link href="/"><span>TopikGo</span></Link></div>
        <div className={styles.navRightContainer}>
          <ul className={styles.navList}>
            <li><Link href="/exams" className={isActive('/exams') ? styles.activeLink : ''}>Luyện Đề</Link></li>
            <li><Link href="/practice" className={isActive('/practice') ? styles.activeLink : ''}>Luyện Dạng</Link></li>
            <li><Link href="/guide" className={isActive('/guide') ? styles.activeLink : ''}>Hướng Dẫn</Link></li>
            {/* Link Tiến Độ ở trạng thái loading (có thể ẩn hoặc dạng placeholder) */}
            {/* <li className="w-20 h-5 bg-gray-200 dark:bg-slate-700 rounded animate-pulse"></li> */}
          </ul>
          <div className="w-24 h-6 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
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
          <Link href="/" className={pathname === '/' ? styles.activeLink : ''}><span>TopikGo</span></Link>
        </div>
        <div className={styles.navRightContainer}>
          <ul className={styles.navList}>
            <li><Link href="/exams" className={isActive('/exams') ? styles.activeLink : ''}>Thi Thử</Link></li>
            <li><Link href="/practice" className={isActive('/practice') ? styles.activeLink : ''}>Luyện Tập</Link></li>
            <li><Link href="/guide" className={isActive('/guide') ? styles.activeLink : ''}>Hướng Dẫn</Link></li>
           
          </ul>
          <div className="relative" ref={userMenuRef}> {/* Sử dụng class Tailwind cho relative */}
            {currentUser ? (
              <div className={styles.loggedInUserContainer}> {/* Giữ class CSS module nếu cần */}
                <button onClick={toggleUserMenu} className={`${styles.userMenuButton} flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md focus:outline-none`}>
                  <span title={currentUser.email} className="truncate max-w-[100px]">{getDisplayEmail(currentUser.email)}</span>
                  <svg className={`ml-1.5 h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.23 8.29a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
                </button>
                {isUserMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-60 origin-top-right bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl z-50 py-1.5 ring-1 ring-black ring-opacity-5 focus:outline-none">
                    {currentUser.role === 'admin' && (
                        <Link href="/admin/dashboard" className="group flex items-center w-full px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-slate-100" onClick={() => setIsUserMenuOpen(false)}>
                           <AdminIcon /> Trang Quản Trị
                        </Link>
                    )}
                    {/* THÊM LINK TIẾN ĐỘ VÀO DROPDOWN */}
                    <Link href="/my-progress" className="group flex items-center w-full px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-slate-100" onClick={() => setIsUserMenuOpen(false)}>
                       <ProgressIcon /> Tiến Độ Học Tập
                    </Link>
                    <Link href="/history" className="group flex items-center w-full px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-slate-100" onClick={() => setIsUserMenuOpen(false)}>
                       <HistoryIcon /> Lịch Sử Luyện Thi
                    </Link>
                    <Link href="/my-vocabulary" className="group flex items-center w-full px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-slate-100" onClick={() => setIsUserMenuOpen(false)}>
                       <VocabularyIcon/> Từ vựng đã lưu
                    </Link>
                    <Link href="/guide" className="group flex items-center w-full px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-slate-100" onClick={() => setIsUserMenuOpen(false)}>
                       <GuideIcon /> Hướng dẫn
                    </Link>
                    <div className="my-1.5 h-px bg-gray-200 dark:bg-slate-700 mx-2"></div> 
                    <button onClick={handleLogoutAndCloseMenu} className="group flex items-center w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-800/20 hover:text-red-700 dark:hover:text-red-300 rounded-b-md"> {/* Có thể bỏ rounded-b-md nếu muốn đều */}
                       <LogoutIcon /> Đăng xuất
                    </button>
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
            <li><Link href="/guide" onClick={closeMobileMenu} className={isActive('/guide') ? styles.mobileActiveLink : ''}>Hướng Dẫn</Link></li>
            
            {currentUser && ( // Các link chỉ cho người đã đăng nhập
                 <li><Link href="/my-progress" onClick={closeMobileMenu} className={isActive('/my-progress') ? styles.mobileActiveLink : styles.mobileAuthButton}>Tiến Độ Học Tập</Link></li>
            )}
            {currentUser ? (
              <>
                {currentUser.role === 'admin' && (<li><Link href="/admin/dashboard" onClick={closeMobileMenu} className={styles.mobileAuthButton}>Trang Admin</Link></li>)}
                <li><Link href="/history" onClick={closeMobileMenu} className={styles.mobileAuthButton}>Lịch Sử Thi</Link></li>
                <li><Link href="/my-vocabulary" onClick={closeMobileMenu} className={styles.mobileAuthButton}>Từ Vựng</Link></li>
                <li><button onClick={handleLogoutAndCloseMenu} className={styles.mobileAuthButton}>Đăng xuất ({getDisplayEmail(currentUser.email)})</button></li>
              </>
            ) : (
              <li><button onClick={handleOpenLoginAndCloseMobileMenu} className={styles.mobileAuthButton}>Đăng nhập</button></li>
            )}
          </ul>
        </div>
      </nav>
      {/* GlobalLoginModal được render ở đây để nó là một phần của Navbar client component tree */}
      {/* Chỉ render GlobalLoginModal ở client side */}
      {isClient && <GlobalLoginModal />}
    </>
  );
}