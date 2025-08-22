import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { AudioPlayer } from "./AudioPlayer";
import { useState } from "react";
import { LayoutGrid, LayoutList, CheckCircle } from "lucide-react";

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
}

export function QuranHeader({ currentPage, verses, showControls, onOpenPanel, layoutMode, onToggleLayout }: QuranHeaderProps) {
  const userPreferences = useQuery(api.quran.getUserPreferences);
  const firstVerse = verses[0];
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
            <div className="w-12 h-12 flex items-center justify-center">
              <img 
                src={logoUrl} 
                alt="مصحف الهادي" 
                className="w-14 h-14 object-cover rounded-lg shadow-sm border border-main bg-main"
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
              onClick={() => onOpenPanel('khatmah')}
              className="p-2 bg-hover rounded-lg transition-colors group"
              title="الختمة"
            >
              <CheckCircle className="w-5 h-5 text-muted group-hover:text-accent" />
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
function getChapterName(chapterId: number): string {
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
}
