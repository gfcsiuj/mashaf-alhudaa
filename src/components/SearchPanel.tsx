import { useState, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface SearchResult {
  verse_key: string;
  text_uthmani: string;
  page_number: number;
  chapter_id: number;
  verse_number: number;
}

interface SearchPanelProps {
  onClose: () => void;
  onGoToPage: (page: number) => void;
}

export function SearchPanel({ onClose, onGoToPage }: SearchPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const searchVerses = useAction(api.quran.searchQuran);

  // Debounced search
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
    if (searchTerm.trim().length < 2) {
      toast.error("يرجى إدخال كلمتين على الأقل للبحث");
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    
    try {
      console.log("Searching for:", searchTerm);
      const data = await searchVerses({ query: searchTerm.trim() });
      console.log("Search results:", data);
      
      // The backend now returns enriched data, so no complex mapping is needed
      const results = data.results || [];
      setSearchResults(results);
      
      if (!results || results.length === 0) {
        toast.info("لم يتم العثور على نتائج");
      } else {
        toast.success(`تم العثور على ${results.length} نتيجة`);
      }
    } catch (error: any) {
      console.error("Search error:", error);
      toast.error("خطأ في البحث - حاول مرة أخرى");
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.page_number) {
      onGoToPage(result.page_number);
      toast.success(`الانتقال إلى صفحة ${result.page_number}`);
    } else {
      toast.error("لا يمكن تحديد رقم الصفحة لهذه الآية.");
    }
  };

  const highlightSearchTerm = (text: string, term: string) => {
    if (!text) return ""; // Guard against undefined text
    if (!term.trim()) return text;
    
    const regex = new RegExp(`(${term.trim()})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? 
        <mark key={index} className="bg-yellow-200 px-1 rounded">{part}</mark> : 
        part
    );
  };

  const getChapterName = (chapterId: number): string => {
    const chapterNames: { [key: number]: string } = {
      1: "الفاتحة", 2: "البقرة", 3: "آل عمران", 4: "النساء", 5: "المائدة",
      6: "الأنعام", 7: "الأعراف", 8: "الأنفال", 9: "التوبة", 10: "يونس",
      11: "هود", 12: "يوسف", 13: "الرعد", 14: "إبراهيم", 15: "الحجر",
      16: "النحل", 17: "الإسراء", 18: "الكهف", 19: "مريم", 20: "طه",
      21: "الأنبياء", 22: "الحج", 23: "المؤمنون", 24: "النور", 25: "الفرقان",
      26: "الشعراء", 27: "النمل", 28: "القصص", 29: "العنكبوت", 30: "الروم",
      31: "لقمان", 32: "السجدة", 33: "الأحزاب", 34: "سبأ", 35: "فاطر",
      36: "يس", 37: "الصافات", 38: "ص", 39: "الزمر", 40: "غافر",
      41: "فصلت", 42: "الشورى", 43: "الزخرف", 44: "الدخان", 45: "الجاثية",
      46: "الأحقاف", 47: "محمد", 48: "الفتح", 49: "الحجرات", 50: "ق",
      51: "الذاريات", 52: "الطور", 53: "النجم", 54: "القمر", 55: "الرحمن",
      56: "الواقعة", 57: "الحديد", 58: "المجادلة", 59: "الحشر", 60: "الممتحنة",
      61: "الصف", 62: "الجمعة", 63: "المنافقون", 64: "التغابن", 65: "الطلاق",
      66: "التحريم", 67: "الملك", 68: "القلم", 69: "الحاقة", 70: "المعارج",
      71: "نوح", 72: "الجن", 73: "المزمل", 74: "المدثر", 75: "القيامة",
      76: "الإنسان", 77: "المرسلات", 78: "النبأ", 79: "النازعات", 80: "عبس",
      81: "التكوير", 82: "الانفطار", 83: "المطففين", 84: "الانشقاق", 85: "البروج",
      86: "الطارق", 87: "الأعلى", 88: "الغاشية", 89: "الفجر", 90: "البلد",
      91: "الشمس", 92: "الليل", 93: "الضحى", 94: "الشرح", 95: "التين",
      96: "العلق", 97: "القدر", 98: "البينة", 99: "الزلزلة", 100: "العاديات",
      101: "القارعة", 102: "التكاثر", 103: "العصر", 104: "الهمزة", 105: "الفيل",
      106: "قريش", 107: "الماعون", 108: "الكوثر", 109: "الكافرون", 110: "النصر",
      111: "المسد", 112: "الإخلاص", 113: "الفلق", 114: "الناس"
    };
    
    return chapterNames[chapterId] || "";
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h2 className="text-xl font-bold text-gray-800 font-ui">البحث في القرآن</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span className="text-xl">✕</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="flex-shrink-0 p-6 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث في القرآن الكريم..."
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] outline-none font-ui text-lg"
              dir="rtl"
              autoFocus
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {isLoading ? (
                <div className="w-5 h-5 spinner"></div>
              ) : (
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2 font-ui">
            اكتب كلمتين على الأقل للبحث
          </p>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 spinner mx-auto mb-4"></div>
              <p className="text-gray-600 font-ui">جاري البحث...</p>
            </div>
          ) : hasSearched && searchResults.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="font-ui text-lg mb-2">لم يتم العثور على نتائج</p>
              <p className="text-sm font-ui text-gray-400">
                جرب البحث بكلمات مختلفة
              </p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="p-4 space-y-3">
              <p className="text-sm text-gray-600 mb-4 font-ui">
                تم العثور على {searchResults.length} نتيجة
              </p>
              {searchResults.map((result, index) => (
                <div
                  key={`${result.verse_key}-${index}`}
                  onClick={() => handleResultClick(result)}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-[var(--color-accent)]/5 hover:border-[var(--color-accent)] cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--color-accent)]">📖</span>
                      <span className="text-sm text-[var(--color-accent)] font-medium font-ui">
                        {result.chapter_id ? `${getChapterName(result.chapter_id)} • الآية ${result.verse_number}` : result.verse_key}
                      </span>
                    </div>
                    {result.page_number && (
                      <span className="text-sm text-gray-500 font-ui">
                        صفحة {result.page_number}
                      </span>
                    )}
                  </div>
                  <div 
                    className="text-gray-800 font-quran text-lg leading-relaxed group-hover:text-[var(--color-accent)] transition-colors"
                    dir="rtl"
                  >
                    {highlightSearchTerm(result.text_uthmani, searchTerm)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="font-ui text-lg mb-2">ابحث في القرآن الكريم</p>
              <p className="text-sm font-ui text-gray-400">
                اكتب في المربع أعلاه للبحث عن الآيات
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {searchResults.length > 0 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600 text-center font-ui">
              انقر على أي نتيجة للانتقال إلى الصفحة
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
