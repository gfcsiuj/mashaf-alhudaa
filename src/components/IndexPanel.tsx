import { useState, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

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

  // Get page number for chapter (simplified - you might want to use actual API data)
  const getChapterStartPage = (chapterId: number): number => {
    const chapterPages: { [key: number]: number } = {
      1: 1, 2: 2, 3: 50, 4: 77, 5: 106, 6: 128, 7: 151, 8: 177, 9: 187,
      10: 208, 11: 221, 12: 235, 13: 249, 14: 255, 15: 262, 16: 267, 17: 282,
      18: 293, 19: 305, 20: 312, 21: 322, 22: 332, 23: 342, 24: 350, 25: 359,
      26: 367, 27: 377, 28: 385, 29: 396, 30: 404, 31: 411, 32: 415, 33: 418,
      34: 428, 35: 434, 36: 440, 37: 446, 38: 453, 39: 458, 40: 467, 41: 477,
      42: 483, 43: 489, 44: 496, 45: 499, 46: 502, 47: 507, 48: 511, 49: 515,
      50: 518, 51: 520, 52: 523, 53: 526, 54: 528, 55: 531, 56: 534, 57: 537,
      58: 542, 59: 545, 60: 549, 61: 551, 62: 553, 63: 554, 64: 556, 65: 558,
      66: 560, 67: 562, 68: 564, 69: 566, 70: 568, 71: 570, 72: 572, 73: 574,
      74: 575, 75: 577, 76: 578, 77: 580, 78: 582, 79: 583, 80: 585, 81: 586,
      82: 587, 83: 587, 84: 589, 85: 590, 86: 591, 87: 591, 88: 592, 89: 593,
      90: 594, 91: 595, 92: 595, 93: 596, 94: 596, 95: 597, 96: 597, 97: 598,
      98: 598, 99: 599, 100: 599, 101: 600, 102: 600, 103: 601, 104: 601,
      105: 601, 106: 602, 107: 602, 108: 602, 109: 603, 110: 603, 111: 603,
      112: 604, 113: 604, 114: 604
    };
    
    return chapterPages[chapterId] || 1;
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
