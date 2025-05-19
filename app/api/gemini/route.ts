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
    // Add more keys as needed
].filter((key): key is string => !!key); // Filter out undefined/null keys

const MODEL_NAME = "gemini-1.5-flash-latest";

// --- Initialize Gemini Client ---
let currentApiKeyIndex = 0;

function getNextApiKey(): string | null {
    if (API_KEYS.length === 0) {
        console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        console.error("FATAL ERROR: No valid GEMINI_API_KEYs set in .env.local");
        console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        return null;
    }
    const key = API_KEYS[currentApiKeyIndex];
    currentApiKeyIndex = (currentApiKeyIndex + 1) % API_KEYS.length; // Rotate to next key
    return key;
}

function initializeGenAI(apiKey: string): GoogleGenerativeAI {
    const genAI = new GoogleGenerativeAI(apiKey);
    console.log("Gemini AI Client Initialized with API Key:", apiKey.slice(0, 4) + "...");
    return genAI;
}

// --- Optional Configurations ---
const generationConfig = {
    temperature: 0.5,
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
        .replace(/<u[^>]*>/g, '')
        .replace(/<\/u>/g, '')
        .replace(/<b[^>]*>/g, '')
        .replace(/<\/b>/g, '')
        .replace(/<i[^>]*>/g, '')
        .replace(/<\/i>/g, '')
        .replace(/ /g, ' ')
        .replace(/<br\s*\/?>/g, '\n')
        .replace(/<[^>]+>/g, '');
    cleanedText = cleanedText.replace(/\s{2,}/g, ' ').trim();
    return cleanedText;
}

// --- POST Handler with Retry Logic ---
async function executeWithRetry<T>(
    fn: (genAI: GoogleGenerativeAI) => Promise<T>,
    maxRetries: number = API_KEYS.length
): Promise<T> {
    let lastError: any;
    for (let i = 0; i < maxRetries; i++) {
        const apiKey = getNextApiKey();
        if (!apiKey) {
            throw new Error('No valid API keys available.');
        }
        const genAI = initializeGenAI(apiKey);
        try {
            return await fn(genAI);
        } catch (error: any) {
            lastError = error;
            if (error.message.includes('API key not valid') || error.message.includes('quota') || error.message.includes('rate limit')) {
                console.warn(`API Key failed: ${apiKey.slice(0, 4)}... Retrying with next key...`);
                continue;
            }
            throw error; // Non-retryable error
        }
    }
    throw lastError || new Error('All API keys failed.');
}

// --- POST Handler ---
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { task, text, context, query, word } = body;

        if (!task) {
            return NextResponse.json({ error: 'Thiếu tham số: task' }, { status: 400 });
        }

        console.log(`[API Route] Received task: ${task}`);

        const result = await executeWithRetry(async (genAI) => {
            const model = genAI.getGenerativeModel({ model: MODEL_NAME });

            if (task === 'translate') {
                if (typeof text !== 'string') {
                    return NextResponse.json({ error: 'Thiếu tham số text cho task translate' }, { status: 400 });
                }
                const cleanText = cleanHtmlForApi(text);
                if (!cleanText) {
                    return NextResponse.json({ error: 'Nội dung text không hợp lệ sau khi làm sạch.' }, { status: 400 });
                }
                const promptParts: Part[] = [
                    { text: `Chỉ dịch nội dung tiếng Hàn sau sang tiếng Việt một cách tự nhiên, giữ nguyên các ký hiệu như ①②③④ hoặc ( ). Không thêm bất kỳ lời dẫn, giải thích, tiêu đề "Bản dịch tiếng Việt:", hay định dạng Markdown nào khác. Chỉ trả về duy nhất nội dung đã được dịch, không có ký tự trang trí nào.` },
                    { text: `Nội dung tiếng Hàn:\n---\n${cleanText}\n---` },
                    { text: `Bản dịch tiếng Việt:` }
                ];
                const result = await model.generateContent({
                    contents: [{ role: "user", parts: promptParts }],
                    generationConfig,
                    safetySettings,
                });
                let resultText = "";
                if (result?.response) {
                    resultText = result.response.text();
                } else {
                    throw new Error("Gemini API không trả về phản hồi cho việc dịch.");
                }
                return NextResponse.json({ result: resultText.trim() });

            } else if (task === 'chat') {
                if (typeof context !== 'string' || typeof query !== 'string') {
                    return NextResponse.json({ error: 'Thiếu tham số context hoặc query cho task chat' }, { status: 400 });
                }
                const cleanContext = cleanHtmlForApi(context);
                const cleanQuery = query.replace(/<[^>]+>/g, '').trim();
                if (!cleanContext || !cleanQuery) {
                    return NextResponse.json({ error: 'Context hoặc query không hợp lệ sau khi làm sạch.' }, { status: 400 });
                }
                const promptParts: Part[] = [
                    { text: `Bạn là một gia sư tiếng Hàn hữu ích, đang giải thích một câu hỏi thi TOPIK cho học viên. Nhiệm vụ của bạn là đọc kỹ Ngữ cảnh câu hỏi TOPIK và Câu hỏi của người dùng, sau đó đưa ra câu trả lời bằng tiếng Việt, tập trung vào việc giải đáp thắc mắc trong Câu hỏi của người dùng liên quan trực tiếp đến Ngữ cảnh đã cho. Trả lời một cách rõ ràng, súc tích, trực tiếp vào vấn đề. Chỉ ghi từ vựng, không cần ghi phiên âm của từ vựng đó, không dùng các dấu * để liệt kê.` },
                    { text: `Ngữ cảnh câu hỏi TOPIK:\n---\n${cleanContext}\n---` },
                    { text: `Câu hỏi của người dùng:\n"${cleanQuery}"` },
                    { text: `Giải thích của bạn (tiếng Việt):` }
                ];
                const result = await model.generateContent({
                    contents: [{ role: "user", parts: promptParts }],
                    generationConfig,
                    safetySettings,
                });
                let resultText = "";
                if (result?.response) {
                    resultText = result.response.text();
                } else {
                    throw new Error("Gemini API không trả về phản hồi cho việc chat.");
                }
                return NextResponse.json({ result: resultText.trim() });

            } else if (task === 'getWordTranslation') {
                if (typeof word !== 'string' || !word.trim()) {
                    return NextResponse.json({ error: 'Thiếu hoặc từ không hợp lệ cho getWordTranslation' }, { status: 400 });
                }
                const cleanWord = word.trim();
                const prompt = `
                    Cung cấp nghĩa của từ "${cleanWord}" bằng tiếng Việt một cách ngắn gọn và 1-2 ví dụ sử dụng từ này trong câu bằng tiếng Hàn cùng bản dịch tiếng Việt.
                    Trả về định dạng JSON:
                    {
                        "translation": "nghĩa tiếng Việt",
                        "examples": [
                            "câu tiếng Hàn - bản dịch tiếng Việt",
                            "câu tiếng Hàn - bản dịch tiếng Việt"
                        ]
                    }
                `;
                console.log(`[API Route] Sending Word Translation Prompt to Gemini for: "${cleanWord}"`);
                const result = await model.generateContent(prompt);
                if (!result?.response) {
                    console.error("[API Route] Gemini API không trả về trường 'response' cho getWordTranslation.");
                    throw new Error("Gemini API không trả về phản hồi đầy đủ cho việc tra từ.");
                }
                const responseText = result.response.text();
                const textToParse = responseText.replace(/```json\n|\n```/g, '');
                try {
                    const jsonResponse = JSON.parse(textToParse);
                    return NextResponse.json({
                        translation: jsonResponse.translation || 'Không có nghĩa.',
                        examples: jsonResponse.examples || [],
                    });
                } catch (e) {
                    console.error("[API Route] Lỗi phân tích JSON từ Gemini cho getWordTranslation:", e);
                    console.error("[API Route] Original response text from Gemini:", responseText);
                    console.error("[API Route] Text after regex replacement:", textToParse);
                    throw new Error("Gemini API không trả về JSON hợp lệ cho việc tra từ.");
                }
            } else {
                return NextResponse.json({ error: 'Loại tác vụ không hợp lệ' }, { status: 400 });
            }
        });

        return result;

    } catch (error: any) {
        console.error("[API Route] Lỗi khi gọi Gemini API hoặc xử lý:", error);
        let errorMessage = error.message || 'Lỗi không xác định từ API';
        let statusCode = 500;

        if (errorMessage.includes('API key not valid')) {
            errorMessage = 'API Key không hợp lệ hoặc bị thiếu.';
            statusCode = 401;
        } else if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
            errorMessage = 'Đã vượt quá hạn ngạch sử dụng API.';
            statusCode = 429;
        } else if (error.toString().includes('SAFETY')) {
            errorMessage = "Nội dung yêu cầu/phản hồi không phù hợp.";
            statusCode = 400;
        } else if (error instanceof SyntaxError && error.message.includes('JSON')) {
            errorMessage = `Lỗi phân tích dữ liệu JSON từ phản hồi của Gemini: ${error.message}`;
            statusCode = 500;
        } else if (errorMessage.startsWith("Gemini API không trả về JSON hợp lệ")) {
            statusCode = 500;
        }

        return NextResponse.json({ error: `Lỗi xử lý yêu cầu: ${errorMessage}` }, { status: statusCode });
    }
}

// --- GET Handler ---
export async function GET() {
    return NextResponse.json({ message: 'Gemini API route is active. Use POST method.' });
}