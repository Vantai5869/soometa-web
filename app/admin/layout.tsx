// app/admin/layout.tsx
import Link from 'next/link';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const sidebarItems = [
  { name: 'Dashboard', href: '/admin/dashboard' },
  { name: 'Users', href: '/admin/users' },
  { name: 'Transcriptions', href: '/admin/transcriptions' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-100 border-r p-4">
        <h2 className="text-lg font-bold mb-6">Admin Panel</h2>
        <nav className="space-y-2">
          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded-md hover:bg-gray-200"
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-y-auto bg-white">
        {children}
      </main>
    </div>
  );
}
