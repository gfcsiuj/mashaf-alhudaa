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
import { AudioPlayer } from "./AudioPlayer";

// تعريف الرابط الأساسي للصوتيات
export const AUDIO_BASE_URL = 'https://verses.quran.com/';

interface Verse {
  id: number;
  verse_key: string;
  text_uthmani: string;
  chapter_id: number;
  verse_number: number;
  page_number: number;
  juz_number?: number;
  audio?: {
    url: string;
    duration?: number;
  };
}

interface PageData {
  verses: Verse[];
  pagination?: any;
  meta?: any;
}

export function QuranReader() {
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [audioPlaylist, setAudioPlaylist] = useState<any[]>([]);
  const [showControls, setShowControls] = useState(true);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [showSettingsPage, setShowSettingsPage] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [highlightedVerse, setHighlightedVerse] = useState<string | null>(null);
  const [layoutMode, setLayoutMode] = useState('list'); // 'list' or 'flow'
  
  // Global State Variables - مصدر الحقيقة الوحيد في التطبيق
  // تحميل الإعدادات من localStorage إذا كانت موجودة
  const localSettings = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('quranSettings') || '{}') : {};
  const [selectedReciter, setSelectedReciter] = useState(localSettings.selectedReciter || 7); // Default to Al-Afasy
  const [selectedTafsir, setSelectedTafsir] = useState(localSettings.selectedTafsir || 167); // Default to Jalalayn
  const [selectedTranslation, setSelectedTranslation] = useState(localSettings.selectedTranslation || 131); // Default translation
  const [currentTheme, setCurrentTheme] = useState(localSettings.theme || 'light'); // إضافة حالة للثيم الحالي
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Convex hooks
  const getPageData = useAction(api.quran.getPageData);
  const getPageAudio = useAction(api.quran.getPageAudio);
  const userPreferences = useQuery(api.quran.getUserPreferences);
  const updateProgress = useMutation(api.quran.updateReadingProgress);
  
  // Load page data
  const loadPage = async (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > 604) {
      toast.error("رقم الصفحة غير صالح");
      return;
    }
    
    setIsLoading(true);
    try {
      console.log("Loading page:", pageNumber);
      
      // Use a single, all-in-one request to get all page data
      const data = await getPageData({
        pageNumber,
        reciterId: selectedReciter,
        tafsirId: selectedTafsir,
        translationId: selectedTranslation,
      });
      
      console.log("Page data loaded (all-in-one):", data);
      
      if (!data || !data.verses || data.verses.length === 0) {
        throw new Error("لا توجد آيات في هذه الصفحة");
      }
      
      setPageData(data);
      
      // Construct the audio playlist from the verse data itself
      const audioPlaylist = data.verses.map(verse => {
        if (verse.audio?.url) {
          return {
            verseKey: verse.verse_key,
            url: `https://verses.quran.com/${verse.audio.url}`
          };
        }
        return null;
      }).filter(item => item !== null);

      setAudioPlaylist(audioPlaylist);
      setCurrentPage(pageNumber);
      
      // Update reading progress
      try {
        await updateProgress({ pageNumber });
      } catch (progressError) {
        console.warn("Failed to update progress:", progressError);
      }
      
      // Save to localStorage
      localStorage.setItem('quranLastPage', pageNumber.toString());
      
      // Check for reminders
      checkPageReminder(pageNumber);
      
      toast.success(`تم تحميل الصفحة ${pageNumber}`);
    } catch (error: any) {
      console.error("Error loading page:", error);
      toast.error(error.message || "خطأ في تحميل الصفحة");
      
      // Set fallback state
      if (!pageData) {
        setPageData({ verses: [] });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // دالة لتشغيل آية محددة في مشغل الصوت الرئيسي
  const playVerseInMainPlayer = (verseKey: string, audioUrl: string) => {
    // إنشاء قائمة تشغيل جديدة تحتوي فقط على الآية المحددة
    const singleVersePlaylist = [{
      verseKey: verseKey,
      url: audioUrl
    }];
    
    // تحديث قائمة التشغيل الرئيسية
    setAudioPlaylist(singleVersePlaylist);
    setCurrentVerseAudio(audioUrl);
    
    // إذا كانت لوحة الصوت مفتوحة، أغلقها
    if (activePanel === 'audio') {
      setActivePanel(null);
    }
  };

  // Check for page reminders
  const checkPageReminder = (pageNumber: number) => {
    const reminders = JSON.parse(localStorage.getItem('pageReminders') || '[]');
    const reminder = reminders.find((r: any) => r.pageNumber === pageNumber);
    
    if (reminder) {
      toast.success(`تذكير: ${reminder.note}`, {
        duration: 5000,
      });
    }
  };

  // تطبيق الثيم الحالي على العنصر الرئيسي
  useEffect(() => {
    // إزالة جميع فئات الثيم السابقة
    document.documentElement.classList.remove('theme-light', 'theme-dark', 'theme-sepia', 'theme-green');
    
    // إضافة فئة الثيم الحالي
    if (currentTheme !== 'light') { // الثيم الفاتح هو الافتراضي ولا يحتاج إلى فئة
      document.documentElement.classList.add(`theme-${currentTheme}`);
    }
  }, [currentTheme]);
  
  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const savedPage = localStorage.getItem('quranLastPage');
        const initialPage = savedPage ? parseInt(savedPage) : 1;
        console.log("Initializing with page:", initialPage);
        await loadPage(initialPage);
      } catch (error) {
        console.error("Error initializing app:", error);
        setIsLoading(false);
      }
    };
    
    initializeApp();
  }, []);

  // Reload when preferences change (but not on initial load)
  useEffect(() => {
    if (userPreferences && currentPage > 0 && pageData) {
      console.log("Preferences changed, reloading page");
      loadPage(currentPage);
    }
  }, [userPreferences?.selectedReciter, userPreferences?.selectedTafsir]);

  // Touch handlers for swipe navigation
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
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentPage < 604) {
      loadPage(currentPage + 1);
    }
    if (isRightSwipe && currentPage > 1) {
      loadPage(currentPage - 1);
    }
  };

  // Click to toggle controls
  const handlePageClick = (event: React.MouseEvent) => {
    // منع انتشار الحدث لتجنب التأثير على مشغل الصوت
    event.stopPropagation();
    
    // تبديل حالة عناصر التحكم فقط
    setShowControls(!showControls);
  };

  // Navigation functions
  const goToNextPage = () => {
    if (currentPage < 604) loadPage(currentPage + 1);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) loadPage(currentPage - 1);
  };

  const goToPage = (pageNumber: number) => {
    loadPage(pageNumber);
    setActivePanel(null);
  };

  // Show completion prayer when reaching the end
  useEffect(() => {
    if (currentPage === 604) {
      setTimeout(() => {
        setActivePanel('completion');
      }, 2000);
    }
  }, [currentPage]);

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Header */}
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
        audioPlaylist={audioPlaylist}
        onTrackChange={setHighlightedVerse}
        layoutMode={layoutMode}
        onToggleLayout={() => setLayoutMode(prev => prev === 'list' ? 'flow' : 'list')}
      />

      {/* Audio Player - لا نعرضه هنا بعد الآن لأننا سننقله إلى القائمة العلوية */}

      {/* Main Content */}
      <main
        ref={containerRef}
        className="pt-16 pb-20 min-h-screen px-4"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handlePageClick}
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
      />
        </div>
      </main>

      {/* Bottom Controls */}
      <QuranControls
        currentPage={currentPage}
        showControls={showControls}
        onPrevPage={goToPrevPage}
        onNextPage={goToNextPage}
        onGoToPage={goToPage}
      />

      {/* Side Panels */}
      {activePanel === 'search' && (
        <SearchPanel
          onClose={() => setActivePanel(null)}
          onGoToPage={goToPage}
        />
      )}
      
      {activePanel === 'index' && (
        <IndexPanel
          onClose={() => setActivePanel(null)}
          onGoToPage={goToPage}
        />
      )}
      
      {showSettingsPage && (
        <SettingsPage
          onClose={() => setShowSettingsPage(false)}
          currentPage={currentPage}
          loadPage={loadPage}
          setSelectedReciter={setSelectedReciter}
          setSelectedTafsir={setSelectedTafsir}
          setSelectedTranslation={setSelectedTranslation}
        />
      )}
      
      {activePanel === 'bookmarks' && (
        <BookmarksPanel
          onClose={() => setActivePanel(null)}
          onGoToPage={goToPage}
        />
      )}

      {activePanel === 'reminders' && (
        <RemindersPanel
          onClose={() => setActivePanel(null)}
          currentPage={currentPage}
        />
      )}

      {/* تم إزالة لوحة الصوت المنبثقة لأننا أضفنا مشغل الصوت مباشرة في الشريط العلوي */}

      {activePanel === 'completion' && (
        <CompletionPanel
          onClose={() => setActivePanel(null)}
          onRestart={() => {
            setActivePanel(null);
            goToPage(1);
          }}
        />
      )}
    </div>
  );
}

// Completion Prayer Panel
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
              className="px-6 py-3 bg-[#8b7355] text-white rounded-lg hover:bg-[#6b5b47] transition-colors font-ui"
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
