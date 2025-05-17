// utils.ts
import DOMPurify from 'dompurify';
import React from 'react'; // Need React for JSX return type
import { QuestionContent, SharedContent } from './types';

// Hàm trích xuất khoảng số [start~end] hoặc số đơn [number] từ chuỗi instruction
export function extractRange(instruction: string | undefined): { start: number, end: number } | undefined {
    if (!instruction) return undefined;
    try {
        // Regex tìm khoảng số [start~end] hoặc [start-end]
        const rangeMatch = instruction.match(/\[\s*(\d+)\s*[~～-]\s*(\d+)\s*\]/);
        if (rangeMatch && rangeMatch[1] && rangeMatch[2]) {
            const start = parseInt(rangeMatch[1], 10);
            const end = parseInt(rangeMatch[2], 10);
            if (!isNaN(start) && !isNaN(end) && start <= end) {
                return { start, end };
            }
        }
        // Regex tìm số đơn [number]
        const singleMatch = instruction.match(/\[\s*(\d+)\s*\]/);
        if (singleMatch && singleMatch[1]) {
            const singleNum = parseInt(singleMatch[1], 10);
            if (!isNaN(singleNum)) {
                return { start: singleNum, end: singleNum };
            }
        }
    } catch (error) {
        console.error(`Error parsing range in instruction: "${instruction}"`, error);
    }
    return undefined;
}

// Hàm kiểm tra xem một số có nằm trong bất kỳ khoảng nào trong danh sách không
export function isNumberInRange(number: number | undefined, ranges: { start: number, end: number }[]): boolean {
    if (number === undefined || number === null || isNaN(number)) return false;
    return ranges.some(range => number >= range.start && number <= range.end);
}


// Hàm chuẩn hóa instruction string (chỉ dùng cho label hiển thị)
export function normalizeInstruction(instruction: string | undefined): string {
    if (!instruction) return "";
    const cleaned = simpleCleanHtml(instruction)
        .replace(/^※\s*/, '')
        .replace(/<보기>와 같이\s*/, '')
        .replace(/고르십시오.?$/, '')
        .replace(/\s+/g, ' ')
        .trim();
    return cleaned || simpleCleanHtml(instruction);
}

// Hàm làm sạch HTML cơ bản (dùng cho label và server-side rendering)
export function simpleCleanHtml(htmlString: string | undefined): string {
    if (!htmlString) return "";
    return htmlString
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<p.*?>/gi, ' ')
        .replace(/<\/p>/gi, ' ')
        .replace(/<[^>]*>/g, '')
        .replace(/ |\u00A0/g, ' ') // Non-breaking space and similar
        .replace(/\s+/g, ' ')
        .trim();
}

// Hàm định dạng giá trị văn bản cho dangerouslySetInnerHTML
export function formatValue(value: string | undefined): string {
    if (!value) return "";
    // Allow basic formatting tags that are common in text content
    const sanitized = DOMPurify.sanitize(value, {
        USE_PROFILES: { html: true },
        ALLOWED_TAGS: ['br', 'p', 'strong', 'em', 'u', 'b', 'i'], // Added b, i for robustness
        ALLOWED_ATTR: ['style'], // Maybe allow style for minimal inline styling if needed, but keep it minimal
    });
    // Replace newlines with <br/> only if they are not already handled by <p> or <br/>
    // This requires a bit more care, but a simple replace is often sufficient for basic cases
    return sanitized.replace(/\n/g, '<br/>');
}


// Hàm hiển thị nội dung dựa trên content.type
export const renderContent = (content: QuestionContent | SharedContent | undefined | null, isShared: boolean = false): React.ReactNode => {
    if (!content || typeof content !== 'object' || !('type' in content)) return null;

    try {
        switch (content.type) {
            case 'text':
            case 'text_with_insertion_points':
                if (typeof content.value !== 'string') return null;
                const textBaseStyle = "text-[1.05em] leading-relaxed whitespace-pre-wrap break-words text-gray-700";
                const passageStyle = `p-4 md:p-5 bg-gray-50 rounded-md ${textBaseStyle}`;
                const questionTextStyle = `text-[1.1em] leading-relaxed whitespace-pre-wrap break-words text-gray-800`;
                // Use prose classes for better typography, combined with custom styles
                const finalClassName = `prose prose-sm max-w-none ${isShared ? passageStyle : (content.value.includes('\n') || content.value.length > 100 ? passageStyle : questionTextStyle)}`;

                // Use dangerouslySetInnerHTML only on client side
                if (typeof window !== 'undefined') {
                    return <div className={finalClassName} dangerouslySetInnerHTML={{ __html: formatValue(content.value) }} />;
                } else {
                     // Fallback for server-side rendering, removes most HTML
                    return <div className={finalClassName}>{simpleCleanHtml(content.value)}</div>;
                }

            case 'image':
                const imgClassName = `block my-4 mx-auto border border-gray-200 rounded max-h-[250px] md:max-h-[300px] w-auto h-auto object-contain ${isShared ? 'md:max-w-md lg:max-w-lg' : 'max-w-xs sm:max-w-sm md:max-w-md'}`;
                return content.src ? (
                    <img
                        src={content.src}
                        alt={content.alt || 'Hình ảnh'}
                        className={imgClassName}
                        loading="lazy"
                        onError={(e) => { e.currentTarget.outerHTML = `<span class="text-red-600">[Ảnh lỗi: ${simpleCleanHtml(content.alt)}]</span>`; }}
                    />
                ) : '[Thiếu nguồn ảnh]';

            case 'audio_prompt':
                 // Audio prompt often appears within text, not as a standalone content type
                 // This case might need adjustment based on how audio_prompt is structured in your data
                 // If it's intended as content *between* questions or similar, this is okay.
                 // If it's just an instruction *about* listening for the group/question audio,
                 // it might be redundant if audio players are already shown.
                return <div className="text-gray-600 text-left bg-transparent border-none mb-[15px] italic ">🎧 [{content.value || 'Nghe và làm theo yêu cầu'}] 🎧</div>;

            case 'instruction':
                 // Instruction as content is usually not for shared content
                 // and is different from the group's main instruction string.
                 // This might be an instruction specific to a single question.
                if (!isShared && typeof content.value === 'string') {
                    return <div className="my-1 font-semibold text-gray-800 text-base text-gray-600">{content.value}</div>;
                }
                return null;

            case 'ordering_task':
                if (!isShared && Array.isArray(content.items)) {
                    return (
                        <div className="my-4 space-y-2 rounded border border-gray-100 ">
                            {content.items.map((item, idx) => item?.marker && item?.text ? (
                                <div key={idx} className="flex items-baseline text-base p-2 rounded border border-gray-200">
                                    <span className="font-bold text-gray-700 mr-3 w-5 text-center flex-shrink-0 mr-12">{item.marker}</span>
                                    <span className="flex-1 leading-relaxed whitespace-pre-wrap break-words">{item.text}</span>
                                </div>
                            ) : null)}
                        </div>
                    );
                }
                return null;

            case 'insertion_task':
                if (!isShared) {
                    const passageHtml = typeof content.main_passage === 'string' ? formatValue(content.main_passage) : '';
                    const sentenceToInsert = typeof content.sentence_to_insert === 'string' ? content.sentence_to_insert : '';

                    if (passageHtml && sentenceToInsert) {
                         const passageDiv = typeof window !== 'undefined' ? (
                             <div className="p-4 border border-gray-200 rounded bg-gray-50 text-base leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: passageHtml }}></div>
                         ) : (
                             <div className="p-4 border border-gray-200 rounded bg-gray-50 text-base leading-relaxed prose prose-sm max-w-none">{simpleCleanHtml(passageHtml)}</div>
                         );


                        return (
                            <div className="my-4 space-y-3">
                                <div className="p-3 rounded border text-base font-medium text-gray-800">
                                    {/* <strong className="font-semibold text-gray-900 not-italic mr-1">Chèn câu:</strong> */}
                                    {sentenceToInsert}
                                </div>
                                {passageDiv}
                            </div>
                        );
                    } else if (sentenceToInsert) {
                        return (
                            <div className="my-2 text-base text-gray-700">
                                <strong className="font-semibold text-gray-900 not-italic mr-1">Chèn câu:</strong>
                                {sentenceToInsert} (Xem đoạn văn ở trên)
                            </div>
                        );
                    }
                }
                return null;

            default:
                // Handle other potential content types or provide a fallback
                if (typeof content.value === 'string' && content.value.trim()) {
                     // If there's a value but type is unknown, render it as text fallback
                     const className = `prose prose-sm max-w-none text-[1.05em] leading-relaxed whitespace-pre-wrap break-words ${isShared ? 'p-4 md:p-5 bg-gray-50 rounded-md text-gray-700' : 'text-gray-800'}`;
                     if (typeof window !== 'undefined') {
                        return <div className={className} dangerouslySetInnerHTML={{ __html: formatValue(content.value) }} />;
                     } else {
                        return <div className={className}>{simpleCleanHtml(content.value)}</div>;
                     }
                 }
                 // return <div className="text-red-500 italic">[{content.type} - Nội dung không xác định]</div>; // Optional: show placeholder for unknown types
                return null;
        }
    } catch (error) {
        console.error("Error rendering content:", content, error);
        return <div className="text-red-500 italic">Lỗi hiển thị nội dung. Vui lòng thử lại.</div>;
    }
};