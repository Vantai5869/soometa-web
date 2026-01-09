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

// ... các imports khác ...

// Icon Bút Chì (Edit)
const EditPencilIcon = React.memo(() => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
  </svg>
));
EditPencilIcon.displayName = 'EditPencilIcon';

// Icon Dấu Tick (Confirm/Save)
const CheckIcon = React.memo(() => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
  </svg>
));
CheckIcon.displayName = 'CheckIcon';

// Icon cho Download
const DownloadIcon = React.memo(({ className }: { className?: string }) => <svg className={`w-4 h-4 mr-2.5 text-slate-500 dark:text-slate-400 group-hover:text-current ${className || ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>);
DownloadIcon.displayName = 'DownloadIcon';

const ListIcon = React.memo(({ className }: { className?: string }) => (
  <svg className={`w-4 h-4 mr-2.5 text-slate-500 dark:text-slate-400 group-hover:text-current ${className || ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
));
ListIcon.displayName = 'ListIcon';

const DeviceMobileIcon = React.memo(({ className }: { className?: string }) => (
  <svg className={`w-4 h-4 mr-2.5 text-slate-500 dark:text-slate-400 group-hover:text-current ${className || ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 002-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
));
DeviceMobileIcon.displayName = 'DeviceMobileIcon';

const ChevronDownIcon = React.memo(({ className }: { className?: string }) => (
  <svg 
    className={`ml-0.5 h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 shrink-0 ${className || ''}`} 
    viewBox="0 0 20 20" 
    fill="currentColor"
  >
    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.23 8.29a.75.75 0 01.02-1.06z" clipRule="evenodd" />
  </svg>
));
ChevronDownIcon.displayName = 'ChevronDownIcon';

// ... các hàm và useEffects khác của bạn giữ nguyên ...

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
  const setRefreshedUser = useAuthStore((state) => state.setRefreshedUser);
  const token = useAuthStore((state) => state.token);
  // Giữ nguyên các state local
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isDocsMenuOpen, setIsDocsMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const docsMenuRef = useRef<HTMLLIElement>(null);
  
  // Scroll detection for glassmorphism effect
  const [isScrolled, setIsScrolled] = useState(false);

// ... (các state hiện có: isClient, currentUser, token, setRefreshedUser, openLoginModal, logout, etc.)

const [isEditingName, setIsEditingName] = useState(false);
const [editedName, setEditedName] = useState('');
const [nameUpdateError, setNameUpdateError] = useState<string | null>(null);

// useEffect để khởi tạo editedName khi currentUser.name thay đổi (và không đang edit)
useEffect(() => {
  if (currentUser && !isEditingName) {
    setEditedName(currentUser.name || ''); // Lấy tên hiện tại hoặc chuỗi rỗng nếu chưa có
  }
}, [currentUser, isEditingName]);

const handleEditNameClick = () => {
  if (!currentUser) return;
  setEditedName(currentUser.name || getDisplayEmail(currentUser)); // Sử dụng tên hiện tại hoặc display email làm giá trị ban đầu
  setIsEditingName(true);
  setNameUpdateError(null); // Xóa lỗi cũ (nếu có)
};

const handleCancelEditName = () => {
  setIsEditingName(false);
  if (currentUser) {
    setEditedName(currentUser.name || ''); // Reset về tên ban đầu
  }
  setNameUpdateError(null);
};

const handleSaveName = async () => {
  if (!currentUser || !token) {
    alert("Vui lòng đăng nhập lại để cập nhật tên.");
    return;
  }
  if (editedName.trim() === (currentUser.name || '')) { // Không có gì thay đổi
    setIsEditingName(false);
    return;
  }

  setNameUpdateError(null); // Xóa lỗi cũ
  // Giả sử bạn có một biến môi trường cho API base URL
  const NEXT_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  try {
    const response = await fetch(`${NEXT_API_BASE_URL}/users/${currentUser._id}`, { // Hoặc API endpoint riêng cho cập nhật tên
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ name: editedName.trim() }), // Chỉ gửi trường name
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Lỗi khi cập nhật tên.');
    }

    // Cập nhật thành công, làm mới currentUser trong store
    if (result.user) {
      setRefreshedUser(result.user as UserData, token); // Giả sử API trả về user object đã cập nhật
    }
    setIsEditingName(false);
    // alert('Đã cập nhật tên thành công!'); // Bạn có thể dùng một thông báo tinh tế hơn

  } catch (error: any) {
    console.error("Lỗi cập nhật tên:", error);
    setNameUpdateError(error.message || "Không thể cập nhật tên. Vui lòng thử lại.");
  }
};

// ... (các hàm và useEffect khác của bạn giữ nguyên) ...
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

  useEffect(() => {
    if(!isClient || !isDocsMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (docsMenuRef.current && !docsMenuRef.current.contains(event.target as Node)) {
        setIsDocsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      if(isClient) document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDocsMenuOpen, isClient]);

  // Scroll event listener for glassmorphism effect
  useEffect(() => {
    if (!isClient) return;
    
    // Find the scrollable parent container
    const findScrollableParent = (element: HTMLElement | null): HTMLElement | null => {
      if (!element) return null;
      
      const parent = element.parentElement;
      if (!parent) return null;
      
      const overflowY = window.getComputedStyle(parent).overflowY;
      if (overflowY === 'auto' || overflowY === 'scroll') {
        return parent;
      }
      
      return findScrollableParent(parent);
    };
    
    // Get navbar element to find its scrollable parent
    const navElement = document.querySelector('nav');
    const scrollableContainer = navElement ? findScrollableParent(navElement) : null;
    
    const handleScroll = () => {
      const scrollTop = scrollableContainer ? scrollableContainer.scrollTop : window.scrollY;
      setIsScrolled(scrollTop > 50);
    };
    
    // Set initial state
    handleScroll();
    
    // Listen to scroll on the correct container
    const target = scrollableContainer || window;
    target.addEventListener('scroll', handleScroll, { passive: true } as any);
    
    return () => {
      if (isClient) {
        target.removeEventListener('scroll', handleScroll);
      }
    };
  }, [isClient]);

  // Placeholder khi đang load auth state (giữ nguyên)
  if (!isClient || isLoadingAuth) {
    return (
      <nav className={styles.navbar}>
        <div className={styles.logo}><Link href="/"><span>TopikGo</span></Link></div>
        <div className={styles.navRightContainer}>
          <ul className={styles.navList}>
            <li><Link href="/exams" className={isActive('/exams') ? styles.activeLink : styles.navLinkItem}>Luyện Đề</Link></li>
            <li><Link href="/practice" className={isActive('/practice') ? styles.activeLink : styles.navLinkItem}>Luyện Dạng</Link></li>
            <li><Link href="/guide" className={isActive('/guide') ? styles.activeLink : styles.navLinkItem}>Tải app</Link></li>
          </ul>
          <div className="w-24 h-8 bg-gray-200 dark:bg-slate-700 rounded-md animate-pulse" />
        </div>
        <button className={styles.hamburgerButton} aria-label="Mở menu">
          {[1,2,3].map(i => <span key={`hamb-line-load-${i}`} className={styles.hamburgerLine}></span>)}
        </button>
      </nav>
    );
  }

  return (
    <>
      <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : styles.transparent}`}>
        <div className={styles.logo}>
          <Link href="/" className={isActive('/') ? styles.activeLink : styles.navLinkItem}><span>TopikGo</span></Link>
        </div>
        <div className={styles.navRightContainer}>
          <ul className={styles.navList}>
            {/* Giữ nguyên các link navList bạn đã cung cấp */}
            <li><Link href="/exams" className={isActive('/exams') ? styles.activeLink : styles.navLinkItem}>Thi Thử</Link></li>
            <li><Link href="/practice" className={isActive('/practice') ? styles.activeLink : styles.navLinkItem}>Luyện Tập</Link></li>
            
            <li className="relative" ref={docsMenuRef}>
              <button 
                onClick={() => setIsDocsMenuOpen(!isDocsMenuOpen)}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md transition-all duration-200 group cursor-pointer ${isActive('/download') || isActive('/topik-30-days') || isActive('/guide') ? styles.activeLink : styles.navLinkItem}`}
              >
                <span className="font-medium">Tài liệu</span>
                <ChevronDownIcon className={isDocsMenuOpen ? 'rotate-180 text-sky-500' : 'group-hover:text-sky-500'} />
              </button>
              
              {isDocsMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 origin-top-right bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-gray-100 dark:border-slate-700/50 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1),0_15px_20px_-10px_rgba(0,0,0,0.05)] z-50 py-3 focus:outline-none animate-in fade-in zoom-in duration-300">
                  <Link 
                    href="/download" 
                    className="group flex items-center w-full px-5 py-3 text-sm text-gray-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-sky-900/30 hover:text-sky-600 dark:hover:text-sky-400 transition-all duration-200"
                    onClick={() => setIsDocsMenuOpen(false)}
                  >
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-900/30 text-sky-500 group-hover:bg-sky-100 dark:group-hover:bg-sky-800/40 transition-colors mr-3.5">
                      <DownloadIcon className="!mr-0 w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-[0.925rem]">Kho đề thi TOPIK</span>
                      <span className="text-[11px] text-gray-400 dark:text-slate-500 font-normal">Tải đề thi các kỳ trước đó</span>
                    </div>
                  </Link>
                  <Link 
                    href="/topik-30-days" 
                    className="group flex items-center w-full px-5 py-3 text-sm text-gray-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-sky-900/30 hover:text-sky-600 dark:hover:text-sky-400 transition-all duration-200"
                    onClick={() => setIsDocsMenuOpen(false)}
                  >
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-900/30 text-orange-500 group-hover:bg-orange-100 dark:group-hover:bg-orange-800/40 transition-colors mr-3.5">
                      <ListIcon className="!mr-0 w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-[0.925rem]">Lộ trình 30 ngày</span>
                      <span className="text-[11px] text-gray-400 dark:text-slate-500 font-normal">Ôn tập TOPIK theo lộ trình</span>
                    </div>
                  </Link>
                  <div className="mx-5 my-2.5 h-px bg-gray-50 dark:bg-slate-700/50" />
                  <Link 
                    href="/guide" 
                    className="group flex items-center w-full px-5 py-3 text-sm text-gray-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-sky-900/30 hover:text-sky-600 dark:hover:text-sky-400 transition-all duration-200"
                    onClick={() => setIsDocsMenuOpen(false)}
                  >
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-800/40 transition-colors mr-3.5">
                      <DeviceMobileIcon className="!mr-0 w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-[0.925rem]">Tải app học tập</span>
                      <span className="text-[11px] text-gray-400 dark:text-slate-500 font-normal">Học mọi lúc mọi nơi</span>
                    </div>
                  </Link>
                </div>
              )}
            </li>
            
            {/* {currentUser && (
                 <li><Link href="/my-progress" className={isActive('/my-progress') ? styles.activeLink : styles.navLinkItem}>Tiến Độ</Link></li>
            )} */}
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
                    {isUserMenuOpen && (
  <div >
    {/* User Info Header in Dropdown */}
    <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-1">
        {!isEditingName ? (
          <>
            <p 
              className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate flex-grow" 
              title={currentUser?.email || ''}
            >
              {currentUser?.name || getDisplayEmail(currentUser)}
            </p>
            <button 
              onClick={handleEditNameClick} 
              className="ml-2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full focus:outline-none focus:ring-1 focus:ring-sky-500"
              title="Sửa tên hiển thị"
            >
              <EditPencilIcon />
            </button>
          </>
        ) : (
          <div className="flex items-center w-full space-x-1.5">
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') handleCancelEditName(); }}
              className="flex-grow px-2 py-1 text-sm border border-sky-300 dark:border-sky-700 rounded-md focus:ring-1 focus:ring-sky-500 focus:border-sky-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
              autoFocus
              maxLength={50}
            />
            <button 
              onClick={handleSaveName}
              className="p-1.5 text-green-500 hover:text-green-700 dark:hover:text-green-400 rounded-full focus:outline-none focus:ring-1 focus:ring-green-500"
              title="Lưu tên"
            >
              <CheckIcon />
            </button>
             
            <button 
              onClick={handleCancelEditName}
              className="p-1.5 text-red-500 hover:text-red-700 dark:hover:text-red-400 rounded-full focus:outline-none focus:ring-1 focus:ring-red-500"
              title="Hủy"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
            
          </div>
        )}
      </div>
      {nameUpdateError && <p className="px-4 text-xs text-red-600 pt-0.5 pb-1">{nameUpdateError}</p>}

      <p className="px-4 text-xs text-gray-500 dark:text-slate-400 truncate pb-1.5">
        {currentUser?.email}
      </p>
      {currentUser?.role === 'admin' && (
        <span className="ml-4 mb-1.5 inline-block px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100 rounded-full">Quản trị viên</span>
      )}
      {currentUser?.role === 'user' && currentUser?.subscriptionTier === 'premium' && (
        <span className="ml-4 mb-1.5 inline-block px-2 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100 rounded-full">Premium</span>
      )}
    </div>
    {/* Các Link items trong dropdown như cũ */}
    {/* ... */}
  </div>
)}

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
                        <Link href="/download" className="group flex items-center w-full px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-slate-100" onClick={() => setIsUserMenuOpen(false)}>
                           <DownloadIcon /> Tải Đề Thi
                        </Link>
                        <Link href="/guide" className="group flex items-center w-full px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-slate-100" onClick={() => setIsUserMenuOpen(false)}>
                           <GuideIcon /> Tải app
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
            
            <li className="px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest dark:text-slate-500">Tài liệu</li>
            <li>
              <Link href="/download" onClick={closeMobileMenu} className={isActive('/download') ? styles.mobileActiveLink : styles.mobileNavLinkItem}>
                <div className="flex items-center">
                  <DownloadIcon className="mr-3 text-gray-400" />
                  <span>Kho đề thi TOPIK</span>
                </div>
              </Link>
            </li>
            <li>
              <Link href="/topik-30-days" onClick={closeMobileMenu} className={isActive('/topik-30-days') ? styles.mobileActiveLink : styles.mobileNavLinkItem}>
                <div className="flex items-center">
                  <ListIcon className="mr-3 text-gray-400" />
                  <span>Tải đề TOPIK 30 ngày</span>
                </div>
              </Link>
            </li>
            <li>
              <Link href="/guide" onClick={closeMobileMenu} className={isActive('/guide') ? styles.mobileActiveLink : styles.mobileNavLinkItem}>
                <div className="flex items-center">
                  <DeviceMobileIcon className="mr-3 text-gray-400" />
                  <span>Tải app học tập</span>
                </div>
              </Link>
            </li>
            {/* {currentUser && (
                 <li><Link href="/my-progress" onClick={closeMobileMenu} className={isActive('/my-progress') ? styles.mobileActiveLink : styles.mobileAuthButton}>Tiến Độ Học Tập</Link></li>
            )} */}
            {currentUser ? (
              <>
                {currentUser.role === 'admin' && (<li><Link href="/admin/dashboard" onClick={closeMobileMenu} className={styles.mobileAuthButton}>Trang Quản Trị</Link></li>)}
                <li><Link href="/my-progress" onClick={closeMobileMenu} className={isActive('/my-progress') ? styles.mobileActiveLink : styles.mobileAuthButton}>Tiến Độ Học Tập</Link></li>
                <li><Link href="/history" onClick={closeMobileMenu} className={styles.mobileAuthButton}>Lịch Sử Thi</Link></li>
                <li><Link href="/my-vocabulary" onClick={closeMobileMenu} className={styles.mobileAuthButton}>Từ Vựng</Link></li>
                <li><Link href="/download" onClick={closeMobileMenu} className={styles.mobileAuthButton}>Tải Đề Thi</Link></li>
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