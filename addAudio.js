const fs = require('fs');
const path = require('path');

// --- Dữ liệu ID và Prefix (Dựa trên kết quả trước đó) ---
// !! Quan trọng: Đảm bảo các prefix URL trong này là chính xác !!
const idPrefixArray = [
//   {
//     "id": "91-II-listening",
//     "prefix": "https://res.cloudinary.com/dueyjeqd5/video/upload/v1746458844/soometa/91-II-listening/40_"
//   },
//   {
//     "id": "91-I-listening",
//     "prefix": "https://s4-media1.study4.com/media/topik_tests/audio/38_"
//   },

  {
    "id": "96-II-listening",
    "prefix": "https://res.cloudinary.com/dueyjeqd5/video/upload/v1747732992/soometa/96-II-listening/962_"
  },
  {
    "id": "96-I-listening",
    "prefix": "https://res.cloudinary.com/dueyjeqd5/video/upload/v1747732927/soometa/96-I-listening/961_"
  },



  // {
  //   "id": "91-II-listening",
  //   "prefix": "https://res.cloudinary.com/dueyjeqd5/video/upload/v1746458843/soometa/91-II-listening/40_"
  // },
  // {
  //   "id": "91-I-listening",
  //   "prefix": "https://res.cloudinary.com/dueyjeqd5/video/upload/v1746503771/soometa/91-I-listening/38_"
  // },
  // {
  //   "id": "83-II-listening",
  //   "prefix": "https://res.cloudinary.com/dueyjeqd5/video/upload/v1746512342/soometa/83-II-listening/4_"
  // },
  // {
  //   "id": "83-I-listening",
  //   "prefix": "https://res.cloudinary.com/dueyjeqd5/video/upload/v1746503641/soometa/83-I-listening/2_"
  // },
  // {
  //   "id": "64-II-listening",
  //   "prefix": "https://res.cloudinary.com/dueyjeqd5/video/upload/v1746512512/soometa/64-II-listening/8_"
  // },
  // {
  //   "id": "64-I-listening",
  //   "prefix": "https://res.cloudinary.com/dueyjeqd5/video/upload/v1746503865/soometa/64-I-listening/6_"
  // },
  // { 
  //   "id": "60-II-listening",
  //   "prefix": "https://res.cloudinary.com/dueyjeqd5/video/upload/v1746512840/soometa/60-II-listening/12_"
  // },
  // { 
  //   "id": "60-I-listening",
  //   "prefix": "https://res.cloudinary.com/dueyjeqd5/video/upload/v1746511302/soometa/60-I-listening/10_"
  // },
  // { 
  //   "id": "52-II-listening",
  //   "prefix": "https://res.cloudinary.com/dueyjeqd5/video/upload/v1746513012/soometa/52-II-listening/16_"
  // },
  // { 
  //   "id": "52-I-listening",
  //   "prefix": "https://res.cloudinary.com/dueyjeqd5/video/upload/v1746511494/soometa/52-I-listening/14_"
  // },
  // {
  //   "id": "47-II-listening",
  //   "prefix": "https://res.cloudinary.com/dueyjeqd5/video/upload/v1746513277/soometa/47-II-listening/24_"
  // },
  // {
  //   "id": "47-I-listening",
  //   "prefix": "https://res.cloudinary.com/dueyjeqd5/video/upload/v1746511665/soometa/47-I-listening/22_"
  // },
  // {
  //   "id": "41-II-listening",
  //   "prefix": "https://res.cloudinary.com/dueyjeqd5/video/upload/v1746513407/soometa/41-II-listening/20_"
  // },
  // {
  //   "id": "41-I-listening",
  //   "prefix": "https://res.cloudinary.com/dueyjeqd5/video/upload/v1746511778/soometa/41-I-listening/18_"
  // },
  // {
  //   "id": "37-II-listening",
  //   "prefix": "https://res.cloudinary.com/dueyjeqd5/video/upload/v1746513634/soometa/37-II-listening/28_"
  // },
  // {
  //   "id": "37-I-listening",
  //   "prefix": "https://res.cloudinary.com/dueyjeqd5/video/upload/v1746511909/soometa/37-I-listening/26_"
  // },
  // {
  //   "id": "36-II-listening",
  //   "prefix": "https://res.cloudinary.com/dueyjeqd5/video/upload/v1746513802/soometa/36-II-listening/32_"
  // },
  // {
  //   "id": "36-I-listening",
  //   "prefix": "https://res.cloudinary.com/dueyjeqd5/video/upload/v1746511999/soometa/36-I-listening/30_"
  // },
  // {
  //   "id": "35-II-listening",
  //   "prefix": "https://res.cloudinary.com/dueyjeqd5/video/upload/v1746513985/soometa/35-II-listening/36_"
  // },
  // {
  //   "id": "35-I-listening",
  //   "prefix": "https://res.cloudinary.com/dueyjeqd5/video/upload/v1746512167/soometa/35-I-listening/34_"
  // }
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