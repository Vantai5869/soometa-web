// app/components/InteractiveChatPanel.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/authStore'; // Điều chỉnh đường dẫn nếu cần

// --- Định nghĩa Types ---
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
// --- Kết thúc định nghĩa Types ---

const NEXT_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// --- Hàm gọi API Gemini (Cần implement đầy đủ logic của bạn) ---
async function fetchChatResponse(
  contextText: string | null,
  chatHistory: ChatMessage[],
  newMessage: string
): Promise<string> {
    console.log("Gọi fetchChatResponse với context:", contextText, "new:", newMessage);
    const apiRequestBody: any = {
      task: 'getAdvancedChatResponse', // Đảm bảo task này được backend xử lý
      newMessage: newMessage,
      chatHistory: chatHistory
        .filter(msg => msg.type === 'user' || msg.type === 'ai') // Chỉ gửi tin nhắn của user và ai
        .map(msg => ({ role: msg.type === 'user' ? 'user' : 'model', parts: [{text: msg.text}] })), // Điều chỉnh format nếu cần
    };
    if (contextText) {
      apiRequestBody.contextText = contextText;
    }

    // Giả sử endpoint API của bạn là /api/gemini
    const response = await fetch(`/api/gemini`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiRequestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `Lỗi server (mã: ${response.status})` }));
      console.error("Lỗi API Chat:", errorData);
      throw new Error(errorData.error || `Lỗi API Chat: ${response.status}`);
    }
    const data = await response.json();
    return data.chatResponse || "Xin lỗi, tôi gặp chút sự cố khi xử lý yêu cầu của bạn.";
}

async function fetchInitialDataForSelection(text: string): Promise<InitialData> {
    console.log("Gọi fetchInitialDataForSelection với text:", text);
    // Giả sử endpoint API của bạn là /api/gemini
    const response = await fetch(`/api/gemini`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            task: 'getWordTranslation', // Đảm bảo task này được backend xử lý
            word: text,
        }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Lỗi server (mã: ${response.status})` }));
        console.error("Lỗi API lấy dữ liệu ban đầu:", errorData);
        throw new Error(errorData.error || `Lỗi API lấy dữ liệu ban đầu: ${response.status}`);
    }
    const data = await response.json();
    return {
        translation: data.translation || "Không tìm thấy bản dịch.",
        examples: Array.isArray(data.examples) ? data.examples : [],
    };
}
// --- Kết thúc hàm gọi API Gemini ---

const InteractiveChatPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [initialSelectedText, setInitialSelectedText] = useState<string | null>(null);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentUserMessage, setCurrentUserMessage] = useState<string>('');
  const [isLoadingAiResponse, setIsLoadingAiResponse] = useState<boolean>(false);
  const [isSmallScreen, setIsSmallScreen] = useState<boolean>(false); // Mặc định false cho SSR

  // State cho tính năng lưu từ vựng
  const [isFavorited, setIsFavorited] = useState<boolean>(false);
  const [isLoadingFavoriteStatus, setIsLoadingFavoriteStatus] = useState<boolean>(false);
  const [isSavingFavorite, setIsSavingFavorite] = useState<boolean>(false);
  const [favoriteMessage, setFavoriteMessage] = useState<string | null>(null);
  const [initialDataForFavorite, setInitialDataForFavorite] = useState<InitialData | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const chatLogRef = useRef<HTMLDivElement>(null);
  const initialSelectedTextRef = useRef<string|null>(null);

  const token = useAuthStore(state => state.token);
  const currentUser = useAuthStore(state => state.currentUser);
  const openLoginModal = useAuthStore(state => state.openLoginModal);
  // const isLoadingAuth = useAuthStore(state => state._isLoadingAuth); // Không dùng trực tiếp ở đây nữa nếu isClient đã đủ

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return; // Chỉ chạy ở client
    const checkScreenSize = () => setIsSmallScreen(window.innerWidth < 768);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [isClient]);

  const resetAllPanelStates = useCallback(() => {
    setInitialSelectedText(null);
    initialSelectedTextRef.current = null;
    setChatMessages([]);
    setCurrentUserMessage('');
    setIsLoadingInitialData(false);
    setIsLoadingAiResponse(false);
    setIsFavorited(false);
    setIsLoadingFavoriteStatus(false);
    setIsSavingFavorite(false);
    setFavoriteMessage(null);
    setInitialDataForFavorite(null);
  }, []);

  const closePanel = useCallback(() => setIsOpen(false), []);
  
  useEffect(() => {
    if (!isOpen) {
        resetAllPanelStates();
    }
  }, [isOpen, resetAllPanelStates]);

  const prepareForNewSelection = useCallback(() => {
    setChatMessages([]); 
    setCurrentUserMessage('');
    setIsLoadingAiResponse(false);
    setIsFavorited(false);
    setIsLoadingFavoriteStatus(false);
    setFavoriteMessage(null);
    setInitialDataForFavorite(null);
  }, []);

  const handleMouseUp = useCallback(
    (event: MouseEvent) => {
      if (!isClient || isSmallScreen) return;
      if (panelRef.current && panelRef.current.contains(event.target as Node)) return;

      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (text && selection && selection.rangeCount > 0) {
        let commonAncestor: Node | ParentNode | null = selection.getRangeAt(0).commonAncestorContainer;
        let isSelectableArea = false;
        while (commonAncestor && commonAncestor !== document.body && commonAncestor !== document) {
          if (commonAncestor.nodeType === Node.ELEMENT_NODE && (commonAncestor as HTMLElement).dataset.selectableArea === 'true') {
            isSelectableArea = true; break;
          }
          commonAncestor = commonAncestor.parentNode;
        }

        if (isSelectableArea) {
          if (text !== initialSelectedTextRef.current || !isOpen) {
            prepareForNewSelection(); 
            setInitialSelectedText(text);
            initialSelectedTextRef.current = text;
            setIsOpen(true);
            setIsLoadingInitialData(true); 
            setTimeout(() => chatInputRef.current?.focus(), 100);
          } else if (text === initialSelectedTextRef.current && !isOpen) {
            setIsOpen(true);
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
    [isOpen, closePanel, isSmallScreen, prepareForNewSelection, isClient]
  );
  
  useEffect(() => {
    initialSelectedTextRef.current = initialSelectedText;
  }, [initialSelectedText]);

  useEffect(() => {
    if (!isClient) return;
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseUp, isClient]);

  useEffect(() => {
    if (!isClient || !isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closePanel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closePanel, isClient]);

  useEffect(() => {
    const currentTextToFetch = initialSelectedText;
    if (isClient && isOpen && currentTextToFetch && isLoadingInitialData) {
        fetchInitialDataForSelection(currentTextToFetch)
            .then(data => {
                if (isOpen && initialSelectedTextRef.current === currentTextToFetch) {
                    setInitialDataForFavorite(data);
                    let formattedInitialText = `**Văn bản gốc được chọn:**\n_"${currentTextToFetch}"_\n\n`;
                    formattedInitialText += `**Nghĩa:** ${data.translation}\n`;
                    if (data.examples && data.examples.length > 0) {
                        formattedInitialText += `\n**Ví dụ minh họa:**\n`;
                        data.examples.forEach((ex) => {
                            formattedInitialText += `  • ${ex.korean}\n    ⤷ ${ex.vietnamese}\n`;
                        });
                    } else if (data.translation && data.translation !== "Không tìm thấy thông tin chi tiết." && 
                               !data.translation.startsWith("Lỗi khi tải dữ liệu")) {
                        formattedInitialText += "\n_(Không có ví dụ)_";
                    }
                    const initialInfoMessage: ChatMessage = {
                        id: `initial-info-block-${Date.now()}`, type: 'initial-info-block',
                        text: formattedInitialText.trim()
                    };
                    setChatMessages([initialInfoMessage]);

                    if (token && currentUser?._id) {
                        setIsLoadingFavoriteStatus(true);
                        fetch(`${NEXT_API_BASE_URL}/vocabulary/check?koreanWord=${encodeURIComponent(currentTextToFetch)}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        })
                        .then(res => {
                            if (!res.ok) throw new Error(`API check favorite error: ${res.status}`);
                            return res.json();
                        })
                        .then(favData => {
                            if (initialSelectedTextRef.current === currentTextToFetch) {
                                setIsFavorited(favData.isFavorited || false);
                            }
                        }).catch(favErr => {
                            console.error("Lỗi kiểm tra trạng thái yêu thích:", favErr);
                            if (initialSelectedTextRef.current === currentTextToFetch) setIsFavorited(false);
                        }).finally(() => {
                            if (initialSelectedTextRef.current === currentTextToFetch) setIsLoadingFavoriteStatus(false);
                        });
                    } else {
                        setIsFavorited(false); setIsLoadingFavoriteStatus(false);
                    }
                }
            })
            .catch(error => {
                if (isOpen && initialSelectedTextRef.current === currentTextToFetch) {
                    const errorBlock: ChatMessage = {
                        id: `error-initial-${Date.now()}`, type: 'system',
                        text: `**Lỗi tải thông tin cho: "${currentTextToFetch}"**\n${error instanceof Error ? error.message : String(error)}`
                    };
                    setChatMessages([errorBlock]); setInitialDataForFavorite(null);
                }
            })
            .finally(() => {
                if (isOpen && initialSelectedTextRef.current === currentTextToFetch) {
                    setIsLoadingInitialData(false);
                }
            });
    } else if (!currentTextToFetch && isOpen) {
        setIsLoadingInitialData(false); setIsLoadingFavoriteStatus(false);
    }
  }, [isOpen, initialSelectedText, isLoadingInitialData, token, currentUser, isClient]);

  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendMessage = useCallback(async () => {
    const messageText = currentUserMessage.trim();
    if (!messageText || isLoadingAiResponse) return; 

    const newUserMessage: ChatMessage = { id: `user-${Date.now()}`, type: 'user', text: messageText };
    setChatMessages(prev => {
        const infoBlockIndex = prev.findIndex(msg => msg.type === 'initial-info-block');
        if (infoBlockIndex !== -1 && prev.length === 1) {
            return [...prev, newUserMessage];
        } else if (prev.length === 0 && initialSelectedTextRef.current) {
             const tempSelectedText = initialSelectedTextRef.current;
             const tempInitialInfo: ChatMessage = {
                id: `initial-info-block-temp-${Date.now()}`, type: 'initial-info-block',
                text: `**Văn bản gốc được chọn:**\n_"${tempSelectedText}"_\n\n_(Đang chờ thông tin chi tiết...)_`
            };
             return [tempInitialInfo, newUserMessage];
        }
        return [...prev, newUserMessage];
    });
    setCurrentUserMessage('');
    setIsLoadingAiResponse(true);

    try {
      const historyForAPI = chatMessages.filter(msg => msg.type === 'user' || msg.type === 'ai');
      const currentHistory = historyForAPI.length > 0 ? historyForAPI : (newUserMessage ? [newUserMessage] : []);
      const aiResponseText = await fetchChatResponse(initialSelectedTextRef.current, currentHistory, messageText);
      const newAiMessage: ChatMessage = { id: `ai-${Date.now()}`, type: 'ai', text: aiResponseText };
      setChatMessages(prev => [...prev, newAiMessage]);
    } catch (error) {
      const errorMessageText = error instanceof Error ? error.message : 'Lỗi khi chat.';
      const errorMsg: ChatMessage = { id: `error-ai-${Date.now()}`, type: 'ai', text: `Lỗi: ${errorMessageText}` };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoadingAiResponse(false);
      if (isClient) setTimeout(() => chatInputRef.current?.focus(), 0); 
    }
  }, [currentUserMessage, isLoadingAiResponse, chatMessages, isClient]);


  const handleToggleFavorite = useCallback(async () => {
    if (!initialSelectedText || !initialDataForFavorite || isSavingFavorite || isLoadingFavoriteStatus || !isClient) return;
    
    if (!currentUser || !token) {
        openLoginModal(
            () => { if(isClient) handleToggleFavorite(); }, // Thử lại sau khi đăng nhập
            () => { if(isClient) alert("Bạn cần đăng nhập để lưu từ vựng.");}
        );
        return;
    }
    if (isFavorited) { console.log("Đã yêu thích, bỏ qua."); return; } // Hoặc logic unfavorite sau
    
    setIsSavingFavorite(true);
    setFavoriteMessage(null);
    const payload = {
        koreanWord: initialSelectedText,
        vietnameseMeaning: initialDataForFavorite.translation,
        examples: initialDataForFavorite.examples.slice(0, 2).map(ex => ({
            koreanExample: ex.korean, vietnameseExample: ex.vietnamese
        }))
    };
    try {
        const response = await fetch(`${NEXT_API_BASE_URL}/vocabulary`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (!response.ok) {
            if (response.status === 409 || result.alreadyExists) {
                setIsFavorited(true); setFavoriteMessage(result.message || "Từ này đã được lưu.");
            } else { throw new Error(result.message || `Lỗi API: ${response.status}`); }
        } else {
            setIsFavorited(true); setFavoriteMessage(result.message || "Đã lưu từ vựng!");
        }
        setTimeout(() => setFavoriteMessage(null), 3000);
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Không thể lưu từ vựng.';
        setFavoriteMessage(`Lỗi: ${msg}`);
        setTimeout(() => setFavoriteMessage(null), 4000);
    } finally {
        setIsSavingFavorite(false);
    }
  }, [isClient, initialSelectedText, initialDataForFavorite, isSavingFavorite, isLoadingFavoriteStatus, currentUser, token, openLoginModal, isFavorited]);


  if (!isClient || isSmallScreen || !isOpen) {
    return null;
  }

  const renderFormattedText = (text: string): React.ReactNode[] => {
    const lines = text.split('\n');
    return lines.map((line, lineIndex) => {
        const parts = line.split(/(\*\*.*?\*\*|_.*?_|• .*|⤷ .*)/g);
        return (
            <p key={lineIndex} className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-0.5 last:mb-0">
                {parts.map((part, partIndex) => {
                    if (!part) return null;
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={partIndex} className="text-gray-900">{part.substring(2, part.length - 2)}</strong>;
                    }
                    if (part.startsWith('_') && part.endsWith('_')) {
                        return <em key={partIndex} className="italic text-gray-700">{part.substring(1, part.length - 1)}</em>;
                    }
                    if (part.trim().startsWith('⤷')) {
                         return <span key={partIndex} className="ml-6 text-gray-600 block">{part.trim().substring(2)}</span>;
                    }
                    if (part.trim().startsWith('•')) {
                         return <span key={partIndex} className="ml-2 block"><span className="font-semibold mr-1">•</span>{part.trim().substring(2)}</span>;
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
      className="fixed bottom-5 right-5 w-[420px] max-w-[calc(100%-2.5rem)] h-[70vh] max-h-[750px] bg-white border border-gray-300 rounded-xl shadow-2xl flex flex-col z-[9999] overflow-hidden"
    >
      {/* Header */}
      <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-gray-100 rounded-t-xl shrink-0">
        <h2 className="text-base font-semibold text-gray-700 truncate pr-2 flex-grow" title={initialSelectedText || "Thảo luận & Tra cứu"}>
            {initialSelectedText ? `Về: "${initialSelectedText}"` : "Thảo luận & Tra cứu"}
        </h2>
        <div className="flex items-center shrink-0 space-x-1.5"> {/* space-x-1.5 */}
            {initialSelectedText && initialDataForFavorite && (
                <button 
                    onClick={handleToggleFavorite} 
                    disabled={isSavingFavorite || isLoadingFavoriteStatus}
                    className={`p-1.5 rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                                ${isFavorited ? 'text-yellow-500 hover:text-yellow-600' : 'text-gray-400 hover:text-yellow-400'}`}
                    title={isFavorited ? "Đã yêu thích" : "Thêm vào yêu thích"}
                    aria-label={isFavorited ? "Đã yêu thích" : "Thêm vào yêu thích"}
                >
                    {isSavingFavorite || isLoadingFavoriteStatus ? (
                        <svg className="w-5 h-5 animate-spin text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : isFavorited ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.39-3.423 3.11a.75.75 0 00.44 1.316l5.034.732 2.26 4.542a.75.75 0 001.352 0l2.26-4.542 5.033-.732a.75.75 0 00.44-1.316l-3.422-3.11-4.753-.39L10.868 2.884z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.82.61l-4.72-3.202a.563.563 0 00-.652 0l-4.72 3.202a.562.562 0 01-.82-.61l1.285-5.385a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                        </svg>
                    )}
                </button>
            )}
            <button onClick={closePanel} className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200 transition-colors" aria-label="Đóng">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
            </button>
        </div>
      </div>

      {favoriteMessage && (
        <div className={`absolute top-16 left-1/2 -translate-x-1/2 px-4 py-2 rounded-md shadow-lg text-xs font-medium
                        ${favoriteMessage.startsWith('Lỗi') ? 'bg-red-600 text-white' : 'bg-green-600 text-white'} 
                        z-[10000] transition-all duration-300 ease-out animate-fadeInOut`}
        style={{animation: 'fadeInOut 3s ease-out forwards'}}
        >
            {favoriteMessage}
        </div>
      )}
        <style jsx global>{`
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translateY(-12px) translateX(-50%); }
                15% { opacity: 1; transform: translateY(0px) translateX(-50%); }
                85% { opacity: 1; transform: translateY(0px) translateX(-50%); }
                100% { opacity: 0; transform: translateY(-12px) translateX(-50%); }
            }
        `}</style>

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
        {isLoadingAiResponse && ( // AI Typing indicator
          <div className="flex justify-start">
            <div className="max-w-[80%] p-2.5 rounded-lg bg-gray-200 text-gray-800 rounded-bl-none">
              <span className="text-sm inline-flex items-center">
                AI đang soạn tin
                <span className="animate-pulseSequential点的 ml-1">
                  <span className="opacity-0 animation-delay-0">•</span>
                  <span className="opacity-0 animation-delay-200">•</span>
                  <span className="opacity-0 animation-delay-400">•</span>
                </span>
              </span>
            </div>
          </div>
        )}
         {chatMessages.length === 0 && !isLoadingInitialData && !initialSelectedText && (
             <p className="text-sm text-gray-400 text-center py-10 px-3">Bôi đen một đoạn văn bản trên trang để bắt đầu tra cứu và trò chuyện với AI.</p>
         )}
      </div>

      <div className="p-3 border-t border-gray-200 bg-white rounded-b-xl shrink-0">
        <div className="flex items-end space-x-2">
          <textarea
            ref={chatInputRef}
            value={currentUserMessage}
            onChange={(e) => setCurrentUserMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !isLoadingAiResponse && !isLoadingInitialData && currentUserMessage.trim()) {
                e.preventDefault(); handleSendMessage();
              }
            }}
            placeholder={isLoadingInitialData ? "Đang tải thông tin..." : "Hỏi thêm hoặc trò chuyện..."}
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
       <style jsx global>{`
            @keyframes pulseSequentialDots {
                0%, 100% { opacity: 0; }
                50% { opacity: 1; }
            }
            .animate-pulseSequential点的 > span {
                animation: pulseSequentialDots 1s infinite;
            }
            .animate-pulseSequential点的 > span:nth-child(1) { animation-delay: 0s; }
            .animate-pulseSequential点的 > span:nth-child(2) { animation-delay: 0.2s; }
            .animate-pulseSequential点的 > span:nth-child(3) { animation-delay: 0.4s; }
        `}</style>
    </div>
  );
};

export default InteractiveChatPanel;