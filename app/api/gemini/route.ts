import { NextRequest, NextResponse } from 'next/server';
import {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
    Part
} from "@google/generative-ai";

// --- Configuration ---
const API_KEYS = [
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
].filter((key): key is string => !!key && key.trim() !== '');

const MODELS = [
    "gemini-3-flash-preview",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro",
    "gemma-3-27b-it",
    "gemma-3-12b-it",
    "gemma-3-4b-it",
    "gemma-3-2b-it",
    "gemma-3-1b-it"
];

// --- Dynamic state for rotation ---
let activeApiKeys = [...API_KEYS];
let activeModels = [...MODELS];

function rotateToEnd<T>(arr: T[], item: T) {
    const index = arr.indexOf(item);
    if (index > -1) {
        arr.splice(index, 1);
        arr.push(item);
        // console.log(`[Rotation] Moved to end: ${item}. Current list: ${arr.join(', ')}`);
    }
}

function initializeGenAI(apiKey: string): GoogleGenerativeAI {
    return new GoogleGenerativeAI(apiKey);
}

function isLikelyKeyError(error: any): boolean {
    const message = (error?.message || '').toLowerCase();
    const status = Number(error?.status);
    const keywords = [
        'api key not valid', 'invalid api key', 'permission denied', 
        'api_key_invalid', 'reported as leaked', 'key was reported',
        'key has been disabled', 'key expired'
    ];
    return keywords.some(kw => message.includes(kw)) || status === 401 || status === 403;
}

// --- Optional Configurations ---
const generationConfig = {
    temperature: 0.4,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
};

const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// --- Clean HTML Function ---
function cleanHtmlForApi(inputText: string | undefined | null): string {
    if (typeof inputText !== 'string') return '';
    let cleanedText = inputText
        .replace(/<span class="blank-marker">\(…\)<\/span>/g, '(…)')
        .replace(/<span class="blank-marker">\(\s*(㉠|㉡|㉢|㉣)\s*\)<\/span>/g, '($1)')
        .replace(/<span class="insertion-point">\(\s*(㉠|㉡|㉢|㉣)\s*\)<\/span>/g, '($1)')
        .replace(/<u[^>]*>/g, '').replace(/<\/u>/g, '')
        .replace(/<b[^>]*>/g, '').replace(/<\/b>/g, '')
        .replace(/<i[^>]*>/g, '').replace(/<\/i>/g, '')
        .replace(/&nbsp;/g, ' ').replace(/<br\s*\/?>/g, '\n')
        .replace(/<[^>]+>/g, '');
    cleanedText = cleanedText.replace(/\s{2,}/g, ' ').trim();
    return cleanedText;
}

// --- POST Handler with Retry Logic ---
async function executeWithRetry<T>(
    fn: (genAI: GoogleGenerativeAI, modelName: string) => Promise<T>
): Promise<T> {
    let lastError: any;
    
    if (activeApiKeys.length === 0) {
        throw new Error('Không có API key nào được cấu hình.');
    }

    // Capture current state to avoid iteration issues if rotation happens concurrently
    const keysToTry = [...activeApiKeys];
    
    for (const apiKey of keysToTry) {
        const genAI = initializeGenAI(apiKey);
        const modelsToTry = [...activeModels];

        for (const modelName of modelsToTry) {
            try {
                return await fn(genAI, modelName);
            } catch (error: any) {
                lastError = error;
                
                if (isLikelyKeyError(error)) {
                    console.warn(`[Gemini API] Key error with ${apiKey.substring(0, 8)}... - Rotating to end.`);
                    rotateToEnd(activeApiKeys, apiKey);
                    break; // break model loop, try next key
                } else {
                    // Quota, 404, or other model-specific errors
                    console.warn(`[Gemini API] Error with model ${modelName}:`, error.message, "- Rotating to end.");
                    rotateToEnd(activeModels, modelName);
                    // continue to next model
                }
            }
        }
    }
    
    throw lastError || new Error('Tất cả API key và Model đều đã đạt giới hạn hoặc thất bại.');
}

// --- POST Handler ---
export async function POST(request: NextRequest) {
    let requestBodyForLogging: any = null;
    try {
        const body = await request.json();
        requestBodyForLogging = body;
        const { task, text, context, query, word, newMessage, chatHistory, contextText } = body;

        if (!task) {
            return NextResponse.json({ error: 'Thiếu tham số: task' }, { status: 400 });
        }
        // console.log(`[API Route] Received task: ${task}`); // Bỏ log này nếu không cần thiết

        const responseData = await executeWithRetry(async (genAI, modelName) => {
            const model = genAI.getGenerativeModel({ model: modelName });

            if (task === 'getWordTranslation') {
                // ... (logic getWordTranslation giữ nguyên như phiên bản trước, đã yêu cầu không phiên âm và JSON)
                if (typeof word !== 'string' || !word.trim()) {
                    throw new Error('Thiếu hoặc từ không hợp lệ cho getWordTranslation');
                }
                const cleanWord = cleanHtmlForApi(word);
                 if (!cleanWord) {
                    throw new Error('Nội dung "word" không hợp lệ sau khi làm sạch cho getWordTranslation.');
                }
                const prompt = `
Cung cấp định nghĩa chính của cụm từ/từ tiếng Hàn sau: "${cleanWord}" bằng tiếng Việt một cách ngắn gọn, súc tích.
Sau đó, cung cấp chính xác 2 ví dụ sử dụng cụm từ/từ này trong câu hoàn chỉnh bằng tiếng Hàn, kèm theo bản dịch tiếng Việt tương ứng cho mỗi ví dụ.
YÊU CẦU QUAN TRỌNG:
1.  TUYỆT ĐỐI KHÔNG bao gồm phiên âm Romanization (ví dụ: Biga wasseotjiman...) trong bất kỳ phần nào của câu trả lời (cả định nghĩa, câu ví dụ tiếng Hàn, hay bản dịch tiếng Việt).
2.  Trình bày câu trả lời dưới dạng JSON hợp lệ và CHỈ JSON mà thôi, không có ký tự \`\`\`json bao quanh hay bất kỳ text nào khác ngoài JSON.
Định dạng JSON như sau:
{
    "translation": "nghĩa tiếng Việt của ${cleanWord}",
    "examples": [
        { "korean": "Câu ví dụ tiếng Hàn 1", "vietnamese": "Bản dịch tiếng Việt của ví dụ 1" },
        { "korean": "Câu ví dụ tiếng Hàn 2", "vietnamese": "Bản dịch tiếng Việt của ví dụ 2" }
    ]
}
Nếu không tìm thấy thông tin hoặc không thể cung cấp định nghĩa/ví dụ phù hợp cho "${cleanWord}", hãy trả về JSON với "translation": "Không tìm thấy thông tin chi tiết." và "examples": [].
                `;
                const result = await model.generateContent({
                    contents: [{ role: "user", parts: [{text: prompt}] }],
                    generationConfig, safetySettings,
                });

                if (!result?.response) {
                    throw new Error("Gemini API không trả về trường 'response' cho getWordTranslation.");
                }
                const finishReason = result.response.candidates?.[0]?.finishReason;
                // ... (log finishReason và blockReason như cũ) ...
                if (result.response.promptFeedback?.blockReason) {
                    console.error(`[API Route] getWordTranslation - Prompt Blocked: ${result.response.promptFeedback.blockReason}`);
                    throw new Error(`Yêu cầu bị chặn bởi bộ lọc an toàn: ${result.response.promptFeedback.blockReason}`);
                }
                if (finishReason === "MAX_TOKENS") console.warn("[API Route] getWordTranslation - Phản hồi có thể bị cắt ngắn do MAX_TOKENS.");

                const responseText = result.response.text();
                let jsonString = responseText.trim();
                const jsonMarkdownMatch = jsonString.match(/^```json\s*([\s\S]*?)\s*```$/);
                if (jsonMarkdownMatch && jsonMarkdownMatch[1]) {
                    jsonString = jsonMarkdownMatch[1].trim();
                } else {
                    const firstBrace = jsonString.indexOf('{');
                    const lastBrace = jsonString.lastIndexOf('}');
                    if (firstBrace !== -1 && lastBrace > firstBrace) {
                        jsonString = jsonString.substring(firstBrace, lastBrace + 1);
                    }
                }
                try {
                    const jsonResponse = JSON.parse(jsonString);
                    return {
                        translation: jsonResponse.translation || 'Không tìm thấy thông tin chi tiết.',
                        examples: (jsonResponse.examples || []).map((ex: any) => ({
                            korean: ex.korean || "",
                            vietnamese: ex.vietnamese || ""
                        })),
                    };
                } catch (e: any) {
                    console.error("[API Route] Lỗi JSON getWordTranslation:", e.message, "Chuỗi parse:", jsonString, "Gốc:", responseText);
                    throw new Error(`Gemini API không trả về JSON hợp lệ cho việc tra từ. Lỗi: ${e.message}.`);
                }

            } else if (task === 'getAdvancedChatResponse') {
                if (typeof newMessage !== 'string' || !newMessage.trim()) {
                    throw new Error('Thiếu tham số newMessage hoặc nội dung trống cho task getAdvancedChatResponse');
                }

                const { image, contextText } = body; 
                const cleanNewMessage = newMessage.trim();
                const cleanContextText = contextText ? cleanHtmlForApi(contextText as string) : null;

                const parts: Part[] = [];
                // **** PROMPT ĐƯỢC TINH CHỈNH ****
                parts.push({ text: `Bạn là một trợ lý AI ngôn ngữ thông minh, lịch sự và chuyên nghiệp, có khả năng giải thích các vấn đề phức tạp một cách đơn giản.
                YÊU CẦU BẮT BUỘC KHI TRẢ LỜI:
                1.  **Ngôn ngữ:** Trả lời bằng tiếng Việt.
                2.  **Ngắn gọn & Rõ ràng:** Đi thẳng vào vấn đề, dễ hiểu, tránh dài dòng, không lặp lại câu hỏi của người dùng trừ khi để làm rõ một điểm rất cụ thể.
                3.  **Không phiên âm:** TUYỆT ĐỐI KHÔNG sử dụng phiên âm Romanization cho bất kỳ từ hoặc câu tiếng Hàn nào (ví dụ: "annyeonghaseyo"). Nếu cần trích dẫn tiếng Hàn, hãy viết bằng ký tự Hangul.
                4.  **Tinh tế & Chuyên nghiệp:** Trình bày câu trả lời thật gọn gàng, sạch sẽ. Chỉ trả về nội dung câu trả lời trực tiếp. Không thêm các câu dẫn dắt không cần thiết như "Đây là câu trả lời của tôi:", "Tôi hiểu rằng...", "Hy vọng điều này giúp bạn...", v.v.
                5.  **Định dạng:**
                    * Sử dụng xuống dòng (một ký tự \`\\n\`) để tách các đoạn văn hoặc ý chính nếu câu trả lời dài và cần cấu trúc rõ ràng. Tránh xuống dòng quá nhiều.
                    * Nếu cần liệt kê, sử dụng dấu gạch đầu dòng (-) hoặc số (1., 2.) một cách nhất quán.
                    * Không sử dụng Markdown (như đậm, nghiêng, tiêu đề #) trừ khi được yêu cầu cụ thể để làm rõ một thuật ngữ hoặc cấu trúc.
                6.  **Không ký tự rác:** Đảm bảo không có ký tự thừa, ký tự điều khiển ẩn, hoặc định dạng không mong muốn trong câu trả lời.
                Mục tiêu là cung cấp một câu trả lời sạch sẽ, chính xác, và hữu ích nhất có thể.`
                });

                if (cleanContextText) {
                    parts.push({ text: `\n\nSau đây là đoạn văn bản mà người dùng đã chọn trước đó để bạn tham khảo làm ngữ cảnh chính:\n"""\n${cleanContextText}\n"""` });
                }

                // Xử lý hình ảnh nếu có
                if (image && typeof image === 'string' && image.startsWith('data:image/')) {
                    const mimeType = image.split(';')[0].split(':')[1];
                    const base64Data = image.split(',')[1];
                    parts.push({
                        inlineData: {
                            data: base64Data,
                            mimeType: mimeType
                        }
                    });
                }

                if (chatHistory && Array.isArray(chatHistory) && chatHistory.length > 0) {
                    parts.push({ text: "\n\nDưới đây là lịch sử của cuộc trò chuyện này (nếu cần thiết để hiểu câu hỏi mới):" });
                    (chatHistory as Array<{ type: 'user' | 'ai', text: string }>).forEach(msg => {
                        if (msg.type === 'user') parts.push({ text: `\nNgười dùng: ${cleanHtmlForApi(msg.text)}` });
                        else if (msg.type === 'ai') parts.push({ text: `\nAI: ${cleanHtmlForApi(msg.text)}` });
                    });
                } else if (!cleanContextText && !image) { 
                     parts.push({ text: "\n\nĐây là một cuộc trò chuyện mới." });
                }

                parts.push({ text: `\n\nCâu hỏi / Yêu cầu hiện tại từ người dùng:\n"""\n${cleanNewMessage}\n"""` });
                parts.push({ text: `\n\nPhản hồi của bạn (AI):` }); 

                const result = await model.generateContent({
                    contents: [{ role: "user", parts }],
                    generationConfig, safetySettings,
                });
                if (!result?.response) {
                    throw new Error("Gemini API không trả về phản hồi cho 'getAdvancedChatResponse'.");
                }
                // Log finishReason để debug
                const finishReason = result.response.candidates?.[0]?.finishReason;
                console.log(`[API Route] getAdvancedChatResponse - Finish Reason: ${finishReason}`);
                 if (result.response.promptFeedback?.blockReason) {
                    console.error(`[API Route] getAdvancedChatResponse - Prompt Blocked: ${result.response.promptFeedback.blockReason}`);
                    throw new Error(`Yêu cầu bị chặn bởi bộ lọc an toàn: ${result.response.promptFeedback.blockReason}`);
                }
                if (finishReason === "MAX_TOKENS") {
                    console.warn("[API Route] getAdvancedChatResponse - Phản hồi có thể bị cắt ngắn do MAX_TOKENS.");
                }
                return { chatResponse: result.response.text().trim() };
            }
            // --- Các task khác (translate, chat TOPIK) giữ nguyên ---
            else if (task === 'translate') { /* ... giữ nguyên ... */ }
            else if (task === 'chat') { /* ... giữ nguyên ... */ }
            else {
                throw new Error('Loại tác vụ không hợp lệ');
            }
        });
        return NextResponse.json(responseData);
    } catch (error: any) {
        // ... (error handling giữ nguyên)
        console.log('============== LỖI XẢY RA ========');
        console.log({error})
        console.log('============== LỖI XẢY RA ========');
        console.error(`[API Route] Lỗi cuối cùng khi xử lý task "${requestBodyForLogging?.task || 'không xác định'}":`, error.message, error.stack);
        let errorMessage = error.message || 'Lỗi không xác định từ API';
        let statusCode = 500;
        const lowerErrorMessage = errorMessage.toLowerCase();

        if (lowerErrorMessage.includes('api key not valid') || 
            lowerErrorMessage.includes('invalid api key') ||
            lowerErrorMessage.includes('permission denied') ||
            lowerErrorMessage.includes('api_key_invalid')) {
            errorMessage = 'API Key không hợp lệ, đã hết hạn, bị thu hồi hoặc cấu hình sai.'; statusCode = 401;
        } else if (lowerErrorMessage.includes('quota') || lowerErrorMessage.includes('rate limit')) {
            errorMessage = 'Đã vượt quá hạn ngạch hoặc giới hạn tần suất gọi API.'; statusCode = 429;
        } else if (error.toString().toLowerCase().includes('safety') || lowerErrorMessage.includes("bị chặn bởi bộ lọc an toàn")) {
            errorMessage = "Nội dung yêu cầu hoặc phản hồi bị chặn vì lý do an toàn."; statusCode = 400;
        } else if (errorMessage.startsWith("Gemini API không trả về JSON hợp lệ")) {
            statusCode = 502;
        } else if (errorMessage.includes('Thiếu tham số') || errorMessage.includes('không hợp lệ')) {
            statusCode = 400;
        }
        return NextResponse.json({ error: `Lỗi xử lý: ${errorMessage}` }, { status: statusCode });
    }
}

// --- GET Handler ---
export async function GET() {
    return NextResponse.json({ message: 'Gemini API route is active. Use POST method to interact.' });
}