const fs = require('fs');
const path = require('path');

// --- Cấu hình ---
const inputFilePath = path.join(__dirname, 'data.json'); // File JSON gốc
const outputFilePath = path.join(__dirname, 'data_sorted.json'); // File JSON kết quả đã sắp xếp
// --- Kết thúc cấu hình ---

// Hàm so sánh hai ID đề thi
function compareTestIds(a, b) {
    try {
        const idA = a.id;
        const idB = b.id;

        const partsA = idA.split('-'); // Ví dụ: ["96", "II", "listening"]
        const partsB = idB.split('-');

        // Kiểm tra định dạng cơ bản
        if (partsA.length < 2 || partsB.length < 2) {
            // Nếu ID không đúng định dạng, coi như bằng nhau để giữ thứ tự gốc tương đối
            return 0;
        }

        const numA = parseInt(partsA[0], 10);
        const numB = parseInt(partsB[0], 10);

        // 1. Sắp xếp theo số kỳ thi giảm dần
        if (numB !== numA) {
            return numB - numA;
        }

        // 2. Nếu số kỳ thi bằng nhau, sắp xếp theo Level giảm dần (II trước I)
        const levelA = partsA[1];
        const levelB = partsB[1];
        const levelOrder = {'Ⅱ': 2, 'Ⅰ': 1}; // Gán giá trị để so sánh

        const orderA = levelOrder[levelA] || 0; // Nếu không phải I hoặc II, coi là 0
        const orderB = levelOrder[levelB] || 0;

        if (orderB !== orderA) {
            return orderB - orderA; // Level cao hơn (II) đứng trước
        }

        // 3. Nếu số kỳ thi và Level bằng nhau, sắp xếp theo Skill (alphabetical - listening trước reading)
        if (partsA.length > 2 && partsB.length > 2) {
             const skillA = partsA[2];
             const skillB = partsB[2];
             return skillA.localeCompare(skillB); // Sắp xếp theo bảng chữ cái tăng dần
        }

        // Nếu không có phần skill hoặc các trường hợp khác, giữ nguyên thứ tự tương đối
        return 0;

    } catch (e) {
        console.error(`Lỗi khi phân tích ID: ${a.id} hoặc ${b.id}`, e);
        return 0; // Lỗi thì giữ nguyên thứ tự
    }
}

try {
    // 1. Đọc file data.json
    console.log(`Đang đọc file dữ liệu gốc: ${inputFilePath}`);
    const rawData = fs.readFileSync(inputFilePath, 'utf8');
    const testsData = JSON.parse(rawData);
    console.log(`Đọc thành công. Tổng số đề thi: ${testsData.length}`);

    // 2. Sắp xếp mảng dữ liệu
    console.log("Bắt đầu sắp xếp dữ liệu...");
    testsData.sort(compareTestIds);
    console.log("Sắp xếp hoàn tất.");

    // 3. Lưu kết quả ra file mới
    console.log(`Đang lưu kết quả đã sắp xếp vào file: ${outputFilePath}`);
    // Sử dụng null, 2 để format JSON cho dễ đọc
    const outputJsonString = JSON.stringify(testsData, null, 2);
    fs.writeFileSync(outputFilePath, outputJsonString, 'utf8');
    console.log(">>> Xử lý hoàn tất! <<<");

} catch (error) {
    console.error("Đã xảy ra lỗi trong quá trình xử lý:", error);
    if (error.code === 'ENOENT') {
        console.error(`Lỗi: Không tìm thấy file ${inputFilePath}. Hãy đảm bảo file data.json nằm cùng thư mục với script.`);
    } else if (error instanceof SyntaxError) {
        console.error(`Lỗi: File ${inputFilePath} có định dạng JSON không hợp lệ.`);
    }
}