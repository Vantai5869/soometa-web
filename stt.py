import time
import json
import asyncio
import aiohttp

ASSEMBLYAI_API_KEY = "674d42163f3a448ea246cc6b877a4eac"  # API key của bạn
INPUT_URLS_FILE = 'mp3links.json'  # File chứa mảng các URL âm thanh
OUTPUT_TRANSCRIPTS_FILE = 'topik-30-days.json' # File JSON đầu ra

HEADERS = {
    "authorization": ASSEMBLYAI_API_KEY,
    "content-type": "application/json"
}

MAX_POLLING_ATTEMPTS = 250
POLLING_INTERVAL = 10

async def submit_audio_for_transcription(session, audio_url):
    """Gửi URL âm thanh đến AssemblyAI để bắt đầu quá trình chuyển đổi."""
    payload = {
        "audio_url": audio_url,
        "language_code": "ko",
        "speaker_labels": True
    }
    try:
        async with session.post("https://api.assemblyai.com/v2/transcript",
                                json=payload,
                                headers=HEADERS) as response:
            if response.status == 200:
                data = await response.json()
                return data.get("id")
            else:
                error_text = await response.text()
                print(f"❌ Lỗi khi gửi URL {audio_url}: {response.status} - {error_text}")
                return None
    except Exception as e:
        print(f"❌ Ngoại lệ khi gửi URL {audio_url}: {e}")
        return None

async def get_transcription_result(session, transcript_id, audio_url_original):
    """Kiểm tra trạng thái và lấy kết quả chuyển đổi với các trường được chọn lọc."""
    polling_url = f"https://api.assemblyai.com/v2/transcript/{transcript_id}"
    for attempt in range(MAX_POLLING_ATTEMPTS):
        try:
            async with session.get(polling_url, headers=HEADERS) as response:
                if response.status == 200:
                    assemblyai_response_json = await response.json()
                    api_status = assemblyai_response_json.get("status")

                    if api_status == "completed":
                        # In thông tin người nói ra console (tùy chọn)
                        utterances_from_api = assemblyai_response_json.get("utterances", [])
                        if utterances_from_api:
                            print(f"🎯 Transcription with Speakers for {audio_url_original} (ID: {transcript_id}):")
                            for utterance in utterances_from_api:
                                speaker = utterance.get("speaker", "N/A")
                                text = utterance.get("text", "")
                                start_ms = utterance.get("start")
                                end_ms = utterance.get("end")
                                start_s = start_ms / 1000.0 if start_ms is not None else "N/A"
                                end_s = end_ms / 1000.0 if end_ms is not None else "N/A"
                                print(f"  Speaker {speaker} ({start_s}s - {end_s}s): {text}")
                        elif assemblyai_response_json.get("text"):
                             print(f"🎯 Transcription for {audio_url_original} (ID: {transcript_id}): {assemblyai_response_json.get('text')}")
                        
                        # Tạo đối tượng kết quả CHỈ với các trường mong muốn
                        selected_fields_result = {
                            "status_script": "completed", # Trạng thái xử lý từ script này
                            "id": assemblyai_response_json.get("id"),
                            "audio_url": audio_url_original,
                            "text": assemblyai_response_json.get("text"),
                            "utterances": utterances_from_api, # Giữ nguyên cấu trúc utterances gốc từ API
                            "confidence": assemblyai_response_json.get("confidence"),
                            "audio_duration": assemblyai_response_json.get("audio_duration")
                        }
                        return selected_fields_result

                    elif api_status == "error":
                        error_message = assemblyai_response_json.get('error', 'Lỗi không xác định từ API')
                        print(f"❌ Lỗi chuyển đổi cho URL {audio_url_original} (ID: {transcript_id}): {error_message}")
                        return {
                            "status_script": "transcription_error",
                            "audio_url": audio_url_original,
                            "id": transcript_id,
                            "error_message": error_message
                        }
                    elif api_status in ["queued", "processing"]:
                        pass
                    else:
                        print(f"⚠️ Trạng thái API không xác định '{api_status}' cho URL {audio_url_original} (ID: {transcript_id})")
                        return {
                            "status_script": api_status, # Trạng thái lạ từ API
                            "audio_url": audio_url_original,
                            "id": transcript_id,
                            "error_message": f"Trạng thái API không xác định: {api_status}"
                        }
                else: # Lỗi HTTP khi polling
                    error_text = await response.text()
                    print(f"❌ Lỗi polling cho URL {audio_url_original} (ID: {transcript_id}): {response.status} - {error_text}")
            
            await asyncio.sleep(POLLING_INTERVAL)

        except Exception as e:
            print(f"❌ Ngoại lệ khi polling cho URL {audio_url_original} (ID: {transcript_id}): {e}")
            await asyncio.sleep(POLLING_INTERVAL)

    print(f"⚠️ Hết thời gian chờ cho URL {audio_url_original} (ID: {transcript_id}).")
    return {
        "status_script": "timeout",
        "audio_url": audio_url_original,
        "id": transcript_id,
        "error_message": "Quá thời gian chờ để hoàn thành chuyển đổi."
    }

async def process_single_url(session, audio_url):
    """Xử lý hoàn chỉnh một URL: gửi và lấy kết quả."""
    print(f"🚀 Bắt đầu xử lý URL: {audio_url}")
    transcript_id = await submit_audio_for_transcription(session, audio_url)
    if transcript_id:
        result = await get_transcription_result(session, transcript_id, audio_url)
        return result
    else:
        return {
            "status_script": "submit_failed",
            "audio_url": audio_url,
            "error_message": "Không thể gửi URL để chuyển đổi."
        }

async def main():
    try:
        with open(INPUT_URLS_FILE, 'r', encoding='utf-8') as f:
            audio_urls = json.load(f)
        if not isinstance(audio_urls, list):
            print(f"❌ Lỗi: File '{INPUT_URLS_FILE}' không chứa một mảng JSON các URL.")
            return
        if not audio_urls:
            print("ℹ️ Không có URL nào để xử lý trong file.")
            return
        print(f"🔎 Đã đọc {len(audio_urls)} URL từ '{INPUT_URLS_FILE}'.")
    except FileNotFoundError:
        print(f"❌ Lỗi: Không tìm thấy file '{INPUT_URLS_FILE}'.")
        return
    except json.JSONDecodeError:
        print(f"❌ Lỗi: File '{INPUT_URLS_FILE}' không phải là định dạng JSON hợp lệ.")
        return

    all_selected_transcriptions = []
    
    async with aiohttp.ClientSession() as session:
        tasks = [process_single_url(session, url) for url in audio_urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)

    for result_item in results:
        if isinstance(result_item, Exception):
            print(f"❌ Lỗi không mong muốn trong quá trình xử lý một task: {result_item}")
            all_selected_transcriptions.append({"audio_url": "unknown_due_to_task_exception", 
                                                "status_script": "task_exception", 
                                                "error_message": str(result_item)})
        elif result_item:
            all_selected_transcriptions.append(result_item)

    try:
        with open(OUTPUT_TRANSCRIPTS_FILE, 'w', encoding='utf-8') as f:
            json.dump(all_selected_transcriptions, f, ensure_ascii=False, indent=2)
        print(f"\n🎉 >>> Tất cả quá trình chuyển đổi đã hoàn tất. Kết quả được lưu tại: '{OUTPUT_TRANSCRIPTS_FILE}' <<<")
    except IOError:
        print(f"❌ Lỗi: Không thể ghi vào file '{OUTPUT_TRANSCRIPTS_FILE}'.")

if __name__ == "__main__":
    start_time = time.time()
    asyncio.run(main())
    end_time = time.time()
    print(f"⏱️  Tổng thời gian thực thi: {end_time - start_time:.2f} giây")