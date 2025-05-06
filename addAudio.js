const fs = require('fs');
const path = require('path');

// --- Dữ liệu ID và Prefix (Dựa trên kết quả trước đó) ---
// !! Quan trọng: Đảm bảo các prefix URL trong này là chính xác !!
const idPrefixArray = [
//   {
//     "id": "91-II-listening",
//     "prefix": "https://res.cloudinary.com/dueyjeqd5/video/upload/v1746458844/soometa/91-II-listening/40_"
//   },
  {
    "id": "91-I-listening",
    "prefix": "https://s4-media1.study4.com/media/topik_tests/audio/38_"
  },
//   {
//     "id": "83-II-listening",
//     "prefix": "https://res.cloudinary.com/dueyjeqd5/video/upload/v1746446194/soometa/83_"
//   },
//   {
//     "id": "83-I-listening",
//     "prefix": "https://res.cloudinary.com/dueyjeqd5/video/upload/v1746446194/soometa/83_"
//   },
//   {
//     "id": "64-II-listening",
//     "prefix": "https://res.cloudinary.com/dueyjeqd5/video/upload/v1746446194/soometa/64_"
//   },
//   {
//     "id": "64-I-listening",
//     "prefix": "https://res.cloudinary.com/dueyjeqd5/video/upload/v1746446194/soometa/64_"
//   },
//   {
//     "id": "47-II-listening",
//     "prefix": "https://res.cloudinary.com/dueyjeqd5/video/upload/v1746446194/soometa/47_"
//   },
//   {
//     "id": "47-I-listening",
//     "prefix": "https://res.cloudinary.com/dueyjeqd5/video/upload/v1746446194/soometa/47_"
//   },
//   {
//     "id": "41-II-listening",
//     "prefix": "https://res.cloudinary.com/dueyjeqd5/video/upload/v1746446194/soometa/41_"
//   },
//   {
//     "id": "41-I-listening",
//     "prefix": "https://res.cloudinary.com/dueyjeqd5/video/upload/v1746446194/soometa/41_"
//   },
//   {
//     "id": "37-II-listening",
//     "prefix": "https://res.cloudinary.com/dueyjeqd5/video/upload/v1746446194/soometa/37_"
//   },
//   {
//     "id": "37-I-listening",
//     "prefix": "https://res.cloudinary.com/dueyjeqd5/video/upload/v1746446194/soometa/37_"
//   },
//   {
//     "id": "36-II-listening",
//     "prefix": "https://res.cloudinary.com/dueyjeqd5/video/upload/v1746446194/soometa/36_"
//   },
//   {
//     "id": "36-I-listening",
//     "prefix": "https://res.cloudinary.com/dueyjeqd5/video/upload/v1746446194/soometa/36_"
//   },
//   {
//     "id": "35-II-listening",
//     "prefix": "https://res.cloudinary.com/dueyjeqd5/video/upload/v1746446194/soometa/35_"
//   },
//   {
//     "id": "35-I-listening",
//     "prefix": "https://res.cloudinary.com/dueyjeqd5/video/upload/v1746446194/soometa/35_"
//   }
];
// --- Kết thúc dữ liệu ID và Prefix ---


// --- Cấu hình ---
const dataFilePath = path.join(__dirname, 'data.json'); // File JSON gốc
const outputFilePath = path.join(__dirname, 'data_final_with_audio.json'); // File JSON kết quả cuối cùng
const singleQuestionAudioField = 'question_audio_url'; // Tên trường cho link audio câu hỏi đơn
const pairedGroupAudioField = 'group_audio_url';       // Tên trường cho link audio nhóm câu hỏi kép
// --- Kết thúc cấu hình ---

// Hàm thêm số 0 vào trước số có 1 chữ số
function padNumber(num) {
    return String(num).padStart(2, '0');
}

// Hàm tạo URL audio đầy đủ
function generateFullAudioUrl(prefix, questionNumber, topikLevel, isPair = false) {
    if (!prefix) return null;
    let questionPart = '';

    if (isPair) {
        // Tạo link dạng kép: prefix_num-num+1.mp3
        questionPart = `${padNumber(questionNumber)}-${padNumber(questionNumber + 1)}`;
    } else {
        // Tạo link dạng đơn: prefix_paddedNum.mp3
        questionPart = padNumber(questionNumber);
    }

    if (questionPart) {
        return `${prefix}${questionPart}.mp3`;
    }
    return null;
}

try {
    // 1. Đọc file data.json
    console.log(`Đang đọc file dữ liệu gốc: ${dataFilePath}`);
    const rawData = fs.readFileSync(dataFilePath, 'utf8');
    const originalTestsData = JSON.parse(rawData);
    console.log(`Đọc thành công ${originalTestsData.length} mục đề thi.`);

    // 2. Tạo một Map để tra cứu prefix nhanh chóng từ ID
    const prefixMap = new Map();
    idPrefixArray.forEach(item => {
        prefixMap.set(item.id, item.prefix);
    });
    console.log(`Đã tạo Map tra cứu cho ${prefixMap.size} tiền tố URL.`);

    // 3. Tạo bản sao sâu để xử lý, tránh thay đổi dữ liệu gốc
    const processedTestsData = JSON.parse(JSON.stringify(originalTestsData));
    let singleLinksAdded = 0;
    let groupLinksAdded = 0;
    let listeningTestsProcessed = 0;

    // 4. Xử lý từng đề thi
    console.log("Bắt đầu xử lý và gắn link audio...");
    processedTestsData.forEach(test => {
        // Chỉ xử lý phần thi nghe '듣기'
        if (test.skill === '듣기') {
            listeningTestsProcessed++;
            const testId = test.id;
            const topikLevel = test.level; // "TOPIK Ⅰ" hoặc "TOPIK Ⅱ"
            const prefix = prefixMap.get(testId); // Lấy prefix từ Map

            if (!prefix) {
                console.warn(`!!! Cảnh báo: Không tìm thấy tiền tố URL cho đề thi ID '${testId}'. Bỏ qua đề thi này.`);
                return; // Bỏ qua đề thi này nếu không có prefix
            }

            // Duyệt qua các nhóm hướng dẫn và câu hỏi
            if (test.instruction_groups && Array.isArray(test.instruction_groups)) {
                test.instruction_groups.forEach(group => {
                    let groupHasPair = false;
                    let pairFirstQuestionNum = -1;
                    let groupAudioUrlAddedForThisGroup = false; // Cờ kiểm tra cho từng group

                    // Kiểm tra xem nhóm này có câu hỏi kép không
                    if (group.questions && Array.isArray(group.questions)) {
                        for (const question of group.questions) {
                            const qNum = question.number;
                            if (topikLevel === 'TOPIK Ⅰ' && qNum >= 25 && qNum % 2 !== 0) {
                                groupHasPair = true;
                                pairFirstQuestionNum = qNum;
                                break;
                            } else if (topikLevel === 'TOPIK Ⅱ' && qNum >= 21 && qNum % 2 !== 0) {
                                groupHasPair = true;
                                pairFirstQuestionNum = qNum;
                                break;
                            }
                        }
                    }

                    // Nếu nhóm chứa câu hỏi kép, thêm link vào group object (chỉ 1 lần)
                    if (groupHasPair && !groupAudioUrlAddedForThisGroup) {
                        const groupAudioUrl = generateFullAudioUrl(prefix, pairFirstQuestionNum, topikLevel, true);
                        if (groupAudioUrl) {
                            group[pairedGroupAudioField] = groupAudioUrl;
                            groupLinksAdded++;
                            groupAudioUrlAddedForThisGroup = true; // Đánh dấu đã thêm cho nhóm này
                        }
                    }

                    // Duyệt qua các câu hỏi để thêm link cho câu đơn (nếu nhóm không phải là nhóm kép)
                    if (!groupHasPair && group.questions && Array.isArray(group.questions)) {
                        group.questions.forEach(question => {
                            const questionNumber = question.number;
                            let isSingle = false;
                             if (topikLevel === 'TOPIK Ⅰ' && questionNumber >= 1 && questionNumber <= 24) {
                                 isSingle = true;
                             } else if (topikLevel === 'TOPIK Ⅱ' && questionNumber >= 1 && questionNumber <= 20) {
                                 isSingle = true;
                             }

                            // Chỉ thêm link vào question object nếu là câu đơn VÀ nhóm không chứa câu kép
                            if (isSingle) {
                                const singleAudioUrl = generateFullAudioUrl(prefix, questionNumber, topikLevel, false);
                                if (singleAudioUrl) {
                                    question[singleQuestionAudioField] = singleAudioUrl;
                                    singleLinksAdded++;
                                }
                            }
                        });
                    }
                });
            }
        }
    });
    console.log(`Đã xử lý ${listeningTestsProcessed} đề thi nghe.`);
    console.log(`Đã thêm link cho ${singleLinksAdded} câu hỏi đơn và ${groupLinksAdded} nhóm câu hỏi kép.`);

    // 5. Lưu kết quả ra file mới
    console.log(`Đang lưu kết quả vào file: ${outputFilePath}`);
    const outputJsonString = JSON.stringify(processedTestsData, null, 2); // Format đẹp
    fs.writeFileSync(outputFilePath, outputJsonString, 'utf8');
    console.log(">>> Xử lý hoàn tất! <<<");

} catch (error) {
    console.error("Đã xảy ra lỗi trong quá trình xử lý:", error);
     if (error.code === 'ENOENT') {
        if (error.path === dataFilePath) console.error(`Lỗi: Không tìm thấy file ${dataFilePath}.`);
        else console.error(`Lỗi: Không tìm thấy file đầu vào JSON hoặc file prefix.`);
    } else if (error instanceof SyntaxError) {
         if (error.message.includes('JSON')) console.error(`Lỗi: File ${dataFilePath} hoặc file prefix có định dạng JSON không hợp lệ.`);
         else console.error("Lỗi phân tích JSON không xác định.");
    }
}