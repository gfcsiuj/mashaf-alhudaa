import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { AudioPlayer } from "./AudioPlayer";
import { useState } from "react";
import { LayoutGrid, LayoutList } from "lucide-react";

interface Verse {
  chapter_id: number;
  juz_number?: number;
}

interface QuranHeaderProps {
  currentPage: number;
  verses: Verse[];
  showControls: boolean;
  onOpenPanel: (panel: string) => void;
  layoutMode: string;
  onToggleLayout: () => void;
  allChapters: any[] | undefined;
}

export function QuranHeader({ currentPage, verses, showControls, onOpenPanel, layoutMode, onToggleLayout, allChapters }: QuranHeaderProps) {
  const userPreferences = useQuery(api.quran.getUserPreferences);
  const firstVerse = verses[0];

  const getChapterName = (chapterId: number): string => {
    if (!allChapters || !chapterId) return "";
    const chapter = allChapters.find((c: any) => c.id === chapterId);
    return chapter?.name_arabic || "";
  };

  const chapterName = getChapterName(firstVerse?.chapter_id);
  const juzNumber = firstVerse?.juz_number;

  // Determine logo based on theme
  const theme = userPreferences?.theme || "light";
  const logoUrl = theme === "green" 
    ? "https://g.top4top.io/p_35150rkjh1.png"
    : "https://k.top4top.io/p_3515htb0u1.png";

  if (!showControls) return null;

  return (
    <header className="fixed top-0 left-0 right-0 bg-main/95 backdrop-blur-sm border-b border-main z-40 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
          {/* Left: App Title with Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-main shadow-sm border border-main flex items-center justify-center">
              <img 
                src={logoUrl} 
                alt="مصحف الهادي" 
                className="w-10 h-10 object-contain"
                onError={(e) => {
                  // Fallback to default icon if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <svg className="w-6 h-6 text-accent hidden" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-main font-ui">
                مصحف الهادي
              </h1>
              <p className="text-xs text-muted font-ui">القرآن الكريم</p>
            </div>
          </div>

          {/* Center: Page Info */}
          <div className="flex items-center gap-4 text-sm text-muted font-ui">
            {chapterName && (
              <span className="font-medium hidden sm:inline">{chapterName}</span>
            )}
            {juzNumber && (
              <span className="hidden md:inline">الجزء {juzNumber}</span>
            )}
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onOpenPanel('search')}
              className="p-2 bg-hover rounded-lg transition-colors group"
              title="البحث"
            >
              <svg className="w-5 h-5 text-muted group-hover:text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button
              onClick={() => onOpenPanel('index')}
              className="p-2 bg-hover rounded-lg transition-colors group"
              title="الفهرس"
            >
              <svg className="w-5 h-5 text-muted group-hover:text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => onOpenPanel('bookmarks')}
              className="p-2 bg-hover rounded-lg transition-colors group"
              title="المفضلة"
            >
              <svg className="w-5 h-5 text-muted group-hover:text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
            <button
              onClick={() => onOpenPanel('settings')}
              className="p-2 bg-hover rounded-lg transition-colors group"
              title="الإعدادات"
            >
              <svg className="w-5 h-5 text-muted group-hover:text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              onClick={() => onOpenPanel('reminders')}
              className="p-2 bg-hover rounded-lg transition-colors group"
              title="التذكيرات"
            >
              <svg className="w-5 h-5 text-muted group-hover:text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM4 15h8v-2H4v2zM4 11h8V9H4v2z" />
              </svg>
            </button>
            <button
              onClick={onToggleLayout}
              className="p-2 bg-hover rounded-lg transition-colors group"
              title="تغيير طريقة العرض"
            >
              {layoutMode === 'list' ? (
                <LayoutGrid className="w-5 h-5 text-muted group-hover:text-accent" />
              ) : (
                <LayoutList className="w-5 h-5 text-muted group-hover:text-accent" />
              )}
            </button>
          </div>
          </div>
          
        </div>
      </div>
    </header>
  );
}

// Helper function to get chapter name
// This is now handled inside the component with the allChapters prop.
