// app/api/gemini/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
    Part // Import Part để sử dụng trong promptParts
} from "@google/generative-ai";

// --- Configuration ---
const API_KEY = process.env.GEMINI_API_KEY;
// Chọn model phù hợp - Flash nhanh và rẻ hơn, Pro mạnh hơn
const MODEL_NAME = "gemini-1.5-flash-latest";
// const MODEL_NAME = "gemini-pro";

// --- Initialize Gemini Client ---
let genAI: GoogleGenerativeAI | null = null;
if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
    console.log("Gemini AI Client Initialized."); // Log khi khởi tạo thành công
} else {
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error("FATAL ERROR: GEMINI_API_KEY is not set in .env.local");
    console.error("The Gemini API route will not function correctly.");
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
}

// --- Optional Configurations ---
const generationConfig = {
  temperature: 0.5, // Giữ ở mức trung bình cho cân bằng
  topK: 1,
  topP: 1,
  maxOutputTokens: 2048, // Giới hạn token để kiểm soát chi phí
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// === HÀM LÀM SẠCH HTML ===
function cleanHtmlForApi(inputText: string | undefined | null): string {
    if (typeof inputText !== 'string') return ''; // Trả về chuỗi rỗng nếu input không hợp lệ
    // Thứ tự replace quan trọng để tránh lỗi
    let cleanedText = inputText
        .replace(/<span class="blank-marker">\(…\)<\/span>/g, '(…)') // (…)
        .replace(/<span class="blank-marker">\(\s*(㉠|㉡|㉢|㉣)\s*\)<\/span>/g, '($1)') // ( ㉠ )...
        .replace(/<span class="insertion-point">\(\s*(㉠|㉡|㉢|㉣)\s*\)<\/span>/g, '($1)') // insertion point
        .replace(/<u[^>]*>/g, '')       // <u>
        .replace(/<\/u>/g, '')          // </u>
        .replace(/<b[^>]*>/g, '')       // <b>
        .replace(/<\/b>/g, '')          // </b>
        .replace(/<i[^>]*>/g, '')       // <i> (Nếu có)
        .replace(/<\/i>/g, '')          // </i> (Nếu có)
        .replace(/&nbsp;/g, ' ')        // &nbsp;
        .replace(/<br\s*\/?>/g, '\n')   // <br> -> newline
        .replace(/<[^>]+>/g, '');     // Xóa các thẻ HTML còn lại (cẩn thận nếu cần giữ lại thẻ nào đó)

    // Có thể thêm các bước làm sạch khác nếu cần (vd: xóa khoảng trắng thừa)
    cleanedText = cleanedText.replace(/\s{2,}/g, ' ').trim(); // Thay thế nhiều khoảng trắng bằng 1, xóa khoảng trắng đầu/cuối

    return cleanedText;
}
// =========================

// --- POST Handler ---
export async function POST(request: NextRequest) {
  // Kiểm tra lại API Key
  if (!API_KEY || !genAI) {
      console.error("API Key check failed during POST request.");
      return NextResponse.json({ error: 'Thiếu cấu hình API Key phía server.' }, { status: 500 });
  }

  try {
    // Parse request body
    const body = await request.json();
    const { task, text, context, query } = body; // Nhận dữ liệu thô từ client

    // Validate input parameters
    if (!task) { return NextResponse.json({ error: 'Thiếu tham số: task' }, { status: 400 }); }
    if (task === 'translate' && typeof text !== 'string') { return NextResponse.json({ error: 'Thiếu tham số text cho task translate' }, { status: 400 }); }
    if (task === 'chat' && (typeof context !== 'string' || typeof query !== 'string')) { return NextResponse.json({ error: 'Thiếu tham số context hoặc query cho task chat' }, { status: 400 }); }

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    let promptParts: Part[] = []; // Sử dụng kiểu Part[]
    let resultText = "";

    console.log(`[API Route] Received task: ${task}`);

    // --- Task Logic ---
    if (task === 'translate') {
        // <<< LÀM SẠCH HTML Ở ĐÂY >>>
        const cleanText = cleanHtmlForApi(text);

        if (!cleanText) {
             console.warn("[API Route] Translation text is empty after cleaning.");
             return NextResponse.json({ error: 'Nội dung text không hợp lệ sau khi làm sạch.' }, { status: 400 });
        }

        // Sử dụng text đã làm sạch trong prompt
        promptParts = [
             {text: `Chỉ dịch nội dung tiếng Hàn sau sang tiếng Việt một cách tự nhiên, giữ nguyên các ký hiệu như ①②③④ hoặc ( ). Không thêm bất kỳ lời dẫn, giải thích, tiêu đề "Bản dịch tiếng Việt:", hay định dạng Markdown nào khác. Chỉ trả về duy nhất nội dung đã được dịch.`},
             {text: `Nội dung tiếng Hàn:\n---\n${cleanText}\n---`}, // << Dùng cleanText
             {text: `Bản dịch tiếng Việt:`}
        ];
        console.log("--- Sending Cleaned Translation Prompt to Gemini ---");

        const result = await model.generateContent({
             contents: [{ role: "user", parts: promptParts }],
             generationConfig, safetySettings,
        });

        // Xử lý response an toàn hơn
        if (result?.response) { resultText = result.response.text(); }
        else { throw new Error("Gemini API không trả về phản hồi cho việc dịch."); }

    } else if (task === 'chat') {
        // Làm sạch context và query trước khi gửi đi
        const cleanContext = cleanHtmlForApi(context);
        const cleanQuery = query.replace(/<[^>]+>/g, '').trim(); // Làm sạch query đơn giản hơn

        if (!cleanContext || !cleanQuery) {
             return NextResponse.json({ error: 'Context hoặc query không hợp lệ sau khi làm sạch.' }, { status: 400 });
        }

        promptParts = [
            {text: `Bạn là một gia sư tiếng Hàn hữu ích, đang giải thích một câu hỏi thi TOPIK cho học viên. Nhiệm vụ của bạn là đọc kỹ Ngữ cảnh câu hỏi TOPIK và Câu hỏi của người dùng, sau đó đưa ra câu trả lời bằng tiếng Việt, tập trung vào việc giải đáp thắc mắc trong Câu hỏi của người dùng liên quan trực tiếp đến Ngữ cảnh đã cho. Trả lời một cách rõ ràng, súc tích, trực tiếp vào vấn đề.`},
            {text: `Ngữ cảnh câu hỏi TOPIK:\n---\n${cleanContext}\n---`}, // Dùng context sạch
            {text: `Câu hỏi của người dùng:\n"${cleanQuery}"`}, // Dùng query sạch
            {text: `Giải thích của bạn (tiếng Việt):`}
         ];
         console.log("--- Sending Cleaned Chat Prompt to Gemini ---");

         const result = await model.generateContent({
             contents: [{ role: "user", parts: promptParts }],
             generationConfig, safetySettings,
         });

         if (result?.response) { resultText = result.response.text(); }
         else { throw new Error("Gemini API không trả về phản hồi cho việc chat."); }
    } else {
        return NextResponse.json({ error: 'Loại tác vụ không hợp lệ' }, { status: 400 });
    }

    // Trả về kết quả đã được trim()
    return NextResponse.json({ result: resultText.trim() });

  } catch (error: any) {
    console.error("[API Route] Lỗi khi gọi Gemini API hoặc xử lý:", error);
    let errorMessage = error.message || 'Lỗi không xác định từ API';
    let statusCode = 500;
    if (errorMessage.includes('API key not valid')) {errorMessage = 'API Key không hợp lệ hoặc bị thiếu.'; statusCode = 401;}
    else if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {errorMessage = 'Đã vượt quá hạn ngạch sử dụng API.'; statusCode = 429;}
    else if (error.toString().includes('SAFETY')) { errorMessage = "Nội dung yêu cầu/phản hồi không phù hợp."; statusCode = 400;}
    else if (error instanceof SyntaxError && error.message.includes('JSON')) { errorMessage = "Lỗi phân tích dữ liệu JSON từ yêu cầu."; statusCode = 400; }
    // Thêm các check lỗi khác nếu cần

    return NextResponse.json({ error: `Lỗi xử lý yêu cầu: ${errorMessage}` }, { status: statusCode });
  }
}

// --- GET Handler (Giữ nguyên) ---
export async function GET() {
    return NextResponse.json({ message: 'Gemini API route is active. Use POST method.' });
}