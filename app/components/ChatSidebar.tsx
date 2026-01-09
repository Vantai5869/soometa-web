'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, User, Image as ImageIcon, X, ChevronRight, ChevronDown } from 'lucide-react';
import axios from 'axios';

import Image from 'next/image';

interface Message {
  type: 'user' | 'ai';
  text: string;
  image?: string; // Base64 image
}

interface ChatSidebarProps {
  onClose?: () => void;
}

export default function ChatSidebar({ onClose }: ChatSidebarProps = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile/desktop
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    const onChange = () => setIsMobile(mql.matches);
    mql.addEventListener('change', onChange);
    onChange();
    return () => mql.removeEventListener('change', onChange);
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Reset textarea height when input is cleared
  useEffect(() => {
    if (input === '' && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh (jpg, png, etc.)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setSelectedImage(base64);
      setImagePreview(base64);
    };
    reader.readAsDataURL(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (!file) continue;

        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          setSelectedImage(base64);
          setImagePreview(base64);
        };
        reader.readAsDataURL(file);
        
        // Ngăn chặn việc dán nội dung text nếu chỉ muốn dán ảnh? 
        // Thông thường người dùng dán ảnh từ clipboard sẽ kèm theo text rác hoặc link ảnh, 
        // ở đây ta cứ để dán cả text nếu có, nhưng ưu tiên lấy ảnh.
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || isComposing) return;

    const userMessage: Message = { 
      type: 'user', 
      text: input.trim(),
      image: selectedImage || undefined
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSelectedImage(null);
    setImagePreview(null);
    setIsLoading(true);

    try {
      const chatHistory = messages.map(msg => ({
        type: msg.type,
        text: msg.text
      }));

      const response = await axios.post('/api/gemini', {
        task: 'getAdvancedChatResponse',
        newMessage: userMessage.text,
        chatHistory: chatHistory,
        image: userMessage.image // Gửi kèm ảnh
      });

      if (response.data && response.data.chatResponse) {
        setMessages(prev => [...prev, { type: 'ai', text: response.data.chatResponse }]);
      }
    } catch (error: any) {
      console.error('Chat Error:', error);
      const errorMessage = error.response?.data?.error || 'Xin lỗi, có lỗi xảy ra khi kết nối với AI.';
      setMessages(prev => [...prev, { type: 'ai', text: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-full max-h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="relative w-6 h-6 overflow-hidden rounded-md border border-gray-100 flex-shrink-0">
            <Image 
              src="/logo.png" 
              alt="Topikgo Logo" 
              fill
              className="object-contain p-0.5"
            />
          </div>
          <h2 className="font-semibold text-gray-800 text-sm tracking-tight">Topikgo Chat</h2>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={clearChat}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
            title="Xóa lịch sử chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          
          {onClose && (
            <button 
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
              title={isMobile ? "Đóng chat" : "Đóng sidebar"}
            >
              {isMobile ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-5 pr-2 mb-2 scrollbar-thin scrollbar-thumb-gray-200"
        style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        {messages.length === 0 && (
          <div className="text-center py-12 px-4">
            <div className="relative w-12 h-12 mx-auto mb-4 opacity-10">
               <Image 
                src="/logo.png" 
                alt="Topikgo Logo" 
                fill
                className="object-contain"
              />
            </div>
            <p className="text-gray-400 text-xs font-medium">Chào bạn! Tôi có thể giúp gì cho buổi học TOPIK hôm nay?</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className={`flex items-center gap-1.5 mb-1 px-1 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {msg.type === 'user' ? 'Bạn' : 'Topikgo AI'}
              </span>
            </div>
            <div 
              className={`max-w-[95%] p-3.5 rounded-2xl text-[13px] leading-relaxed shadow-sm border ${
                msg.type === 'user' 
                  ? 'bg-blue-50/80 text-blue-900 border-blue-100 rounded-tr-none' 
                  : 'bg-white text-gray-800 border-gray-100 rounded-tl-none'
              }`}
            >
              {msg.image && (
                <div className="mb-2 relative rounded-lg overflow-hidden border border-white/20">
                  <img 
                    src={msg.image} 
                    alt="Attached" 
                    className="max-w-full h-auto object-contain"
                  />
                </div>
              )}
              <div className="whitespace-pre-wrap break-words">
                {msg.text}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex flex-col items-start animate-in fade-in duration-500">
            <div className="flex items-center gap-1.5 mb-1 px-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Topikgo AI
              </span>
            </div>
            <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="mt-auto border-t border-gray-100 pt-3 bg-white">
        {/* Image Preview */}
        {imagePreview && (
          <div className="mb-2 relative inline-block animate-in zoom-in-95 duration-200">
            <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-full h-full object-cover"
              />
              <button 
                onClick={removeSelectedImage}
                className="absolute top-1 right-1 p-0.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                title="Gỡ ảnh"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        <div className="relative group flex items-center gap-2">
          {/* Hidden File Input */}
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            className="hidden"
            accept="image/*"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all flex-shrink-0"
            title="Đính kèm ảnh"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          <div className="relative flex-1 group">
            <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            onPaste={handlePaste}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                if (isComposing) return;
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Nhập câu hỏi..."
            rows={1}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all resize-none overflow-hidden max-h-32 placeholder:text-gray-400 text-gray-700"
            style={{ height: 'auto' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${target.scrollHeight}px`;
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${
              input.trim() && !isLoading 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-100 hover:bg-blue-700' 
                : 'text-gray-300'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
          </div>
        </div>
        <div className="mt-2 pb-1 space-y-1 px-2 text-left">
          <p className="text-[10px] text-gray-400 flex items-center gap-1.5 justify-start">
            <span className="w-1 h-1 bg-gray-300 rounded-full" />
            Dán ảnh (Ctrl+V) để dịch hoặc giải thích bài tập
          </p>
          <p className="text-[10px] text-gray-400 flex items-center gap-1.5 justify-start">
            <span className="w-1 h-1 bg-gray-300 rounded-full" />
            Shift + Enter để xuống dòng
          </p>
        </div>
      </div>
    </div>
  );
}
