'use client';

import React from 'react';
import InstructionGroupDisplay from './InstructionGroupDisplay';
import { DisplayGroup } from './types';

interface PracticeQuestionListProps {
    groupsToDisplay: DisplayGroup[];
    handlePracticeAnswerSelect: (uniqueQuestionId: string, optionIndex: number) => void;
    selectedSkill: string;
    selectedExamId: string;
    selectedLevel: string;
    selectedSkillForMessage: string;
    getAnsweredIndex: (uniqueQuestionId: string) => number | undefined;
}

const PracticeQuestionList: React.FC<PracticeQuestionListProps> = ({
    groupsToDisplay,
    handlePracticeAnswerSelect,
    selectedSkill,
    selectedExamId,
    selectedLevel,
    selectedSkillForMessage,
    getAnsweredIndex,
}) => {
    const totalQuestionsDisplayed = groupsToDisplay.reduce((count, group) => count + (group.questions?.length || 0), 0);

    return (
        <div className="bg-white p-0 md:p-8 rounded-lg md:shadow-sm mt-8"> {/* Removed border */}
            <h2 className="text-xl font-semibold mb-6 text-gray-700">Danh sách câu hỏi ({totalQuestionsDisplayed} câu)</h2>
            {groupsToDisplay.length > 0 ? (
                groupsToDisplay.map((group, groupIndex) => (
                    <InstructionGroupDisplay
                        key={`${group.examId}-group-${groupIndex}`}
                        group={group}
                        groupIndex={groupIndex}
                        handlePracticeAnswerSelect={handlePracticeAnswerSelect}
                        selectedSkill={selectedSkill}
                        getAnsweredIndex={getAnsweredIndex}
                    />
                ))
            ) : (
                <div className="text-gray-600 italic py-4">
                    Không tìm thấy câu hỏi phù hợp với các dạng yêu cầu đã chọn trong {selectedExamId === 'all' ? `các đề ${selectedLevel} - ${selectedSkillForMessage}.` : `đề ${selectedExamId}.`} Vui lòng thử lại.
                </div>
            )}
        </div>
    );
};

export default PracticeQuestionList;