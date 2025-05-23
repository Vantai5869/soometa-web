// app/components/GlobalLoginModal.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { useAuthStore, getOrGenerateDeviceId } from '../store/authStore';
import styles from './Navbar.module.css'; // SỬ DỤNG CSS MODULES TỪ NAVBAR

const generateVerificationCode = (): string => Math.floor(1000 + Math.random() * 9000).toString();

export default function GlobalLoginModal() {
  const isLoginModalOpen = useAuthStore(state => state.isLoginModalOpen);
  const closeLoginModal = useAuthStore(state => state.closeLoginModal);
  const sendVerificationCodeApi = useAuthStore(state => state.sendVerificationCodeApi);
  const verifyAndLoginApi = useAuthStore(state => state.verifyAndLoginApi);
  const isModalLoading = useAuthStore(state => state.isModalLoading);
  const modalErrorMessage = useAuthStore(state => state.modalErrorMessage);


  const [email, setEmail] = useState('');
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [sentCodeToUser, setSentCodeToUser] = useState<string | null>(null);
  const [isCodeSentUI, setIsCodeSentUI] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  useEffect(() => {
    if (isLoginModalOpen) {
      setEmail('');
      setVerificationCodeInput('');
      setSentCodeToUser(null);
      setIsCodeSentUI(false);
      setCountdown(0);
      // Xóa lỗi của store khi modal mở để không hiển thị lỗi cũ
      useAuthStore.setState({ modalErrorMessage: null });
    }
  }, [isLoginModalOpen]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0 && isCodeSentUI && isLoginModalOpen) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown, isCodeSentUI, isLoginModalOpen]);

  const handleSendVerificationCode = async () => {
    if (!email || !email.includes('@')) {
      useAuthStore.setState({ modalErrorMessage: 'Vui lòng nhập email hợp lệ.' });
      return;
    }
    const codeToSend = generateVerificationCode();
    const success = await sendVerificationCodeApi(email, codeToSend);
    if (success) {
      setSentCodeToUser(codeToSend);
      setIsCodeSentUI(true);
      setCountdown(60);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCodeInput || verificationCodeInput.length !== 4) {
      useAuthStore.setState({ modalErrorMessage: 'Mã xác nhận phải gồm 4 chữ số.' });
      return;
    }
    if (verificationCodeInput !== sentCodeToUser) {
      useAuthStore.setState({ modalErrorMessage: 'Mã xác nhận không đúng.' });
      return;
    }
    const deviceId = getOrGenerateDeviceId();
    await verifyAndLoginApi(email, deviceId); 
  };
  
  const handleModalOverlayClick = () => {
    closeLoginModal(true);
  };

  const handleTryChangeEmail = () => {
    setIsCodeSentUI(false);
    setSentCodeToUser(null);
    setVerificationCodeInput('');
    useAuthStore.setState({ modalErrorMessage: null });
  }

  if (!isLoginModalOpen) return null;

  return (
    <div className={styles.modalOverlayLogin} onClick={handleModalOverlayClick}>
      <div className={styles.loginModal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalCloseButton} onClick={() => closeLoginModal(true)}>&times;</button>
        <h2>Đăng nhập / Đăng ký</h2>
        {modalErrorMessage && <p className={styles.errorMessage}>{modalErrorMessage}</p>}
        
        {!isCodeSentUI ? (
          <>
            <div className={styles.formGroup}>
              <label htmlFor="global-login-email">Email:</label>
              <input
                type="email" id="global-login-email" value={email}
                onChange={(e) => { setEmail(e.target.value); useAuthStore.setState({ modalErrorMessage: null });}}
                placeholder="Nhập email của bạn" disabled={isModalLoading}
              />
            </div>
            <button onClick={handleSendVerificationCode} disabled={isModalLoading || !email || !email.includes('@')} className={styles.modalButtonPrimary}>
              {isModalLoading ? 'Đang gửi...' : 'Lấy mã xác nhận'}
            </button>
          </>
        ) : (
          <>
            <p className={styles.infoMessage}>Một mã xác nhận (gồm 4 chữ số) đã được gửi đến {email} (vui lòng kiểm tra cả mục spam).</p>
            <div className={styles.formGroup}>
              <label htmlFor="global-login-verificationCode">Mã xác nhận:</label>
              <input
                type="text" id="global-login-verificationCode" value={verificationCodeInput}
                onChange={(e) => { setVerificationCodeInput(e.target.value.replace(/\D/g, '').slice(0,4)); useAuthStore.setState({ modalErrorMessage: null });}}
                placeholder="Nhập mã 4 chữ số" maxLength={4} disabled={isModalLoading}
              />
            </div>
            <button onClick={handleVerifyCode} disabled={isModalLoading || verificationCodeInput.length !== 4} className={styles.modalButtonPrimary}>
              {isModalLoading ? 'Đang xác nhận...' : 'Xác nhận'}
            </button>
            <button
              onClick={handleSendVerificationCode}
              disabled={isModalLoading || countdown > 0}
              className={`${styles.modalButtonSecondary} ${styles.resendButton}`}
            >
              {countdown > 0 ? `Gửi lại mã sau (${countdown}s)` : 'Gửi lại mã'}
            </button>
            <button
                onClick={handleTryChangeEmail}
                disabled={isModalLoading}
                className={`${styles.modalButtonSecondary} ${styles.changeEmailButton}`}
            >
                Thay đổi Email
            </button>
          </>
        )}
      </div>
    </div>
  );
}