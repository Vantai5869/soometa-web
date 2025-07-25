// app/admin/components/RealTimeVisitors.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { Badge } from '@/components/ui/badge';
import { 
    User, Users, XCircle, Wifi, WifiOff, ShieldCheck, Eye, Mail, Clock, ServerIcon, Fingerprint, LogOut, Maximize2, Minimize2, UserCog, Info, UserCheck, Globe, Monitor, MapPin, Smartphone, MonitorSmartphone
} from 'lucide-react';
import { initializeSocket, disconnectSocket } from '../../../lib/configSocket';

// Cập nhật Visitor interface để bao gồm các thông tin chi tiết
interface Visitor {
  id: string; 
  displayInfo: string; 
  email?: string; 
  connectedAt: string;
  ip?: string; 
  type: 'guest' | 'user' | 'unknown'; 
  // Thêm các trường khác nếu server gửi về, ví dụ:
  // deviceName?: string;
  // currentPage?: string;
}

interface VisitorData {
  count: number;    
  users: Visitor[]; 
}

interface AdminData { 
    _id: string;
    email: string;
    role: string;
}

export default function RealTimeVisitors() {
  const [visitorData, setVisitorData] = useState<VisitorData>({ count: 0, users: [] });
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true); // Mặc định mở panel
  const [currentAdmin, setCurrentAdmin] = useState<AdminData | null>(null);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);

  // Effect 1: Load admin data
  useEffect(() => {
    const adminDataString = localStorage.getItem('userData');
    if (adminDataString) {
        try {
            const parsedAdminData: AdminData = JSON.parse(adminDataString);
            setCurrentAdmin(parsedAdminData);
        } catch (e) {
            console.error("Lỗi parse thông tin admin từ localStorage:", e);
        }
    }
  }, []);

  // Effect 2: Setup Socket.IO
  useEffect(() => {
    // Khởi tạo kết nối Socket.IO sử dụng configSocket
    socketRef.current = initializeSocket();

    const socket = socketRef.current;

    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
      if (currentAdmin) {
        socket.emit('USER_IDENTIFIED', { 
          userId: currentAdmin._id,
          name: currentAdmin.email, 
          role: currentAdmin.role,
        });
      }
    });

    socket.on('disconnect', (reason: Socket.DisconnectReason) => {
      setIsConnected(false);
      setError(reason === 'io server disconnect' ? 'Bị ngắt kết nối bởi máy chủ.' : 'Mất kết nối, đang thử lại...');
    });

    socket.on('connect_error', (err: Error) => {
      console.error('Admin: Lỗi kết nối Socket:', err.message);
      setIsConnected(false);
      setError(`Lỗi kết nối: ${err.message}.`);
    });

    socket.on('VISITOR_DATA', (data: VisitorData) => {
      setVisitorData(data);
    });

    return () => {
      if (socket) {
        disconnectSocket();
      }
    };
  }, [currentAdmin]);

  const handleViewDetails = (visitor: Visitor) => {
    // Chỉ cho phép xem chi tiết nếu là 'user' và có thông tin để hiển thị
    if (visitor.type === 'user') {
      setSelectedVisitor(visitor);
    }
  };

  const handleCloseDetails = () => {
    setSelectedVisitor(null);
  };

  const DetailRow: React.FC<{ icon: React.ElementType, label: string, value?: string | null, isMono?: boolean, isLink?: boolean, linkPrefix?: string }> = 
  ({ icon: Icon, label, value, isMono, isLink, linkPrefix }) => {
    // Corrected condition:
    // If value is null, undefined, or an empty string, do not render.
    // This will display the string "0" if value is "0".
    if (!value) return null; 
    
    return (
      <div className="flex items-start py-2">
        <Icon size={18} className="mr-3 text-slate-400 mt-0.5 flex-shrink-0" />
        <div className="flex-grow">
          <p className="text-xs text-slate-500">{label}</p>
          {isLink && value ? ( // value will be a non-empty string here
            <a 
              href={`${linkPrefix || ''}${value}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`font-medium text-sky-400 hover:text-sky-300 hover:underline break-all ${isMono ? 'font-mono text-xs' : 'text-sm'}`}
            >
              {value}
            </a>
          ) : (
            <p className={`font-medium text-slate-200 break-all ${isMono ? 'font-mono text-xs bg-slate-700 px-1.5 py-0.5 rounded' : 'text-sm'}`}>
              {value}
            </p>
          )}
        </div>
      </div>
    );
  };


  return (
    <>
      {/* Main Component Container */}
      <div 
        className={`fixed bottom-5 right-5 z-[200] bg-slate-800/95 backdrop-blur-md text-slate-100 rounded-xl shadow-2xl flex flex-col transition-all duration-300 ease-in-out overflow-hidden ${
          isPanelOpen ? 'w-[400px] md:w-[450px] max-h-[calc(100vh-40px)] min-h-[300px]' : 'w-auto max-h-[70px]'
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-3.5 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center">
            {isConnected ? <Wifi className="text-emerald-400 mr-2.5" size={20} /> : <WifiOff className="text-rose-400 mr-2.5" size={20} />}
            <h3 className="text-lg font-semibold text-slate-50">Khách Online</h3>
            {isPanelOpen && (
                <Badge variant={isConnected ? "outline" : "solid"} className={`ml-3 text-xs ${isConnected ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'}`}>
                    {visitorData.count}
                </Badge>
            )}
          </div>
          <button 
              onClick={() => setIsPanelOpen(!isPanelOpen)} 
              className="text-slate-400 hover:text-slate-100 p-1.5 rounded-full hover:bg-slate-700 transition-colors"
              title={isPanelOpen ? "Thu gọn" : "Mở rộng"}
          >
              {isPanelOpen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>

        {/* Collapsible Content */}
        {isPanelOpen && (
          <>
            {/* Connection Error Message */}
            {error && !isConnected && <p className="text-xs text-rose-300 bg-rose-900/60 p-2.5 mx-3.5 mt-2.5 rounded text-center">{error}</p>}
            
            {/* User List */}
            <div className="flex-grow overflow-y-auto px-2 py-2 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800/50 min-h-[150px]">
              {visitorData.users.length > 0 ? (
                visitorData.users.map((user) => (
                  <div 
                    key={user.id} 
                    className={`p-2.5 rounded-lg flex items-center transition-all duration-150 ease-in-out group ${user.type === 'user' ? 'hover:bg-sky-700/40 cursor-pointer' : 'hover:bg-slate-700/60'}`}
                    onClick={user.type === 'user' ? () => handleViewDetails(user) : undefined}
                    title={user.type === 'user' ? `Xem chi tiết ${user.displayInfo}` : user.displayInfo}
                  >
                    <div className={`p-1.5 rounded-full mr-3 flex-shrink-0 ${user.type === 'user' ? 'bg-sky-500/30 text-sky-300' : 'bg-slate-600 text-slate-400'}`}>
                      {user.type === 'user' ? <UserCog size={20} /> : <User size={20} />}
                    </div>
                    <div className="flex-grow min-w-0">
                        <p className={`font-semibold truncate text-sm ${user.type === 'user' ? 'text-sky-200 group-hover:text-sky-100' : 'text-slate-100 group-hover:text-slate-50'}`}>
                            {user.displayInfo}
                        </p>
                        <p className="text-xs text-slate-400 group-hover:text-slate-300">
                            Online: {new Date(user.connectedAt).toLocaleTimeString('vi-VN')}
                        </p>
                    </div>
                    {user.type === 'user' && <Eye size={18} className="text-slate-500 group-hover:text-sky-300 ml-2 flex-shrink-0" />}
                  </div>
                ))
              ) : (
                <p className="text-slate-400 italic text-center py-8">Chưa có người dùng nào online.</p>
              )}
            </div>

            {/* Admin Info Footer */}
            {currentAdmin && (
               <div className="text-xs text-slate-500 p-3 border-t border-slate-700 flex items-center flex-shrink-0">
                  <ShieldCheck size={16} className="mr-1.5 text-emerald-400 flex-shrink-0" />
                  <span className="font-medium text-slate-400">Admin:</span>
                  <span className="ml-1.5 truncate" title={currentAdmin.email}>{currentAdmin.email}</span>
               </div>
            )}
          </>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedVisitor && (
        <div 
          className="fixed inset-0 z-[210] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          onClick={handleCloseDetails}
        >
          <div 
            className="bg-slate-800 border border-slate-700 text-slate-100 rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300 ease-out animate-modalOpen"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-slate-700">
              <h4 className="text-xl font-semibold text-sky-300 flex items-center">
                <Info size={22} className="mr-2.5" /> Chi Tiết Khách Truy Cập
              </h4>
              <button 
                onClick={handleCloseDetails} 
                className="text-slate-400 hover:text-slate-100 p-1.5 rounded-full hover:bg-slate-700/70 transition-colors"
                title="Đóng"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-5 md:p-6 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-700/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                <DetailRow icon={UserCog} label="Tên hiển thị" value={selectedVisitor.displayInfo} />
                <DetailRow icon={Mail} label="Email" value={selectedVisitor.email} isLink linkPrefix="mailto:" />
                <DetailRow icon={Fingerprint} label="Socket ID / User ID" value={selectedVisitor.id} isMono />
                <DetailRow icon={ServerIcon} label="Địa chỉ IP" value={selectedVisitor.ip} />
                <DetailRow icon={Clock} label="Online từ" value={new Date(selectedVisitor.connectedAt).toLocaleString('vi-VN', { dateStyle: 'full', timeStyle: 'long' })} />
                <DetailRow 
                    icon={selectedVisitor.type === 'user' ? UserCheck : User} // UserCheck được sử dụng ở đây
                    label="Loại tài khoản" 
                    value={selectedVisitor.type === 'user' ? 'Thành viên' : (selectedVisitor.type === 'guest' ? 'Khách' : 'Không xác định')} 
                />
                {/* Ví dụ thêm trường khác nếu có */}
                {/* <DetailRow icon={Smartphone} label="Thiết bị" value={selectedVisitor.deviceName} /> */}
                {/* <DetailRow icon={LinkIcon} label="Trang hiện tại" value={selectedVisitor.currentPage} /> */}
              </div>
            </div>
            
            <div className="p-4 bg-slate-800/50 border-t border-slate-700 text-right rounded-b-xl">
                <button 
                    onClick={handleCloseDetails}
                    className="px-5 py-2.5 text-sm font-medium text-slate-100 bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-50"
                >
                    <LogOut size={16} className="inline mr-2" /> Đóng
                </button>
            </div>
          </div>
        </div>
      )}
      <style jsx global>{`
        @keyframes modalOpen {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-modalOpen {
          animation: modalOpen 0.25s ease-out forwards;
        }
        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
        }
        .scrollbar-thumb-slate-700::-webkit-scrollbar-thumb,
        .scrollbar-thumb-slate-600::-webkit-scrollbar-thumb {
          background-color: #334155; /* slate-700 or 600 */
          border-radius: 5px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .scrollbar-thumb-slate-700:hover::-webkit-scrollbar-thumb,
        .scrollbar-thumb-slate-600:hover::-webkit-scrollbar-thumb {
          background-color: #475569; /* slate-600 or 500 */
        }
        .scrollbar-track-slate-800::-webkit-scrollbar-track,
        .scrollbar-track-slate-700\/50::-webkit-scrollbar-track {
          background-color: rgba(30, 41, 59, 0.5); /* slate-800/50 or slate-700/50 */
        }
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
      `}</style>
    </>
  );
}
