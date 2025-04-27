// app/admin/users/page.tsx
'use client';

import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';

type User = {
  _id: string;
  email: string;
  deviceId: string;
  platform: 'iOS' | 'Android';
  createdAt: string;
  role: string;
  isActive: boolean;
  lastLogin: string | null;
};

export default function UserListPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://soometa-be.onrender.com/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p>Đang tải dữ liệu...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Danh sách người dùng</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border rounded-md text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Platform</th>
              <th className="p-2 text-left">Device ID</th>
              <th className="p-2 text-left">Active</th>
              <th className="p-2 text-left">Last Login</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-t">
                <td className="p-2">{u.email}</td>
                <td className="p-2">
                  <Badge variant="outline">{u.platform}</Badge>
                </td>
                <td className="p-2 text-gray-500">{u.deviceId}</td>
                <td className="p-2">
                  <Badge className={u.isActive ? 'bg-green-500' : 'bg-red-500'}>
                    {u.isActive ? 'Hoạt động' : 'Tạm khóa'}
                  </Badge>
                </td>
                <td className="p-2">{u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Chưa có'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
