import { useState } from "react";

interface QuranControlsProps {
  currentPage: number;
  showControls: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
  onGoToPage: (page: number) => void;
}

export function QuranControls({ 
  currentPage, 
  showControls, 
  onPrevPage, 
  onNextPage, 
  onGoToPage 
}: QuranControlsProps) {
  if (!showControls) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-main/95 backdrop-blur-sm border-t border-main z-40 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Previous Page Button */}
          <button
            onClick={onPrevPage}
            disabled={currentPage <= 1}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all btn-hover font-ui"
            title="الصفحة السابقة"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">السابقة</span>
          </button>

          {/* Page Number Display */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted font-ui">صفحة</span>
            <span className="font-bold text-accent text-lg">{currentPage}</span>
            <span className="text-sm text-muted font-ui">من 604</span>
          </div>

          {/* Next Page Button */}
          <button
            onClick={onNextPage}
            disabled={currentPage >= 604}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all btn-hover font-ui"
            title="الصفحة التالية"
          >
            <span className="hidden sm:inline">التالية</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
