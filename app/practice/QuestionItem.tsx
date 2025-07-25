// src/components/QuestionItem.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import EnhancedTranscriptPlayer from '../components/EnhancedTranscriptPlayer'; // Adjust import path
import { Question, Option } from './types'; // Adjust import path
import { renderContent } from './utils'; // Adjust import path

interface QuestionItemProps {
    question: Question;
    uniqueQuestionId: string;
    handlePracticeAnswerSelect: (uniqueQuestionId: string, optionIndex: number) => void;
    selectedSkill: string;
    answeredIndex?: number;
}

const optionMarkers = ['①', '②', '③', '④'];

const QuestionItem: React.FC<QuestionItemProps> = ({
    question,
    uniqueQuestionId,
    handlePracticeAnswerSelect,
    selectedSkill,
    answeredIndex,
}) => {
    const isImageOptions = question.option_type === 'image';
    const showQuestionAudio = selectedSkill === '듣기' && question.question_audio_url;

    const [selectedIndex, setSelectedIndex] = useState<number | undefined>(answeredIndex);
    const [isChecked, setIsChecked] = useState(answeredIndex !== undefined);

    useEffect(() => {
        setIsChecked(answeredIndex !== undefined);
        setSelectedIndex(answeredIndex);
    }, [question, uniqueQuestionId, answeredIndex]);

    const handleSelect = (index: number) => {
        setSelectedIndex(index);
    };

    const handleCheckQuestion = useCallback(() => {
        if (selectedIndex !== undefined) {
            setIsChecked(true);
            handlePracticeAnswerSelect(uniqueQuestionId, selectedIndex);
        } else {
            console.warn(`Check button clicked for ${uniqueQuestionId} but no option selected.`);
        }
    }, [selectedIndex, handlePracticeAnswerSelect, uniqueQuestionId]);

    if (!question.options || question.options.length === 0 || !question.content?.type) {
         return null;
    }

    const showCheckButton = !isChecked && selectedIndex !== undefined;

    return (
        // Sử dụng cấu trúc và styling bạn cung cấp
        <div id={`question-block-${uniqueQuestionId}`} className={`questionBlock p-2 m-2 pt-4 rounded-lg ${isChecked ? 'feedback-shown bg-gray-50' : 'bg-white'}`} data-option-type={isImageOptions ? 'image' : 'text'}>
            {/* Sử dụng cấu trúc header bạn cung cấp */}
            <div className="questionHeader md:flex  border-gray-200"> {/* Giữ nguyên styling md:flex border-gray-200 */}
                <span className="questionNumber font-bold text-gray-800 text-[1.15em] mr-2">{question.number}.</span>
                {/* Giữ nguyên vị trí và styling questionContent bạn cung cấp */}
                <div className="questionContent mb-5">{renderContent(question.content, false)}</div>
                {/* {question.points > 0 && <span className="questionPoints text-sm text-gray-500 mr-4">({question.points} điểm)</span>} */}
                 {/* <span className="text-xs text-gray-400 ml-auto">ID: {uniqueQuestionId}</span> */}
            </div>

            {showQuestionAudio && question.question_audio_url && (
                <div className="mb-4 audio-player-container-small">
                    <EnhancedTranscriptPlayer key={question.question_audio_url} audioUrl={question.question_audio_url}/>
                </div>
            )}

            {/* Giữ nguyên cấu trúc ul và styling bạn cung cấp */}
            {Array.isArray(question.options) && question.options.length > 0 ? (
                // Sử dụng layout và spacing bạn cung cấp
                <ul className={`optionsList list-none p-0 m-0 ${isImageOptions
                        ? 'grid grid-cols-2 gap-y-4 gap-x-4 max-w-md mx-auto'
                        : 'flex flex-wrap space-x-6'
                    } ${showCheckButton ? 'mb-5' : ''}`}
                >
                    {question.options.map((opt, index) => {
                        if (!opt) return null;
                        const inputId = `q-${uniqueQuestionId}-o-${index}`;

                        let itemStyling = '';
                        let textStyling = '';
                        let markerStyling = '';

                        if (isChecked) {
                            if (opt.is_correct) {
                                // Đáp án đúng: highlight xanh
                                itemStyling = '';
                                textStyling = 'text-green-800 font-semibold';
                                markerStyling = 'text-green-700 font-bold';
                            } else if (selectedIndex === index) {
                                // Đáp án sai mà user chọn: gạch đỏ
                                itemStyling = 'line-through';
                                textStyling = 'text-red-800 font-semibold';
                                markerStyling = 'text-red-700 font-bold';
                            } else {
                                // Các đáp án sai khác: không gạch, mờ đi
                                itemStyling = 'opacity-70';
                                textStyling = 'text-gray-600';
                                markerStyling = 'text-gray-500';
                            }
                        } else {
                            if (selectedIndex === index) {
                                itemStyling = '';
                                textStyling = 'text-blue-800 font-semibold';
                                markerStyling = 'text-blue-700 font-bold';
                            } else {
                                itemStyling = '';
                                textStyling = 'text-gray-700 group-hover:text-gray-900';
                                markerStyling = 'text-gray-600 group-hover:text-blue-600';
                            }
                        }

                        // Sử dụng liClassName bạn cung cấp
                        const liClassName = `optionItem rounded-lg transition duration-150 ease-in-out relative flex items-baseline text-left p-0 border-none ${itemStyling} ${isImageOptions ? 'flex-col items-center justify-center text-center' : ''} ${isChecked ? 'pointer-events-none cursor-default' : 'cursor-pointer'} mb-3 last:mb-0 last:border-none ml-6 mr-6`;


                        return (
                            <li
                                key={opt.id || `opt-${question.id}-${index}`}
                                className={liClassName}
                                onClick={isChecked ? undefined : () => handleSelect(index)}
                                role="radio"
                                aria-checked={selectedIndex === index}
                                aria-labelledby={`label-${inputId}`}
                                tabIndex={showCheckButton ? 0 : -1}
                            >
                                <input
                                    type="radio"
                                    name={`q-${uniqueQuestionId}`}
                                    id={inputId}
                                    value={index}
                                    checked={selectedIndex === index}
                                    onChange={() => handleSelect(index)}
                                    className="absolute opacity-0 pointer-events-none peer"
                                     disabled={isChecked}
                                />
                                 {/* Sử dụng label bạn cung cấp */}
                                 <label htmlFor={inputId} id={`label-${inputId}`} className={`flex-1 w-full ${isImageOptions ? 'flex flex-col items-center' : 'flex items-start py-1'} ${isChecked ? 'cursor-default' : 'cursor-pointer'}`}>
                                    {/* Sử dụng span marker bạn cung cấp */}
                                    <span className={`marker font-medium mr-2 w-6 text-center flex-shrink-0 text-[1.05em] leading-relaxed ${isImageOptions ? 'mb-2 w-full text-sm' : ''} ${markerStyling}`}>
                                        {optionMarkers[index % optionMarkers.length]}
                                    </span>
                                     {/* Sử dụng div content bạn cung cấp */}
                                     <div className={`content ${isImageOptions ? '' : 'flex-1'}`}>
                                        {isImageOptions && opt.image_src ? (
                                             // --- CHỈ SỬA PHẦN NÀY: Thêm border có điều kiện cho ảnh ---
                                             // Thêm border mặc định xám
                                             // Thêm border xanh khi được chọn (chưa check)
                                             // Thêm border xanh lá khi đúng (đã check)
                                             // Thêm border đỏ khi sai được chọn (đã check)
                                            <img
                                                src={opt.image_src}
                                                alt={opt.alt || `Lựa chọn ${index + 1}`}
                                                className={`optionImage max-w-[210px] max-h-[210px] rounded-md mx-auto block object-contain bg-white ${
                                                    isChecked
                                                        ? (opt.is_correct
                                                            ? 'border-2 border-green-500'
                                                            : selectedIndex === index
                                                                ? 'border-2 border-red-500'
                                                                : 'border border-gray-300')
                                                        : selectedIndex === index
                                                            ? 'border-2 border-blue-500'
                                                            : 'border border-gray-300'
                                                }`}
                                                loading="lazy"
                                                onError={(e) => { e.currentTarget.outerHTML = `<span class="text-red-600 italic">[Ảnh lỗi]</span>`; }}
                                            />
                                             // -------------------------------------------------
                                        ) : (
                                            // Sử dụng span optionText bạn cung cấp
                                            <span className={`optionText text-base leading-relaxed break-words ${textStyling}`}>
                                                 <span>{opt.text || `Lựa chọn ${index + 1}`}</span>
                                            </span>
                                        )}
                                    </div>
                                </label>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p className="text-red-500 text-sm italic mt-2">Không có lựa chọn cho câu hỏi này.</p>
            )}

            {/* Sử dụng nút kiểm tra đáp án bạn cung cấp */}
            
            {showCheckButton && (
                <div className="text-center mt-4">
                    <button
                        onClick={handleCheckQuestion}
                        className="inline-block px-4 py-2 text-sm bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out"
                    >
                        Kiểm tra đáp án câu này
                    </button>
                </div>
            )}
        </div>
    );
};

export default QuestionItem;