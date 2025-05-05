// components/ChatModal.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from '@/styles/Exam.module.css'; // << Đảm bảo đường dẫn CSS đúng
import type { Question, ExplanationContent, Option } from './types'; // << Đảm bảo đường dẫn Types đúng

interface ChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    questionData: Question | null; // Question có thể null ban đầu
    explanation: ExplanationContent | undefined; // Dữ liệu giải thích/chat cho câu hỏi này
    selectedAnswerIndex: number | undefined; // Index đáp án user chọn (0-based)
    correctAnswerIndex: number | undefined;  // Index đáp án đúng (0-based)
    onFetchTranslation: (questionNumber: number, question: Question) => Promise<void>; // Callback để fetch dịch
    onSendMessage: (message: string) => Promise<void>; // Callback gửi tin nhắn chat (chỉ cần message)
}

const optionMarkers = ['①', '②', '③', '④'];

// --- Helper function render nội dung câu hỏi gốc trong Modal ---
const renderModalQuestionContent = (q: Question | null) => {
    if (!q || !q.content) return <p><i>[Không có nội dung câu hỏi]</i></p>;
    // Đơn giản hóa: Chỉ hiển thị text hoặc alt text của ảnh/audio
    switch (q.content.type) {
        case 'text':
        case 'instruction':
             const cleanText = q.content.value.replace(/<[^>]+>/g, ''); // Loại bỏ HTML cơ bản
             return <p>{cleanText.substring(0, 200)}{cleanText.length > 200 ? '...' : ''}</p>; // Giới hạn độ dài
        case 'image':
             return <p><i>[Hình ảnh: {q.content.alt}]</i></p>; // Chỉ hiện alt text
             // Hoặc có thể render lại ảnh nhỏ:
             // return <img src={q.content.src} alt={q.content.alt} style={{maxHeight: '50px', maxWidth: '100%', display:'block', margin: '5px 0'}} onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => (e.currentTarget.outerHTML = `[Ảnh lỗi]`)} />;
        case 'audio_prompt':
             return <p><i>[Câu hỏi nghe số {q.number}]</i></p>;
        case 'ordering_task':
             return <p><i>[Câu hỏi sắp xếp thứ tự]</i></p>;
        case 'insertion_task':
             return <p><i>[Câu hỏi chèn câu]</i></p>;
        default:
             return <p><i>[Nội dung câu hỏi không xác định]</i></p>;
    }
};

// --- Helper function render các lựa chọn gốc trong Modal (với highlight) ---
const renderOptionsInModal = (options: Option[] | undefined, selectedIdx?: number, correctIdx?: number) => {
    if (!options || !Array.isArray(options)) return null;
    return options.map((opt, index) => {
         if (!opt) return null;
        const isSelected = selectedIdx === index;
        const isCorrect = index === correctIdx;
        let itemClass = styles.modalOptionItem;
        if (isCorrect) { itemClass += ` ${styles.modalCorrectAnswer}`; }
        if (isSelected && !isCorrect) { itemClass += ` ${styles.modalSelectedIncorrect}`; }
        if (isSelected && isCorrect) { itemClass += ` ${styles.modalSelectedCorrect}`; } // Kết hợp nếu cần

        return (
            <div key={opt.id || index} className={itemClass}>
                <span className={styles.modalOptionMarker}>{optionMarkers[index]}</span>
                {opt.image_src ? (
                     <img src={opt.image_src} alt={opt.alt || ''} className={styles.modalOptionImage} onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => (e.currentTarget.outerHTML = `[Ảnh lỗi]`)} />
                ) : (
                     <span className={styles.modalOptionText}>{opt.text}</span>
                )}
            </div>
        );
    });
};

// --- Helper Function: Phân tách bản dịch ---
const parseStructuredTranslation = (rawTranslation: string | undefined): { questionPart: string; optionsPart: string } => {
    const result = { questionPart: '', optionsPart: '' };
    if (!rawTranslation || typeof rawTranslation !== 'string') return result;
    const questionMarker = "[PHẦN CÂU HỎI]:";
    const optionsMarker = "[PHẦN LỰA CHỌN]:";
    const optionsIndex = rawTranslation.indexOf(optionsMarker);
    let questionIndex = rawTranslation.indexOf(questionMarker);

    if (questionIndex !== -1 && optionsIndex !== -1 && optionsIndex > questionIndex) {
        result.questionPart = rawTranslation.substring(questionIndex + questionMarker.length, optionsIndex).trim();
        result.optionsPart = rawTranslation.substring(optionsIndex + optionsMarker.length).trim();
    } else if (questionIndex !== -1) { // Chỉ tìm thấy marker câu hỏi
        result.questionPart = rawTranslation.substring(questionIndex + questionMarker.length).trim();
        // Kiểm tra xem phần còn lại có dấu hiệu của lựa chọn không (ví dụ: ①)
        if (!result.questionPart.includes('①') && !result.questionPart.includes('②')) {
             result.optionsPart = "[Không có phần lựa chọn trong bản dịch]";
        } else {
            // Nếu không có marker options nhưng có dấu hiệu option, coi hết phần còn lại là options
             result.optionsPart = result.questionPart;
             result.questionPart = "[Không tìm thấy phần câu hỏi riêng biệt]";
        }
    } else if (optionsIndex !== -1) { // Chỉ tìm thấy marker lựa chọn
         result.questionPart = rawTranslation.substring(0, optionsIndex).trim(); // Phần trước đó là câu hỏi
         result.optionsPart = rawTranslation.substring(optionsIndex + optionsMarker.length).trim();
    } else { // Không tìm thấy marker nào
        console.warn("Không thể phân tích cấu trúc dịch, hiển thị toàn bộ.");
        result.questionPart = rawTranslation; // Hiển thị tất cả ở phần câu hỏi
    }
    return result;
};

// --- Component ChatModal ---
const ChatModal: React.FC<ChatModalProps> = ({
    isOpen,
    onClose,
    questionData,
    explanation,
    selectedAnswerIndex,
    correctAnswerIndex,
    onFetchTranslation,
    onSendMessage
}) => {
    const [userMessage, setUserMessage] = useState('');
    const chatBodyRef = useRef<HTMLDivElement>(null);

    // Cuộn chat body xuống cuối
    useEffect(() => {
        if (isOpen && chatBodyRef.current) {
            setTimeout(() => { if (chatBodyRef.current) { chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight; } }, 50);
        }
    }, [explanation?.chatHistory, isOpen]);

    // Đóng modal bằng phím ESC
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => { if (event.key === 'Escape') { onClose(); } };
        if (isOpen) { window.addEventListener('keydown', handleEsc); }
        return () => { window.removeEventListener('keydown', handleEsc); };
    }, [isOpen, onClose]);

    // Không render gì nếu modal không mở hoặc không có dữ liệu câu hỏi
    if (!isOpen || !questionData) return null;

    // Hàm gửi tin nhắn
    const handleSend = () => {
        if (userMessage.trim() && !explanation?.isChatLoading) {
            onSendMessage(userMessage.trim());
            setUserMessage('');
        }
    };

    // Hàm xử lý nhấn Enter để gửi
    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); handleSend(); }
    };

    // Hàm gọi fetch bản dịch
    const handleTriggerTranslate = () => {
        onFetchTranslation(questionData.number, questionData);
    }

    // Phân tách bản dịch từ prop explanation
    const parsedTranslation = parseStructuredTranslation(explanation?.translation);

    return (
        <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby={`modalTitle-${questionData.number}`}>
            {/* Ngăn sự kiện click lan ra overlay */}
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} role="document">

                {/* Header của Modal */}
                <div className={styles.modalHeader}>
                    <h3 id={`modalTitle-${questionData.number}`} className={styles.modalTitle}>
                        Giải thích / Hỏi đáp (Câu {questionData.number})
                    </h3>
                    <button className={styles.modalCloseButton} onClick={onClose} aria-label="Đóng Modal">×</button>
                </div>

                {/* Body của Modal (Cho phép cuộn) */}
                <div className={styles.modalBody}>

                    {/* Khu vực hiển thị lại câu hỏi và lựa chọn */}
                    <div className={styles.modalQuestionArea}>
                        <div className={styles.modalQuestionContent}>
                            {renderModalQuestionContent(questionData)}
                        </div>
                        <div className={styles.modalOptionsArea}>
                            {renderOptionsInModal(questionData.options, selectedAnswerIndex, correctAnswerIndex)}
                        </div>
                    </div>

                    {/* Khu vực dịch thuật */}
                    <div className={styles.modalTranslationArea}>
                        {/* Nút dịch chỉ hiện khi chưa có bản dịch và không lỗi */}
                        {!explanation?.translation && !explanation?.isLoadingTranslation && !explanation?.translationError && (
                            <button onClick={handleTriggerTranslate} className={styles.detailsButton} > Dịch sang tiếng Việt </button>
                        )}
                        {explanation?.isLoadingTranslation && <p><i>Đang tải bản dịch...</i></p>}
                        {explanation?.translationError && <p className={styles.errorMessage}>{explanation.translationError}</p>}

                        {/* Hiển thị bản dịch đã phân tách */}
                        {explanation?.translation && !explanation?.isLoadingTranslation && (
                            <>
                                {parsedTranslation.questionPart && (
                                    <div className={styles.translationQuestionPart}>
                                        <strong>Phần câu hỏi/đoạn văn (Dịch):</strong>
                                        <p>{parsedTranslation.questionPart}</p>
                                    </div>
                                )}
                                {parsedTranslation.optionsPart && (
                                    <div className={styles.translationOptionsPart}>
                                        <strong>Phần lựa chọn (Dịch):</strong>
                                        {/* Tách và render từng dòng lựa chọn */}
                                        {parsedTranslation.optionsPart
                                            .split('\n')
                                            .filter(line => line.trim().length > 0)
                                            .map((line, index) => (
                                                <p key={index} className={styles.translatedOptionLine}>{line}</p>
                                            ))
                                        }
                                    </div>
                                )}
                            </>
                        )}
                         {/* Nút thử dịch lại nếu có lỗi */}
                         {explanation?.translationError && <button onClick={handleTriggerTranslate} className={styles.detailsButton} > Thử dịch lại </button>}
                    </div>

                    {/* Khu vực Chat */}
                    <div className={styles.modalChatArea}>
                        <h4 className={styles.chatAreaTitle}>Hỏi đáp thêm</h4>
                        <div className={styles.chatBody} ref={chatBodyRef}>
                            {/* Render lịch sử chat */}
                            {explanation?.chatHistory?.map((msg, index) => (
                                <div key={index} className={`${styles.chatMessage} ${msg.sender === 'user' ? styles.userMessage : styles.aiMessage}`}>
                                    <p>{msg.message}</p>
                                </div>
                            ))}
                            {/* Hiển thị trạng thái loading của AI */}
                            {explanation?.isChatLoading && (
                                 <div className={`${styles.chatMessage} ${styles.aiMessage}`}> <p><i>AI đang soạn...</i></p> </div>
                             )}
                        </div>
                        {/* Khu vực nhập liệu chat */}
                        <div className={styles.chatInputArea}>
                            <textarea
                                value={userMessage}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setUserMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Nhập câu hỏi của bạn..."
                                rows={2}
                                disabled={explanation?.isChatLoading}
                                className={styles.chatTextarea}
                                aria-label={`Nhập câu hỏi chat cho câu ${questionData.number}`}
                            />
                            <button onClick={handleSend} disabled={explanation?.isChatLoading || !userMessage.trim()} className={styles.chatSendButton}> Gửi </button>
                        </div>
                         {/* Hiển thị lỗi chat nếu có */}
                         {explanation?.chatError && <p className={`${styles.errorMessage} ${styles.chatError}`}>{explanation.chatError}</p>}
                    </div>
                </div> {/* End modalBody */}
            </div>
        </div>
    );
};

export default ChatModal;