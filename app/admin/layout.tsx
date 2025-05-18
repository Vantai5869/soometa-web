// app/admin/layout.tsx
'use client'; // This component will run on the client side

import Link from 'next/link';
import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Import usePathname
import { cn } from '@/lib/utils'; // Assuming you have this utility

// Define a type for your user data for clarity
interface UserData {
  _id: string;
  email: string;
  role: string; // e.g., 'admin', 'user'
  // Add any other relevant user fields
}

const sidebarItems = [
  { name: 'Dashboard', href: '/admin/dashboard' },
  { name: 'Users', href: '/admin/users' },
  { name: 'Transcriptions', href: '/admin/transcriptions' },
  // Add other admin links here
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname(); // Get the current path
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for user token and user data in localStorage
    const token = localStorage.getItem('userToken');
    const userDataString = localStorage.getItem('userData');

    if (!token || !userDataString) {
      // If no token or user data, redirect to homepage
      console.log('AdminLayout: No token or user data found. Redirecting to /');
      router.replace('/'); // Use replace to avoid adding to history stack
      return;
    }

    try {
      const userData: UserData = JSON.parse(userDataString);
      if (userData && userData.role === 'admin') {
        // User is an admin
        setIsAuthorized(true);
      } else {
        // User is not an admin or data is malformed
        console.log('AdminLayout: User is not an admin or data is malformed. Redirecting to /');
        router.replace('/');
      }
    } catch (error) {
      // Error parsing user data (e.g., corrupted data)
      console.error('AdminLayout: Error parsing user data from localStorage. Redirecting to /', error);
      localStorage.removeItem('userToken'); // Clear potentially corrupted data
      localStorage.removeItem('userData');
      localStorage.removeItem('loggedInUserEmail');
      router.replace('/');
    } finally {
      setIsLoading(false);
    }
  }, [router]); // router is a stable dependency

  if (isLoading) {
    // Show a loading state while checking authorization
    // This prevents a flash of admin content if the user is not authorized
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-600">Loading Admin Panel...</p>
        {/* You can add a spinner icon here */}
      </div>
    );
  }

  if (!isAuthorized) {
    // This case should ideally be handled by the redirect in useEffect,
    // but as a fallback, or if the redirect hasn't completed, don't render the admin layout.
    // It's better to ensure the redirect in useEffect is robust.
    // Returning null or a "Not Authorized" message here can also be an option,
    // but the redirect is cleaner.
    return null; // Or a "Not Authorized" component
  }

  // If authorized, render the admin layout
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 text-slate-100 border-r border-slate-700 p-5 flex flex-col">
        <div className="mb-8">
          <Link href="/admin/dashboard">
            <h2 className="text-2xl font-bold text-white hover:text-sky-400 transition-colors">
              Admin Panel
            </h2>
          </Link>
        </div>
        <nav className="space-y-1 flex-grow">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block px-4 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-sky-600 text-white shadow-md" 
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                )}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
        {/* Optional: Add a logout button or user info at the bottom of the sidebar */}
        <div className="mt-auto pt-4 border-t border-slate-700">
            {/* Example: Logout button - you'll need a handleLogout function */}
            {/* <button 
                onClick={handleLogout} 
                className="w-full px-4 py-2.5 rounded-md text-sm font-medium text-slate-300 hover:bg-rose-600 hover:text-white transition-colors text-left"
            >
                Đăng xuất
            </button> */}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto bg-slate-100">
        {children}
      </main>
    </div>
  );
}
