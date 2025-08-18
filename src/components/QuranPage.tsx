import { useState } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { AUDIO_BASE_URL } from "./QuranReader";
import { BookOpen, FileText, Play, Bookmark, Share2 } from "lucide-react";

interface Verse {
  id: number;
  verse_key: string;
  text_uthmani: string;
  chapter_id: number;
  verse_number: number;
  page_number: number;
  audio?: {
    url: string;
    duration?: number;
  };
  translations?: any[];
  tafsirs?: any[];
}

interface QuranPageProps {
  verses: Verse[];
  isLoading: boolean;
  currentPage: number;
  userPreferences: any;
  playVerseInMainPlayer: (playlist: any[]) => void;
  highlightedVerse: string | null;
  layoutMode: string;
  fontSize: string;
  arabicFont: string;
}

function VerseDetail({
  verse,
  arabicFont,
  fontSize,
  isHighlighted,
  onVerseClick,
  showTafsir,
  showTranslation,
}: {
  verse: Verse;
  arabicFont: string;
  fontSize: string;
  isHighlighted: boolean;
  onVerseClick: (verse: Verse, event: React.MouseEvent) => void;
  showTafsir: boolean;
  showTranslation: boolean;
}) {
  const tafsirText = verse.tafsirs?.[0]?.text || "التفسير غير متوفر.";
  const translationText = verse.translations?.[0]?.text || "الترجمة غير متوفرة.";

  const fontFamilyClasses: Record<string, string> = {
    uthmani: 'font-quran',
    indopak: 'font-indopak',
    qpc: 'font-qpc'
  };
  const fontSizeClasses: Record<string, string> = { small: 'text-xl', medium: 'text-2xl', large: 'text-3xl' };

  return (
    <div className={`verse-container mb-4 p-4 rounded-lg border bg-white shadow-sm transition-colors ${isHighlighted ? 'active-verse' : 'border-gray-100'}`}>
      <p
        className={`${fontFamilyClasses[arabicFont]} ${fontSizeClasses[fontSize]} leading-loose text-justify cursor-pointer`}
        onClick={(e) => onVerseClick(verse, e)}
      >
        {verse.text_uthmani}
        <span className="verse-number">{verse.verse_number}</span>
      </p>

      {showTafsir && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
          <h3 className="font-bold text-green-800 mb-2 font-ui">التفسير</h3>
          <p className="text-green-700 font-ui">{tafsirText}</p>
        </div>
      )}
      {showTranslation && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
          <h3 className="font-bold text-blue-800 mb-2 font-ui">الترجمة</h3>
          <p className="text-blue-700 font-ui">{translationText}</p>
        </div>
      )}
    </div>
  );
}

export function QuranPage({ verses, isLoading, currentPage, userPreferences, playVerseInMainPlayer, highlightedVerse, layoutMode, fontSize, arabicFont }: QuranPageProps) {
  const [menuState, setMenuState] = useState<{
    visible: boolean;
    verse: Verse | null;
    position: { x: number, y: number };
  }>({ visible: false, verse: null, position: { x: 0, y: 0 } });

  const [visibleTafsir, setVisibleTafsir] = useState<string | null>(null);
  const [visibleTranslation, setVisibleTranslation] = useState<string | null>(null);

  const addBookmark = useMutation(api.quran.addBookmark);

  const handleVerseClick = (verse: Verse, event: React.MouseEvent) => {
    event.stopPropagation();
    setMenuState({
      visible: true,
      verse: verse,
      position: { x: event.clientX, y: event.clientY }
    });
  };

  const handlePlayVerse = (verse: Verse) => {
    const verseIndex = verses.findIndex(v => v.verse_key === verse.verse_key);
    if (verseIndex === -1) return;

    const newPlaylist = verses.slice(verseIndex).map(v => ({
      verseKey: v.verse_key,
      url: v.audio?.url ? `https://verses.quran.com/${v.audio.url}` : null
    })).filter(item => item.url !== null);

    if (newPlaylist.length > 0) {
      playVerseInMainPlayer(newPlaylist);
      toast.success("بدء تشغيل التلاوة");
    } else {
      toast.error("لا يتوفر صوت لهذه الآية");
    }
  };

  const handleCloseMenu = () => {
    if (menuState.visible) {
      setMenuState({ visible: false, verse: null, position: { x: 0, y: 0 } });
    }
  };

  const handleMenuAction = async (action: string) => {
    const verse = menuState.verse;
    if (!verse) return;

    switch (action) {
      case 'listen':
        handlePlayVerse(verse);
        break;
      case 'bookmark':
        try {
          await addBookmark({ pageNumber: currentPage, verseKey: verse.verse_key, verseText: verse.text_uthmani });
          toast.success("تم حفظ الآية في المفضلة");
        } catch (error) { toast.error("خطأ في حفظ الآية"); }
        break;
      case 'share':
        const shareText = `${verse.text_uthmani}\n\n(${verse.verse_key})`;
        if (navigator.share) {
          navigator.share({ title: 'آية من القرآن الكريم', text: shareText }).catch(() => {});
        } else {
          navigator.clipboard.writeText(shareText);
          toast.success("تم نسخ الآية");
        }
        break;
      case 'tafsir':
        setVisibleTafsir(prev => prev === verse.verse_key ? null : verse.verse_key);
        setVisibleTranslation(null); // Close other detail
        break;
      case 'translation':
        setVisibleTranslation(prev => prev === verse.verse_key ? null : verse.verse_key);
        setVisibleTafsir(null); // Close other detail
        break;
    }
    handleCloseMenu();
  };

  const getChapterName = (chapterId: number): string => {
    const chapterNames: { [key: number]: string } = {1:"الفاتحة",2:"البقرة",3:"آل عمران",4:"النساء",5:"المائدة",6:"الأنعام",7:"الأعراف",8:"الأنفال",9:"التوبة",10:"يونس",11:"هود",12:"يوسف",13:"الرعد",14:"إبراهيم",15:"الحجر",16:"النحل",17:"الإسراء",18:"الكهف",19:"مريم",20:"طه",21:"الأنبياء",22:"الحج",23:"المؤمنون",24:"النور",25:"الفرقان",26:"الشعراء",27:"النمل",28:"القصص",29:"العنكبوت",30:"الروم",31:"لقمان",32:"السجدة",33:"الأحزاب",34:"سبأ",35:"فاطر",36:"يس",37:"الصافات",38:"ص",39:"الزمر",40:"غافر",41:"فصلت",42:"الشورى",43:"الزخرف",44:"الدخان",45:"الجاثية",46:"الأحقاف",47:"محمد",48:"الفتح",49:"الحجرات",50:"ق",51:"الذاريات",52:"الطور",53:"النجم",54:"القمر",55:"الرحمن",56:"الواقعة",57:"الحديد",58:"المجادلة",59:"الحشر",60:"الممتحنة",61:"الصف",62:"الجمعة",63:"المنافقون",64:"التغابن",65:"الطلاق",66:"التحريم",67:"الملك",68:"القلم",69:"الحاقة",70:"المعارج",71:"نوح",72:"الجن",73:"المزمل",74:"المدثر",75:"القيامة",76:"الإنسان",77:"المرسلات",78:"النبأ",79:"النازعات",80:"عبس",81:"التكوير",82:"الانفطار",83:"المطففين",84:"الانشقاق",85:"البروج",86:"الطارق",87:"الأعلى",88:"الغاشية",89:"الفجر",90:"البلد",91:"الشمس",92:"الليل",93:"الضحى",94:"الشرح",95:"التين",96:"العلق",97:"القدر",98:"البينة",99:"الزلزلة",100:"العاديات",101:"القارعة",102:"التكاثر",103:"العصر",104:"الهمزة",105:"الفيل",106:"قريش",107:"الماعون",108:"الكوثر",109:"الكافرون",110:"النصر",111:"المسد",112:"الإخلاص",113:"الفلق",114:"الناس"};
    return chapterNames[chapterId] || "";
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 spinner mx-auto"></div></div>;
  }

  if (!verses || verses.length === 0) {
    return <div className="flex items-center justify-center min-h-[60vh]"><p>لا توجد آيات في هذه الصفحة</p></div>;
  }

  const fontFamilyClasses: Record<string, string> = { uthmani: 'font-quran', indopak: 'font-indopak', qpc: 'font-qpc' };
  const fontSizeClasses: Record<string, string> = { small: 'text-xl', medium: 'text-2xl', large: 'text-3xl' };
  const firstVerse = verses[0];
  const isChapterStart = firstVerse?.verse_number === 1;
  const chapterName = getChapterName(firstVerse?.chapter_id);
  const shouldShowBasmala = isChapterStart && firstVerse?.chapter_id !== 9;

  return (
    <div className="max-w-4xl mx-auto" onClick={handleCloseMenu}>
      <div className="text-center my-8 pb-4 border-b border-gray-200">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full">
          <span className="text-gray-700 font-ui font-medium">صفحة</span>
          <span className="text-[var(--color-accent)] font-ui font-bold text-lg">{currentPage}</span>
        </div>
      </div>

      {isChapterStart && (
        <div className="w-full my-8">
          <div className="flex items-center justify-center">
            <div className="px-8 py-4 bg-gray-100 border-2 border-gray-200 rounded-lg shadow-md">
              <h2 className="text-3xl font-bold font-quran text-gray-700">سورة {chapterName}</h2>
            </div>
          </div>
          {shouldShowBasmala && (
            <div className="text-center py-6 mt-4">
              <p className="font-quran text-4xl text-[var(--color-accent)] leading-loose">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
            </div>
          )}
        </div>
      )}

      <div>
        {layoutMode === 'list' ? (
          verses.map((verse) => (
            <VerseDetail
              key={verse.id}
              verse={verse}
              arabicFont={arabicFont}
              fontSize={fontSize}
              isHighlighted={highlightedVerse === verse.verse_key}
              onVerseClick={handleVerseClick}
              showTafsir={visibleTafsir === verse.verse_key}
              showTranslation={visibleTranslation === verse.verse_key}
            />
          ))
        ) : (
          <div className={`${fontFamilyClasses[arabicFont]} ${fontSizeClasses[fontSize]} leading-loose text-justify`} dir="rtl" style={{ textAlignLast: 'center' }}>
            {verses.map((verse, index) => (
              <span key={verse.id || index} className={`cursor-pointer hover:bg-gray-50 rounded px-1 transition-colors duration-200 ${highlightedVerse === verse.verse_key ? 'active-verse' : ''}`} onClick={(e) => handleVerseClick(verse, e)}>
                {verse.text_uthmani || "نص الآية غير متوفر"}
                <span className="verse-number">{verse.verse_number}</span>
                {index < verses.length - 1 && " "}
              </span>
            ))}
          </div>
        )}
      </div>

      {menuState.visible && menuState.verse && (
        <div
          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 slide-up flex flex-col"
          style={{
            left: Math.min(menuState.position.x, window.innerWidth - 200),
            top: Math.min(menuState.position.y, window.innerHeight - 250),
          }}
        >
          <button onClick={() => handleMenuAction('listen')} className="w-full px-4 py-2 text-right hover:bg-gray-50 flex items-center gap-3 transition-colors font-ui"><Play size={16} /><span>استماع للآية</span></button>
          <button onClick={() => handleMenuAction('bookmark')} className="w-full px-4 py-2 text-right hover:bg-gray-50 flex items-center gap-3 transition-colors font-ui"><Bookmark size={16} /><span>إضافة للمفضلة</span></button>
          <button onClick={() => handleMenuAction('share')} className="w-full px-4 py-2 text-right hover:bg-gray-50 flex items-center gap-3 transition-colors font-ui"><Share2 size={16} /><span>مشاركة الآية</span></button>
          <button onClick={() => handleMenuAction('tafsir')} className="w-full px-4 py-2 text-right hover:bg-gray-50 flex items-center gap-3 transition-colors font-ui"><BookOpen size={16} /><span>عرض التفسير</span></button>
          <button onClick={() => handleMenuAction('translation')} className="w-full px-4 py-2 text-right hover:bg-gray-50 flex items-center gap-3 transition-colors font-ui"><FileText size={16} /><span>عرض الترجمة</span></button>
        </div>
      )}
    </div>
  );
}
