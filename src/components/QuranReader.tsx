import { useState, useEffect, useRef } from "react";
import { useAction, useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { QuranPage } from "./QuranPage";
import { QuranHeader } from "./QuranHeader";
import { QuranControls } from "./QuranControls";
import { SearchPanel } from "./SearchPanel";
import { IndexPanel } from "./IndexPanel";
import { SettingsPage } from "../pages/SettingsPage";
import { BookmarksPanel } from "./BookmarksPanel";
import { RemindersPanel } from "./RemindersPanel";
import { KhatmahPanel } from "./KhatmahPanel";
import { VerseImageGenerator } from "./VerseImageGenerator";
import { AudioPlayer } from "./AudioPlayer";
import { type Verse } from "../lib/types";
import { appEmitter } from "../lib/events";
import { surahData } from "../lib/surah-data";
import { juzData } from "../lib/juz-data";

export const AUDIO_BASE_URL = 'https://verses.quran.com/';

interface PageData {
  verses: Verse[];
  pagination?: any;
  meta?: any;
}

interface QuranReaderProps {
  onAskAi: (verse: Verse) => void;
  showControls: boolean;
  onPageClick: () => void;
}

export function QuranReader({ onAskAi, showControls, onPageClick }: QuranReaderProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [audioPlaylist, setAudioPlaylist] = useState<any[]>([]);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [showSettingsPage, setShowSettingsPage] = useState(false);
  const [verseToShare, setVerseToShare] = useState<Verse | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [highlightedVerse, setHighlightedVerse] = useState<string | null>(null);
  const [layoutMode, setLayoutMode] = useState('flow');
  const [forcePlay, setForcePlay] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right' | 'fade' | null>(null);

  const localSettings = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('quranSettings') || '{}') : {};
  const [selectedReciter, setSelectedReciter] = useState(localSettings.selectedReciter || 7);
  const [selectedTafsir, setSelectedTafsir] = useState(localSettings.selectedTafsir || 167);
  const [selectedTranslation, setSelectedTranslation] = useState(localSettings.selectedTranslation || 131);
  const [fontSize, setFontSize] = useState(localSettings.fontSize || 'medium');
  const [autoPlay, setAutoPlay] = useState(localSettings.autoPlay || false);
  const [arabicFont, setArabicFont] = useState(localSettings.arabicFont || 'uthmani');
  const [currentTheme, setCurrentTheme] = useState(localSettings.theme || 'sepia');

  const containerRef = useRef<HTMLDivElement>(null);
  
  const getPageData = useAction(api.quran.getPageData);
  const userPreferences = useQuery(api.quran.getUserPreferences);
  const updateProgress = useMutation(api.quran.updateReadingProgress);
  
  const loadPage = async (pageNumber: number, options?: { shouldStartPlaying?: boolean, newReciterId?: number }) => {
    const shouldPlay = options?.shouldStartPlaying ?? false;
    const reciterToFetch = options?.newReciterId ?? selectedReciter;

    if (pageNumber < 1 || pageNumber > 604) {
      toast.error("رقم الصفحة غير صالح");
      return;
    }
    
    setIsLoading(true);
    try {
      const data = await getPageData({
        pageNumber,
        reciterId: reciterToFetch,
        tafsirId: selectedTafsir,
        translationId: selectedTranslation,
      });
      
      if (!data || !data.verses || data.verses.length === 0) {
        throw new Error("لا توجد آيات في هذه الصفحة");
      }
      
      setPageData(data);

      const newAudioPlaylist = data.verses.map(verse => {
        if (verse.audio?.url) {
          return {
            verseKey: verse.verse_key,
            url: `https://verses.quran.com/${verse.audio.url}`
          };
        }
        return null;
      }).filter(item => item !== null);

      setAudioPlaylist(newAudioPlaylist);
      setCurrentPage(pageNumber);
      setForcePlay(shouldPlay);

      await updateProgress({ pageNumber });
      localStorage.setItem('quranLastPage', pageNumber.toString());
      checkPageReminder(pageNumber);
      toast.success(`تم تحميل الصفحة ${pageNumber}`);
    } catch (error: any) {
      console.error("Error loading page:", error);
      toast.error(error.message || "خطأ في تحميل الصفحة");
      if (!pageData) {
        setPageData({ verses: [] });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const playVerseInMainPlayer = (newPlaylist: any[]) => {
    setAudioPlaylist(newPlaylist);
    setForcePlay(true);
  };

  const handlePlayFromEmpty = () => {
    if (pageData?.verses) {
      const newAudioPlaylist = pageData.verses.map(verse => {
        if (verse.audio?.url) {
          return {
            verseKey: verse.verse_key,
            url: `https://verses.quran.com/${verse.audio.url}`
          };
        }
        return null;
      }).filter(item => item !== null);

      if (newAudioPlaylist.length > 0) {
        setAudioPlaylist(newAudioPlaylist);
        setForcePlay(true);
      } else {
        toast.error("لا يوجد صوت لهذه الصفحة");
      }
    }
  };

  const checkPageReminder = (pageNumber: number) => {
    const reminders = JSON.parse(localStorage.getItem('pageReminders') || '[]');
    const reminder = reminders.find((r: any) => r.pageNumber === pageNumber);
    if (reminder) {
      toast.success(`تذكير: ${reminder.note}`, { duration: 5000 });
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-dark', 'theme-green', 'theme-sepia', 'theme-light');
    root.classList.add(`theme-${currentTheme}`);
  }, [currentTheme]);
  
  useEffect(() => {
    const initializeApp = async () => {
      const savedPage = localStorage.getItem('quranLastPage');
      const initialPage = savedPage ? parseInt(savedPage) : 1;
      await loadPage(initialPage, { shouldStartPlaying: false });
    };
    initializeApp();
  }, []);

  useEffect(() => {
    if (userPreferences && currentPage > 0 && pageData) {
      loadPage(currentPage, { shouldStartPlaying: false });
    }
  }, [userPreferences?.selectedReciter, userPreferences?.selectedTafsir]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isNext = distance > 50 && currentPage < 604;
    const isPrev = distance < -50 && currentPage > 1;

    if (isNext) {
      setAnimationDirection('left');
      loadPage(currentPage + 1, { shouldStartPlaying: false });
    } else if (isPrev) {
      setAnimationDirection('right');
      loadPage(currentPage - 1, { shouldStartPlaying: false });
    }
  };

  const handleShareVerse = (verse: Verse) => {
    setVerseToShare(verse);
  };

  const goToNextPage = () => {
    if (currentPage < 604) {
      setAnimationDirection('left');
      loadPage(currentPage + 1, { shouldStartPlaying: true });
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setAnimationDirection('right');
      loadPage(currentPage - 1, { shouldStartPlaying: false });
    }
  };

  const goToPage = (pageNumber: number) => {
    setAnimationDirection('fade');
    loadPage(pageNumber, { shouldStartPlaying: false });
    setActivePanel(null);
  };

  const goToVerse = (pageNumber: number, verseKey: string) => {
    if (pageNumber !== currentPage) {
      loadPage(pageNumber, { shouldStartPlaying: false });
    }
    setHighlightedVerse(verseKey);
    setTimeout(() => {
      const verseElement = document.querySelector(`[data-verse-key="${verseKey}"]`);
      if (verseElement) {
        verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 500);
    setActivePanel(null);
    toast.success(`تم الانتقال إلى الآية ${verseKey}`);
  };

  useEffect(() => {
    if (currentPage === 604) {
      setTimeout(() => setActivePanel('completion'), 2000);
    }
  }, [currentPage]);

  useEffect(() => {
    const handleNavigateToPage = (data: { page: number }) => {
      if (data && typeof data.page === 'number') {
        goToPage(data.page);
      }
    };

    const handleNavigateToSurah = (data: { surahName: string }) => {
      if (data && typeof data.surahName === 'string') {
        // BUG FIX: Use a more robust search logic.
        // The AI might send "سورة طه" and we need to find "طه" in it.
        const surah = surahData.find(s => data.surahName.includes(s.arabicName));
        if (surah) {
          goToPage(surah.startPage);
        } else {
          toast.error(`لم يتم العثور على سورة "${data.surahName}"`);
        }
      }
    };

    appEmitter.on('navigateToPage', handleNavigateToPage);
    appEmitter.on('navigateToSurah', handleNavigateToSurah);

    const handleChangeTheme = (data: { theme: string }) => {
        if (data && typeof data.theme === 'string') {
            const validThemes = ['light', 'dark', 'green', 'sepia'];
            if (validThemes.includes(data.theme)) {
                setCurrentTheme(data.theme);
                toast.success(`تم تغيير المظهر إلى ${data.theme}`);
            }
        }
    };

    const handleChangeFontSize = (data: { size: string }) => {
        if (data && typeof data.size === 'string') {
            const validSizes = ['small', 'medium', 'large'];
            if (validSizes.includes(data.size)) {
                setFontSize(data.size);
                toast.success(`تم تغيير حجم الخط إلى ${data.size}`);
            }
        }
    };

    appEmitter.on('changeTheme', handleChangeTheme);
    appEmitter.on('changeFontSize', handleChangeFontSize);

    const handleNavigateToJuz = (data: { juz: number }) => {
        if (data && typeof data.juz === 'number') {
            const juz = juzData.find(j => j.id === data.juz);
            if (juz) {
                goToPage(juz.startPage);
            } else {
                toast.error(`لم يتم العثور على جزء "${data.juz}"`);
            }
        }
    };
    appEmitter.on('navigateToJuz', handleNavigateToJuz);

    const handleNavigateToVerse = (data: { pageNumber: number, verseKey: string }) => {
        if (data && data.pageNumber && data.verseKey) {
            goToVerse(data.pageNumber, data.verseKey);
        }
    };
    appEmitter.on('navigateToVerse', handleNavigateToVerse);

    return () => {
      appEmitter.off('navigateToPage', handleNavigateToPage);
      appEmitter.off('navigateToSurah', handleNavigateToSurah);
      appEmitter.off('changeTheme', handleChangeTheme);
      appEmitter.off('changeFontSize', handleChangeFontSize);
      appEmitter.off('navigateToJuz', handleNavigateToJuz);
      appEmitter.off('navigateToVerse', handleNavigateToVerse);
    };
  }, [goToPage]);

  return (
    <div className="min-h-screen bg-main relative">
      <QuranHeader
        currentPage={currentPage}
        verses={pageData?.verses || []}
        showControls={showControls}
        onOpenPanel={(panel) => {
          if (panel === 'settings') {
            setShowSettingsPage(true);
          } else {
            setActivePanel(panel);
          }
        }}
        layoutMode={layoutMode}
        onToggleLayout={() => setLayoutMode(prev => prev === 'list' ? 'flow' : 'list')}
      />

      {audioPlaylist && audioPlaylist.length > 0 && (
        <div className={`fixed top-16 left-0 right-0 z-50 p-2 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 invisible'}`}>
          <AudioPlayer
            playlist={audioPlaylist}
            showControls={true}
            isInHeader={true}
            onTrackChange={setHighlightedVerse}
            onPlaylistEnded={() => {
              if (autoPlay) {
                goToNextPage();
              }
            }}
            onPlayFromEmpty={handlePlayFromEmpty}
            autoPlay={autoPlay}
            startPlaying={forcePlay}
            onPlaybackStarted={() => setForcePlay(false)}
          />
        </div>
      )}

      <main
        ref={containerRef}
        className="pt-32 pb-20 min-h-screen px-4"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={onPageClick}
      >
        <div className="py-6">
          <QuranPage
            verses={pageData?.verses || []}
            isLoading={isLoading}
            currentPage={currentPage}
            userPreferences={userPreferences}
            playVerseInMainPlayer={playVerseInMainPlayer}
            highlightedVerse={highlightedVerse}
            layoutMode={layoutMode}
            fontSize={fontSize}
            arabicFont={arabicFont}
            onAskAi={onAskAi}
            animationDirection={animationDirection}
            onShareVerse={handleShareVerse}
          />
        </div>
      </main>

      <QuranControls
        currentPage={currentPage}
        showControls={showControls}
        onPrevPage={goToPrevPage}
        onNextPage={goToNextPage}
        onGoToPage={goToPage}
      />

      {activePanel === 'search' && (
        <SearchPanel
          onClose={() => setActivePanel(null)}
          onGoToVerse={goToVerse}
          playVerseInMainPlayer={playVerseInMainPlayer}
          selectedReciter={selectedReciter}
        />
      )}
      {activePanel === 'index' && <IndexPanel onClose={() => setActivePanel(null)} onGoToPage={goToPage} />}
      {showSettingsPage && (
        <SettingsPage
          onClose={() => setShowSettingsPage(false)}
          loadPage={(options) => loadPage(currentPage, options)}
          currentPage={currentPage}
          selectedReciter={selectedReciter}
          selectedTafsir={selectedTafsir}
          selectedTranslation={selectedTranslation}
          fontSize={fontSize}
          autoPlay={autoPlay}
          currentTheme={currentTheme}
          arabicFont={arabicFont}
          setSelectedReciter={setSelectedReciter}
          setSelectedTafsir={setSelectedTafsir}
          setSelectedTranslation={setSelectedTranslation}
          setFontSize={setFontSize}
          setAutoPlay={setAutoPlay}
          setCurrentTheme={setCurrentTheme}
          setArabicFont={setArabicFont}
        />
      )}
      {activePanel === 'bookmarks' && <BookmarksPanel onClose={() => setActivePanel(null)} onGoToPage={goToPage} />}
      {activePanel === 'reminders' && <RemindersPanel onClose={() => setActivePanel(null)} currentPage={currentPage} />}
      {activePanel === 'khatmah' && <KhatmahPanel onClose={() => setActivePanel(null)} />}
      {verseToShare && <VerseImageGenerator verse={verseToShare} onClose={() => setVerseToShare(null)} />}
      {activePanel === 'completion' && <CompletionPanel onClose={() => setActivePanel(null)} onRestart={() => { setActivePanel(null); goToPage(1); }} />}
    </div>
  );
}

function CompletionPanel({ onClose, onRestart }: { onClose: () => void; onRestart: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 font-ui">
            تهانينا! لقد أتممت قراءة القرآن الكريم
          </h2>
          <div className="bg-green-50 p-6 rounded-lg border-r-4 border-green-400">
            <h3 className="font-semibold text-green-800 mb-4 font-ui">دعاء ختم القرآن</h3>
            <p className="text-green-700 font-ui leading-relaxed text-lg" dir="rtl">
              اللَّهُمَّ ارْحَمْنِي بِالْقُرْآنِ، وَاجْعَلْهُ لِي إِمَامًا وَنُورًا وَهُدًى وَرَحْمَةً.
              اللَّهُمَّ ذَكِّرْنِي مِنْهُ مَا نَسِيتُ، وَعَلِّمْنِي مِنْهُ مَا جَهِلْتُ، وَارْزُقْنِي تِلَاوَتَهُ آنَاءَ اللَّيْلِ وَأَطْرَافَ النَّهَارِ، وَاجْعَلْهُ لِي حُجَّةً يَا رَبَّ الْعَالَمِينَ.
            </p>
          </div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={onRestart}
              className="px-6 py-3 bg-[var(--color-accent)] text-white rounded-lg hover:bg-[#6b5b47] transition-colors font-ui"
            >
              ابدأ من جديد
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-ui"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
