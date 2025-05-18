// app/api/gemini/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
    Part
} from "@google/generative-ai";

// --- Configuration ---
const API_KEY = process.env.GEMINI_API_KEY;
// Giữ nguyên model name, "-latest" thường là một lựa chọn tốt.
// Nếu logic gốc của bạn dùng "gemini-1.5-flash" thì cũng không khác biệt nhiều.
const MODEL_NAME = "gemini-1.5-flash-latest";

// --- Initialize Gemini Client ---
let genAI: GoogleGenerativeAI | null = null;
if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
    console.log("Gemini AI Client Initialized in API Route.");
} else {
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error("FATAL ERROR: GEMINI_API_KEY is not set in .env.local");
    console.error("The Gemini API route will not function correctly.");
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
}

// --- Optional Configurations (Giữ nguyên như logic của bạn) ---
const generationConfig = {
  temperature: 0.5, // Bạn có thể điều chỉnh nếu logic gốc có giá trị khác
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

// Hàm làm sạch HTML (giữ nguyên như bạn đã cung cấp nếu có dùng cho task khác)
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
        .replace(/&nbsp;/g, ' ')
        .replace(/<br\s*\/?>/g, '\n')
        .replace(/<[^>]+>/g, '');
    cleanedText = cleanedText.replace(/\s{2,}/g, ' ').trim();
    return cleanedText;
}

// --- POST Handler ---
export async function POST(request: NextRequest) {
  if (!API_KEY || !genAI) {
      console.error("API Key check failed during POST request.");
      return NextResponse.json({ error: 'Thiếu cấu hình API Key phía server.' }, { status: 500 });
  }

  try {
    const body = await request.json();
    // Giả định 'word' là tham số cho logic fetchTranslation gốc của bạn
    const { task, text, context, query, word } = body;

    if (!task) {
        return NextResponse.json({ error: 'Thiếu tham số: task' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: MODEL_NAME }); // Sử dụng model đã cấu hình
    console.log(`[API Route] Received task: ${task}`);

    if (task === 'translate') {
        // Logic cho task 'translate' (giữ nguyên như trước)
        if (typeof text !== 'string') {
            return NextResponse.json({ error: 'Thiếu tham số text cho task translate' }, { status: 400 });
        }
        const cleanText = cleanHtmlForApi(text);
        if (!cleanText) {
             return NextResponse.json({ error: 'Nội dung text không hợp lệ sau khi làm sạch.' }, { status: 400 });
        }
        const promptParts: Part[] = [
             {text: `Chỉ dịch nội dung tiếng Hàn sau sang tiếng Việt một cách tự nhiên, giữ nguyên các ký hiệu như ①②③④ hoặc ( ). Không thêm bất kỳ lời dẫn, giải thích, tiêu đề "Bản dịch tiếng Việt:", hay định dạng Markdown nào khác. Chỉ trả về duy nhất nội dung đã được dịch, không có ký tự trang trí nào.`},
             {text: `Nội dung tiếng Hàn:\n---\n${cleanText}\n---`},
             {text: `Bản dịch tiếng Việt:`}
        ];
        const result = await model.generateContent({
             contents: [{ role: "user", parts: promptParts }],
             generationConfig, safetySettings,
        });
        let resultText = "";
        if (result?.response) { resultText = result.response.text(); }
        else { throw new Error("Gemini API không trả về phản hồi cho việc dịch."); }
        return NextResponse.json({ result: resultText.trim() });

    } else if (task === 'chat') {
        // Logic cho task 'chat' (giữ nguyên như trước)
        if (typeof context !== 'string' || typeof query !== 'string') {
            return NextResponse.json({ error: 'Thiếu tham số context hoặc query cho task chat' }, { status: 400 });
        }
        const cleanContext = cleanHtmlForApi(context);
        const cleanQuery = query.replace(/<[^>]+>/g, '').trim();
        if (!cleanContext || !cleanQuery) {
             return NextResponse.json({ error: 'Context hoặc query không hợp lệ sau khi làm sạch.' }, { status: 400 });
        }
        const promptParts: Part[] = [
            {text: `Bạn là một gia sư tiếng Hàn hữu ích, đang giải thích một câu hỏi thi TOPIK cho học viên. Nhiệm vụ của bạn là đọc kỹ Ngữ cảnh câu hỏi TOPIK và Câu hỏi của người dùng, sau đó đưa ra câu trả lời bằng tiếng Việt, tập trung vào việc giải đáp thắc mắc trong Câu hỏi của người dùng liên quan trực tiếp đến Ngữ cảnh đã cho. Trả lời một cách rõ ràng, súc tích, trực tiếp vào vấn đề. chi ghi từ vựng không cần ghi phiên âm của từ vựng đó, không dùng các dấu * đẻ liệt kê`},
            {text: `Ngữ cảnh câu hỏi TOPIK:\n---\n${cleanContext}\n---`},
            {text: `Câu hỏi của người dùng:\n"${cleanQuery}"`},
            {text: `Giải thích của bạn (tiếng Việt):`}
         ];
         const result = await model.generateContent({
             contents: [{ role: "user", parts: promptParts }],
             generationConfig, safetySettings,
         });
         let resultText = "";
         if (result?.response) { resultText = result.response.text(); }
         else { throw new Error("Gemini API không trả về phản hồi cho việc chat."); }
        return NextResponse.json({ result: resultText.trim() });

    } else if (task === 'getWordTranslation') {
        // Đây là phần logic được chuyển từ fetchTranslation gốc của bạn
        if (typeof word !== 'string' || !word.trim()) {
            return NextResponse.json({ error: 'Thiếu hoặc từ không hợp lệ cho getWordTranslation' }, { status: 400 });
        }
        const cleanWord = word.trim(); // Giả sử bạn cũng trim word trong logic gốc

        // Prompt giống hệt logic gốc của bạn
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

        const result = await model.generateContent(prompt); // Gọi Gemini

        if (!result?.response) {
            console.error("[API Route] Gemini API không trả về trường 'response' cho getWordTranslation.");
            throw new Error("Gemini API không trả về phản hồi đầy đủ cho việc tra từ.");
        }
        const responseText = result.response.text();

        // !!! SỬ DỤNG LOGIC LÀM SẠCH GỐC CỦA BẠN !!!
        // Nếu logic gốc của bạn là: const jsonResponse = JSON.parse(responseText.replace(/```json\n|\n```/g, ''));
        // thì áp dụng nó ở đây.
        // Biến này sẽ chứa text sau khi áp dụng regex của bạn.
        const textToParse = responseText.replace(/```json\n|\n```/g, '');

        try {
            const jsonResponse = JSON.parse(textToParse);

            // Trả về dữ liệu giống cấu trúc gốc của bạn
            return NextResponse.json({
                translation: jsonResponse.translation || 'Không có nghĩa.',
                examples: jsonResponse.examples || [],
            });
        } catch (e) {
            console.error("[API Route] Lỗi phân tích JSON từ Gemini cho getWordTranslation (sử dụng regex gốc của bạn):", e);
            console.error("[API Route] Original response text from Gemini:", responseText);
            console.error("[API Route] Text after YOUR regex replacement (textToParse):", textToParse);
            // Lỗi này sẽ được bắt bởi catch ở ngoài và trả về cho client
            throw new Error("Gemini API không trả về JSON hợp lệ cho việc tra từ (đã thử regex gốc).");
        }
    } else {
        return NextResponse.json({ error: 'Loại tác vụ không hợp lệ' }, { status: 400 });
    }

  } catch (error: any) {
    console.error("[API Route] Lỗi khi gọi Gemini API hoặc xử lý:", error);
    let errorMessage = error.message || 'Lỗi không xác định từ API';
    let statusCode = 500;

    // Các kiểm tra lỗi cụ thể (giữ nguyên)
    if (errorMessage.includes('API key not valid')) {errorMessage = 'API Key không hợp lệ hoặc bị thiếu.'; statusCode = 401;}
    else if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {errorMessage = 'Đã vượt quá hạn ngạch sử dụng API.'; statusCode = 429;}
    else if (error.toString().includes('SAFETY')) { errorMessage = "Nội dung yêu cầu/phản hồi không phù hợp."; statusCode = 400;}
    // Lỗi JSON.parse sẽ có message chứa "JSON" hoặc message cụ thể bạn throw từ try-catch bên trong task
    else if (error instanceof SyntaxError && error.message.includes('JSON')) {
        errorMessage = `Lỗi phân tích dữ liệu JSON từ phản hồi của Gemini: ${error.message}`;
        statusCode = 500; // Lỗi từ phía server khi không parse được response từ Gemini
    } else if (errorMessage.startsWith("Gemini API không trả về JSON hợp lệ")) {
        // Giữ nguyên message lỗi này nếu nó được throw từ bên trong
        statusCode = 500;
    }

    return NextResponse.json({ error: `Lỗi xử lý yêu cầu: ${errorMessage}` }, { status: statusCode });
  }
}

// --- GET Handler (Giữ nguyên) ---
export async function GET() {
    return NextResponse.json({ message: 'Gemini API route is active. Use POST method.' });
}