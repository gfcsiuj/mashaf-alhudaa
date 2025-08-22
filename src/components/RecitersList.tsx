import { useState, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { X, Search } from "lucide-react";

interface Reciter {
  id: number;
  reciter_name: string;
  translated_name: {
    name: string;
  };
}

interface RecitersListProps {
  onClose: () => void;
  onSelectReciter: (reciterId: number) => void;
  selectedReciter: number;
}

export function RecitersList({ onClose, onSelectReciter, selectedReciter }: RecitersListProps) {
  const [reciters, setReciters] = useState<Reciter[] | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const getReciters = useAction(api.quran.getReciters);

  useEffect(() => {
    const fetchReciters = async () => {
      try {
        const recitersData = await getReciters({});
        setReciters(recitersData || []);
      } catch (error) {
        toast.error("خطأ في تحميل قائمة القراء");
        console.error("Failed to fetch reciters:", error);
        setReciters([]);
      }
    };
    fetchReciters();
  }, [getReciters]);

  const filteredReciters = reciters
    ? reciters.filter(reciter =>
      reciter.translated_name.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reciter.reciter_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    : [];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 font-ui">اختر القارئ</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-gray-200 relative">
          <input
            type="text"
            placeholder="ابحث عن قارئ..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] outline-none font-ui"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute right-7 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        </div>

        {/* Reciters List */}
        <div className="flex-1 overflow-y-auto p-4">
          {!reciters ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 spinner mx-auto mb-4"></div>
              <p className="text-gray-600 font-ui">جاري تحميل القراء...</p>
            </div>
          ) : filteredReciters.length > 0 ? (
            <div className="space-y-2">
              {filteredReciters.map((reciter) => (
                <button
                  key={reciter.id}
                  onClick={() => onSelectReciter(reciter.id)}
                  className={`w-full text-right p-4 rounded-lg transition-colors flex items-center justify-between group
                    ${selectedReciter === reciter.id 
                      ? 'bg-accent text-white font-semibold' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                >
                  <span className="font-ui">{reciter.translated_name.name}</span>
                  {selectedReciter === reciter.id && (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <p className="font-ui">لا توجد نتائج مطابقة</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
