'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- START: Định nghĩa Types ---
interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system' | 'initial-info-block';
  text: string;
}

interface InitialExample {
  korean: string;
  vietnamese: string;
}

interface InitialData {
  translation: string;
  examples: InitialExample[];
}
// --- END: Định nghĩa Types ---

// --- START: Hàm gọi API (Giữ nguyên từ phiên bản trước) ---
async function fetchChatResponse(
  contextText: string | null,
  chatHistory: ChatMessage[],
  newMessage: string
): Promise<string> {
    const apiRequestBody: any = {
      task: 'getAdvancedChatResponse',
      newMessage: newMessage,
      chatHistory: chatHistory
        .filter(msg => msg.type === 'user' || msg.type === 'ai')
        .map(msg => ({ type: msg.type, text: msg.text })),
    };
    if (contextText) {
      apiRequestBody.contextText = contextText;
    }
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiRequestBody),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `Lỗi không xác định từ server (mã: ${response.status})` }));
      throw new Error(errorData.error || `Lỗi API Chat: ${response.status}`);
    }
    const data = await response.json();
    return data.chatResponse || "Xin lỗi, tôi chưa có câu trả lời.";
}

async function fetchInitialDataForSelection(text: string): Promise<InitialData> {
    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            task: 'getWordTranslation',
            word: text,
        }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Lỗi không xác định từ server (mã: ${response.status})` }));
        throw new Error(errorData.error || `Lỗi API lấy dữ liệu ban đầu: ${response.status}`);
    }
    const data = await response.json();
    return {
        translation: data.translation || "Không tìm thấy thông tin chi tiết.",
        examples: data.examples || [],
    };
}
// --- END: Hàm gọi API ---

const InteractiveChatPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [initialSelectedText, setInitialSelectedText] = useState<string | null>(null);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentUserMessage, setCurrentUserMessage] = useState<string>('');
  const [isLoadingAiResponse, setIsLoadingAiResponse] = useState<boolean>(false);
  const [isSmallScreen, setIsSmallScreen] = useState<boolean>(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const chatLogRef = useRef<HTMLDivElement>(null);
  const initialSelectedTextRef = useRef<string|null>(null);

  useEffect(() => {
    const checkScreenSize = () => setIsSmallScreen(window.innerWidth < 768);
    checkScreenSize(); window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const resetAllPanelStates = useCallback(() => {
    setInitialSelectedText(null);
    initialSelectedTextRef.current = null;
    setChatMessages([]);
    setCurrentUserMessage('');
    setIsLoadingInitialData(false);
    setIsLoadingAiResponse(false);
  }, []);

  const closePanel = useCallback(() => setIsOpen(false), []);
  
  useEffect(() => {
    if (!isOpen) resetAllPanelStates();
  }, [isOpen, resetAllPanelStates]);

  const prepareForNewSelection = useCallback(() => {
    setChatMessages([]); 
    setCurrentUserMessage('');
    setIsLoadingAiResponse(false);
  }, []);

  const handleMouseUp = useCallback(
    (event: MouseEvent) => {
      if (isSmallScreen) return;
      if (panelRef.current && panelRef.current.contains(event.target as Node)) return;

      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (text && selection && selection.rangeCount > 0) {
        // **FIX LỖI TYPE Ở ĐÂY**
        let commonAncestor: Node | null = selection.getRangeAt(0).commonAncestorContainer;
        let isSelectableArea = false;
        while (commonAncestor && commonAncestor !== document.body) {
          if (commonAncestor.nodeType === Node.ELEMENT_NODE && (commonAncestor as HTMLElement).dataset.selectableArea === 'true') {
            isSelectableArea = true; break;
          }
          commonAncestor = commonAncestor.parentNode; // Giờ đây phép gán này hợp lệ
        }

        if (isSelectableArea) {
          if (text !== initialSelectedTextRef.current || !isOpen) {
            prepareForNewSelection(); 
            setInitialSelectedText(text); 
            setIsOpen(true);
            setIsLoadingInitialData(true); 
            setTimeout(() => chatInputRef.current?.focus(), 100);
          }
        } else {
          if (isOpen) closePanel();
        }
      } else { 
        if (isOpen && !(panelRef.current && panelRef.current.contains(event.target as Node))) {
          closePanel();
        }
      }
    },
    [isOpen, closePanel, isSmallScreen, prepareForNewSelection]
  );
  
  useEffect(() => {
    initialSelectedTextRef.current = initialSelectedText;
  }, [initialSelectedText]);

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseUp]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closePanel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closePanel]);

  useEffect(() => {
    const currentTextToFetch = initialSelectedText;
    if (isOpen && currentTextToFetch && isLoadingInitialData) {
        fetchInitialDataForSelection(currentTextToFetch)
            .then(data => {
                if (isOpen && initialSelectedTextRef.current === currentTextToFetch) {
                    let formattedInitialText = `**Văn bản gốc được chọn:**\n_"${currentTextToFetch}"_\n\n`;
                    formattedInitialText += `**Nghĩa:** ${data.translation}\n`;
                    if (data.examples && data.examples.length > 0) {
                        formattedInitialText += `\n**Ví dụ minh họa:**\n`;
                        data.examples.forEach((ex) => { // Bỏ index nếu không dùng
                            formattedInitialText += `  • ${ex.korean}\n    ⤷ ${ex.vietnamese}\n`;
                        });
                    } else if (data.translation !== "Không tìm thấy thông tin chi tiết." && 
                               !data.translation.startsWith("Lỗi khi tải dữ liệu")) {
                        formattedInitialText += "\n_(Không có ví dụ)_";
                    }
                    const initialInfoMessage: ChatMessage = {
                        id: `initial-info-block-${Date.now()}`,
                        type: 'initial-info-block',
                        text: formattedInitialText.trim()
                    };
                    setChatMessages([initialInfoMessage]);
                }
            })
            .catch(error => {
                if (isOpen && initialSelectedTextRef.current === currentTextToFetch) {
                    console.error("Lỗi fetch dữ liệu ban đầu:", error);
                    const errorBlock: ChatMessage = {
                        id: `error-initial-${Date.now()}`,
                        type: 'system',
                        text: `**Lỗi tải thông tin cho: "${currentTextToFetch}"**\n${error.message}`
                    };
                    setChatMessages([errorBlock]);
                }
            })
            .finally(() => {
                if (isOpen && initialSelectedTextRef.current === currentTextToFetch) {
                    setIsLoadingInitialData(false);
                }
            });
    }
  }, [isOpen, initialSelectedText, isLoadingInitialData]);

  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendMessage = useCallback(async () => {
    const messageText = currentUserMessage.trim();
    // Cho phép gửi ngay cả khi đang tải initial data, nhưng AI response sẽ chờ
    if (!messageText || isLoadingAiResponse ) return; 

    const newUserMessage: ChatMessage = { id: `user-${Date.now()}`, type: 'user', text: messageText };
    setChatMessages(prev => [...prev, newUserMessage]);
    setCurrentUserMessage('');
    setIsLoadingAiResponse(true);

    try {
      const historyForAPI = chatMessages.filter(msg => msg.type === 'user' || msg.type === 'ai');
      const aiResponseText = await fetchChatResponse(initialSelectedTextRef.current, historyForAPI, messageText);
      const newAiMessage: ChatMessage = { id: `ai-${Date.now()}`, type: 'ai', text: aiResponseText };
      setChatMessages(prev => [...prev, newAiMessage]);
    } catch (error) {
      const errorMessageText = error instanceof Error ? error.message : 'Đã có lỗi xảy ra khi chat.';
      const errorMsg: ChatMessage = { id: `error-${Date.now()}`, type: 'ai', text: `Lỗi: ${errorMessageText}` };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoadingAiResponse(false);
      // Focus lại vào ô input sau khi AI trả lời (hoặc lỗi)
      setTimeout(() => chatInputRef.current?.focus(), 0); 
    }
  }, [currentUserMessage, isLoadingAiResponse, chatMessages]); // Bỏ isLoadingInitialData khỏi deps vì nó không trực tiếp ảnh hưởng logic gửi


  if (isSmallScreen || !isOpen) {
    return null;
  }

  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, lineIndex) => {
        const parts = line.split(/(\*\*.*?\*\*|_.*?_)/g);
        return (
            <p key={lineIndex} className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {parts.map((part, partIndex) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={partIndex} className="text-gray-800">{part.substring(2, part.length - 2)}</strong>;
                    }
                    if (part.startsWith('_') && part.endsWith('_')) {
                        return <em key={partIndex}>{part.substring(1, part.length - 1)}</em>;
                    }
                    if (part.trim().startsWith('⤷')) {
                         return <span key={partIndex} className="ml-4 text-gray-600">{part.trim()}</span>;
                    }
                    if (part.trim().startsWith('•')) {
                         return <span key={partIndex} className="ml-1 block">{part.trim()}</span>;
                    }
                    return <span key={partIndex}>{part}</span>;
                })}
            </p>
        );
    });
  };

  return (
    <div
      ref={panelRef}
      className="fixed bottom-5 right-5 w-[420px] max-w-[calc(100%-2.5rem)] h-[70vh] max-h-[750px] bg-white border border-gray-200 rounded-xl shadow-2xl flex flex-col z-[9999] overflow-hidden"
    >
      {/* Header */}
      <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl shrink-0">
        <h2 className="text-base font-semibold text-gray-700 truncate pr-2" title={initialSelectedText || "Thảo luận & Tra cứu"}>
            {initialSelectedText ? `Về: "${initialSelectedText}"` : "Thảo luận & Tra cứu"}
        </h2>
        <button onClick={closePanel} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200" aria-label="Đóng">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
        </button>
      </div>

      {/* Khu vực Chat Log */}
      <div ref={chatLogRef} className="flex-grow p-4 overflow-y-auto space-y-3 bg-slate-50">
        {isLoadingInitialData && chatMessages.length === 0 && (
            <div className="text-sm text-gray-500 text-center py-4 animate-pulse">Đang phân tích...</div>
        )}
        {chatMessages.map((msg) => {
            if (msg.type === 'initial-info-block') {
                return (
                    <div key={msg.id} className="p-3 mb-3 bg-stone-100 border border-stone-200 rounded-lg text-sm shadow-sm space-y-1">
                        {renderFormattedText(msg.text)}
                    </div>
                );
            }
            return (
              <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-2.5 rounded-xl text-sm leading-relaxed shadow-sm
                    ${msg.type === 'user' ? 'bg-blue-600 text-white rounded-br-none' : ''}
                    ${msg.type === 'ai' ? 'bg-white text-gray-800 border border-gray-200 rounded-bl-none' : ''}
                    ${msg.type === 'system' ? 'w-full bg-amber-100 text-amber-800 text-xs text-center italic py-2 px-3 rounded-md' : ''}
                  `}
                >
                  {msg.text.split('\n').map((line, idx) => (
                    <React.Fragment key={idx}>
                      {line}
                      {idx < msg.text.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            );
        })}
        {isLoadingAiResponse && (
          <div className="flex justify-start">
            <div className="max-w-[80%] p-2.5 rounded-lg bg-gray-200 text-gray-800 rounded-bl-none animate-pulse">
              <span className="text-sm">AI đang soạn tin...</span>
            </div>
          </div>
        )}
         {chatMessages.length === 0 && !isLoadingInitialData && !initialSelectedText && (
             <p className="text-sm text-gray-400 text-center py-10 px-3">Bôi đen một đoạn văn bản trên trang để bắt đầu tra cứu và trò chuyện với AI.</p>
         )}
      </div>

      {/* Khu vực Input Chat */}
      <div className="p-3 border-t border-gray-200 bg-white rounded-b-xl shrink-0">
        <div className="flex items-end space-x-2">
          <textarea
            ref={chatInputRef}
            value={currentUserMessage}
            onChange={(e) => setCurrentUserMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !isLoadingAiResponse && !isLoadingInitialData && currentUserMessage.trim()) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={isLoadingInitialData ? "Đang tải thông tin..." : "Hỏi thêm hoặc bắt đầu trò chuyện..."}
            className="flex-grow p-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm min-h-[44px] max-h-[120px]"
            rows={1}
            disabled={isLoadingInitialData || isLoadingAiResponse}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoadingAiResponse || !currentUserMessage.trim() || isLoadingInitialData}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-medium shrink-0 h-[44px]"
          >
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
};

export default InteractiveChatPanel;

// data-selectable-area="true" // **** CHO PHÉP BÔI ĐEN TOÀN BỘ KHỐI CÂU HỎI (đặt vào div nào cần) ****÷