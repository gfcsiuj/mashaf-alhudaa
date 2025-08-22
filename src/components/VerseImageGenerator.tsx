import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { type Verse } from '../lib/types';
import { X, Download, Image } from 'lucide-react';

interface VerseImageGeneratorProps {
  verse: Verse | null;
  onClose: () => void;
}

export function VerseImageGenerator({ verse, onClose }: VerseImageGeneratorProps) {
  const imageRef = useRef<HTMLDivElement>(null);
  const [backgroundColor, setBackgroundColor] = useState('#10b981'); // Default to primary color

  if (!verse) return null;

  const handleDownload = async () => {
    if (imageRef.current === null) {
      return;
    }
    try {
      const dataUrl = await toPng(imageRef.current, { cacheBust: true });
      const link = document.createElement('a');
      link.download = `quran-verse-${verse.verse_key}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
    }
  };

  const backgroundColors = ['#10b981', '#111827', '#4f46e5', '#be123c', '#db2777'];

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-main rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-main">
          <h2 className="text-xl font-bold text-main font-ui flex items-center gap-2">
            <Image size={20} />
            مشاركة آية
          </h2>
          <button onClick={onClose} className="p-2 bg-hover rounded-lg transition-colors">
            <X size={24} className="text-main" />
          </button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Preview Area */}
          <div className="flex-1 flex items-center justify-center p-8 bg-gray-200 dark:bg-gray-900">
            <div
              ref={imageRef}
              className="w-[400px] h-[400px] flex flex-col items-center justify-center text-white p-8"
              style={{ backgroundColor: backgroundColor }}
            >
              <p className="font-quran text-3xl text-center leading-relaxed">
                {verse.text_uthmani}
              </p>
              <p className="mt-4 font-ui text-lg">
                ({verse.verse_key})
              </p>
            </div>
          </div>

          {/* Customization Panel */}
          <div className="w-full md:w-64 bg-main border-l border-main p-6 overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">تخصيص</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-muted mb-2">لون الخلفية</label>
                <div className="flex flex-wrap gap-3">
                  {backgroundColors.map(color => (
                    <button
                      key={color}
                      onClick={() => setBackgroundColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${backgroundColor === color ? 'border-accent ring-2 ring-accent' : 'border-main'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              {/* Placeholder for more options like font size, translation toggle etc. */}
            </div>
            <div className="mt-8">
              <button
                onClick={handleDownload}
                className="w-full px-4 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-ui flex items-center justify-center gap-2"
              >
                <Download size={20} />
                <span>تحميل الصورة</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
