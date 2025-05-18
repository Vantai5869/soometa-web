// app/admin/users/UserDetailModal.tsx (hoặc vị trí bạn muốn)
'use client';

import React, { useState }from 'react';
import { Badge } from '../components/badge'; // **ĐIỀU CHỈNH ĐƯỜN DẪN NÀY** cho đúng với vị trí Badge component của bạn
import type { User } from './../users/page'; // Import User type từ page.tsx

interface UserDetailModalProps {
  user: User | null; // Allow user to be null for initial state or when no user is selected
  onClose: () => void;
  onConfirmDelete: (userId: string) => void; // Callback for when delete is confirmed
}

// Helper component để hiển thị từng mục chi tiết cho nhất quán
const DetailItem: React.FC<{ label: string; value: React.ReactNode; isMonospace?: boolean }> = ({ label, value, isMonospace }) => (
  <div className="flex flex-col sm:flex-row py-2 border-b border-gray-100 last:border-b-0">
    <p className="w-full sm:w-1/3 text-gray-500 font-medium mb-1 sm:mb-0">{label}:</p>
    <div className={`w-full sm:w-2/3 text-gray-800 break-words ${isMonospace ? 'font-mono text-xs bg-gray-50 p-1 rounded' : ''}`}>
      {value}
    </div>
  </div>
);

export default function UserDetailModal({ user, onClose, onConfirmDelete }: UserDetailModalProps) {
  const [viewMode, setViewMode] = useState<'details' | 'confirmDelete'>('details');

  // Effect to reset viewMode to 'details' when the user prop changes (e.g., modal is opened for a new user)
  // or when the modal is closed and re-opened.
  React.useEffect(() => {
    if (user) {
      setViewMode('details');
    }
  }, [user]);

  if (!user) return null;

  const handleInitiateDelete = () => {
    setViewMode('confirmDelete');
  };

  const handleCancelDelete = () => {
    setViewMode('details');
  };

  const handleConfirmDeleteAction = () => {
    onConfirmDelete(user._id);
    // The parent component should call onClose after the delete operation is complete.
    // Or, if you want the modal to close immediately after clicking confirm:
    // onClose(); 
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-70 p-4 transition-opacity duration-300 ease-in-out"
      onClick={onClose} // Đóng modal khi click vào overlay
    >
      <div 
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-in-out"
        onClick={(e) => e.stopPropagation()} // Ngăn việc click bên trong modal làm đóng modal
      >
        {/* Header chung cho cả hai view */}
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800">
            {viewMode === 'details' ? 'Chi tiết người dùng' : 'Xác nhận xoá người dùng'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-3xl"
            aria-label="Đóng modal"
          >
            &times;
          </button>
        </div>
        
        {/* Nội dung thay đổi dựa trên viewMode */}
        {viewMode === 'details' && (
          <>
            <div className="space-y-2 text-sm">
              <DetailItem label="ID" value={user._id} isMonospace />
              <DetailItem label="Email" value={user.email} />
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
                value={user.lastLogin ? new Date(user.lastLogin).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'medium'}) : 'Chưa có'} 
              />
              <DetailItem 
                label="Ngày tạo" 
                value={new Date(user.createdAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'medium'})} 
              />
            </div>

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
    </div>
  );
}
