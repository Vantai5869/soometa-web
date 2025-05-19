'use client';

import React from 'react';
import Select, { MultiValue } from 'react-select';
import { Exam, ReactSelectOption } from './types';
import { normalizeInstruction } from './utils';

interface PracticeFiltersProps {
    selectedLevel: string;
    setSelectedLevel: (level: string) => void;
    selectedSkill: string;
    setSelectedSkill: (skill: string) => void;
    selectedExamId: string;
    setSelectedExamId: (examId: string) => void;
    selectedInstructions: string[];
    setSelectedInstructions: (instructions: string[]) => void;
    filteredExamsByLevelSkill: Exam[];
    instructionTypeOptions: ReactSelectOption[];
}

const PracticeFilters: React.FC<PracticeFiltersProps> = ({
    selectedLevel,
    setSelectedLevel,
    selectedSkill,
    setSelectedSkill,
    selectedExamId,
    setSelectedExamId,
    selectedInstructions,
    setSelectedInstructions,
    filteredExamsByLevelSkill,
    instructionTypeOptions,
}) => {

    const handleLevelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newLevel = event.target.value;
        setSelectedLevel(newLevel);
        setSelectedSkill(newLevel === 'TOPIK Ⅰ' ? '듣기' : selectedSkill);
        setSelectedExamId('all');
        setSelectedInstructions([]);
    };

    const handleSkillChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newSkill = event.target.value;
        setSelectedSkill(newSkill);
        setSelectedExamId('all');
        setSelectedInstructions([]);
    };

    const handleExamChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newExamId = event.target.value;
        setSelectedExamId(newExamId);
    };

    const handleMultiInstructionChange = (selectedOptions: MultiValue<ReactSelectOption>) => {
        const selectedValues = selectedOptions ? selectedOptions.map(option => option.value) : [];
        setSelectedInstructions(selectedValues);
    };

    return (
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm mb-8 space-y-6 md:space-y-0 md:grid md:grid-cols-3 md:gap-6">
            <div className="filter-item">
                <label htmlFor="level-select" className="block mb-1.5 text-sm font-medium text-gray-700">Cấp độ:</label>
                <select
                    id="level-select"
                    value={selectedLevel}
                    onChange={handleLevelChange}
                    className="w-full py-2 px-3 border border-gray-300 rounded-md bg-white text-base shadow-none focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300 hover:border-blue-200 transition duration-150 ease-in-out" // Removed shadow, softer ring/border on focus/hover
                >
                    <option value="TOPIK Ⅰ">TOPIK I</option>
                    <option value="TOPIK Ⅱ">TOPIK II</option>
                </select>
            </div>
            <div className="filter-item">
                <label htmlFor="skill-select" className="block mb-1.5 text-sm font-medium text-gray-700">Kỹ năng:</label>
                <select
                    id="skill-select"
                    value={selectedSkill}
                    onChange={handleSkillChange}
                    className="w-full py-2 px-3 border border-gray-300 rounded-md bg-white text-base shadow-none focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300 hover:border-blue-200 transition duration-150 ease-in-out" // Removed shadow, softer ring/border on focus/hover
                >
                    <option value="듣기">Nghe (듣기)</option>
                    <option value="읽기">Đọc (읽기)</option>
                </select>
            </div>
            <div className="filter-item">
                <label htmlFor="exam-select" className="block mb-1.5 text-sm font-medium text-gray-700">Kỳ thi ({filteredExamsByLevelSkill.length}):</label>
                <select
                    id="exam-select"
                    value={selectedExamId}
                    onChange={handleExamChange}
                    className="w-full py-2 px-3 border border-gray-300 rounded-md bg-white text-base shadow-none focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300 hover:border-blue-200 transition duration-150 ease-in-out" // Removed shadow, softer ring/border on focus/hover
                >
                    <option value="all">-- Tất cả phù hợp --</option>
                    {filteredExamsByLevelSkill.map((exam) => (
                        <option key={exam.id} value={exam.id}>
                            ({exam.id}) {exam.year_description} {exam.exam_number_description}
                        </option>
                    ))}
                </select>
            </div>

            <div className="md:col-span-3 bg-gray-50 p-6 rounded-md border border-gray-200">
                <label htmlFor="instruction-select-react" className="block mb-2 text-base font-medium text-gray-700"> Chọn dạng yêu cầu (có thể chọn nhiều): </label>
                <Select
                    inputId="instruction-select-react"
                    instanceId="instruction-select-instance"
                    isMulti
                    options={instructionTypeOptions}
                    value={instructionTypeOptions.filter(option => selectedInstructions.includes(option.value))}
                    onChange={handleMultiInstructionChange}
                    placeholder="Tìm hoặc chọn dạng yêu cầu..."
                    noOptionsMessage={() => "Không có dạng nào"}
                    isDisabled={instructionTypeOptions.length === 0}
                    className="text-base react-select-container"
                    classNamePrefix="react-select"
                    styles={{
                        control: (base, state) => ({
                            ...base,
                            minHeight: '42px',
                            // Softer border/ring on focus/hover
                            borderColor: state.isFocused ? '#93c5fd' : '#d1d5db', // blue-300 focus, gray-300 default
                            boxShadow: state.isFocused ? '0 0 0 1px #bfdbfe' : 'none', // blue-200 1px ring, no other shadow
                            '&:hover': {
                                borderColor: '#93c5fd', // blue-300 focus hover
                            },
                            borderRadius: '0.375rem'
                        }),
                        // Softer styling for multi-value tags
                        multiValue: (base) => ({ ...base, backgroundColor: '#eef2ff', borderRadius: '0.25rem' }), // indigo-100
                        multiValueLabel: (base) => ({ ...base, color: '#4338ca', fontSize: '0.875rem' }), // indigo-700
                        multiValueRemove: (base) => ({ ...base, color: '#6366f1', ':hover': { backgroundColor: '#c7d2fe', color: '#3730a3' } }), // indigo-500, indigo-300, indigo-900
                        menu: (base) => ({ ...base, zIndex: 20 }),
                        // Optional: Customize option hover/selected in dropdown menu if needed
                        // option: (base, state) => ({
                        //     ...base,
                        //     backgroundColor: state.isFocused ? '#eef2ff' : state.isSelected ? '#bfdbfe' : null, // indigo-100 hover, blue-200 selected
                        //     color: state.isSelected ? '#1e3a8a' : '#374151', // blue-900 selected, gray-700 default
                        //     ':active': {
                        //         ...base[':active'],
                        //         backgroundColor: state.isSelected ? '#bfdbfe' : '#d1d5db', // blue-200 or gray-300 on click
                        //     },
                        // }),
                    }}
                />
                {instructionTypeOptions.length === 0 && (
                    <div className="text-gray-500 italic mt-2 text-sm">
                        Không tìm thấy dạng yêu cầu cho "{selectedLevel} - {selectedSkill}". Vui lòng chọn cấp độ hoặc kỹ năng khác.
                    </div>
                )}
            </div>
        </div>
    );
};

export default PracticeFilters;