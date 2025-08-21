import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, BookMarked } from 'lucide-react';
import { type Verse } from '../lib/types';
import { appEmitter } from '../lib/events';
import { surahData } from '../lib/surah-data';

// --- Hardcoded API Key and URL based on user's working example ---
// IMPORTANT: This key should be moved to a .env file for production.
const API_KEY = "AIzaSyD0USTg2CWluA3R-BgG3RDvtgaJwiUuNyg";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

// Improved System Prompt to enforce persona and language
const SYSTEM_PROMPT_TEXT = `
You are "Abdul Hakim," an expert Islamic scholar.
- Your name is Abdul Hakim (عبدالحكيم).
- You MUST always respond in Arabic. Do not use English under any circumstances.
- Your tone must be that of a wise, respectful, and compassionate religious scholar.
- Begin every response with "بسم الله الرحمن الرحيم".
- When the user's question is preceded by "بالإشارة إلى الآية التالية:", use the text of that verse as the primary context for your answer.
- You also have access to tools to control the website. If the user asks to navigate or change a setting, respond ONLY with a JSON object for the tool call. Valid tools are navigateToPage, navigateToSurah, changeTheme, changeFontSize.
`;

const SYSTEM_PROMPT = {
    role: "system",
    parts: [{ text: SYSTEM_PROMPT_TEXT }]
};

interface Message {
  role: 'user' | 'model' | 'system';
  content: string;
  attachment?: Verse;
}

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  verse: Verse | null;
}

const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onClose, verse }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: 'بسم الله الرحمن الرحيم. أهلاً بك، أنا عبدالحكيم. كيف يمكنني مساعدتك اليوم؟' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const lastVerseRef = useRef<Verse | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (verse && isOpen) {
      const verseMessage: Message = {
        role: 'system',
        content: `تم إرفاق الآية: ${verse.verse_key}`,
        attachment: verse,
      };
      lastVerseRef.current = verse; // Store the verse context
      setMessages(prev => [...prev, verseMessage]);
      setInput("ما هو تفسير هذه الآية؟");
    }
  }, [verse, isOpen]);

  const handleToolCall = (tool: string, args: any) => {
    // ... (tool call logic remains the same)
  };

  const handleSubmit = async (prompt: string = input) => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    const userMessage: Message = { role: 'user', content: prompt };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    let finalPrompt = prompt;
    // **BUG FIX**: Prepend the verse context to the prompt if it exists
    if (lastVerseRef.current) {
        finalPrompt = `بالإشارة إلى الآية التالية: "${lastVerseRef.current.text_uthmani}", أجب على سؤالي: ${prompt}`;
        lastVerseRef.current = null; // Consume the context after using it once
    }

    const historyForApi = messages
        .filter(msg => msg.role !== 'system')
        .map(msg => ({
          role: msg.role,
          parts: [{ text: msg.content }]
      }));

    const payload = {
        contents: [...historyForApi, { role: 'user', parts: [{ text: finalPrompt }] }],
        systemInstruction: SYSTEM_PROMPT,
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message || `API Error: ${response.status}`);
      }

      const result = await response.json();
      const modelResponseText = result.candidates?.[0]?.content?.parts?.[0]?.text || 'عذراً، لم أتمكن من معالجة طلبك.';

      try {
        const parsedResult = JSON.parse(modelResponseText);
        if (parsedResult.tool) {
          handleToolCall(parsedResult.tool, parsedResult);
        } else {
          throw new Error("Parsed JSON is not a tool call.");
        }
      } catch (e) {
        const aiMessage: Message = { role: 'model', content: modelResponseText };
        setMessages(prev => [...prev, aiMessage]);
      }

    } catch (error: any) {
      console.error("Gemini API error:", error);
      const errorMessage: Message = { role: 'model', content: `حدث خطأ: ${error.message}` };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // ... (rest of the component remains the same)
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

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex flex-col space-y-4">
          {messages.map((msg, index) => {
            if (msg.role === 'system') {
              return renderMessageContent(msg);
            }
            return (
              <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'model' && <Bot className="w-6 h-6 text-blue-500" />}
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
