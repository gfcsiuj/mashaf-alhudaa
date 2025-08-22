import { useState } from 'react';
import { X, Search, Check } from 'lucide-react';

interface Reciter {
  id: number;
  name: string;
  translated_name?: {
    name: string;
    language_name: string;
  };
}

interface RecitersListProps {
  reciters: Reciter[] | null;
  selectedReciterId: number;
  onClose: () => void;
  onSelectReciter: (id: number) => void;
}

export function RecitersList({ reciters, selectedReciterId, onClose, onSelectReciter }: RecitersListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredReciters = reciters?.filter(reciter => {
    const term = searchTerm.toLowerCase();
    const name = (reciter.name || '').toLowerCase();
    const translatedName = (reciter.translated_name?.name || '').toLowerCase();
    return name.includes(term) || translatedName.includes(term);
  });

  const handleSelect = (id: number) => {
    onSelectReciter(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-main text-main z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-main">
        <h2 className="text-xl font-bold font-ui">اختر القارئ</h2>
        <button onClick={onClose} className="p-2 bg-hover rounded-lg transition-colors">
          <X size={24} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-main">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث عن اسم القارئ..."
            className="w-full pl-10 pr-4 py-2 border border-main bg-main rounded-lg focus:ring-2 focus:ring-accent outline-none"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            <Search size={20} />
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {reciters === null && <div className="p-8 text-center">جار التحميل...</div>}
        {reciters && reciters.length === 0 && <div className="p-8 text-center">تعذر تحميل القراء</div>}
        {filteredReciters && filteredReciters.length > 0 ? (
          <div className="space-y-1 p-2">
            {filteredReciters.map(reciter => (
              <button
                key={reciter.id}
                onClick={() => handleSelect(reciter.id)}
                className={`w-full text-right flex items-center justify-between p-4 rounded-lg transition-colors ${
                  selectedReciterId === reciter.id ? 'bg-accent/10 text-accent' : 'hover:bg-hover'
                }`}
              >
                <span>{reciter.translated_name?.name || reciter.name}</span>
                {selectedReciterId === reciter.id && <Check size={20} />}
              </button>
            ))}
          </div>
        ) : (
          reciters && <div className="p-8 text-center text-muted">لم يتم العثور على نتائج</div>
        )}
      </div>
    </div>
  );
}
