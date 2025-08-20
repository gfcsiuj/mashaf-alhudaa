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
}

export function SearchPanel({
  onClose,
  onGoToVerse,
  playVerseInMainPlayer,
  selectedReciter
}: SearchPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [playingVerse, setPlayingVerse] = useState<string | null>(null);

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
    const chapterNames: { [key: number]: string } = {
      1:"الفاتحة",2:"البقرة",3:"آل عمران",4:"النساء",5:"المائدة",6:"الأنعام",7:"الأعراف",8:"الأنفال",9:"التوبة",10:"يونس",11:"هود",12:"يوسف",13:"الرعد",14:"إبراهيم",15:"الحجر",16:"النحل",17:"الإسراء",18:"الكهف",19:"مريم",20:"طه",21:"الأنبياء",22:"الحج",23:"المؤمنون",24:"النور",25:"الفرقان",26:"الشعراء",27:"النمل",28:"القصص",29:"العنكبوت",30:"الروم",31:"لقمان",32:"السجدة",33:"الأحزاب",34:"سبأ",35:"فاطر",36:"يس",37:"الصافات",38:"ص",39:"الزمر",40:"غافر",41:"فصلت",42:"الشورى",43:"الزخرف",44:"الدخان",45:"الجاثية",46:"الأحقاف",47:"محمد",48:"الفتح",49:"الحجرات",50:"ق",51:"الذاريات",52:"الطور",53:"النجم",54:"القمر",55:"الرحمن",56:"الواقعة",57:"الحديد",58:"المجادلة",59:"الحشر",60:"الممتحنة",61:"الصف",62:"الجمعة",63:"المنافقون",64:"التغابن",65:"الطلاق",66:"التحريم",67:"الملك",68:"القلم",69:"الحاقة",70:"المعارج",71:"نوح",72:"الجن",73:"المزمل",74:"المدثر",75:"القيامة",76:"الإنسان",77:"المرسلات",78:"النبأ",79:"النازعات",80:"عبس",81:"التكوير",82:"الانفطار",83:"المطففين",84:"الانشقاق",85:"البروج",86:"الطارق",87:"الأعلى",88:"الغاشية",89:"الفجر",90:"البلد",91:"الشمس",92:"الليل",93:"الضحى",94:"الشرح",95:"التين",96:"العلق",97:"القدر",98:"البينة",99:"الزلزلة",100:"العاديات",101:"القارعة",102:"التكاثر",103:"العصر",104:"الهمزة",105:"الفيل",106:"قريش",107:"الماعون",108:"الكوثر",109:"الكافرون",110:"النصر",111:"المسد",112:"الإخلاص",113:"الفلق",114:"الناس"
    };
    return chapterNames[chapterId] || "";
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 font-ui">البحث في القرآن</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">✕</button>
        </div>
        <div className="flex-shrink-0 p-6 border-b">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث عن كلمة أو آية..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]"
            autoFocus
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center"><div className="w-8 h-8 spinner mx-auto"></div><p>جاري البحث...</p></div>
          ) : hasSearched && searchResults.length === 0 ? (
            <div className="p-8 text-center text-gray-500">لم يتم العثور على نتائج</div>
          ) : (
            <div className="p-4 space-y-3">
              {searchResults.map((result) => (
                <div
                  key={result.verse_key}
                  onClick={() => handleResultClick(result)}
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <p className="font-quran text-lg mb-2">{highlightSearchTerm(result.text_uthmani, searchTerm)}</p>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">
                      {`سورة ${getChapterName(result.chapter_id)} - الآية ${result.verse_number}`}
                    </span>
                    <button
                      onClick={(e) => handlePlayVerse(e, result.verse_key)}
                      className="p-2 rounded-full hover:bg-gray-200 disabled:opacity-50"
                      disabled={playingVerse === result.verse_key}
                      aria-label="تشغيل الآية"
                    >
                      {playingVerse === result.verse_key ? (
                        <div className="w-5 h-5 spinner"></div>
                      ) : (
                        <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 4.31A1 1 0 018 5.14v9.72a1 1 0 01-1.7.7l-4-4.86a1 1 0 010-1.4l4-4.86zM13.7 4.31a1 1 0 011.7.7v9.72a1 1 0 01-1.7.7l-4-4.86a1 1 0 010-1.4l4-4.86z"></path></svg>
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
