// ExamViewerWrapper.tsx
'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import ExamViewer from './ExamViewer';
import ExamSidebar from './ExamSidebar';
import CountdownTimer from './CountdownTimer';
import styles from './../exams/Exam.module.css'; 
import navStyles from '../components/Navbar.module.css'; 
import type {
  ExamData, SelectedAnswers, CorrectAnswersMap,
  Level, Skill, Question, InstructionGroup,
} from './types';
import { useAuthStore } from '../store/authStore';

const NEXT_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ''; 

const getDurationInSeconds = (level?: Level, skill?: Skill): number => {
  const DEFAULT_DURATION_SECONDS = 60 * 60;
  if (!level || !skill) return DEFAULT_DURATION_SECONDS;

  const isTopik1 = level.includes('Ⅰ') || level.includes('I');
  const isTopik2 = level.includes('Ⅱ') || level.includes('II');

  if (isTopik1) {
    if (skill === '듣기') return 40 * 60;
    if (skill === '읽기') return 60 * 60;
  } else if (isTopik2) {
    if (skill === '듣기') return 60 * 60;
    if (skill === '읽기') return 70 * 60;
    if (skill === '쓰기' || (skill as string) === 'Viết') return 50 * 60;
  }
  
  return DEFAULT_DURATION_SECONDS;
};

type ExamMetaDataType = {
  description?: string;
  level?: Level;
  skill?: Skill;
  year?: string;
};
type PendingSubmissionDataType = {
  examId: string | number;
  examMeta: ExamMetaDataType;
  selectedAnswers: SelectedAnswers;
  score: number;
  totalQuestions: number;
  isSubmitted: true;
  submittedAt: string;
  initialDuration: number;
  _id?: string; 
  userId?: any; 
};

interface ExamViewerWrapperProps {
  examData: ExamData | null;
}

const ExamViewerWrapper: React.FC<ExamViewerWrapperProps> = ({ examData }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<SelectedAnswers>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [isInitiallyLoadingLocal, setIsInitiallyLoadingLocal] = useState<boolean>(true);
  const [scoreForApi, setScoreForApi] = useState<number | null>(null);
  const [isReviewingSpecificSession, setIsReviewingSpecificSession] = useState(false);
  
  const currentUser = useAuthStore(state => state.currentUser);
  const _isLoadingAuth = useAuthStore(state => state._isLoadingAuth);
  const openLoginModal = useAuthStore(state => state.openLoginModal);
  const logoutUser = useAuthStore(state => state.logout);

  const pendingSubmissionDataRef = useRef<PendingSubmissionDataType | null>(null);
  const [showLoginPromptModal, setShowLoginPromptModal] = useState(false);

  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  const initialDuration: number = useMemo(() => examData ? getDurationInSeconds(examData.level, examData.skill) : 0, [examData]);

  const correctAnswersMap: CorrectAnswersMap = useMemo((): CorrectAnswersMap => {
    const map: CorrectAnswersMap = {};
    if (!examData?.instruction_groups) return map;
    examData.instruction_groups.forEach((group) => {
      group?.questions?.forEach((q) => {
        if (q && q.options && typeof q.number === 'number') {
          const correctIndex = q.options.findIndex(opt => opt?.is_correct);
          if (correctIndex !== -1) map[q.number] = correctIndex;
        }
      });
    });
    return map;
  }, [examData]);

  const totalQuestions: number = useMemo((): number => {
    if (!examData?.instruction_groups) return 0;
    return examData.instruction_groups.reduce(
      (acc, group) => acc + (group?.questions?.length || 0), 0
    );
  }, [examData]);

  useEffect(() => {
    if (!isClient || _isLoadingAuth) {
        setIsInitiallyLoadingLocal(true); return;
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const reviewSessionId = urlParams.get('reviewSessionId');

    const initializeExamState = async () => {
      setIsInitiallyLoadingLocal(true);
      setIsReviewingSpecificSession(false); 

      if (reviewSessionId) {
        const currentToken = useAuthStore.getState().token;
        if (!currentToken) {
          if (isClient) alert("Bạn cần đăng nhập để xem lại chi tiết bài làm.");
          openLoginModal(() => {});
          setIsInitiallyLoadingLocal(false);
          if (examData) { setSelectedAnswers({}); setIsSubmitted(false); setScore(0); }
          return;
        }
        try {
          const response = await fetch(`${NEXT_API_BASE_URL}/exam-sessions/${reviewSessionId}`, {
            headers: { 'Authorization': `Bearer ${currentToken}` },
          });
          if (response.status === 401 || response.status === 403) {
            if(isClient) alert("Phiên đăng nhập không hợp lệ hoặc bạn không có quyền xem.");
            logoutUser(); openLoginModal(); throw new Error("Unauthorized/Forbidden for specific session review");
          }
          if (response.status === 404) {
            if (isClient) alert("Không tìm thấy bài làm để xem lại.");
            if (examData) { setSelectedAnswers({}); setIsSubmitted(false); setScore(0); }
            throw new Error("Session not found for review");
          }
          if (!response.ok) {
             const errorData = await response.json().catch(() => ({message: `Lỗi không rõ: ${response.statusText}`}));
             throw new Error(errorData.message || `Lỗi API (${response.status})`);
          }
          const sessionToReview: PendingSubmissionDataType = await response.json();
          if (!sessionToReview || typeof sessionToReview.examId === 'undefined') {
             if (isClient) alert("Dữ liệu bài làm xem lại không hợp lệ.");
             if (examData) { setSelectedAnswers({}); setIsSubmitted(false); setScore(0); }
          } else if (examData && sessionToReview.examId.toString() === examData.id.toString()) {
            setSelectedAnswers(sessionToReview.selectedAnswers || {});
            setScore(sessionToReview.score);
            setIsSubmitted(true); 
            setIsReviewingSpecificSession(true);
          } else if (examData && sessionToReview.examId.toString() !== examData.id.toString()) {
            if (isClient) alert(`Bài làm này cho đề thi khác (ID đề bài làm: ${sessionToReview.examId}, ID đề hiện tại: ${examData.id}).`);
            setSelectedAnswers({}); setIsSubmitted(false); setScore(0);
          } else if (!examData && sessionToReview.examId) {
            if (isClient) alert(`Không thể hiển thị. Dữ liệu đề thi (ID: ${sessionToReview.examId}) chưa tải. Vui lòng vào đúng trang đề.`);
          } else { if (examData) { setSelectedAnswers({}); setIsSubmitted(false); setScore(0); } }
        } catch (err: unknown) { // Sử dụng unknown cho error
          console.error("Lỗi lấy dữ liệu review (phiên cụ thể):", err);
          const errorMessage = err instanceof Error ? err.message : "Lỗi không xác định";
          if (isClient && !((errorMessage.includes("Unauthorized")) || errorMessage.includes("Session not found")) ) {
            alert(`Lỗi khi lấy dữ liệu xem lại bài làm: ${errorMessage}`);
          }
          if (examData) { setSelectedAnswers({}); setIsSubmitted(false); setScore(0); }
        }
      } else { 
        if (examData) { setSelectedAnswers({}); setIsSubmitted(false); setScore(0); }
      }
      setIsInitiallyLoadingLocal(false);
    };
    if (isClient) initializeExamState();
  }, [examData, _isLoadingAuth, isClient, openLoginModal, logoutUser]);


  const handleAnswerSelect = useCallback((questionNumber: number, optionIndex: number): void => {
    if (isSubmitted || isReviewingSpecificSession) return;
    setSelectedAnswers(prev => ({ ...prev, [questionNumber]: optionIndex }));
  },[isSubmitted, isReviewingSpecificSession]);
  
  const performSave = useCallback(async (userIdToUse: string, submissionData: PendingSubmissionDataType) => {
    const currentToken = useAuthStore.getState().token;
    
    const saveDataWithExistingToken = async (tokenToUse: string) => {
        const finalData = { ...submissionData, userId: userIdToUse };
        let unauthorizedOrForbidden = false;
        try {
          const response = await fetch(`${NEXT_API_BASE_URL}/exam-sessions`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenToUse}`},
            body: JSON.stringify(finalData),
          });
          if (response.status === 401 || response.status === 403) { 
            unauthorizedOrForbidden = true;
            throw new Error("UnauthorizedOnSave"); 
          }
          if (!response.ok) {
            const errorBody = await response.json().catch(()=> ({message: `Lỗi server: ${response.statusText}`}));
            throw new Error(errorBody.message || `Lỗi API: ${response.status}`);
          }
          await response.json();
          // if (isClient) alert("Kết quả của bạn đã được lưu.");
        } catch (err: unknown) { // Sử dụng unknown
          console.error("Lỗi lưu API:", err);
          const errorMessage = err instanceof Error ? err.message : "Lỗi không xác định khi lưu.";
          if (isClient) {
            if (unauthorizedOrForbidden) { // Kiểm tra biến cờ
              alert("Phiên đăng nhập không hợp lệ/hết hạn. Vui lòng đăng nhập lại.");
              logoutUser();
              openLoginModal( () => { 
                    const refreshedUser = useAuthStore.getState().currentUser;
                    const refreshedToken = useAuthStore.getState().token;
                    if(refreshedUser?._id && refreshedToken && pendingSubmissionDataRef.current) {
                         saveDataWithExistingToken(refreshedToken); 
                    } else {
                       pendingSubmissionDataRef.current = null; 
                       setScoreForApi(null);
                       if(isClient) alert("Không thể tự động lưu lại sau khi đăng nhập.");
                    }
                },
                () => { pendingSubmissionDataRef.current = null; setScoreForApi(null); }
              );
            } else {
              alert(`Lỗi khi lưu kết quả: ${errorMessage}. Vui lòng kiểm tra console.`);
            }
          }
        } finally { 
          if (!unauthorizedOrForbidden || !pendingSubmissionDataRef.current) { // Chỉ reset nếu không phải đang chờ login lại
            setScoreForApi(null); 
            pendingSubmissionDataRef.current = null; 
          }
        }
    };

    if (!currentToken) {
      if (isClient) alert("Bạn cần đăng nhập để lưu bài.");
      openLoginModal(
        () => { 
            const refreshedUser = useAuthStore.getState().currentUser;
            const refreshedToken = useAuthStore.getState().token;
            if(refreshedUser?._id && refreshedToken && pendingSubmissionDataRef.current) {
                saveDataWithExistingToken(refreshedToken);
            } else {
                pendingSubmissionDataRef.current = null; setScoreForApi(null);
            }
        },
        () => { pendingSubmissionDataRef.current = null; setScoreForApi(null); }
      );
      return;
    }
    await saveDataWithExistingToken(currentToken);
  }, [isClient, openLoginModal, logoutUser]);


  const handleSubmit = useCallback((isTimeout: boolean = false): void => {
      if (isSubmitted || isReviewingSpecificSession) return;
      let currentScoreValue: number = 0;
      if (examData?.instruction_groups) {
        examData.instruction_groups.forEach(group => {
          group?.questions?.forEach(q => {
            if (q && q.options && typeof q.number === 'number' && correctAnswersMap[q.number] !== undefined) {
              const correctIndex = correctAnswersMap[q.number];
              const selectedIndex = selectedAnswers[q.number];
              if (selectedIndex === correctIndex) currentScoreValue++;
            }
          });
        });
      }
      setScore(currentScoreValue);
      setIsSubmitted(true); 

      if (!examData || typeof examData.id === 'undefined') { 
        if (isClient) alert("Đã có lỗi, không thể nộp bài. Vui lòng thử lại.");
        setIsSubmitted(false); setScore(0); return;
      }
      const user = useAuthStore.getState().currentUser;
      const dataToSubmitBase: PendingSubmissionDataType = {
        examId: examData.id, 
        examMeta: { description: examData.exam_number_description, level: examData.level, skill: examData.skill, year: examData.year_description, },
        selectedAnswers, score: currentScoreValue, totalQuestions,
        isSubmitted: true, submittedAt: new Date().toISOString(), initialDuration,
      };
      pendingSubmissionDataRef.current = dataToSubmitBase;
      if (!user?._id) { setShowLoginPromptModal(true); } 
      else { setScoreForApi(currentScoreValue); }
      if (isTimeout && isClient) alert('Đã hết giờ làm bài!');
    },
    [examData, selectedAnswers, correctAnswersMap, isSubmitted, initialDuration, totalQuestions, isClient, isReviewingSpecificSession]
  );

  useEffect(() => {
    if (isClient && isSubmitted && !isReviewingSpecificSession && scoreForApi !== null && examData && !_isLoadingAuth && !showLoginPromptModal) {
      const user = useAuthStore.getState().currentUser;
      if (user?._id) {
        if (pendingSubmissionDataRef.current) {
             performSave(user._id, pendingSubmissionDataRef.current);
        } else {
            if (examData?.id !== undefined && scoreForApi !== null) {
                 const fallbackData: PendingSubmissionDataType = {
                    examId: examData.id, 
                    examMeta: { description: examData.exam_number_description, level: examData.level, skill: examData.skill, year: examData.year_description }, 
                    selectedAnswers, score: scoreForApi, totalQuestions, isSubmitted: true, 
                    submittedAt: new Date().toISOString(), initialDuration,
                };
                performSave(user._id, fallbackData);
            } else { setScoreForApi(null); }
        }
      } else { setScoreForApi(null); }
    }
  }, [isClient, isSubmitted, scoreForApi, examData, _isLoadingAuth, showLoginPromptModal, performSave, selectedAnswers, totalQuestions, initialDuration, isReviewingSpecificSession]);

  const handleScrollToQuestion = useCallback((questionNumber: number): void => {
    if (!isClient) return;
    const element = document.getElementById(`question-block-${questionNumber}`);
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [isClient]);

  const handleLoginFromPrompt = () => {
    setShowLoginPromptModal(false);
    if (!pendingSubmissionDataRef.current) {
        if (isClient) alert("Lỗi: Không có dữ liệu bài làm để lưu."); return;
    }
    const dataToSaveAfterLogin = pendingSubmissionDataRef.current;
    openLoginModal(
      () => { 
        const loggedInUser = useAuthStore.getState().currentUser;
        if (loggedInUser?._id) { performSave(loggedInUser._id, dataToSaveAfterLogin); } 
        else { 
          if (isClient) alert("Lỗi sau khi đăng nhập, không thể lưu bài.");
          pendingSubmissionDataRef.current = null;
        }
      },
      () => { 
        if (isClient) alert("Kết quả của bạn sẽ không được lưu vì bạn chưa đăng nhập."); 
        pendingSubmissionDataRef.current = null; 
      }
    );
  };

  const handleSkipLoginAndSubmit = () => {
    setShowLoginPromptModal(false);
    // if (isClient) alert("Kết quả của bạn sẽ được hiển thị nhưng không được lưu vào lịch sử.");
    setScoreForApi(null); 
    pendingSubmissionDataRef.current = null;
  };

  if (!isClient || _isLoadingAuth || isInitiallyLoadingLocal) {
    // return <div className={styles.loading}>Đang xử lý dữ liệu...</div>;
    return <></>
  }

  if (!examData) {
    if (new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('reviewSessionId') && !isInitiallyLoadingLocal && isClient) {
        return <div className={styles.loading}>Không thể tải dữ liệu đề thi để xem lại. Đề thi có thể không tồn tại hoặc URL không đúng.</div>;
    }
    return <div className={styles.loading}>Đang tải dữ liệu đề thi...</div>;
  }
  
  let pageTitleSuffix = '';
  if (isReviewingSpecificSession) { 
    pageTitleSuffix = '(Xem lại bài làm)';
  } else if (isSubmitted) {
    pageTitleSuffix = '(Kết quả)';
  }

  return (
    <>
      <div data-selectable-area="true" className={`${styles.appContainer} ${isSubmitted ? styles.submitted : ''}`}>
        <div className={styles.mainContent}>
          <h1 className={styles.examTitle}>
            {examData.exam_number_description} TOPIK {examData.level} -{' '}
            {examData.skill === '읽기' ? 'Đọc' : 'Nghe'} ({examData.year_description})
            {isClient && pageTitleSuffix && <span style={{color: isReviewingSpecificSession ? 'purple' : 'green', marginLeft: '10px'}}>{pageTitleSuffix}</span>}
          </h1>
          <ExamViewer
            instructionGroups={examData.instruction_groups}
            skill={examData.skill}
            audioUrl={examData.audio_url}
            selectedAnswers={selectedAnswers}
            isSubmitted={isSubmitted}
            correctAnswersMap={correctAnswersMap}
            onAnswerSelect={handleAnswerSelect}
          />
          <div className={`${styles.submissionArea} ${styles.mobileSubmitArea}`}>
             <CountdownTimer
              key={`mobile-timer-${examData.id}`}
              initialDurationSeconds={initialDuration}
              onTimeout={() => handleSubmit(true)}
              isSubmitted={isSubmitted || isReviewingSpecificSession}
              className={styles.timerDisplayMobile}
            />
            {!(isSubmitted || isReviewingSpecificSession) ? (
              <button
                id="submit-btn-mobile"
                onClick={() => handleSubmit(false)}
                className={`${styles.submitButton} ${styles.submitButtonMobile}`}
              > Nộp bài </button>
            ) : (
              <div id="score-container-mobile" className={styles.scoreDisplay}>
                Kết quả: {score} / {totalQuestions}
              </div>
            )}
          </div>
        </div>
        <ExamSidebar
          instructionGroups={examData.instruction_groups} selectedAnswers={selectedAnswers}
          isSubmitted={isSubmitted} correctAnswersMap={correctAnswersMap}
          onScrollToQuestion={handleScrollToQuestion}
          timerComponent={
            <CountdownTimer key={`sidebar-timer-${examData.id}`} initialDurationSeconds={initialDuration}
              onTimeout={() => handleSubmit(true)} isSubmitted={isSubmitted || isReviewingSpecificSession} />
          }
          isReviewing={isReviewingSpecificSession}
          onSubmit={ (isReviewingSpecificSession || isSubmitted) ? () => {} : () => handleSubmit(false) } 
          score={score} totalQuestions={totalQuestions}
        />
      </div>

      {showLoginPromptModal && (
        <div className={navStyles.modalOverlayLogin} onClick={() => { setShowLoginPromptModal(false); pendingSubmissionDataRef.current = null; }}>
          <div className={navStyles.loginModal} style={{maxWidth: '420px', textAlign:'left'}} onClick={(e) => e.stopPropagation()}>
            <button className={navStyles.modalCloseButton} onClick={() => { setShowLoginPromptModal(false); pendingSubmissionDataRef.current = null; }}>&times;</button>
            <h2 style={{fontSize: '1.35rem', marginBottom: '0.75rem', textAlign:'center'}}>Lưu Lại Kết Quả?</h2>
            <p style={{color: '#4a5568', fontSize: '0.95rem', marginBottom: '1.75rem', lineHeight: '1.6', textAlign:'center'}}>
              Bạn cần đăng nhập để lưu lại lịch sử làm bài và xem lại kết quả sau này.
            </p>
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
              <button onClick={handleLoginFromPrompt} className={navStyles.modalButtonPrimary}>Đăng nhập và Lưu kết quả</button>
              <button onClick={handleSkipLoginAndSubmit} className={navStyles.modalButtonSecondary}>Bỏ qua, chỉ xem kết quả lần này</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export default ExamViewerWrapper;