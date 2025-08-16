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
  const [showPageInput, setShowPageInput] = useState(false);
  const [pageInput, setPageInput] = useState(currentPage.toString());

  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNumber = parseInt(pageInput);
    if (pageNumber >= 1 && pageNumber <= 604) {
      onGoToPage(pageNumber);
      setShowPageInput(false);
    }
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || (/^\d+$/.test(value) && parseInt(value) <= 604)) {
      setPageInput(value);
    }
  };

  if (!showControls) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 z-40 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Previous Page Button */}
          <button
            onClick={onPrevPage}
            disabled={currentPage <= 1}
            className="flex items-center gap-2 px-4 py-2 bg-[#8b7355] text-white rounded-lg hover:bg-[#6b5b47] disabled:opacity-50 disabled:cursor-not-allowed transition-all btn-hover font-ui"
            title="الصفحة السابقة"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">السابقة</span>
          </button>

          {/* Page Navigation */}
          <div className="flex items-center gap-4">
            {showPageInput ? (
              <form onSubmit={handlePageSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  value={pageInput}
                  onChange={handlePageInputChange}
                  className="w-16 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-[#8b7355] focus:border-[#8b7355] outline-none font-ui"
                  placeholder="1-604"
                  autoFocus
                  onBlur={() => {
                    setShowPageInput(false);
                    setPageInput(currentPage.toString());
                  }}
                />
                <span className="text-sm text-gray-600 font-ui">من 604</span>
              </form>
            ) : (
              <button
                onClick={() => setShowPageInput(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-ui"
                title="انتقال إلى صفحة"
              >
                <span className="text-sm text-gray-600">صفحة</span>
                <span className="font-bold text-[#8b7355]">{currentPage}</span>
                <span className="text-sm text-gray-600">من 604</span>
              </button>
            )}

            {/* Progress Bar */}
            <div className="hidden md:flex items-center gap-2">
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#8b7355] rounded-full transition-all duration-300"
                  style={{ width: `${(currentPage / 604) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 font-ui">
                {Math.round((currentPage / 604) * 100)}%
              </span>
            </div>
          </div>

          {/* Next Page Button */}
          <button
            onClick={onNextPage}
            disabled={currentPage >= 604}
            className="flex items-center gap-2 px-4 py-2 bg-[#8b7355] text-white rounded-lg hover:bg-[#6b5b47] disabled:opacity-50 disabled:cursor-not-allowed transition-all btn-hover font-ui"
            title="الصفحة التالية"
          >
            <span className="hidden sm:inline">التالية</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Quick Navigation (Mobile) */}
        <div className="flex md:hidden items-center justify-center mt-2">
          <div className="flex items-center gap-2">
            <div className="w-24 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#8b7355] rounded-full transition-all duration-300"
                style={{ width: `${(currentPage / 604) * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 font-ui">
              {Math.round((currentPage / 604) * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
