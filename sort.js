// const fs = require('fs');
// const path = require('path');

// // --- Cấu hình ---
// const inputFilePath = path.join(__dirname, 'data.json'); // File JSON gốc
// const outputFilePath = path.join(__dirname, 'data_sorted.json'); // File JSON kết quả đã sắp xếp
// // --- Kết thúc cấu hình ---

// // Hàm so sánh hai ID đề thi
// function compareTestIds(a, b) {
//     try {
//         const idA = a.id;
//         const idB = b.id;

//         const partsA = idA.split('-'); // Ví dụ: ["96", "II", "listening"]
//         const partsB = idB.split('-');

//         // Kiểm tra định dạng cơ bản của ID (vẫn cần thiết cho số kỳ thi và skill)
//         if (partsA.length < 1 || partsB.length < 1) { // Chỉ cần phần số kỳ thi là tối thiểu
//             return 0;
//         }

//         const numA = parseInt(partsA[0], 10);
//         const numB = parseInt(partsB[0], 10);

//         // 1. Sắp xếp theo số kỳ thi giảm dần (cao đến thấp)
//         if (numB !== numA) {
//             return numB - numA;
//         }

//         // 2. Nếu số kỳ thi bằng nhau, sắp xếp theo Level tăng dần (TOPIK Ⅰ trước TOPIK Ⅱ - thấp đến cao)
//         // Sử dụng trực tiếp trường "level"
//         const levelFieldA = a.level; // Ví dụ: "TOPIK Ⅰ"
//         const levelFieldB = b.level; // Ví dụ: "TOPIK Ⅱ"

//         // Tạo một đối tượng để xác định thứ tự của các level
//         // Gán giá trị nhỏ hơn cho Level I để nó đứng trước
//         const levelOrder = {
//             'TOPIK Ⅰ': 1,
//             'TOPIK Ⅱ': 2
//         };

//         // Lấy giá trị thứ tự từ đối tượng levelOrder
//         // Nếu trường level không khớp với định dạng mong muốn, gán giá trị mặc định (ví dụ: 0 hoặc một số lớn)
//         // để xử lý các trường hợp không mong muốn hoặc giữ nguyên thứ tự tương đối.
//         // Ở đây, nếu level không phải 'TOPIK Ⅰ' hoặc 'TOPIK Ⅱ', nó sẽ được coi là lớn hơn (để ở sau)
//         // hoặc bạn có thể điều chỉnh logic này nếu có các loại level khác.
//         const orderA = levelOrder[levelFieldA] || 99; // Gán giá trị lớn nếu không xác định
//         const orderB = levelOrder[levelFieldB] || 99;

//         if (orderA !== orderB) {
//             return orderA - orderB; // Level thấp hơn (TOPIK Ⅰ) đứng trước
//         }

//         // 3. Nếu số kỳ thi và Level (từ trường "level") bằng nhau,
//         //    sắp xếp theo Skill (alphabetical - listening trước reading) - vẫn lấy từ ID
//         if (partsA.length > 2 && partsB.length > 2) {
//             const skillA = partsA[2];
//             const skillB = partsB[2];
//             return skillA.localeCompare(skillB); // Sắp xếp theo bảng chữ cái tăng dần
//         }

//         // Nếu không có phần skill hoặc các trường hợp khác, giữ nguyên thứ tự tương đối
//         return 0;

//     } catch (e) {
//         console.error(`Lỗi khi phân tích ID hoặc Level: ${a.id}/${a.level} hoặc ${b.id}/${b.level}`, e);
//         return 0; // Lỗi thì giữ nguyên thứ tự
//     }
// }

// try {
//     // 1. Đọc file data.json
//     console.log(`Đang đọc file dữ liệu gốc: ${inputFilePath}`);
//     const rawData = fs.readFileSync(inputFilePath, 'utf8');
//     const testsData = JSON.parse(rawData);
//     console.log(`Đọc thành công. Tổng số đề thi: ${testsData.length}`);

//     // 2. Sắp xếp mảng dữ liệu
//     console.log("Bắt đầu sắp xếp dữ liệu...");
//     testsData.sort(compareTestIds);
//     console.log("Sắp xếp hoàn tất.");

//     // 3. Lưu kết quả ra file mới
//     console.log(`Đang lưu kết quả đã sắp xếp vào file: ${outputFilePath}`);
//     const outputJsonString = JSON.stringify(testsData, null, 2);
//     fs.writeFileSync(outputFilePath, outputJsonString, 'utf8');
//     console.log(">>> Xử lý hoàn tất! <<<");

// } catch (error) {
//     console.error("Đã xảy ra lỗi trong quá trình xử lý:", error);
//     if (error.code === 'ENOENT') {
//         console.error(`Lỗi: Không tìm thấy file ${inputFilePath}. Hãy đảm bảo file data.json nằm cùng thư mục với script.`);
//     } else if (error instanceof SyntaxError) {
//         console.error(`Lỗi: File ${inputFilePath} có định dạng JSON không hợp lệ.`);
//     }
// }


const fs = require('fs');
const path = require('path');

// --- Cấu hình ---
const inputFilePath = path.join(__dirname, 'data.json'); // File JSON gốc
const outputAudioUrlsPath = path.join(__dirname, 'filtered_audio_urls_deep_v2.json'); // File JSON kết quả
const excludeUrlPrefix = 'https://www.topik.go.kr';
// --- Kết thúc cấu hình ---

// Hàm đệ quy để tìm tất cả các audio_url, question_audio_url, và group_audio_url
function findAudioUrlsRecursively(obj, urlsFound, excludePrefix) {
    if (obj === null || typeof obj !== 'object') {
        return;
    }

    if (Array.isArray(obj)) {
        obj.forEach(item => findAudioUrlsRecursively(item, urlsFound, excludePrefix));
    } else {
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const value = obj[key];
                if (typeof value === 'string') {
                    // Kiểm tra nếu khóa là một trong các key chứa URL âm thanh
                    // và giá trị không bắt đầu bằng chuỗi cần loại trừ
                    if ((key === 'audio_url' || key === 'question_audio_url' || key === 'group_audio_url') && 
                        !value.startsWith(excludeUrlPrefix) && 
                        value.trim() !== '' && // Bỏ qua các chuỗi rỗng
                        (value.includes('.mp3') || value.includes('.wav') || value.includes('.ogg') || value.includes('.m4a')) // Kiểm tra đuôi file âm thanh cơ bản
                    ) {
                        if (!urlsFound.includes(value)) {
                            urlsFound.push(value);
                        }
                    }
                } else if (typeof value === 'object') {
                    findAudioUrlsRecursively(value, urlsFound, excludePrefix);
                }
            }
        }
    }
}

try {
    // 1. Đọc file data.json
    console.log(`Đang đọc file dữ liệu gốc: ${inputFilePath}`);
    const rawData = fs.readFileSync(inputFilePath, 'utf8');
    const jsonData = JSON.parse(rawData);
    console.log(`Đọc thành công.`);

    // 2. Trích xuất và lọc các audio_url một cách đệ quy
    console.log(`Bắt đầu trích xuất và lọc audio_url (loại trừ các URL bắt đầu bằng: ${excludeUrlPrefix})...`);
    const filteredAudioUrls = [];

    findAudioUrlsRecursively(jsonData, filteredAudioUrls, excludeUrlPrefix);

    console.log(`Trích xuất và lọc hoàn tất. Số lượng audio_url hợp lệ: ${filteredAudioUrls.length}`);
    if (filteredAudioUrls.length > 0) {
        console.log("Một vài URL mẫu được tìm thấy:", filteredAudioUrls.slice(0, 10)); // In ra 10 URL đầu tiên
        console.log("URL cuối cùng được tìm thấy:", filteredAudioUrls[filteredAudioUrls.length - 1]);
    } else {
        console.log("Không tìm thấy audio_url nào hợp lệ sau khi lọc.");
    }

    // 3. Lưu kết quả (mảng các URL) ra file JSON mới
    console.log(`Đang lưu danh sách audio_url đã lọc vào file: ${outputAudioUrlsPath}`);
    const outputJsonString = JSON.stringify(filteredAudioUrls, null, 2);
    fs.writeFileSync(outputAudioUrlsPath, outputJsonString, 'utf8');
    console.log(`>>> Xử lý hoàn tất! Kết quả được lưu tại: ${outputAudioUrlsPath} <<<`);

} catch (error) {
    console.error("Đã xảy ra lỗi trong quá trình xử lý:", error);
    if (error.code === 'ENOENT') {
        console.error(`Lỗi: Không tìm thấy file ${inputFilePath}. Hãy đảm bảo file data.json nằm cùng thư mục với script.`);
    } else if (error instanceof SyntaxError) {
        console.error(`Lỗi: File ${inputFilePath} có định dạng JSON không hợp lệ.`);
    }
}