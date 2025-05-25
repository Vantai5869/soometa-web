// store/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Định nghĩa kiểu UserData (có thể đặt trong file types chung và import vào đây)
export type UserData = {
  _id: string;
  email: string;
  role: string;
  // Thêm các trường khác của user nếu có
  [key: string]: any; 
};

// URL cơ sở của API backend (nên đặt trong .env.local)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://soometa-be.onrender.com';

// Hàm tiện ích getOrGenerateDeviceId (có thể đặt trong file utils riêng)
export const getOrGenerateDeviceId = (): string => {
  // Chỉ chạy ở client-side
  if (typeof window === 'undefined') {
    return 'server-generated-placeholder-device-id'; // Hoặc một giá trị mặc định cho server
  }
  const storageKey = 'deviceIdSoometa';
  let deviceId = localStorage.getItem(storageKey);
  if (!deviceId) {
    const userAgent = navigator.userAgent || "";
    const ipPlaceholder = "CLIENT_IP_UNAVAILABLE"; // Không thể lấy IP client trực tiếp từ JS
    
    // Tạo deviceId dựa trên userAgent hoặc UUID nếu userAgent trống
    if (userAgent) {
      deviceId = `${ipPlaceholder}__${userAgent}`;
      // Để tăng tính duy nhất, có thể hash userAgent hoặc thêm một phần ngẫu nhiên
      // deviceId = await sha256(`${ipPlaceholder}__${userAgent}`); // Ví dụ nếu dùng hash
    } else {
      // Fallback to UUID-like generation
      deviceId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
      });
    }
    localStorage.setItem(storageKey, deviceId);
  }
  return deviceId;
};

interface AuthState {
  currentUser: UserData | null;
  token: string | null;
  isLoginModalOpen: boolean;
  _isLoadingAuth: boolean; // true cho đến khi quá trình rehydrate/initialize hoàn tất
  isModalLoading: boolean; // Trạng thái loading cho các action API bên trong modal
  modalErrorMessage: string | null; // Thông báo lỗi cho modal

  // Callbacks cho modal, được set bởi component gọi openLoginModal
  onLoginSuccessCallback: (() => void) | null;
  onLoginCancelCallback: (() => void) | null;

  // Actions chính của store
  openLoginModal: (onSuccess?: () => void, onCancel?: () => void) => void;
  closeLoginModal: (cancelledByUser?: boolean) => void;
  loginSuccess: (userData: UserData, token: string) => void; // Cập nhật user và token, gọi callback thành công
  logout: () => void;
  setRefreshedUser: (userData: UserData, token?: string) => void; // Cập nhật user từ API (ví dụ: AdminLayout)

  // Actions cho logic API của GlobalLoginModal
  sendVerificationCodeApi: (email: string, code: string) => Promise<boolean>; // Trả về true nếu gửi mã thành công
  verifyAndLoginApi: (email: string, deviceId: string) => Promise<UserData | null>; // Trả về UserData nếu đăng nhập thành công
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // --- State khởi tạo ---
      currentUser: null,
      token: null,
      isLoginModalOpen: false,
      _isLoadingAuth: true, // Quan trọng: Luôn true khi store mới được tạo/tải lại trang
      isModalLoading: false,
      modalErrorMessage: null,
      onLoginSuccessCallback: null,
      onLoginCancelCallback: null,

      // --- Actions ---
      openLoginModal: (onSuccess, onCancel) => {
        set({
          isLoginModalOpen: true,
          onLoginSuccessCallback: onSuccess || null,
          onLoginCancelCallback: onCancel || null,
          modalErrorMessage: null, // Reset lỗi khi mở modal
          isModalLoading: false,   // Reset trạng thái loading
        });
      },

      closeLoginModal: (cancelledByUser = true) => {
        const { onLoginCancelCallback } = get();
        if (cancelledByUser && onLoginCancelCallback) {
          onLoginCancelCallback(); // Gọi callback nếu người dùng chủ động đóng/hủy
        }
        set({
          isLoginModalOpen: false,
          onLoginSuccessCallback: null, // Luôn xóa callbacks khi modal đóng
          onLoginCancelCallback: null,
          modalErrorMessage: null,    // Dọn dẹp lỗi
        });
      },
      
      loginSuccess: (userData, token) => {
        // localStorage sẽ tự động được cập nhật bởi persist middleware
        set({ 
            currentUser: userData, 
            token: token,
            isLoginModalOpen: false, // Tự động đóng modal khi đăng nhập thành công
            isModalLoading: false,
            _isLoadingAuth: false,  // Auth state đã được xác định
            modalErrorMessage: null,
        });
        const { onLoginSuccessCallback } = get();
        if (onLoginSuccessCallback) {
          onLoginSuccessCallback(); // Gọi callback thành công nếu có
        }
        set({ onLoginSuccessCallback: null, onLoginCancelCallback: null }); // Xóa callbacks
      },

      logout: () => {
        // localStorage sẽ tự động được cập nhật bởi persist middleware (currentUser và token sẽ thành null)
        set({ 
            currentUser: null, 
            token: null, 
            _isLoadingAuth: false, // Auth state đã được xác định (là không có user)
            isLoginModalOpen: false, // Đảm bảo modal đóng khi logout (nếu đang mở)
            onLoginSuccessCallback: null, 
            onLoginCancelCallback: null,
            modalErrorMessage: null,
        });
        // Nếu modal đang mở và bị logout, callback onCancel có thể được gọi ở đây nếu cần
        // const { onLoginCancelCallback } = get();
        // if (onLoginCancelCallback) onLoginCancelCallback();
      },

      setRefreshedUser: (userData, newToken) => {
        set((state) => ({
          currentUser: userData,
          token: newToken || state.token, // Cập nhật token nếu có, nếu không giữ token cũ
          _isLoadingAuth: false, // Đảm bảo auth state được coi là đã load xong
        }));
      },

      // --- Actions cho logic API của GlobalLoginModal ---
      sendVerificationCodeApi: async (email, code) => {
        set({ isModalLoading: true, modalErrorMessage: null });
        try {
          const response = await fetch(`${API_BASE_URL}/send-mail`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code }),
          });
          const responseData = await response.json().catch(() => ({ message: "Lỗi parse JSON từ server khi gửi mã" }));
          if (!response.ok) {
            throw new Error(responseData.message || 'Gửi mã xác nhận thất bại.');
          }
          set({ isModalLoading: false });
          return true; // Gửi mã thành công
        } catch (error: any) {
          console.error("AuthStore: sendVerificationCodeApi error:", error);
          set({ isModalLoading: false, modalErrorMessage: error.message });
          return false; // Gửi mã thất bại
        }
      },

      verifyAndLoginApi: async (email, deviceId) => {
        set({ isModalLoading: true, modalErrorMessage: null });
        try {
          const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, deviceId, platform: 'WEB' }),
          });
          const data = await response.json(); // Cố gắng parse JSON ngay cả khi lỗi để đọc message
          if (!response.ok || !data.user || !data.token) {
            // Ưu tiên message từ API, nếu không có thì dùng message mặc định
            throw new Error(data.message || data.error || 'Xác thực hoặc đăng nhập thất bại.');
          }
          // Nếu thành công, gọi action loginSuccess nội bộ
          get().loginSuccess(data.user as UserData, data.token);
          return data.user as UserData; // Trả về UserData
        } catch (error: any) {
          console.error("AuthStore: verifyAndLoginApi error:", error);
          set({ isModalLoading: false, modalErrorMessage: error.message });
          return null; // Đăng nhập thất bại
        }
      },
    }),
    {
      name: 'auth-storage', // Tên key sẽ lưu trong localStorage
      storage: createJSONStorage(() => localStorage),
      // Chỉ persist currentUser và token. _isLoadingAuth và các callbacks sẽ được reset mỗi lần tải.
      partialize: (state) => ({ 
        currentUser: state.currentUser,
        token: state.token 
      }), 
      // Callback này được gọi sau khi Zustand persist middleware đã đọc xong từ localStorage
      // và cập nhật state (currentUser, token).
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            // Nếu có lỗi, vẫn set _isLoadingAuth để ứng dụng không bị kẹt ở trạng thái loading
            if (state) state._isLoadingAuth = false;
            else useAuthStore.setState({ _isLoadingAuth: false }); // Trường hợp state không tồn tại
          } else {
            if (state) state._isLoadingAuth = false;
          }
        }
      }
    }
  )
);

// Không cần gọi initializeAuth() ở global scope nữa vì onRehydrateStorage đã đảm nhiệm việc set _isLoadingAuth.
// Component ClientInitializer (nếu có) ở RootLayout có thể dùng để thực hiện các tác vụ khởi tạo client khác nếu cần.