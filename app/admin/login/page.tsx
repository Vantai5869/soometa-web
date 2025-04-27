'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function AdminLoginPage() {
  const [code, setCode] = useState('');
  const router = useRouter();

  useEffect(() => {
    const cookies = document.cookie.split('; ').find(row => row.startsWith('admin_code='));
    if (cookies?.split('=')[1] === '000') {
      router.push('/admin/dashboard');
    }
  }, [router]);

  const handleSubmit = () => {
    if (code === '000') {
      document.cookie = 'admin_code=000; path=/';
      router.push('/admin/dashboard');
    } else {
      alert('Sai mã truy cập!');
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold text-center">Nhập mã truy cập</h1>
        <Input
          type="password"
          placeholder="Nhập mã (000)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <Button className="w-full" onClick={handleSubmit}>
          Vào Admin
        </Button>
      </div>
    </div>
  );
}
