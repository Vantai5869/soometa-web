// components/ExamViewer.tsx
'use client';

import React from 'react';
import styles from './../exams/Exam.module.css'; // Đảm bảo đường dẫn đúng
// Import các kiểu đã định nghĩa
import type { InstructionGroup, Question, QuestionContent, SharedContent, Option, SelectedAnswers, CorrectAnswersMap } from './types'; // Đảm bảo đường dẫn đúng

// Định nghĩa kiểu cho props của ExamViewer
interface ExamViewerProps {
  instructionGroups: InstructionGroup[];
  selectedAnswers: SelectedAnswers;
  isSubmitted: boolean;
  correctAnswersMap: CorrectAnswersMap;
  onAnswerSelect: (questionNumber: number, optionIndex: number) => void;
}

// --- Helper function để render nội dung câu hỏi/đoạn văn ---
const renderContent = (content: QuestionContent | SharedContent | undefined, isShared: boolean = false): React.ReactNode => {
  if (!content) return null;

  // Hàm định dạng text chung (xử lý marker chỗ trống và điểm chèn)
  const formatValue = (value: string): string => {
       // Thay thế các loại chỗ trống bằng span marker
       let formatted = value.replace(/\(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\)|\(&nbsp;&nbsp;&nbsp;&nbsp;\)|\( \s* \)/g, '<span class="blank-marker">(…)</span>');
       // Thay thế điểm chèn câu bằng span marker
       formatted = formatted.replace(/\( (㉠|㉡|㉢|㉣) \)/g, '<span class="insertion-point">($1)</span>');
       formatted = formatted.replace(/󰡔/g, '『').replace(/󰡕/g, '』');
       // Giữ lại thẻ <u> (render bằng dangerouslySetInnerHTML)
       return formatted;
  };

  // Check type property exists before switching
  if ('type' in content) {
      switch (content.type) {
        case 'text':
        case 'text_with_insertion_points':
             const isPassage = content.value.includes('\n') || content.value.length > 100;
             const textClassName = isShared ? styles.questionPassage : (isPassage ? styles.questionPassage : styles.questionText);
             return <div className={textClassName} dangerouslySetInnerHTML={{ __html: formatValue(content.value) }} />;

        case 'image':
             const imgClassName = isShared ? styles.sharedImage : styles.questionImage; // Giả sử có class sharedImage
             return <img
                       src={content.src}
                       alt={content.alt}
                       className={imgClassName || styles.questionImage} // Fallback
                       onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => (e.currentTarget.outerHTML = `[Không thể tải ảnh: ${content.alt}]`)}
                     />;
        case 'audio_prompt':
             return <div className={styles.questionAudioPlaceholder}>🎧 [{content.value || 'Nghe đoạn hội thoại/thông tin'}] 🎧</div>;
        case 'instruction':
            // Chỉ render instruction của câu hỏi
            if (!isShared) { return <div className={styles.instructionValue}>{content.value}</div>; }
            return null;

        case 'ordering_task':
            if (!isShared) {
                return (
                    <div className={styles.orderingTask}>
                        {content.items.map((item, idx) => (
                             <div key={idx} className={styles.orderingItem}>
                                <span className={styles.marker}>{item.marker}</span>
                                <span className={styles.text}>{item.text}</span>
                            </div>
                        ))}
                    </div>
                );
            }
            return null;
         case 'insertion_task':
            if (!isShared) {
                // Trường hợp passage nằm trong content (Đề 91)
                 if (content.main_passage && typeof content.main_passage === 'string') {
                     const passageHTML = formatValue(content.main_passage); // Dùng hàm format chung
                     return (
                         <div className={styles.insertionTask}>
                             <div className={styles.itemToInsert}><b>Chèn câu:</b> {content.sentence_to_insert}</div>
                             <div className={styles.mainPassage} dangerouslySetInnerHTML={{ __html: passageHTML }}></div>
                         </div>
                     );
                 } else {
                     // Trường hợp passage nằm ở shared_content (Đề 47 - Q59)
                     return <div className={styles.instructionValue}><b>Chèn câu:</b> {content.sentence_to_insert} (Xem đoạn văn ở trên)</div>;
                 }
             }
             return null;

        default:
           // Sử dụng never để kiểm tra tính đầy đủ của union type
           const exhaustiveCheck: never = content;
           console.warn("Unknown content type:", exhaustiveCheck);
           return null;
      }
  }
  return null;
};

// --- Component ExamViewer ---
const ExamViewer: React.FC<ExamViewerProps> = ({
  instructionGroups,
  selectedAnswers,
  isSubmitted,
  correctAnswersMap,
  onAnswerSelect,
}) => {
  // Mảng ký tự tròn số cho các lựa chọn
  const optionMarkers = ['①', '②', '③', '④'];

  return (
    <div>
      {/* Lặp qua từng nhóm hướng dẫn */}
      {instructionGroups.map((group: InstructionGroup, groupIndex: number) => (
        <div key={`group-${groupIndex}`} className={styles.instructionGroup}>
          {/* Render Instruction */}
          {group.instruction && (
            <div className={styles.instructionText} dangerouslySetInnerHTML={{ __html: group.instruction }} />
          )}

          {/* Render Shared Content */}
          {group.shared_content && (
             <div className={`${styles.sharedContent} ${ (group.shared_content.type === 'text' || group.shared_content.type === 'text_with_insertion_points') ? styles.questionPassage : ''}`}>
                 {renderContent(group.shared_content, true)}
             </div>
          )}

          {/* Lặp qua các câu hỏi trong nhóm */}
          {group.questions.map((q: Question) => {
            const questionNumber = q.number;
            const isImageOptions = q.option_type === 'image';
            const currentSelectionIndex = selectedAnswers[questionNumber]; // Đáp án user chọn (index 0-based) or undefined
            const correctOptionIndex = correctAnswersMap[questionNumber]; // Đáp án đúng (index 0-based) or undefined

            return (
              // Thêm id để sidebar có thể scroll tới và data-option-type để CSS xử lý layout
              <div key={q.id} id={`question-block-${questionNumber}`} className={styles.questionBlock} data-option-type={isImageOptions ? 'image' : 'text'}>
                {/* Header Câu hỏi */}
                <div className={styles.questionHeader}>
                  <span className={styles.questionNumber}>{questionNumber}.</span>
                  {q.points && <span className={styles.questionPoints}>({q.points}점)</span>}
                </div>

                {/* Nội dung Câu hỏi */}
                <div className={styles.questionContent}>
                    {renderContent(q.content, false)}
                </div>

                {/* Danh sách Lựa chọn */}
                <ul className={styles.optionsList}>
                  {q.options.map((opt: Option, index: number) => {
                    const isSelected = currentSelectionIndex === index;
                    const isCorrect = opt.is_correct;
                    let liClassName = styles.optionItem; // Class cơ bản

                    // Thêm class nếu lựa chọn này đang được chọn (chưa nộp bài)
                    if (isSelected && !isSubmitted) {
                      liClassName += ` ${styles.selectedOption}`;
                    }

                    // Thêm class feedback sau khi nộp bài
                    if (isSubmitted) {
                      if (isCorrect) {
                          liClassName += ` ${styles.correctAnswer}`;
                      }
                       // Thêm class selectedIncorrect CHỈ khi user chọn sai đáp án này
                      if (isSelected && !isCorrect) {
                          liClassName += ` ${styles.selectedIncorrect}`;
                      }
                       // Class selectedCorrect có thể không cần thiết nếu correctAnswer đã đủ nổi bật
                       if (isSelected && isCorrect) {
                           // liClassName += ` ${styles.selectedCorrect}`;
                       }
                    }

                    return (
                      // Thẻ li bao ngoài cùng, xử lý click
                      <li
                        key={opt.id}
                        className={liClassName}
                        onClick={() => !isSubmitted && onAnswerSelect(questionNumber, index)}
                      >
                        {/* Marker (Số tròn) */}
                        <span className={styles.optionMarker}>{optionMarkers[index]}</span>

                        {/* Nội dung lựa chọn (Text hoặc Image) */}
                        {isImageOptions && opt.image_src ? (
                           <img
                             src={opt.image_src}
                             alt={opt.alt || `Lựa chọn ${index + 1}`}
                             className={styles.optionImage}
                             onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => (e.currentTarget.outerHTML = `[Ảnh lỗi]`)}
                           />
                        ) : (
                          // Thêm class text vào span để có thể style riêng nếu cần (vd: gạch ngang khi sai)
                          <span className={styles.optionText}>{opt.text || `Lựa chọn ${index + 1}`}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default ExamViewer;