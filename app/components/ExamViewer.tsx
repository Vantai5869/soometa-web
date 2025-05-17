'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './../exams/Exam.module.css'; // Adjust path as needed
// Loại bỏ import EnhancedTranscriptPlayer nếu nó không còn được sử dụng cho audio chính và các audio khác.
// Nếu EnhancedTranscriptPlayer vẫn dùng cho audio nhóm/câu hỏi sau khi submit, giữ lại import này.
// Ở đây giả định bạn vẫn dùng EnhancedTranscriptPlayer cho audio nhóm/câu hỏi sau khi submit.
import EnhancedTranscriptPlayer from './EnhancedTranscriptPlayer'; // Adjust path as needed

import type {
  InstructionGroup,
  Question,
  QuestionContent,
  SharedContent,
  Option,
  SelectedAnswers,
  CorrectAnswersMap,
  ExplanationData,
  ExplanationContent,
} from './types'; // Adjust path as needed

// --- InlineChat Component ---
interface InlineChatProps {
  question: Question;
  explanation: ExplanationContent | undefined;
  onSendMessage: (message: string) => Promise<void>;
}

const InlineChat: React.FC<InlineChatProps> = ({
  question,
  explanation,
  onSendMessage,
}) => {
  const [userMessage, setUserMessage] = useState('');
  const chatBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [explanation?.chatHistory]);

  const handleSend = () => {
    if (userMessage.trim() && !explanation?.isChatLoading) {
      onSendMessage(userMessage.trim());
      setUserMessage('');
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles.inlineChatArea}>
      <h4 className={styles.chatAreaTitle}>Hỏi đáp thêm</h4>
      <div className={styles.chatBody} ref={chatBodyRef}>
        {explanation?.chatHistory?.map((msg, index) => (
          <div
            key={index}
            className={`${styles.chatMessage} ${
              msg.sender === 'user' ? styles.userMessage : styles.aiMessage
            }`}
          >
            <p>{msg.message}</p>
          </div>
        ))}
        {explanation?.isChatLoading && (
          <div className={`${styles.chatMessage} ${styles.aiMessage}`}>
            <p>
              <i>AI đang soạn...</i>
            </p>
          </div>
        )}
      </div>
      <div className={styles.chatInputArea}>
        <textarea
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nhập câu hỏi..."
          rows={2}
          disabled={explanation?.isChatLoading}
          className={styles.chatTextarea}
          aria-label={`Nhập câu hỏi chat cho câu ${question.number}`}
        />
        <button
          onClick={handleSend}
          disabled={explanation?.isChatLoading || !userMessage.trim()}
          className={styles.chatSendButton}
        >
          Gửi
        </button>
      </div>
      {explanation?.chatError && (
        <p className={`${styles.errorMessage} ${styles.chatError}`}>
          {explanation.chatError}
        </p>
      )}
    </div>
  );
};

// --- ExamViewerProps Interface ---
interface ExamViewerProps {
  instructionGroups: InstructionGroup[] | undefined | null;
  selectedAnswers: SelectedAnswers;
  isSubmitted: boolean;
  correctAnswersMap: CorrectAnswersMap;
  onAnswerSelect: (questionNumber: number, optionIndex: number) => void;
  explanationData: ExplanationData;
  onFetchTranslation: (questionNumber: number, question: Question) => Promise<void>;
  onSendChatMessage: (
    questionNumber: number,
    question: Question,
    message: string
  ) => Promise<void>;
  skill?: string;
  audioUrl?: string; // This is the main audio URL
}

// --- Helper: Render Content ---
const renderContent = (
  content: QuestionContent | SharedContent | undefined,
  isShared: boolean = false
): React.ReactNode => {
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
        const textClassName = isShared
          ? styles.questionPassage
          : isPassage
          ? styles.questionPassage
          : styles.questionText;
        return (
          <div
            className={textClassName}
            dangerouslySetInnerHTML={{ __html: formatValue(content.value) }}
          />
        );
      case 'image':
        const imgClassName = isShared ? styles.sharedImage : styles.questionImage;
        return content.src ? (
          <img
            src={content.src}
            alt={content.alt}
            className={imgClassName || styles.questionImage}
            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) =>
              (e.currentTarget.outerHTML = `[Ảnh lỗi: ${content.alt}]`)
            }
          />
        ) : (
          '[Thiếu nguồn ảnh]'
        );
      case 'audio_prompt':
        return (
          <div className={styles.questionAudioPlaceholder}>
            🎧 [{content.value || 'Nghe đoạn hội thoại/thông tin'}] 🎧
          </div>
        );
      case 'instruction':
        if (!isShared && typeof content.value === 'string') {
          return <div className={styles.instructionValue}>{content.value}</div>;
        }
        return null;
      case 'ordering_task':
        if (!isShared && Array.isArray(content.items)) {
          return (
            <div className={styles.orderingTask}>
              {content.items.map((item, idx) =>
                item ? (
                  <div key={idx} className={styles.orderingItem}>
                    <span className={styles.marker}>{item.marker}</span>
                    <span className={styles.text}>{item.text}</span>
                  </div>
                ) : null
              )}
            </div>
          );
        }
        return null;
      case 'insertion_task':
        if (!isShared) {
          if (
            content.main_passage &&
            typeof content.main_passage === 'string' &&
            typeof content.sentence_to_insert === 'string'
          ) {
            const passageHTML = formatValue(content.main_passage);
            return (
              <div className={styles.insertionTask}>
                <div className={styles.itemToInsert}>
                  {content.sentence_to_insert}
                </div>
                <div
                  className={styles.mainPassage}
                  dangerouslySetInnerHTML={{ __html: passageHTML }}
                ></div>
              </div>
            );
          } else if (typeof content.sentence_to_insert === 'string') {
            return (
              <div className={styles.instructionValue}>
                <b>Chèn câu:</b> {content.sentence_to_insert} (Xem đoạn văn ở trên)
              </div>
            );
          }
        }
        return null;
      default:
        return null;
    }
  }
  return null;
};

// --- Helper: Parse Translation ---
const parseStructuredTranslation = (
  rawTranslation: string | undefined
): { questionPart: string; optionsPart: string } => {
  const result = { questionPart: '', optionsPart: '' };
  if (!rawTranslation || typeof rawTranslation !== 'string') return result;
  const questionMarker = '[PHẦN CÂU HỎI]:';
  const optionsMarker = '[PHẦN LỰA CHỌN]:';
  const optionsIndex = rawTranslation.indexOf(optionsMarker);
  let questionIndex = rawTranslation.indexOf(questionMarker);

  if (questionIndex !== -1 && optionsIndex !== -1 && optionsIndex > questionIndex) {
    result.questionPart = rawTranslation
      .substring(questionIndex + questionMarker.length, optionsIndex)
      .trim();
    result.optionsPart = rawTranslation
      .substring(optionsIndex + optionsMarker.length)
      .trim();
  } else if (questionIndex !== -1) {
    result.questionPart = rawTranslation
      .substring(questionIndex + questionMarker.length)
      .trim();
  } else if (optionsIndex !== -1) {
    result.questionPart = rawTranslation.substring(0, optionsIndex).trim();
    result.optionsPart = rawTranslation
      .substring(optionsIndex + optionsMarker.length)
      .trim();
  } else {
    console.warn('Không thể phân tích cấu trúc dịch, hiển thị toàn bộ.');
    result.questionPart = rawTranslation;
  }
  return result;
};

// --- Helper: Get Audio URL for Questions ---
const getQuestionAudioUrl = (question: Question): string | null => {
  return question.question_audio_url || null;
};

// --- ExamViewer Component ---
const ExamViewer: React.FC<ExamViewerProps> = ({
  instructionGroups,
  selectedAnswers,
  isSubmitted,
  correctAnswersMap,
  onAnswerSelect,
  explanationData,
  onFetchTranslation,
  onSendChatMessage,
  skill,
  audioUrl, // This prop holds the main audio URL
}) => {
  const optionMarkers = ['①', '②', '③', '④'];
  const [expandedDetails, setExpandedDetails] = useState<{ [key: number]: boolean }>(
    {}
  );

  // Ref để tham chiếu đến phần tử audio
  const mainAudioRef = useRef<HTMLAudioElement>(null);

  // --- Auto-play Logic ---
  useEffect(() => {
    // Kiểm tra nếu là bài nghe, có URL audio chính, bài thi chưa nộp,
    // VÀ phần tử audio đã được render và sẵn sàng trong DOM (qua ref)
    if (skill === '듣기' && audioUrl && !isSubmitted && mainAudioRef.current) {
      // Có thể giữ log này để biết lệnh play đã được gọi
      console.log('Attempting to auto-play main audio:', audioUrl);

      const playPromise = mainAudioRef.current.play();

      if (playPromise !== undefined) {
        playPromise.then(() => {
          // Tự động phát thành công
        }).catch(error => {
          // Đây là nơi lỗi "play() failed..." được bắt.
          // Để ẩn lỗi *hiển thị trên console*, bạn có thể:

          // 1. Bỏ hoàn toàn dòng console.error:
          // console.error('Autoplay failed:', error);

          // 2. Hoặc thay bằng console.warn (ít gây chú ý hơn):
          console.warn('Autoplay was prevented by the browser:', error.message);

          // 3. Hoặc làm gì đó khác (ví dụ: hiển thị thông báo cho người dùng click play)
          // ... your custom handling here ...
        });
      }
    }
  }, [skill, audioUrl, isSubmitted]); // Effect chạy lại khi skill, audioUrl hoặc isSubmitted thay đổi

  // Toggle explanation details
  const toggleDetails = (questionNumber: number, question: Question) => {
    const isCurrentlyExpanded = !!expandedDetails[questionNumber];
    const newExpandedState = !isCurrentlyExpanded;
    setExpandedDetails((prev) => ({ ...prev, [questionNumber]: newExpandedState }));

    if (
      newExpandedState &&
      !explanationData[questionNumber]?.translation &&
      !explanationData[questionNumber]?.isLoadingTranslation &&
      !explanationData[questionNumber]?.translationError
    ) {
      onFetchTranslation(questionNumber, question);
    }
  };

  // Validate instruction groups
  if (!instructionGroups || !Array.isArray(instructionGroups)) {
    return (
      <div className={styles.errorMessage}>
        Lỗi: Dữ liệu nhóm câu hỏi không hợp lệ.
      </div>
    );
  }

  return (
    <div>
      {/* Main Audio Player (Before Submission) */}
      {skill === '듣기' && audioUrl && !isSubmitted && (
        <div className={styles.audioPlayerContainer}>
          {/* Sử dụng thẻ <audio> tiêu chuẩn và gán ref */}
          <audio ref={mainAudioRef} src={audioUrl} controls className={styles.audioPlayer}>
             Trình duyệt của bạn không hỗ trợ thẻ audio.
          </audio>
          {/* Logic auto-play được xử lý bởi useEffect ở trên */}
        </div>
      )}

      {/* Instruction Groups */}
      {instructionGroups.map((group, groupIndex) => {
        if (!group || !Array.isArray(group.questions)) {
          console.error(`Invalid instruction group at index ${groupIndex}:`, group);
          return (
            <div
              key={`invalid-group-${groupIndex}`}
              className={styles.errorMessage}
            >
              Lỗi dữ liệu nhóm câu hỏi tại vị trí {groupIndex}.
            </div>
          );
        }

        return (
          <div key={`group-${groupIndex}`} className={styles.instructionGroup}>
            {/* Group Instruction */}
            {group.instruction && (
              <div
                className={styles.instructionText}
                dangerouslySetInnerHTML={{ __html: group.instruction }}
              />
            )}
            {/* Shared Content */}
            {group.shared_content && (
              <div
                className={`${styles.sharedContent} ${
                  group.shared_content.type === 'text' ||
                  group.shared_content.type === 'text_with_insertion_points'
                    ? styles.questionPassage
                    : ''
                }`}
              >
                {renderContent(group.shared_content, true)}
              </div>
            )}
            {/* Group Audio Player (After Submission, if exists) */}
            {isSubmitted && group.group_audio_url && (
              <div className={styles.audioPlayerContainer}>
                {/* Sử dụng EnhancedTranscriptPlayer cho audio nhóm nếu cần */}
                <EnhancedTranscriptPlayer
                  key={group.group_audio_url}
                  audioUrl={group.group_audio_url}
                />
              </div>
            )}

            {/* Questions */}
            {group.questions.map((q: Question) => {
              if (
                !q ||
                typeof q.number !== 'number' ||
                !Array.isArray(q.options)
              ) {
                console.error(`Invalid question data:`, q);
                return (
                  <div
                    key={`invalid-q-${q?.id || Math.random()}`}
                    className={styles.errorMessage}
                  >
                    Lỗi dữ liệu câu hỏi số {q?.number || 'không xác định'}.
                  </div>
                );
              }

              const questionNumber = q.number;
              const isImageOptions = q.option_type === 'image';
              const currentSelectionIndex = selectedAnswers[questionNumber];
              const correctOptionIndex = correctAnswersMap[questionNumber];
              const currentExplanation = explanationData[questionNumber];
              const isExpanded = !!expandedDetails[questionNumber];
              const parsedTranslation = isExpanded
                ? parseStructuredTranslation(currentExplanation?.translation)
                : { questionPart: '', optionsPart: '' };
              const questionAudioUrl = getQuestionAudioUrl(q);

              return (
                <div
                  key={q.id}
                  id={`question-block-${questionNumber}`}
                  className={styles.questionBlock}
                  data-option-type={isImageOptions ? 'image' : 'text'}
                >
                  {/* Question Header */}
                  <div className={styles.questionHeader}>
                    <span className={styles.questionNumber}>{questionNumber}.</span>
                    <div className={styles.questionContent}>
                      {renderContent(q.content, false)}
                    </div>
                  </div>

                  {/* Question Audio Player (After Submission, if no group audio) */}
                  {isSubmitted && questionAudioUrl && !group.group_audio_url && (
                    <div className={styles.audioPlayerContainer}>
                      {/* Sử dụng EnhancedTranscriptPlayer cho audio câu hỏi nếu cần */}
                      <EnhancedTranscriptPlayer
                        key={questionAudioUrl}
                        audioUrl={questionAudioUrl}
                      />
                    </div>
                  )}

                  {/* Options */}
                  <ul className={styles.optionsList}>
                    {q.options.map((opt: Option, index: number) => {
                      if (!opt) return null;
                      const isSelected = currentSelectionIndex === index;
                      const isCorrect = opt.is_correct;
                      let liClassName = styles.optionItem;
                      let spanTextClassName = styles.optionText;

                      if (isSelected && !isSubmitted) {
                        liClassName += ` ${styles.selectedOption}`;
                      }
                      if (isSubmitted) {
                        if (isCorrect) {
                          liClassName += ` ${styles.correctAnswer}`;
                        }
                        if (isSelected && !isCorrect) {
                          liClassName += ` ${styles.selectedIncorrect}`;
                          spanTextClassName += ` ${styles.selectedIncorrectText}`;
                        }
                      }

                      return (
                        <li
                          key={opt.id || `opt-${index}`}
                          className={liClassName}
                          onClick={() =>
                            !isSubmitted && onAnswerSelect(questionNumber, index)
                          }
                          role="radio"
                          aria-checked={isSelected}
                          tabIndex={isSubmitted ? -1 : 0}
                        >
                          {isImageOptions && opt.image_src ? (
                            <>
                              <span className={styles.optionMarker}>
                                {optionMarkers[index]}
                              </span>
                              <img
                                src={opt.image_src}
                                alt={opt.alt || `Lựa chọn ${index + 1}`}
                                className={styles.optionImage}
                                onError={(
                                  e: React.SyntheticEvent<HTMLImageElement, Event>
                                ) => (e.currentTarget.outerHTML = `[Ảnh lỗi]`)}
                              />
                            </>
                          ) : (
                            <>
                              <span className={styles.optionMarker}>
                                {optionMarkers[index]}
                              </span>
                              <span className={spanTextClassName}>
                                {opt.text || `Lựa chọn ${index + 1}`}
                              </span>
                            </>
                          )}
                        </li>
                      );
                    })}
                  </ul>

                  {/* Explanation (After Submission, only for non-listening skills) */}
                  {isSubmitted && skill !== '듣기' && (
                    <div className={styles.explanationArea}>
                      {/* Explanation Toggle */}
                      <button
                        className={styles.detailsButton}
                        onClick={() => toggleDetails(questionNumber, q)}
                        disabled={
                          currentExplanation?.isLoadingTranslation ||
                          currentExplanation?.isChatLoading
                        }
                        aria-expanded={isExpanded}
                        aria-controls={`details-panel-${questionNumber}`}
                      >
                        {isExpanded ? 'Ẩn chi tiết' : 'Giải thích / Hỏi đáp'}
                      </button>

                      {/* Explanation Panel */}
                      {isExpanded && (
                        <div
                          id={`details-panel-${questionNumber}`}
                          className={styles.detailsPanel}
                        >
                          {/* Translation Section */}
                          <div className={styles.translationSection}>
                            {currentExplanation?.isLoadingTranslation && (
                              <p>
                                <i>Đang tải bản dịch...</i>
                              </p>
                            )}
                            {currentExplanation?.translationError && (
                              <p className={styles.errorMessage}>
                                {currentExplanation.translationError}
                              </p>
                            )}
                            {parsedTranslation.questionPart &&
                              !currentExplanation?.isLoadingTranslation && (
                                <div className={styles.translationQuestionPart}>
                                  <strong>Phần câu hỏi/đoạn văn (Dịch):</strong>
                                  <p>{parsedTranslation.questionPart}</p>
                                </div>
                              )}
                            {parsedTranslation.optionsPart &&
                              !currentExplanation?.isLoadingTranslation && (
                                <div className={styles.translationOptionsPart}>
                                  <strong>Phần lựa chọn (Dịch):</strong>
                                  <pre>{parsedTranslation.optionsPart}</pre>
                                </div>
                              )}
                            {currentExplanation?.translationError && (
                              <button
                                onClick={() =>
                                  onFetchTranslation(questionNumber, q)
                                }
                                className={styles.detailsButton}
                              >
                                Thử dịch lại
                              </button>
                            )}
                          </div>

                          {/* Inline Chat */}
                          <InlineChat
                            question={q}
                            explanation={currentExplanation}
                            onSendMessage={(message) =>
                              onSendChatMessage(questionNumber, q, message)
                            }
                          />
                        </div>
                      )}
                    </div>
                  )}
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