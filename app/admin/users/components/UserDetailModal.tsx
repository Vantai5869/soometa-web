// app/admin/users/UserDetailModal.tsx (hoặc vị trí bạn đặt)
'use client';

import React, { useState, useEffect } from 'react'; // Thêm useEffect nếu chưa có
import Link from 'next/link'; // Import Link để điều hướng
import { Badge } from '../../components/badge'; // **ĐIỀU CHỈNH ĐƯỜN DẪN NÀY** cho đúng
import type { User } from './../../users/page'; // Import User type từ page.tsx

interface UserDetailModalProps {
  user: User | null; 
  // isOpen prop không còn cần thiết nếu modal này tự quản lý việc render dựa trên user !== null
  // Hoặc nếu component cha vẫn dùng isOpen để render có điều kiện UserDetailModal thì giữ lại
  onClose: () => void;
  onConfirmDelete: (userId: string) => void;
}

const DetailItem: React.FC<{ label: string; value: React.ReactNode; isMonospace?: boolean }> = ({ label, value, isMonospace }) => (
  <div className="flex flex-col sm:flex-row py-2 border-b border-gray-100 last:border-b-0">
    <p className="w-full sm:w-1/3 text-gray-500 font-medium mb-1 sm:mb-0">{label}:</p>
    <div className={`w-full sm:w-2/3 text-gray-800 break-words ${isMonospace ? 'font-mono text-xs bg-gray-50 p-1 rounded' : ''}`}>
      {/* Thêm kiểm tra giá trị để hiển thị 'N/A' nếu rỗng hoặc undefined */}
      {value === undefined || value === null || value === '' ? <span className="italic text-gray-400">N/A</span> : value}
    </div>
  </div>
);

export default function UserDetailModal({ user, onClose, onConfirmDelete }: UserDetailModalProps) {
  const [viewMode, setViewMode] = useState<'details' | 'confirmDelete'>('details');

  // Reset viewMode về 'details' khi user prop thay đổi (ví dụ mở modal cho user khác)
  useEffect(() => {
    if (user) {
      setViewMode('details');
    }
  }, [user]);

  if (!user) return null; // Nếu không có user, không render gì cả

  const handleInitiateDelete = () => {
    setViewMode('confirmDelete');
  };

  const handleCancelDelete = () => {
    setViewMode('details');
  };

  const handleConfirmDeleteAction = () => {
    onConfirmDelete(user._id);
    // onClose(); // Component cha sẽ quyết định khi nào đóng modal sau khi xóa
  };

  const formatDate = (dateString?: string | null) => { // Thêm ? cho dateString
    if (!dateString) return 'Chưa có';
    try {
        return new Date(dateString).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'medium'});
    } catch (e) {
        return 'Ngày không hợp lệ';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-70 p-4 transition-opacity duration-300 ease-in-out"
      onClick={onClose} 
    >
      <div 
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-in-out"
        onClick={(e) => e.stopPropagation()} 
      >
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800">
            {/* Hiển thị email nếu user.name không có */}
            {viewMode === 'details' ? `Chi tiết: ${user.name || user.email}` : 'Xác nhận xoá người dùng'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-3xl"
            aria-label="Đóng modal"
          >
            &times;
          </button>
        </div>
        
        {viewMode === 'details' && (
          <>
            <div className="space-y-2 text-sm">
              <DetailItem label="ID" value={user._id} isMonospace />
              <DetailItem label="Email" value={user.email} />
              {/* Thêm user.name vào DetailItem nếu có */}
              {user.name && <DetailItem label="Tên" value={user.name} />}
              <DetailItem 
                label="Vai trò" 
                value={
                  <Badge 
                    variant={user.role === 'admin' ? 'destructive' : 'secondary'}
                    className={`capitalize ${user.role === 'admin' ? 'bg-red-100 text-red-700 border-red-300' : 'bg-blue-100 text-blue-700 border-blue-300'}`}
                  >
                    {user.role}
                  </Badge>
                } 
              />
              <DetailItem 
                label="Platform" 
                value={
                  <Badge variant="outline" className="border-gray-300 text-gray-600">
                    {user.platform}
                  </Badge>
                } 
              />
              <DetailItem label="Device ID" value={user.deviceId} isMonospace />
              <DetailItem 
                label="Trạng thái" 
                value={
                  <Badge className={user.isActive ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'}>
                    {user.isActive ? 'Hoạt động' : 'Tạm khóa'}
                  </Badge>
                } 
              />
              <DetailItem 
                label="Đăng nhập cuối" 
                value={formatDate(user.lastLogin)} 
              />
              <DetailItem 
                label="Ngày tạo" 
                value={formatDate(user.createdAt)} 
              />
            </div>

            {/* ===== BẮT ĐẦU PHẦN THÊM MỚI ===== */}
            <div className="mt-6 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link href={`/admin/users/${user._id}/exam-history`} passHref>
                <button
                  type="button"
                  className="w-full px-4 py-2.5 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-colors shadow-sm"
                >
                  Lịch sử làm bài
                </button>
              </Link>
              <Link href={`/admin/users/${user._id}/vocabulary`} passHref>
                <button
                  type="button"
                  className="w-full px-4 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors shadow-sm"
                >
                  Từ vựng đã lưu
                </button>
              </Link>
              <Link href={`/admin/users/${user._id}/edit`} passHref>
                <button
                  type="button"
                  className="w-full px-4 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors shadow-sm"
                >
                  Chỉnh sửa thông tin
                </button>
              </Link>
            </div>
            {/* ===== KẾT THÚC PHẦN THÊM MỚI ===== */}

            <div className="mt-8 pt-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={onClose}
                type="button"
                className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors shadow-sm hover:shadow-md"
              >
                Đóng
              </button>
              <button
                onClick={handleInitiateDelete}
                type="button"
                className="px-5 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors shadow-sm hover:shadow-md"
              >
                Xoá User
              </button>
            </div>
          </>
        )}

        {viewMode === 'confirmDelete' && (
          <>
            <p className="text-gray-700 mb-6">
              Bạn có chắc chắn muốn xoá người dùng <strong className="font-semibold">{user.email}</strong> (ID: <span className="font-mono text-xs bg-gray-100 p-0.5 rounded">{user._id}</span>)? 
              <br/>
              <span className="font-semibold text-red-600">Hành động này không thể hoàn tác.</span>
            </p>
            <div className="mt-8 pt-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={handleCancelDelete}
                type="button"
                className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors shadow-sm hover:shadow-md"
              >
                Huỷ
              </button>
              <button
                onClick={handleConfirmDeleteAction}
                type="button"
                className="px-5 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors shadow-sm hover:shadow-md"
              >
                Xác nhận xoá
              </button>
            </div>
          </>
        )}
      </div>
       {/* CSS cho scrollbar và animation (nếu cần từ UserDetailModal gốc của bạn) */}
       {/* <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        // ... (phần còn lại của style scrollbar nếu có) ...
      `}</style> */}
    </div>
  );
}