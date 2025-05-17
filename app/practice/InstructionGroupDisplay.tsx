// src/components/InstructionGroupDisplay.tsx
'use client';

import React from 'react';
import QuestionItem from './QuestionItem'; // Adjust import path
import EnhancedTranscriptPlayer from '../components/EnhancedTranscriptPlayer'; // Adjust import path
import { DisplayGroup, Question } from './types'; // Adjust import path
import { renderContent } from './utils'; // Adjust import path - renderContent should be imported

interface InstructionGroupDisplayProps {
    group: DisplayGroup;
    groupIndex: number;
    practiceAnswers: { [key: string]: number };
    handlePracticeAnswerSelect: (uniqueQuestionId: string, optionIndex: number) => void;
    selectedSkill: string;
    // handleAudioPlay: (event: React.SyntheticEvent<HTMLAudioElement>) => void;
}

const InstructionGroupDisplay: React.FC<InstructionGroupDisplayProps> = ({
    group,
    groupIndex,
    practiceAnswers,
    handlePracticeAnswerSelect,
    selectedSkill,
    // handleAudioPlay,
}) => {
    const questionsInGroupToDisplay = group.questions as Question[];
    const showGroupAudio = selectedSkill === '듣기' && group.group_audio_url;

    if (!questionsInGroupToDisplay || questionsInGroupToDisplay.length === 0) {
        return null;
    }

    return (
        <div className="instructionGroup mb-8 md:mb-10 pt-6 first:pt-0"> {/* Khoảng cách dọc phân tách nhóm */}

            {/* --- Render đề bài nhóm (bao gồm HTML) và Exam ID --- */}
            {group.instruction && (
                // Apply styling to the wrapping div
                <div className="groupInstruction mb-4 text-base font-semibold text-gray-800 items-baseline">
                    {/* Call renderContent with a temporary object for the instruction text */}
                    {/* renderContent expects an object like { type: 'text', value: string } for text content */}
                    {renderContent({ type: 'text', value: group.instruction }, false)} {/* isShared=false as it's a group instruction */}

                    {/* Display Exam ID right after the rendered instruction */}
                    {group.examId && (
                        // flex-shrink-0 helps prevent Exam ID from wrapping if instruction is very long
                        <span className="text-xs text-gray-400 ml-1 font-normal flex-shrink-0">
                           (Đề: {group.examId})
                        </span>
                    )}
                </div>
            )}
            {/* ------------------------------------------------- */}

            {showGroupAudio && group.group_audio_url && (
                <div className="mb-5 audio-player-container"> {/* Margin dưới audio nhóm */}
                    <p className="text-sm font-medium text-gray-600 mb-2">Audio cho nhóm câu hỏi:</p>
                    <EnhancedTranscriptPlayer key={group.group_audio_url} audioUrl={group.group_audio_url}/>
                </div>
            )}
            {group.shared_content && (
                 <div className="mb-6 md:mb-8 shared-content-area">{renderContent(group.shared_content, true)}</div> // Margin dưới nội dung dùng chung
            )}
            {questionsInGroupToDisplay.map((question) => {
                const uniqueQuestionId = `${group.examId}-${question.id}`;
                const currentSelectionIndex = practiceAnswers[uniqueQuestionId];

                return (
                    <QuestionItem
                        key={uniqueQuestionId} // Key duy nhất cho mỗi QuestionItem
                        question={question}
                        uniqueQuestionId={uniqueQuestionId}
                        currentSelectionIndex={currentSelectionIndex}
                        handlePracticeAnswerSelect={handlePracticeAnswerSelect}
                        selectedSkill={selectedSkill}
                        // handleAudioPlay={handleAudioPlay} // Truyền xuống nếu cần quản lý dừng audio toàn cục
                    />
                );
            })}
        </div>
    );
};

export default InstructionGroupDisplay;