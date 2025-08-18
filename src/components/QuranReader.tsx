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
  const [layoutMode, setLayoutMode] = useState('flow');
  const [forcePlay, setForcePlay] = useState(false);

  const localSettings = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('quranSettings') || '{}') : {};
  const [selectedReciter, setSelectedReciter] = useState(localSettings.selectedReciter || 7);
  const [selectedTafsir, setSelectedTafsir] = useState(localSettings.selectedTafsir || 167);
  const [selectedTranslation, setSelectedTranslation] = useState(localSettings.selectedTranslation || 131);
  const [fontSize, setFontSize] = useState(localSettings.fontSize || 'medium');
  const [autoPlay, setAutoPlay] = useState(true); // Always true as requested
  const [arabicFont, setArabicFont] = useState(localSettings.arabicFont || 'uthmani');
  const [currentTheme, setCurrentTheme] = useState(localSettings.theme || 'sepia');

  const containerRef = useRef<HTMLDivElement>(null);
  
  const getPageData = useAction(api.quran.getPageData);
  const userPreferences = useQuery(api.quran.getUserPreferences);
  const updateProgress = useMutation(api.quran.updateReadingProgress);
  
  const loadPage = async (pageNumber: number, options?: { shouldStartPlaying?: boolean }) => {
    const shouldPlay = options?.shouldStartPlaying ?? false;
    if (pageNumber < 1 || pageNumber > 604) return;
    
    setIsLoading(true);
    try {
      const data = await getPageData({
        pageNumber,
        reciterId: selectedReciter,
        tafsirId: selectedTafsir,
        translationId: selectedTranslation,
      });
      
      if (!data || !data.verses || data.verses.length === 0) {
        throw new Error("لا توجد آيات في هذه الصفحة");
      }
      
      setPageData(data);
      
      const newAudioPlaylist = data.verses.map(v => v.audio ? { verseKey: v.verse_key, url: `${AUDIO_BASE_URL}${v.audio.url}` } : null).filter(Boolean);
      setAudioPlaylist(newAudioPlaylist as any);
      setCurrentPage(pageNumber);
      setForcePlay(shouldPlay);
      
      await updateProgress({ pageNumber });
      localStorage.setItem('quranLastPage', pageNumber.toString());
    } catch (error) {
      console.error("Error loading page:", error);
      toast.error("خطأ في تحميل الصفحة");
    } finally {
      setIsLoading(false);
    }
  };

  const playVerseInMainPlayer = (newPlaylist: any[]) => {
    setAudioPlaylist(newPlaylist);
    setForcePlay(true);
  };

  useEffect(() => {
    const root = document.documentElement;
    root.className = `theme-${currentTheme}`;
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
    if (pageData) { // Only run if there is existing page data
        loadPage(currentPage, { shouldStartPlaying: false });
    }
  }, [selectedReciter, selectedTafsir, selectedTranslation]);

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
    if (distance > 50 && currentPage < 604) {
      loadPage(currentPage + 1, { shouldStartPlaying: false });
    }
    if (distance < -50 && currentPage > 1) {
      loadPage(currentPage - 1, { shouldStartPlaying: false });
    }
  };

  const handlePageClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.fixed')) return;
    setShowControls(prev => !prev);
  };

  const goToNextPage = () => {
    if (currentPage < 604) loadPage(currentPage + 1, { shouldStartPlaying: true });
  };

  const goToPage = (pageNumber: number) => {
    loadPage(pageNumber, { shouldStartPlaying: false });
    setActivePanel(null);
  };

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
        <div className={`fixed top-16 left-0 right-0 z-40 p-2 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 invisible'}`}>
          <AudioPlayer
            playlist={audioPlaylist}
            showControls={true}
            isInHeader={true}
            onTrackChange={setHighlightedVerse}
            onPlaylistEnded={() => {
              if (autoPlay) goToNextPage();
            }}
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
        onClick={handlePageClick}
      >
        <div className="py-6">
          <QuranPage
            verses={pageData?.verses || []}
            isLoading={isLoading}
            currentPage={currentPage}
            userPreferences={userPreferences as any}
            playVerseInMainPlayer={playVerseInMainPlayer}
            highlightedVerse={highlightedVerse}
            layoutMode={layoutMode}
            fontSize={fontSize}
            arabicFont={arabicFont}
          />
        </div>
      </main>

      <QuranControls
        currentPage={currentPage}
        showControls={showControls}
        onPrevPage={() => { if (currentPage > 1) loadPage(currentPage - 1, { shouldStartPlaying: false }); }}
        onNextPage={() => { if (currentPage < 604) loadPage(currentPage + 1, { shouldStartPlaying: false }); }}
        onGoToPage={goToPage}
      />

      {activePanel === 'search' && <SearchPanel onClose={() => setActivePanel(null)} onGoToPage={goToPage} />}
      {activePanel === 'index' && <IndexPanel onClose={() => setActivePanel(null)} onGoToPage={goToPage} />}
      {showSettingsPage && (
        <SettingsPage
          onClose={() => setShowSettingsPage(false)}
          loadPage={() => loadPage(currentPage, { shouldStartPlaying: false })}
          selectedReciter={selectedReciter}
          selectedTafsir={selectedTafsir}
          selectedTranslation={selectedTranslation}
          fontSize={fontSize}
          currentTheme={currentTheme}
          arabicFont={arabicFont}
          setSelectedReciter={setSelectedReciter}
          setSelectedTafsir={setSelectedTafsir}
          setSelectedTranslation={setSelectedTranslation}
          setFontSize={setFontSize}
          setCurrentTheme={setCurrentTheme}
        />
      )}
    </div>
  );
}
