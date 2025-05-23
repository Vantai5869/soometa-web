// app/components/Navbar.tsx
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './Navbar.module.css';
import React, { useState, useEffect, useRef, useCallback } from 'react'; // Import React
import { useAuthStore, UserData } from '../store/authStore'; // Import UserData nếu store export
import GlobalLoginModal from './GlobalLoginModal';

// --- SVG Icons (Giữ nguyên từ phiên bản trước, thêm PremiumUserIcon nếu bạn muốn icon riêng) ---
const AdminIconForDropdown = React.memo(() => <svg className="w-4 h-4 mr-2.5 text-slate-500 dark:text-slate-400 group-hover:text-current" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.566.379-1.566 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.566 2.6 1.566 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01-.947-2.287c1.566-.379 1.566-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>);
AdminIconForDropdown.displayName = 'AdminIconForDropdown';

const HistoryIcon = React.memo(() => <svg className="w-4 h-4 mr-2.5 text-slate-500 dark:text-slate-400 group-hover:text-current" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" /></svg>);
HistoryIcon.displayName = 'HistoryIcon';

const VocabularyIcon = React.memo(() => <svg className="w-4 h-4 mr-2.5 text-slate-500 dark:text-slate-400 group-hover:text-current" viewBox="0 0 20 20" fill="currentColor"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" /></svg>);
VocabularyIcon.displayName = 'VocabularyIcon';

const GuideIcon = React.memo(() => <svg className="w-4 h-4 mr-2.5 text-slate-500 dark:text-slate-400 group-hover:text-current" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>);
GuideIcon.displayName = 'GuideIcon';

const LogoutIcon = React.memo(() => <svg className="w-4 h-4 mr-2.5 text-slate-500 dark:text-red-400 group-hover:text-red-500 dark:group-hover:text-red-300" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2A.75.75 0 0010.75 3h-5.5A.75.75 0 004.5 4.25v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd" /><path fillRule="evenodd" d="M16.72 10.72a.75.75 0 010-1.06l-3.75-3.75a.75.75 0 111.06-1.06l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 111.06-1.06l3.75-3.75z" clipRule="evenodd" /></svg>);
LogoutIcon.displayName = 'LogoutIcon';

const ProgressIcon = React.memo(() => <svg className="w-4 h-4 mr-2.5 text-slate-500 dark:text-slate-400 group-hover:text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" ><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>);
ProgressIcon.displayName = 'ProgressIcon';

// Icon cho User (ví dụ: hình người đơn giản)
const UserIcon = React.memo(() => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-600 dark:text-slate-300"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM10 12a5.99 5.99 0 00-4.793 2.39A6.483 6.483 0 0010 16.5a6.483 6.483 0 004.793-2.11A5.99 5.99 0 0010 12z" clipRule="evenodd" /></svg>);
UserIcon.displayName = 'UserIcon';

// Icon Vương miện cho Premium User
const CrownIcon = React.memo(() => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="w-3 h-3 text-amber-500 dark:text-amber-400 absolute -top-1 -right-1 transform translate-x-1/4 -translate-y-1/4"
  >
    <path d="M4 8l2.5-4 3.5 3 2-5 3.5 3L16 8h-3.5l-1.5 3.5h-3l-1.5-3.5H4zM3 8h14v1.5H3V8z" />
    <path d="M10 10.5a1 1 0 100 2 1 1 0 000-2z" />
  </svg>
));
CrownIcon.displayName = 'CrownIcon';
// --- Hết SVG Icons ---

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  // Giữ nguyên các state và hook từ store như file bạn cung cấp
  const currentUser = useAuthStore((state) => state.currentUser);
  const openLoginModal = useAuthStore((state) => state.openLoginModal);
  const logout = useAuthStore((state) => state.logout);
  const isLoadingAuth = useAuthStore((state) => state._isLoadingAuth);
  const storeIsLoginModalOpen = useAuthStore((state) => state.isLoginModalOpen);

  // Giữ nguyên các state local
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Giữ nguyên các hàm helper và useEffects bạn đã có
  // Chỉ thêm useCallback và dependencies nếu chúng thực sự cần thiết và chưa có
  const isActive = useCallback((href: string): boolean => {
    if (!isClient) return false;
    if (href === '/') return pathname === href;
    return pathname.startsWith(href);
  }, [pathname, isClient]);

  const toggleMobileMenu = useCallback(() => setIsMenuOpen(prev => !prev), []);

  const closeMobileMenu = useCallback(() => {
    setIsMenuOpen(false);
    if (isClient && !useAuthStore.getState().isLoginModalOpen) { 
        document.body.classList.remove(styles.noScroll);
    }
  }, [isClient]);

  useEffect(() => { 
    if(isMenuOpen) closeMobileMenu();
  }, [pathname]);

  console.log("Navbar: isMenuOpen", isMenuOpen);
  console.log("Navbar: storeIsLoginModalOpen", storeIsLoginModalOpen);
  useEffect(() => {
    if (!isClient) return;
    // Sử dụng storeIsLoginModalOpen từ state đã select để có tính reactive trong effect này
    if (isMenuOpen || storeIsLoginModalOpen) { 
      document.body.classList.add(styles.noScroll);
    } else {
      document.body.classList.remove(styles.noScroll);
    }
    return () => {
      if (isClient) document.body.classList.remove(styles.noScroll);
    };
  }, [isMenuOpen, storeIsLoginModalOpen, isClient]);

  const handleLogoutAndCloseMenu = useCallback(() => {
    const userRoleBeforeLogout = useAuthStore.getState().currentUser?.role;
    const currentPathname = pathname; // Chốt giá trị pathname
    logout();
    setIsUserMenuOpen(false);
    closeMobileMenu();
    if (userRoleBeforeLogout === 'admin' && currentPathname.startsWith('/admin')) {
      router.push('/');
    }
  },[logout, closeMobileMenu, pathname, router]);

  const handleOpenLoginAndCloseMobileMenu = useCallback(() => {
    openLoginModal(); 
    closeMobileMenu();
  }, [openLoginModal, closeMobileMenu]);

  const getDisplayEmail = useCallback((user: UserData | null): string => { // Nhận UserData | null
    if (!user) return 'User';
    // Ưu tiên hiển thị name nếu có và không rỗng
    if (user.name && user.name.trim() !== '') {
        return user.name.length > 15 ? user.name.substring(0, 12) + '...' : user.name;
    }
    if (!user.email) return 'User'; // Fallback nếu email cũng không có
    const atIndex = user.email.indexOf('@');
    let namePart = user.email.substring(0, atIndex !== -1 ? atIndex : user.email.length);
    if (namePart.length > 10) namePart = namePart.substring(0, 10) + '...';
    return namePart || 'User';
  }, []);

  const toggleUserMenu = useCallback(() => setIsUserMenuOpen(prev => !prev), []);

  useEffect(() => {
    if(!isClient || !isUserMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      if(isClient) document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen, isClient]);


  // Placeholder khi đang load auth state (giữ nguyên)
  if (!isClient || isLoadingAuth) {
    return (
      <nav className={styles.navbar}>
        <div className={styles.logo}><Link href="/"><span>TopikGo</span></Link></div>
        <div className={styles.navRightContainer}>
          <ul className={styles.navList}>
            <li><Link href="/exams" className={isActive('/exams') ? styles.activeLink : styles.navLinkItem}>Luyện Đề</Link></li>
            <li><Link href="/practice" className={isActive('/practice') ? styles.activeLink : styles.navLinkItem}>Luyện Dạng</Link></li>
            <li><Link href="/guide" className={isActive('/guide') ? styles.activeLink : styles.navLinkItem}>Hướng Dẫn</Link></li>
          </ul>
          <div className="w-24 h-8 bg-gray-200 dark:bg-slate-700 rounded-md animate-pulse" />
        </div>
        <button className={styles.hamburgerButton} aria-label="Mở menu">
          {[1,2,3].map(i => <span key={`hamb-line-load-${i}`} className={styles.hamburgerLine}></span>)}
        </button>
      </nav>
    );
  }

  console.log("Navbar: currentUser", currentUser);
  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          <Link href="/" className={isActive('/') ? styles.activeLink : styles.navLinkItem}><span>TopikGo</span></Link>
        </div>
        <div className={styles.navRightContainer}>
          <ul className={styles.navList}>
            {/* Giữ nguyên các link navList bạn đã cung cấp */}
            <li><Link href="/exams" className={isActive('/exams') ? styles.activeLink : styles.navLinkItem}>Thi Thử</Link></li>
            <li><Link href="/practice" className={isActive('/practice') ? styles.activeLink : styles.navLinkItem}>Luyện Tập</Link></li>
            <li><Link href="/guide" className={isActive('/guide') ? styles.activeLink : styles.navLinkItem}>Hướng Dẫn</Link></li>
            {currentUser && (
                 <li><Link href="/my-progress" className={isActive('/my-progress') ? styles.activeLink : styles.navLinkItem}>Tiến Độ</Link></li>
            )}
          </ul>
          <div className="relative" ref={userMenuRef}>
            {currentUser ? (
              <div className={styles.loggedInUserContainer}>
                <button 
                  onClick={toggleUserMenu} 
                  className="relative flex items-center space-x-1.5 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-offset-slate-800 focus:ring-offset-1 group"
                  title={ // Tooltip sẽ hiển thị dựa trên trạng thái
                    currentUser.role === 'admin' ? "Tài khoản Quản trị viên" :
                    (currentUser.role === 'user' && currentUser.subscriptionTier === 'premium') ? "Bạn là thành viên Premium" :
                    currentUser.email
                  }
                >
                  {/* Icon User cơ bản */}
                  <span className="relative inline-block shrink-0" 
                        aria-label={getDisplayEmail(currentUser)}
                  >
                    <UserIcon/> {/* Icon User chung */}
                    {/* Icon Vương miện cho Premium User, đặt chồng lên UserIcon */}
                    {currentUser.role === 'user' && currentUser.subscriptionTier === 'premium' && (
                        <span className="absolute -top-1.5 -right-1.5 transform translate-x-1/2 -translate-y-1/2" title="Thành viên Premium"> 
                            <CrownIcon />
                        </span>
                    )}
                     {/* Icon Admin riêng biệt (nếu muốn khác UserIcon) hoặc cũng có thể là vương miện/huy hiệu */}
                     {currentUser.role === 'admin' && (
                        <span className="absolute -top-1.5 -right-1.5 transform translate-x-1/2 -translate-y-1/2" title="Tài khoản Quản trị viên">
                            {/* Có thể dùng AdminIconSvg ở đây hoặc một icon khác như vương miện màu khác */}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-red-500 dark:text-red-400">
                                <path d="M10 1a.75.75 0 01.686.462l1.107 2.646a.75.75 0 00.54.54l2.646 1.107a.75.75 0 01.462.686v2.118a.75.75 0 01-.462.686l-2.646 1.107a.75.75 0 00-.54.54l-1.107 2.646A.75.75 0 0110 14.75a.75.75 0 01-.686-.462l-1.107-2.646a.75.75 0 00-.54-.54l-2.646-1.107a.75.75 0 01-.462-.686V7.882a.75.75 0 01.462-.686l2.646-1.107a.75.75 0 00.54-.54L9.314 1.538A.75.75 0 0110 1z" />
                            </svg>
                        </span>
                    )}
                  </span>

                  <span className="truncate max-w-[70px] sm:max-w-[80px] group-hover:text-sky-600 dark:group-hover:text-sky-400">
                    {getDisplayEmail(currentUser)}
                  </span>
                  
                  <svg className={`ml-0.5 h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 shrink-0 ${isUserMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.23 8.29a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
                </button>
                {isUserMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-64 origin-top-right bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl z-50 py-1.5 ring-1 ring-black ring-opacity-5 focus:outline-none">
                    {/* User Info Header in Dropdown */}
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate" title={currentUser.email}>
                            {currentUser.name || getDisplayEmail(currentUser)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{currentUser.email}</p>
                        {currentUser.role === 'admin' && (
                            <span className="mt-1 inline-block px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100 rounded-full">Quản trị viên</span>
                        )}
                        {currentUser.role === 'user' && currentUser.subscriptionTier === 'premium' && (
                            <span className="mt-1 inline-block px-2 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100 rounded-full">Premium</span>
                        )}
                    </div>

                    <div className="py-1"> {/* Thêm padding cho nhóm link */}
                        {currentUser.role === 'admin' && (
                            <Link href="/admin/dashboard" className="group flex items-center w-full px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-slate-100" onClick={() => setIsUserMenuOpen(false)}>
                               {/* <DropdownAdminIcon /> Trang Quản Trị */}
                               <AdminIconForDropdown /> Trang Quản Trị
                            </Link>
                        )}
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
                           <GuideIcon /> Hướng dẫn sử dụng
                        </Link>
                    </div>
                    <div className="my-1 h-px bg-gray-200 dark:bg-slate-700 mx-2"></div> 
                    <button onClick={handleLogoutAndCloseMenu} className="group flex items-center w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-800/20 hover:text-red-700 dark:hover:text-red-300">
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
            <li><Link href="/" onClick={closeMobileMenu} className={isActive('/') ? styles.mobileActiveLink : styles.mobileNavLinkItem}>Trang Chủ</Link></li>
            <li><Link href="/exams" onClick={closeMobileMenu} className={isActive('/exams') ? styles.mobileActiveLink : styles.mobileNavLinkItem}>Luyện Đề</Link></li>
            <li><Link href="/practice" onClick={closeMobileMenu} className={isActive('/practice') ? styles.mobileActiveLink : styles.mobileNavLinkItem}>Luyện Dạng</Link></li>
            <li><Link href="/guide" onClick={closeMobileMenu} className={isActive('/guide') ? styles.mobileActiveLink : styles.mobileNavLinkItem}>Hướng Dẫn</Link></li>
            {currentUser && (
                 <li><Link href="/my-progress" onClick={closeMobileMenu} className={isActive('/my-progress') ? styles.mobileActiveLink : styles.mobileAuthButton}>Tiến Độ Học Tập</Link></li>
            )}
            {currentUser ? (
              <>
                {currentUser.role === 'admin' && (<li><Link href="/admin/dashboard" onClick={closeMobileMenu} className={styles.mobileAuthButton}>Trang Quản Trị</Link></li>)}
                <li><Link href="/history" onClick={closeMobileMenu} className={styles.mobileAuthButton}>Lịch Sử Thi</Link></li>
                <li><Link href="/my-vocabulary" onClick={closeMobileMenu} className={styles.mobileAuthButton}>Từ Vựng</Link></li>
                <li>
                  <button onClick={handleLogoutAndCloseMenu} className={styles.mobileAuthButton}>
                    Đăng xuất ({getDisplayEmail(currentUser)})
                    {currentUser.role === 'admin' ? (<span className="ml-1.5 px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded-full align-middle">Admin</span>)
                    : (currentUser.role === 'user' && currentUser.subscriptionTier === 'premium') ? (<span className="ml-1.5 px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full align-middle">Premium</span>)
                    : null}
                  </button>
                </li>
              </>
            ) : (
              <li><button onClick={handleOpenLoginAndCloseMobileMenu} className={styles.mobileAuthButton}>Đăng nhập</button></li>
            )}
          </ul>
        </div>
      </nav>
      {isClient && <GlobalLoginModal />}
    </>
  );
}