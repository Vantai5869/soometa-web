// app/admin/exam-stats/components/UserListModal.tsx
'use client';

import React, { useEffect, useState } from 'react';

// Định nghĩa kiểu cho thông tin user hiển thị trong modal
export interface UserInfo {
  _id: string;
  email: string;
  name?: string;
}

interface UserListModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserInfo[];
  examDescription?: string;
  isLoading: boolean;
  error: string | null;
}

const UserListModal: React.FC<UserListModalProps> = ({ 
  isOpen, 
  onClose, 
  users, 
  examDescription, 
  isLoading, 
  error 
}) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Khi modal được yêu cầu mở, set show sau một khoảng trễ nhỏ
      // để trình duyệt có thời gian áp dụng trạng thái ban đầu của transition
      const timer = setTimeout(() => {
        setShow(true);
      }, 10); // 10ms là đủ
      return () => clearTimeout(timer);
    } else {
      // Khi modal được yêu cầu đóng, set show về false để kích hoạt exit transition
      setShow(false);
      // Nếu bạn muốn modal unmount sau khi animation kết thúc, bạn cần logic phức tạp hơn
      // Hiện tại, parent sẽ unmount nó ngay khi isOpen là false.
      // Để có exit animation, component cha không nên unmount ngay.
      // Tuy nhiên, với yêu cầu "đơn giản", fade-out của overlay là đủ.
    }
  }, [isOpen]);

  // Nếu prop isOpen là false và chúng ta không cần chờ exit animation phức tạp,
  // có thể return null ngay. Tuy nhiên, để overlay có fade-out, chúng ta render có điều kiện class.
  // if (!isOpen && !show) return null; // Nếu muốn unmount hoàn toàn sau transition

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center p-4 z-[1055] transition-opacity duration-300 ease-in-out
                  ${isOpen && show ? "bg-black bg-opacity-60 opacity-100" : "bg-opacity-0 opacity-0 pointer-events-none"}`}
      onClick={onClose} // Đóng modal khi click vào overlay
    >
      <div
        className={`bg-white p-6 rounded-xl shadow-2xl max-w-lg w-full 
                    transform transition-all duration-300 ease-out
                    ${isOpen && show 
                        ? "scale-100 opacity-100 translate-y-0" 
                        : "scale-95 opacity-0 translate-y-5"}`}
        onClick={(e) => e.stopPropagation()} 
      >
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800">
            DS Người Làm: <span className="text-sky-600">{examDescription || "Đề thi"}</span>
          </h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 text-3xl leading-none font-semibold outline-none focus:outline-none transition-colors p-1 -mr-1 -mt-1"
            aria-label="Đóng modal"
          >&times;</button>
        </div>
        
        <div className="min-h-[100px]"> {/* Đảm bảo modal có chiều cao tối thiểu ngay cả khi loading/error */}
          {isLoading ? (
            <div className="py-8 text-center text-gray-600 flex flex-col items-center">
              <svg className="mx-auto h-8 w-8 text-sky-500 animate-spin mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang tải danh sách người dùng...
            </div>
          ) : error ? (
            <div className="py-4 text-center text-red-700 bg-red-50 p-4 rounded-md border border-red-200">
              <p className="font-medium">Lỗi tải danh sách:</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          ) : users.length > 0 ? (
            <ul className="max-h-80 overflow-y-auto divide-y divide-gray-200 pr-2">
              {users.map((user, index) => (
                <li key={user._id || index} className="py-3 text-sm text-gray-700 hover:bg-gray-50 px-2 rounded transition-colors">
                  <span className="font-semibold text-gray-800 mr-2">{index + 1}.</span>
                  {user.name ? (
                    <span className="text-gray-900">{user.name} <span className="text-gray-500">({user.email})</span></span>
                  ) : (
                    <span className="text-gray-900">{user.email}</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600 py-8 text-center">Không có người dùng nào đã làm đề thi này.</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 px-4 rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
        >
          Đóng
        </button>
      </div>
    </div>
  );
};

export default UserListModal;