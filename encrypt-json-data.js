// encrypt-json-data.js
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// --- Cấu hình ---
// Đổi thành đường dẫn file JSON dữ liệu gốc của bạn
const INPUT_JSON_FILE_PATH = path.join(__dirname, 'data/data.json');
// Nơi lưu file đã mã hóa. Ví dụ: trong thư mục 'encrypted_data' (tạo thư mục này nếu chưa có)
// không nên để trong 'public' nếu không có lý do đặc biệt.
const ENCRYPTED_FILE_PATH = path.join(__dirname, 'encrypted_data', 'de_thi_data.enc');

// --- Hàm tạo khóa ---
function generateKey() {
  return crypto.randomBytes(32); // 32 bytes cho AES-256
}

// --- Hàm mã hóa ---
// Dữ liệu đầu vào (jsonDataString) phải là một chuỗi.
// Khi đọc file JSON bằng fs.readFileSync(..., 'utf8'), nó đã là chuỗi.
function encryptData(jsonDataString, key) {
  const iv = crypto.randomBytes(12); // IV 12 bytes cho GCM là khuyến nghị
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = Buffer.concat([cipher.update(jsonDataString, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag(); // Lấy authentication tag

  // Lưu IV và authTag cùng với dữ liệu mã hóa.
  // Định dạng: iv_hex:authTag_hex:encrypted_data_hex
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

// --- Hàm chính ---
async function main() {
  try {
    // 1. Tạo hoặc lấy khóa mã hóa
    // QUAN TRỌNG: Chạy script này một lần để tạo key.
    // SAU ĐÓ, LƯU KEY NÀY VÀO BIẾN MÔI TRƯỜNG MỘT CÁCH AN TOÀN.
    const encryptionKey = generateKey();
    console.log('--------------------------------------------------------------------');
    console.log('!!! QUAN TRỌNG !!!');
    console.log('Đây là Khóa Mã Hóa (Encryption Key) của bạn (dưới dạng hex):');
    console.log(encryptionKey.toString('hex'));
    console.log('Hãy LƯU KHÓA NÀY vào file .env.local với tên biến ví dụ: ENCRYPTION_KEY');
    console.log('Ví dụ nội dung file .env.local:');
    console.log(`ENCRYPTION_KEY=${encryptionKey.toString('hex')}`);
    console.log('KHÔNG BAO GIỜ commit khóa này vào Git hoặc chia sẻ công khai.');
    console.log('--------------------------------------------------------------------');

    // 2. Đọc dữ liệu JSON gốc (dưới dạng chuỗi)
    if (!fs.existsSync(INPUT_JSON_FILE_PATH)) {
        console.error(`Không tìm thấy file JSON đầu vào: ${INPUT_JSON_FILE_PATH}`);
        return;
    }
    const jsonDataString = fs.readFileSync(INPUT_JSON_FILE_PATH, 'utf8');

    // Xác thực sơ bộ xem có phải JSON không (không bắt buộc nhưng hữu ích)
    try {
        JSON.parse(jsonDataString);
    } catch (e) {
        console.warn(`Cảnh báo: Nội dung file ${INPUT_JSON_FILE_PATH} có vẻ không phải là JSON hợp lệ. Vẫn tiếp tục mã hóa dưới dạng chuỗi.`);
    }

    // 3. Mã hóa dữ liệu (chuỗi JSON)
    const encryptedDataString = encryptData(jsonDataString, encryptionKey);

    // 4. Lưu dữ liệu đã mã hóa vào file
    const outputDir = path.dirname(ENCRYPTED_FILE_PATH);
    if (!fs.existsSync(outputDir)){
        fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(ENCRYPTED_FILE_PATH, encryptedDataString);
    console.log(`Dữ liệu JSON đã được mã hóa và lưu tại: ${ENCRYPTED_FILE_PATH}`);
    console.log('Hãy đảm bảo bạn đã lưu Khóa Mã Hóa một cách an toàn!');

  } catch (error) {
    console.error('Lỗi trong quá trình mã hóa:', error);
  }
}

main();