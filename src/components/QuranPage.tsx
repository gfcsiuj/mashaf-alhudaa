import { useState } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

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
}

interface QuranPageProps {
  verses: Verse[];
  isLoading: boolean;
  currentPage: number;
  userPreferences: any;
}

export function QuranPage({ verses, isLoading, currentPage, userPreferences }: QuranPageProps) {
  const [selectedVerse, setSelectedVerse] = useState<string | null>(null);
  const [showVerseMenu, setShowVerseMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  
  const addBookmark = useMutation(api.quran.addBookmark);
  const getVerseAudio = useAction(api.quran.getVerseAudio);

  // Handle long press on verse
  const handleVerseLongPress = (verse: Verse, event: React.MouseEvent) => {
    event.preventDefault();
    setSelectedVerse(verse.verse_key);
    setMenuPosition({ x: event.clientX, y: event.clientY });
    setShowVerseMenu(true);
  };

  // Handle bookmark
  const handleBookmark = async () => {
    if (!selectedVerse) return;
    
    const verse = verses.find(v => v.verse_key === selectedVerse);
    if (!verse) return;

    try {
      await addBookmark({
        pageNumber: currentPage,
        verseKey: verse.verse_key,
        verseText: verse.text_uthmani,
      });
      toast.success("تم حفظ الآية في المفضلة");
    } catch (error) {
      toast.error("خطأ في حفظ الآية");
    }
    
    setShowVerseMenu(false);
    setSelectedVerse(null);
  };

  // Handle verse audio playback
  const handlePlayVerse = async () => {
    if (!selectedVerse) return;

    try {
      const audioData = await getVerseAudio({ 
        verseKey: selectedVerse,
        reciterId: userPreferences?.selectedReciter || 7
      });
      
      if (audioData?.url) {
        const audio = new Audio(audioData.url);
        audio.play();
        toast.success("بدء تشغيل الآية");
      } else {
        toast.error("لا يتوفر صوت لهذه الآية");
      }
    } catch (error) {
      toast.error("خطأ في تشغيل الصوت");
      console.error("Error playing verse:", error);
    }
    
    setShowVerseMenu(false);
    setSelectedVerse(null);
  };

  // Handle verse sharing
  const handleShareVerse = async () => {
    if (!selectedVerse) return;
    
    const verse = verses.find(v => v.verse_key === selectedVerse);
    if (!verse) return;

    const shareText = `${verse.text_uthmani}\n\n(${verse.verse_key})`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'آية من القرآن الكريم',
          text: shareText,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        toast.success("تم نسخ الآية");
      } catch (error) {
        toast.error("خطأ في النسخ");
      }
    }
    
    setShowVerseMenu(false);
    setSelectedVerse(null);
  };

  // Close menu when clicking outside
  const handlePageClick = (event: React.MouseEvent) => {
    if (showVerseMenu) {
      setShowVerseMenu(false);
      setSelectedVerse(null);
      event.stopPropagation();
    }
  };

  // Check if this is the start of a new chapter
  const isNewChapter = () => {
    if (!verses.length) return false;
    const firstVerse = verses[0];
    return firstVerse.verse_number === 1;
  };

  // Get chapter name
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 spinner mx-auto"></div>
          <p className="text-gray-600 font-ui">جاري تحميل الصفحة...</p>
        </div>
      </div>
    );
  }

  if (!verses || verses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-gray-600 font-ui">لا توجد آيات في هذه الصفحة</p>
          <p className="text-gray-500 text-sm font-ui">تحقق من رقم الصفحة أو حاول مرة أخرى</p>
        </div>
      </div>
    );
  }

  const fontSize = userPreferences?.fontSize || 'medium';
  const arabicFont = userPreferences?.arabicFont || 'uthmani';
  const showTranslation = userPreferences?.showTranslation || false;
  const showTafsir = userPreferences?.showTafsir || false;

  const fontSizeClasses: Record<string, string> = {
    small: 'text-lg',
    medium: 'text-xl',
    large: 'text-2xl'
  };

  const fontFamilyClasses: Record<string, string> = {
    uthmani: 'font-quran',
    indopak: 'font-indopak',
    qpc: 'font-qpc'
  };

  // Group verses into a continuous text flow
  const renderVersesAsFlow = () => {
    const firstVerse = verses[0];
    const isChapterStart = isNewChapter();
    const chapterName = getChapterName(firstVerse?.chapter_id);
    const shouldShowBasmala = isChapterStart && firstVerse?.chapter_id !== 9; // No Basmala for At-Tawbah

    return (
      <div className="space-y-6">
        {/* Chapter Header */}
        {isChapterStart && (
          <div className="text-center space-y-4 mb-8">
            <div className="inline-block px-6 py-3 bg-[#8b7355] text-white rounded-lg">
              <h2 className="text-xl font-bold font-ui">سورة {chapterName}</h2>
            </div>
            
            {/* Basmala */}
            {shouldShowBasmala && (
              <div className="text-center py-4">
                <p className={`${fontFamilyClasses[arabicFont]} text-2xl text-[#8b7355] leading-loose`} dir="rtl">
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </p>
              </div>
            )}
          </div>
        )}

        {/* Verses */}
        <div 
          className={`${fontFamilyClasses[arabicFont]} ${fontSizeClasses[fontSize]} leading-loose text-justify`}
          dir="rtl"
          style={{ textAlignLast: 'center' }}
        >
          {verses.map((verse, index) => (
            <span key={verse.id || index}>
              <span
                className="cursor-pointer hover:bg-gray-50 rounded px-1 transition-colors duration-200"
                onContextMenu={(e) => handleVerseLongPress(verse, e)}
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  setTimeout(() => {
                    handleVerseLongPress(verse, {
                      clientX: touch.clientX,
                      clientY: touch.clientY,
                      preventDefault: () => {},
                    } as any);
                  }, 500);
                }}
              >
                {verse.text_uthmani || "نص الآية غير متوفر"}
              </span>
              <span className="verse-number">
                {verse.verse_number}
              </span>
              {index < verses.length - 1 && " "}
            </span>
          ))}
        </div>

        {/* Translation */}
        {showTranslation && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
            <h3 className="font-semibold text-blue-800 mb-2 font-ui">الترجمة</h3>
            {verses.map((verse, index) => (
              <div key={`translation-${verse.id || index}`} className="mb-4 last:mb-0">
                <p className="text-gray-600 text-sm font-ui mb-1">{verse.verse_key}</p>
                <p className="text-blue-700 font-ui">
                  {verse.translations && verse.translations[0] ? verse.translations[0].text : "الترجمة غير متوفرة"}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Tafsir */}
        {showTafsir && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
            <h3 className="font-semibold text-green-800 mb-2 font-ui">التفسير</h3>
            {verses.map((verse, index) => (
              <div key={`tafsir-${verse.id || index}`} className="mb-4 last:mb-0">
                <p className="text-gray-600 text-sm font-ui mb-1">{verse.verse_key}</p>
                <p className="text-green-700 font-ui">
                  {verse.tafsirs && verse.tafsirs[0] ? verse.tafsirs[0].text : "التفسير غير متوفر"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm border border-gray-200 fade-in"
      onClick={handlePageClick}
    >
      {/* Page Header */}
      <div className="text-center mb-8 pb-4 border-b border-gray-200">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full">
          <span className="text-gray-700 font-ui font-medium">صفحة</span>
          <span className="text-[#8b7355] font-ui font-bold text-lg">{currentPage}</span>
        </div>
        <p className="text-sm text-gray-600 mt-2 font-ui">
          {verses.length} آية
        </p>
      </div>

      {/* Verses Flow */}
      <div className="mb-8">
        {renderVersesAsFlow()}
      </div>

      {/* Verse Context Menu */}
      {showVerseMenu && (
        <div
          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 slide-up"
          style={{
            left: Math.min(menuPosition.x, window.innerWidth - 200),
            top: Math.min(menuPosition.y, window.innerHeight - 180),
          }}
        >
          <button
            onClick={handleBookmark}
            className="w-full px-4 py-2 text-right hover:bg-gray-50 flex items-center gap-3 transition-colors font-ui"
          >
            <svg className="w-4 h-4 text-[#8b7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <span>إضافة للمفضلة</span>
          </button>
          <button
            onClick={handlePlayVerse}
            className="w-full px-4 py-2 text-right hover:bg-gray-50 flex items-center gap-3 transition-colors font-ui"
          >
            <svg className="w-4 h-4 text-[#8b7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15a2 2 0 002-2V9a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293L10.293 4.293A1 1 0 009.586 4H8a2 2 0 00-2 2v5a2 2 0 002 2z" />
            </svg>
            <span>استماع للآية</span>
          </button>
          <button
            onClick={handleShareVerse}
            className="w-full px-4 py-2 text-right hover:bg-gray-50 flex items-center gap-3 transition-colors font-ui"
          >
            <svg className="w-4 h-4 text-[#8b7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            <span>مشاركة الآية</span>
          </button>
        </div>
      )}
    </div>
  );
}
