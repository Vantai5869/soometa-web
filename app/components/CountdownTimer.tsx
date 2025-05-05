// components/CountdownTimer.tsx
'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import styles from './../exams/Exam.module.css'; // Sử dụng style chung

// Hàm format thời gian MM:SS
const formatTime = (totalSeconds: number): string => {
    if (totalSeconds < 0) totalSeconds = 0;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

interface CountdownTimerProps {
  initialDurationSeconds: number;
  onTimeout: () => void;
  isSubmitted: boolean;
  className?: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  initialDurationSeconds,
  onTimeout,
  isSubmitted,
  className = ''
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(initialDurationSeconds);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutCallbackRef = useRef(onTimeout);

  useEffect(() => {
    timeoutCallbackRef.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    // Chỉ reset thời gian nếu duration thay đổi (khi đổi đề)
    // Không reset khi isSubmitted thay đổi
    setTimeLeft(initialDurationSeconds);
  }, [initialDurationSeconds]);


  useEffect(() => {
    // Dọn dẹp interval cũ
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Dừng nếu đã submit hoặc hết giờ hoặc thời gian ban đầu không hợp lệ
    if (isSubmitted || timeLeft <= 0 || initialDurationSeconds <= 0) {
      // Nếu đã submit nhưng timer chưa về 0 (do submit tay), đặt về 0
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
          // Gọi callback hết giờ đã lưu trong ref
          if(timeoutCallbackRef.current) {
              timeoutCallbackRef.current();
          }
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
  // Chạy lại effect này khi isSubmitted hoặc initialDurationSeconds thay đổi
  }, [initialDurationSeconds, isSubmitted]);

  const isWarning = timeLeft < 600 && timeLeft > 0 && !isSubmitted;

  return (
    <div className={`${styles.timerDisplay} ${isWarning ? styles.timerWarning : ''} ${className}`}>
      <span className={styles.timerIcon}>⏳</span> {formatTime(timeLeft)}
    </div>
  );
};

export default memo(CountdownTimer);