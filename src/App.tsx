import { useState } from "react";
import { QuranReader } from "./components/QuranReader";
import { Toaster } from "sonner";
import Chatbot from "./components/Chatbot";
import { MessageCircle } from "lucide-react";
import { type Verse } from "./lib/types";

export default function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [verseToAsk, setVerseToAsk] = useState<Verse | null>(null);

  const handleAskAi = (verse: Verse) => {
    setVerseToAsk(verse);
    setIsChatOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
    // Delay clearing the verse to allow for closing animation
    setTimeout(() => {
      setVerseToAsk(null);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <QuranReader onAskAi={handleAskAi} />
      
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-4 left-4 z-40 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-transform hover:scale-110"
          aria-label="Open chat"
        >
          <MessageCircle size={24} />
        </button>
      )}

      <Chatbot
        isOpen={isChatOpen}
        onClose={handleCloseChat}
        verse={verseToAsk}
      />

      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: 'white',
            border: '1px solid #e5e5e5',
            color: '#2c2c2c',
            fontFamily: 'Noto Sans Arabic, Cairo, sans-serif'
          }
        }}
      />
    </div>
  );
}
