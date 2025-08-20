import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, BookMarked } from 'lucide-react';
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { type Verse } from '../lib/types';
import { appEmitter } from '../lib/events';
import { surahData } from '../lib/surah-data';

// Define the message structure, now with an optional attachment
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachment?: Verse;
}

// Define the props for our component
interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  verse: Verse | null;
}

const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onClose, verse }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'بسم الله الرحمن الرحيم. أهلاً بك، أنا عبدالحكيم. كيف يمكنني مساعدتك اليوم؟' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const askGemini = useAction(api.gemini.askGemini);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  // Effect to scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Effect to handle an incoming verse to ask about
  useEffect(() => {
    if (verse && isOpen) {
      const verseMessage: Message = {
        role: 'system',
        content: `تم إرفاق الآية: ${verse.verse_key}`,
        attachment: verse,
      };
      setMessages(prev => [...prev, verseMessage]);
      setInput("ما هو تفسير هذه الآية؟");
    }
  }, [verse, isOpen]);

  const handleToolCall = (tool: string, args: any) => {
    let confirmationMessage = "";
    switch (tool) {
      case 'navigateToPage':
        appEmitter.emit('navigateToPage', { page: args.page });
        confirmationMessage = `**تم بنجاح:** جاري الانتقال إلى صفحة **${args.page}**.`;
        onClose();
        break;
      case 'navigateToSurah':
        const surah = surahData.find(s => s.arabicName.includes(args.surahName));
        if (surah) {
          appEmitter.emit('navigateToSurah', { surahName: args.surahName });
          confirmationMessage = `**تم بنجاح:** جاري الانتقال إلى **سورة ${args.surahName}**.`;
          onClose();
        } else {
          confirmationMessage = `**عذراً:** لم أتمكن من العثور على سورة باسم "${args.surahName}".`;
        }
        break;
      case 'changeTheme':
        appEmitter.emit('changeTheme', { theme: args.theme });
        confirmationMessage = `**تم بنجاح:** جاري تغيير المظهر إلى **${args.theme}**.`;
        break;
      case 'changeFontSize':
        appEmitter.emit('changeFontSize', { size: args.size });
        confirmationMessage = `**تم بنجاح:** جاري تغيير حجم الخط إلى **${args.size}**.`;
        break;
      default:
        confirmationMessage = `**عذراً:** لا أستطيع تنفيذ هذا الأمر.`;
    }
    const toolResponseMessage: Message = { role: 'assistant', content: confirmationMessage };
    setMessages(prev => [...prev, toolResponseMessage]);
  };

  const handleSubmit = async (prompt: string = input) => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    const userMessage: Message = { role: 'user', content: prompt };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      const historyForApi = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      const result = await askGemini({ prompt, history: historyForApi });

      try {
        const parsedResult = JSON.parse(result);
        if (parsedResult.tool) {
          handleToolCall(parsedResult.tool, parsedResult);
        } else {
          throw new Error("Parsed JSON is not a tool call.");
        }
      } catch (e) {
        // Not a JSON or not a tool call, treat as regular message
        const aiMessage: Message = { role: 'assistant', content: result };
        setMessages(prev => [...prev, aiMessage]);
      }

    } catch (error) {
      console.error("Error calling Gemini:", error);
      const errorMessage: Message = { role: 'assistant', content: 'عذراً، حدث خطأ ما. يرجى المحاولة مرة أخرى.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit();
  };

  if (!isOpen) {
    return null;
  }

  const renderMessageContent = (msg: Message) => {
    if (msg.attachment) {
      return (
        <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3 mb-2">
            <BookMarked className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="font-semibold text-sm text-blue-800 dark:text-blue-200">
              الآية المرفقة: {msg.attachment.verse_key}
            </span>
          </div>
          <p className="font-quran text-lg text-right text-gray-800 dark:text-gray-200">
            {msg.attachment.text_uthmani}
          </p>
        </div>
      );
    }
    const parts = msg.content.split(/(\*\*.*?\*\*)/g);
    return (
        <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>
            {parts.map((part, i) =>
                part.startsWith('**') && part.endsWith('**') ?
                <strong key={i}>{part.slice(2, -2)}</strong> :
                part
            )}
        </p>
    );
  };

  return (
    <div className="fixed bottom-4 right-4 w-full max-w-lg h-full max-h-[70vh] bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col z-50 sm:h-auto sm:max-h-[600px] transition-all duration-300 ease-in-out">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">عبدالحكيم</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
          aria-label="Close chat"
        >
          <X size={24} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex flex-col space-y-4">
          {messages.map((msg, index) => {
            if (msg.role === 'system') {
              return renderMessageContent(msg);
            }
            return (
              <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && <Bot className="w-6 h-6 text-blue-500" />}
                <div className={`p-3 rounded-lg max-w-sm ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'}`}>
                  {renderMessageContent(msg)}
                </div>
                {msg.role === 'user' && <User className="w-6 h-6 text-gray-500" />}
              </div>
            )
          })}
          {isLoading && (
            <div className="flex items-start gap-3 justify-start">
              <Bot className="w-6 h-6 text-blue-500" />
              <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <form onSubmit={handleFormSubmit} className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isLoading ? "يفكر عبدالحكيم..." : "اسأل عن آية أو موضوع..."}
            className="w-full pl-4 pr-12 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed" disabled={isLoading || !input.trim()}>
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chatbot;
