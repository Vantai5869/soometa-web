'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './../exams/Exam.module.css';
import EnhancedTranscriptPlayer from './EnhancedTranscriptPlayer';

import type {
  InstructionGroup,
  Question,
  QuestionContent,
  SharedContent,
  Option,
  SelectedAnswers,
  CorrectAnswersMap,
  // ExplanationData, // Có thể không cần nếu chỉ dùng cho inline translation
  // ExplanationContent,
} from './types';

// --- ExamViewerProps Interface (Cập nhật) ---
interface ExamViewerProps {
  instructionGroups: InstructionGroup[] | undefined | null;
  selectedAnswers: SelectedAnswers;
  isSubmitted: boolean;
  correctAnswersMap: CorrectAnswersMap;
  onAnswerSelect: (questionNumber: number, optionIndex: number) => void;
  // explanationData: ExplanationData; // Bỏ nếu không cần cho mục đích khác
  // onFetchTranslation: (questionNumber: number, question: Question) => Promise<void>; // Bỏ nếu chỉ dùng cho inline
  skill?: string;
  audioUrl?: string;
}

// --- Helper: Render Content (Giữ nguyên) ---
const renderContent = (
  content: QuestionContent | SharedContent | undefined,
  isShared: boolean = false
): React.ReactNode => {
  // ... (Nội dung hàm giữ nguyên như trước)
  if (!content) return null;
  if (typeof content === 'object' && content !== null && 'type' in content) {
    const formatValue = (value: string): string => {
      if (typeof value !== 'string') return '';
      let formatted = value.replace(
        /\(      \)|\(    \)|\( \s* \)/g,
        '<span class="blank-marker">(…)</span>'
      );
      formatted = formatted.replace(
        /\( (㉠|㉡|㉢|㉣) \)/g,
        isShared
          ? '<span class="insertion-point">($1)</span>'
          : '<span class="blank-marker">($1)</span>'
      );
      formatted = formatted.replace(/󰡔/g, '『').replace(/󰡕/g, '』');
      return formatted;
    };
    switch (content.type) {
      case 'text':
      case 'text_with_insertion_points':
        if (typeof content.value !== 'string') return null;
        const isPassage = content.value.includes('\n') || content.value.length > 100;
        const textClassName = isShared ? styles.questionPassage : isPassage ? styles.questionPassage : styles.questionText;
        return <div className={textClassName} dangerouslySetInnerHTML={{ __html: formatValue(content.value) }} />;
      case 'image':
        const imgClassName = isShared ? styles.sharedImage : styles.questionImage;
        return content.src ? <img src={content.src} alt={content.alt || 'Hình ảnh câu hỏi'} className={imgClassName || styles.questionImage} onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => (e.currentTarget.outerHTML = `[Ảnh lỗi: ${content.alt || 'Không có mô tả'}]`)} /> : '[Thiếu ảnh]';
      case 'audio_prompt':
        return <div className={styles.questionAudioPlaceholder}>🎧 [{content.value || 'Nghe đoạn hội thoại/thông tin'}] 🎧</div>;
      case 'instruction':
        return (!isShared && typeof content.value === 'string') ? <div className={styles.instructionValue}>{content.value}</div> : null;
      case 'ordering_task':
        return (!isShared && Array.isArray(content.items)) ? <div className={styles.orderingTask}>{content.items.map((item, idx) => item ? <div key={idx} className={styles.orderingItem}><span className={styles.marker}>{item.marker}</span><span className={styles.text}>{item.text}</span></div> : null)}</div> : null;
      case 'insertion_task':
        if (!isShared) {
          if (content.main_passage && typeof content.main_passage === 'string' && typeof content.sentence_to_insert === 'string') {
            return <div className={styles.insertionTask}><div className={styles.itemToInsert}>{content.sentence_to_insert}</div><div className={styles.mainPassage} dangerouslySetInnerHTML={{ __html: formatValue(content.main_passage) }}></div></div>;
          } else if (typeof content.sentence_to_insert === 'string') {
            return <div className={styles.instructionValue}><b>Chèn câu:</b> {content.sentence_to_insert} (Xem đoạn văn ở trên)</div>;
          }
        } return null;
      default: return null;
    }
  } return null;
};

// --- Helper: Get Audio URL (Giữ nguyên) ---
const getQuestionAudioUrl = (question: Question): string | null => {
  return question.question_audio_url || null;
};

// --- ExamViewer Component (Đã cập nhật) ---
const ExamViewer: React.FC<ExamViewerProps> = ({
  instructionGroups,
  selectedAnswers,
  isSubmitted,
  correctAnswersMap, // Giữ lại nếu bạn vẫn dùng để hiển thị đáp án đúng/sai trực tiếp trên lựa chọn
  onAnswerSelect,
  // explanationData, // Bỏ
  // onFetchTranslation, // Bỏ
  skill,
  audioUrl,
}) => {
  const optionMarkers = ['①', '②', '③', '④'];
  const mainAudioRef = useRef<HTMLAudioElement>(null);
  // Không cần state expandedDetails nữa

  // --- Auto-play Logic (Giữ nguyên) ---
  useEffect(() => {
    if (skill === '듣기' && audioUrl && !isSubmitted && mainAudioRef.current) {
      const playPromise = mainAudioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn('Autoplay bị trình duyệt chặn:', error.message);
        });
      }
    }
  }, [skill, audioUrl, isSubmitted]);

  if (!instructionGroups || !Array.isArray(instructionGroups)) {
    return <div className={styles.errorMessage}>Lỗi: Dữ liệu nhóm câu hỏi không hợp lệ.</div>;
  }

  return (
    <div>
      {skill === '듣기' && audioUrl && !isSubmitted && (
        <div className={styles.audioPlayerContainer}>
          <audio ref={mainAudioRef} src={audioUrl} controls className={styles.audioPlayer}>
             Trình duyệt của bạn không hỗ trợ thẻ audio.
          </audio>
        </div>
      )}

      {instructionGroups.map((group, groupIndex) => {
        if (!group || !Array.isArray(group.questions)) {
          return <div key={`invalid-group-${groupIndex}`} className={styles.errorMessage}>Lỗi dữ liệu nhóm câu hỏi tại vị trí {groupIndex}.</div>;
        }
        return (
          <div key={`group-${groupIndex}`} className={styles.instructionGroup}>
            {group.instruction && (
              <div className={styles.instructionText} dangerouslySetInnerHTML={{ __html: group.instruction }} />
            )}
            {group.shared_content && (
              <div 
                className={`${styles.sharedContent} ${ (group.shared_content.type === 'text' || group.shared_content.type === 'text_with_insertion_points') ? styles.questionPassage : '' }`}
              >
                {renderContent(group.shared_content, true)}
              </div>
            )}
            {isSubmitted && group.group_audio_url && (
              <div className={styles.audioPlayerContainer}><EnhancedTranscriptPlayer key={group.group_audio_url} audioUrl={group.group_audio_url} /></div>
            )}

            {group.questions.map((q: Question) => {
              if (!q || typeof q.number !== 'number' || !Array.isArray(q.options)) {
                return <div key={`invalid-q-${q?.id || Math.random()}`} className={styles.errorMessage}>Lỗi dữ liệu câu hỏi số {q?.number || 'không xác định'}.</div>;
              }

              const questionNumber = q.number;
              const isImageOptions = q.option_type === 'image';
              const currentSelectionIndex = selectedAnswers[questionNumber];
              // const currentExplanation = explanationData?.[questionNumber]; // Không cần nữa
              const questionAudioUrl = getQuestionAudioUrl(q);

              return (
                <div
                  key={q.id}
                  id={`question-block-${questionNumber}`}
                  className={styles.questionBlock}
                  data-option-type={isImageOptions ? 'image' : 'text'}
                >
                  <div className={styles.questionHeader}>
                    <span className={styles.questionNumber}>{questionNumber}.</span>
                    {/* Phần nội dung câu hỏi giờ đây cũng nằm trong khu vực có thể bôi đen */}
                    <div className={styles.questionContent}> 
                      {renderContent(q.content, false)}
                    </div>
                  </div>

                  {isSubmitted && questionAudioUrl && !group.group_audio_url && (
                    <div className={styles.audioPlayerContainer}><EnhancedTranscriptPlayer key={questionAudioUrl} audioUrl={questionAudioUrl} /></div>
                  )}

                  <ul className={styles.optionsList}>
                    {q.options.map((opt: Option, index: number) => {
                      // ... (Logic render option giữ nguyên)
                      if (!opt) return null;
                      const isSelected = currentSelectionIndex === index;
                      const isCorrect = opt.is_correct;
                      let liClassName = styles.optionItem;
                      let spanTextClassName = styles.optionText;

                      if (isSelected && !isSubmitted) liClassName += ` ${styles.selectedOption}`;
                      if (isSubmitted) {
                        if (isCorrect) liClassName += ` ${styles.correctAnswer}`;
                        if (isSelected && !isCorrect) {
                          liClassName += ` ${styles.selectedIncorrect}`;
                          spanTextClassName += ` ${styles.selectedIncorrectText}`;
                        }
                      }
                      return (
                        <li key={opt.id || `opt-${index}`} className={liClassName}
                            onClick={() => !isSubmitted && onAnswerSelect(questionNumber, index)}
                            role="radio" aria-checked={isSelected} tabIndex={isSubmitted ? -1 : 0}>
                          {isImageOptions && opt.image_src ? (
                            <><span className={styles.optionMarker}>{optionMarkers[index]}</span><img src={opt.image_src} alt={opt.alt || `Lựa chọn ${index + 1}`} className={styles.optionImage} onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => (e.currentTarget.outerHTML = `[Ảnh lỗi]`)}/></>
                          ) : (
                            <><span className={styles.optionMarker}>{optionMarkers[index]}</span><span className={spanTextClassName}>{opt.text || `Lựa chọn ${index + 1}`}</span></>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default ExamViewer;