import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface Bookmark {
  _id: string;
  pageNumber: number;
  verseKey: string;
  verseText: string;
  _creationTime: number;
  userId: string;
  createdAt: number;
  note?: string;
}

interface BookmarksPanelProps {
  onClose: () => void;
  onGoToPage: (page: number) => void;
}

export function BookmarksPanel({ onClose, onGoToPage }: BookmarksPanelProps) {
  const bookmarks = useQuery(api.quran.getUserBookmarks);
  const removeBookmark = useMutation(api.quran.removeBookmark);
  const [isLoading, setIsLoading] = useState(false);

  const handleRemoveBookmark = async (bookmarkId: any) => {
    try {
      setIsLoading(true);
      await removeBookmark({ bookmarkId });
      toast.success("تم حذف المفضلة");
    } catch (error) {
      toast.error("خطأ في حذف المفضلة");
      console.error("Error removing bookmark:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToBookmark = (pageNumber: number) => {
    onGoToPage(pageNumber);
    toast.success(`الانتقال إلى صفحة ${pageNumber}`);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <h2 className="text-xl font-bold text-gray-800 font-ui">المفضلة</h2>
            {bookmarks && (
              <span className="px-2 py-1 bg-[var(--color-accent)] text-white text-sm rounded-full font-ui">
                {bookmarks.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span className="text-xl">✕</span>
          </button>
        </div>

        {/* Bookmarks List */}
        <div className="flex-1 overflow-y-auto max-h-96">
          {!bookmarks ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 spinner mx-auto mb-4"></div>
              <p className="text-gray-600 font-ui">جاري تحميل المفضلة...</p>
            </div>
          ) : bookmarks.length > 0 ? (
            <div className="p-4 space-y-3">
              <p className="text-sm text-gray-600 mb-4 font-ui">
                لديك {bookmarks.length} آية في المفضلة
              </p>
              {bookmarks
                .sort((a: Bookmark, b: Bookmark) => b._creationTime - a._creationTime)
                .map((bookmark: Bookmark) => (
                  <div
                    key={bookmark._id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--color-accent)]">📖</span>
                        <span className="text-sm text-[var(--color-accent)] font-medium font-ui">
                          {bookmark.verseKey} • صفحة {bookmark.pageNumber}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveBookmark(bookmark._id)}
                        disabled={isLoading}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded text-red-500 transition-all disabled:opacity-50"
                        title="حذف من المفضلة"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    
                    <div 
                      className="text-gray-800 mb-3 font-quran text-lg leading-relaxed cursor-pointer hover:text-[var(--color-accent)] transition-colors"
                      dir="rtl"
                      onClick={() => handleGoToBookmark(bookmark.pageNumber)}
                      title="انقر للانتقال إلى الصفحة"
                    >
                      {truncateText(bookmark.verseText, 150)}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-400 font-ui">
                        تم الحفظ في {formatDate(bookmark._creationTime)}
                      </div>
                      <button
                        onClick={() => handleGoToBookmark(bookmark.pageNumber)}
                        className="px-3 py-1 bg-[var(--color-accent)] text-white text-sm rounded hover:bg-[#6b5b47] transition-colors font-ui"
                      >
                        انتقال
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <p className="font-ui text-lg mb-2">لا توجد مفضلة</p>
              <p className="text-sm font-ui text-gray-400">
                اضغط مطولاً على أي آية لإضافتها للمفضلة
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {bookmarks && bookmarks.length > 0 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between text-sm text-gray-600 font-ui">
              <span>إجمالي المفضلة: {bookmarks.length}</span>
              <span>انقر على أي آية للانتقال إليها</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
