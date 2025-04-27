// components/CountdownTimer.tsx
'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import styles from '../exams/Exam.module.css'; // Sử dụng style chung

// Hàm format thời gian MM:SS
const formatTime = (totalSeconds: number): string => {
    if (totalSeconds < 0) totalSeconds = 0;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

interface CountdownTimerProps {
  initialDurationSeconds: number;
  onTimeout: () => void; // Callback khi hết giờ
  isSubmitted: boolean; // Để dừng timer khi nộp bài thủ công
  className?: string; // Cho phép tùy chỉnh class từ bên ngoài
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  initialDurationSeconds,
  onTimeout,
  isSubmitted,
  className = '' // Class mặc định là rỗng
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(initialDurationSeconds);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  // Ref để lưu callback mới nhất, tránh đưa callback vào dependency của useEffect
  const timeoutCallbackRef = useRef(onTimeout);

  // Cập nhật ref khi onTimeout thay đổi
  useEffect(() => {
    timeoutCallbackRef.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    // Reset thời gian khi thời gian khởi tạo thay đổi (chọn đề mới)
    // hoặc khi isSubmitted chuyển từ true về false (khởi tạo lại)
    setTimeLeft(initialDurationSeconds);
  }, [initialDurationSeconds]);


  useEffect(() => {
    // Dọn dẹp interval cũ nếu có
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Nếu đã nộp bài hoặc thời gian ban đầu <= 0 thì không chạy timer
    if (isSubmitted || initialDurationSeconds <= 0 || timeLeft <= 0) {
      // Nếu timeLeft đã là 0 khi isSubmitted true, đảm bảo nó vẫn là 0
      if(isSubmitted && timeLeft > 0) setTimeLeft(0);
      return;
    }

    // Bắt đầu interval mới
    intervalRef.current = setInterval(() => {
      setTimeLeft(prevTime => {
        const newTime = prevTime - 1;
        if (newTime <= 0) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          // Gọi callback đã lưu trong ref
          timeoutCallbackRef.current();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // Chạy lại effect này khi isSubmitted thay đổi (để dừng timer)
    // hoặc khi initialDurationSeconds thay đổi (để reset và bắt đầu lại)
  }, [initialDurationSeconds, isSubmitted]);

  const isWarning = timeLeft < 600 && timeLeft > 0 && !isSubmitted;

  return (
    <div className={`${styles.timerDisplay} ${isWarning ? styles.timerWarning : ''} ${className}`}>
      <span className={styles.timerIcon}>⏳</span> {formatTime(timeLeft)}
    </div>
  );
};

// Sử dụng React.memo để tránh render lại không cần thiết nếu props không đổi
export default memo(CountdownTimer);