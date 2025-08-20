import { useState, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { surahData } from "../lib/surah-data";

interface Chapter {
  id: number;
  name_arabic: string;
  name_simple: string;
  revelation_place: string;
  verses_count: number;
  pages: number[];
}

interface IndexPanelProps {
  onClose: () => void;
  onGoToPage: (page: number) => void;
}

export function IndexPanel({ onClose, onGoToPage }: IndexPanelProps) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const getChapters = useAction(api.quran.getChapters);

  // Load chapters data
  useEffect(() => {
    const loadChapters = async () => {
      try {
        const chaptersData = await getChapters();
        setChapters(chaptersData || []);
      } catch (error) {
        toast.error("خطأ في تحميل فهرس السور");
        console.error("Error loading chapters:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadChapters();
  }, []);

  // Filter chapters based on search
  const filteredChapters = chapters.filter(chapter =>
    chapter.name_arabic.includes(searchTerm) ||
    chapter.name_simple.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getChapterStartPage = (chapterId: number): number => {
    const surah = surahData.find(s => s.id === chapterId);
    return surah ? surah.startPage : 1;
  };

  const handleChapterClick = (chapter: Chapter) => {
    const startPage = getChapterStartPage(chapter.id);
    onGoToPage(startPage);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 font-ui">فهرس السور</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span className="text-xl">✕</span>
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث عن سورة..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] outline-none font-ui"
            dir="rtl"
          />
        </div>

        {/* Chapters List */}
        <div className="flex-1 overflow-y-auto max-h-96">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 spinner mx-auto mb-4"></div>
              <p className="text-gray-600 font-ui">جاري تحميل الفهرس...</p>
            </div>
          ) : filteredChapters.length > 0 ? (
            <div className="p-4 space-y-2">
              {filteredChapters.map((chapter) => (
                <div
                  key={chapter.id}
                  onClick={() => handleChapterClick(chapter)}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-[var(--color-accent)]/5 hover:border-[var(--color-accent)] cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[var(--color-accent)] text-white rounded-full flex items-center justify-center font-bold font-ui">
                        {chapter.id}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 font-ui">
                          {chapter.name_arabic}
                        </h3>
                        <p className="text-sm text-gray-600 font-ui">
                          {chapter.verses_count} آية • {chapter.revelation_place === 'makkah' ? 'مكية' : 'مدنية'}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 font-ui">
                      صفحة {getChapterStartPage(chapter.id)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <span className="text-4xl mb-4 block">📖</span>
              <p className="font-ui">لم يتم العثور على سور</p>
              <p className="text-sm mt-2 font-ui">جرب البحث بكلمات مختلفة</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
