import { useState, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { AUDIO_BASE_URL } from "./QuranReader";

interface SearchResult {
  verse_key: string;
  text_uthmani: string;
  page_number: number;
  chapter_id: number;
  verse_number: number;
}

interface SearchPanelProps {
  onClose: () => void;
  onGoToVerse: (page: number, verseKey: string) => void;
  playVerseInMainPlayer: (playlist: any[]) => void;
  selectedReciter: number;
  allChapters: any[] | undefined;
}

export function SearchPanel({
  onClose,
  onGoToVerse,
  playVerseInMainPlayer,
  selectedReciter,
  allChapters
}: SearchPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [playingVerse, setPlayingVerse] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const searchQuran = useAction(api.quran.searchQuran);
  const getVerseAudio = useAction(api.quran.getVerseAudio);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        handleSearch();
      } else {
        setSearchResults([]);
        setHasSearched(false);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSearch = async () => {
    setIsLoading(true);
    setHasSearched(true);
    try {
      const data = await searchQuran({ query: searchTerm.trim() });
      setSearchResults(data.results || []);
      if ((data.results || []).length === 0) {
        toast.info("لم يتم العثور على نتائج");
      }
    } catch (error: any) {
      toast.error("خطأ في البحث: " + error.message);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.page_number && result.verse_key) {
      onGoToVerse(result.page_number, result.verse_key);
    } else {
      toast.error("لا يمكن تحديد رقم الصفحة لهذه الآية.");
    }
  };

  const handlePlayVerse = async (e: React.MouseEvent, verseKey: string) => {
    e.stopPropagation();
    setPlayingVerse(verseKey);
    try {
      const audioData = await getVerseAudio({ verseKey, reciterId: selectedReciter });
      if (audioData?.url) {
        const fullUrl = `${AUDIO_BASE_URL}${audioData.url}`;
        playVerseInMainPlayer([{ verseKey, url: fullUrl }]);
        toast.success(`جاري تشغيل الآية ${verseKey}`);
      } else {
        toast.error("لم يتم العثور على ملف صوتي لهذه الآية.");
      }
    } catch (error: any) {
      toast.error("خطأ في جلب الملف الصوتي: " + error.message);
    } finally {
      setTimeout(() => setPlayingVerse(null), 1000);
    }
  };

  const highlightSearchTerm = (text: string, term: string) => {
    if (!text) return "";
    if (!term.trim()) return text;
    const regex = new RegExp(`(${term.trim()})`, 'gi');
    return text.split(regex).map((part, index) =>
      regex.test(part) ? <mark key={index} className="bg-yellow-200 px-1 rounded">{part}</mark> : part
    );
  };

  const getChapterName = (chapterId: number): string => {
    if (!allChapters) return "";
    const chapter = allChapters.find((c: any) => c.id === chapterId);
    return chapter?.name_arabic || "";
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match transition duration
  };

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={handleClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-main w-full h-[85vh] rounded-t-2xl shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isClosing ? 'translate-y-full' : 'translate-y-0'
        }`}
      >
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-main">
          <h2 className="text-lg font-bold text-main font-ui">البحث في القرآن</h2>
          <button onClick={handleClose} className="p-2 hover:bg-hover rounded-lg text-2xl">×</button>
        </div>
        <div className="flex-shrink-0 p-4 border-b border-main">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث عن كلمة أو آية..."
            className="w-full px-4 py-3 bg-hover border border-main rounded-lg focus:ring-2 focus:ring-accent"
            autoFocus
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center"><div className="w-8 h-8 spinner mx-auto"></div><p className="text-muted mt-2">جاري البحث...</p></div>
          ) : hasSearched && searchResults.length === 0 ? (
            <div className="p-8 text-center text-muted">لم يتم العثور على نتائج</div>
          ) : (
            <div className="p-4 space-y-3">
              {searchResults.map((result) => (
                <div
                  key={result.verse_key}
                  onClick={() => handleResultClick(result)}
                  className="p-4 border border-main rounded-lg hover:bg-hover cursor-pointer"
                >
                  <p className="font-quran text-lg mb-2 text-main">{highlightSearchTerm(result.text_uthmani, searchTerm)}</p>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted">
                      {`سورة ${getChapterName(result.chapter_id)} - الآية ${result.verse_number}`}
                    </span>
                    <button
                      onClick={(e) => handlePlayVerse(e, result.verse_key)}
                      className="p-2 rounded-full hover:bg-main disabled:opacity-50"
                      disabled={playingVerse === result.verse_key}
                      aria-label="تشغيل الآية"
                    >
                      {playingVerse === result.verse_key ? (
                        <div className="w-5 h-5 spinner"></div>
                      ) : (
                        <svg className="w-5 h-5 text-muted" fill="currentColor" viewBox="0 0 20 20"><path d="M4.555 5.168A1 1 0 016 6.002v7.996a1 1 0 01-1.445.894l-5-4a1 1 0 010-1.788l5-4zM12.555 5.168A1 1 0 0114 6.002v7.996a1 1 0 01-1.445.894l-5-4a1 1 0 010-1.788l5-4z"></path></svg>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
