import { useState } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { AUDIO_BASE_URL } from "./QuranReader";
import { BookOpen, FileText, Play, Bookmark, Share2, Bot } from "lucide-react";
import { type Verse } from "../lib/types";
import { surahData } from "../lib/surah-data";

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
  onAskAi: (verse: Verse) => void;
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
    <div className={`verse-container mb-4 p-4 rounded-lg border bg-main shadow-sm transition-colors ${isHighlighted ? 'active-verse' : 'border-main'}`}>
      <p
        className={`${fontFamilyClasses[arabicFont]} ${fontSizeClasses[fontSize]} leading-loose text-justify cursor-pointer text-main`}
        onClick={(e) => onVerseClick(verse, e)}
      >
        {verse.text_uthmani}
        <span className="verse-number">{verse.verse_number}</span>
      </p>

      {showTafsir && (
        <div className="mt-4 p-3 bg-green-500/10 rounded-lg border-l-4 border-green-500/50">
          <h3 className="font-bold text-green-700 dark:text-green-300 mb-2 font-ui">التفسير</h3>
          <p className="text-green-800 dark:text-green-200 font-ui">{tafsirText}</p>
        </div>
      )}
      {showTranslation && (
        <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border-l-4 border-blue-500/50">
          <h3 className="font-bold text-blue-700 dark:text-blue-300 mb-2 font-ui">الترجمة</h3>
          <p className="text-blue-800 dark:text-blue-200 font-ui">{translationText}</p>
        </div>
      )}
    </div>
  );
}

export function QuranPage({ verses, isLoading, currentPage, userPreferences, playVerseInMainPlayer, highlightedVerse, layoutMode, fontSize, arabicFont, onAskAi }: QuranPageProps) {
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
      case 'ask_ai':
        onAskAi(verse);
        break;
    }
    handleCloseMenu();
  };

  const getChapterName = (chapterId: number): string => {
    const surah = surahData.find(s => s.id === chapterId);
    return surah ? surah.arabicName : "";
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

      {isChapterStart && (
        <div className="w-full my-8">
          <div className="flex items-center justify-center">
            <div className="px-8 py-4 bg-hover border-2 border-main rounded-lg shadow-md">
              <h2 className="text-3xl font-bold font-quran text-main">سورة {chapterName}</h2>
            </div>
          </div>
          {shouldShowBasmala && (
            <div className="text-center py-6 mt-4">
              <p className="font-quran text-4xl text-accent leading-loose basmala">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
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
          <div className={`${fontFamilyClasses[arabicFont]} text-3xl leading-relaxed text-right text-main p-4`} dir="rtl">
            {verses.map((verse, index) => (
              <span key={verse.id || index} className={`cursor-pointer hover:bg-hover rounded px-1 transition-colors duration-200 ${highlightedVerse === verse.verse_key ? 'active-verse' : ''}`} onClick={(e) => handleVerseClick(verse, e)}>
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
          className="fixed bg-main rounded-lg shadow-xl border border-main py-2 z-50 slide-up flex flex-col"
          style={{
            left: Math.min(menuState.position.x, window.innerWidth - 200),
            top: Math.min(menuState.position.y, window.innerHeight - 250),
          }}
        >
          <button onClick={() => handleMenuAction('listen')} className="w-full px-4 py-2 text-right bg-hover flex items-center gap-3 transition-colors text-main"><Play size={16} /><span>استماع للآية</span></button>
          <button onClick={() => handleMenuAction('bookmark')} className="w-full px-4 py-2 text-right bg-hover flex items-center gap-3 transition-colors text-main"><Bookmark size={16} /><span>إضافة للمفضلة</span></button>
          <button onClick={() => handleMenuAction('share')} className="w-full px-4 py-2 text-right bg-hover flex items-center gap-3 transition-colors text-main"><Share2 size={16} /><span>مشاركة الآية</span></button>
          <button onClick={() => handleMenuAction('tafsir')} className="w-full px-4 py-2 text-right bg-hover flex items-center gap-3 transition-colors text-main"><BookOpen size={16} /><span>عرض التفسير</span></button>
          <button onClick={() => handleMenuAction('translation')} className="w-full px-4 py-2 text-right bg-hover flex items-center gap-3 transition-colors text-main"><FileText size={16} /><span>عرض الترجمة</span></button>
          <div className="border-t border-main my-1"></div>
          <button onClick={() => handleMenuAction('ask_ai')} className="w-full px-4 py-2 text-right bg-hover flex items-center gap-3 transition-colors text-main text-blue-600 dark:text-blue-400"><Bot size={16} /><span>اسأل عبدالحكيم</span></button>
        </div>
      )}
    </div>
  );
}
