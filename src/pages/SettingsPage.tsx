import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Moon, Save, X, Leaf, BookOpen } from "lucide-react";

interface SettingsPageProps {
  onClose: () => void;
  loadPage: () => void;
  // State values
  selectedReciter: number;
  selectedTafsir: number;
  selectedTranslation: number;
  fontSize: string;
  autoPlay: boolean;
  currentTheme: string;
  arabicFont: string;
  // State setters
  setSelectedReciter: (id: number) => void;
  setSelectedTafsir: (id: number) => void;
  setSelectedTranslation: (id: number) => void;
  setFontSize: (size: string) => void;
  setAutoPlay: (autoPlay: boolean) => void;
  setCurrentTheme: (theme: string) => void;
  setArabicFont: (font: string) => void;
}

export function SettingsPage({
  onClose,
  loadPage,
  selectedReciter,
  selectedTafsir,
  selectedTranslation,
  fontSize,
  autoPlay,
  currentTheme,
  arabicFont,
  setSelectedReciter,
  setSelectedTafsir,
  setSelectedTranslation,
  setFontSize,
  setAutoPlay,
  setCurrentTheme,
  setArabicFont,
}: SettingsPageProps) {
  // Local state for pending changes
  const [localReciter, setLocalReciter] = useState(selectedReciter);
  const [localTafsir, setLocalTafsir] = useState(selectedTafsir);
  const [localTranslation, setLocalTranslation] = useState(selectedTranslation);
  const [localFontSize, setLocalFontSize] = useState(fontSize);
  const [localAutoPlay, setLocalAutoPlay] = useState(autoPlay);
  const [localTheme, setLocalTheme] = useState(currentTheme);
  const [localArabicFont, setLocalArabicFont] = useState(arabicFont);

  const [isModified, setIsModified] = useState(false);
  const userPreferences = useQuery(api.quran.getUserPreferences);
  const updatePreferences = useMutation(api.quran.updateUserPreferences);

  // Effect to track if settings have changed from original props
  useEffect(() => {
    const hasChanged =
      localReciter !== selectedReciter ||
      localTafsir !== selectedTafsir ||
      localTranslation !== selectedTranslation ||
      localFontSize !== fontSize ||
      localAutoPlay !== autoPlay ||
      localTheme !== currentTheme ||
      localArabicFont !== arabicFont;
    setIsModified(hasChanged);
  }, [
    localReciter, localTafsir, localTranslation, localFontSize, localAutoPlay, localTheme, localArabicFont,
    selectedReciter, selectedTafsir, selectedTranslation, fontSize, autoPlay, currentTheme, arabicFont
  ]);


  const saveAllSettings = async () => {
    // Apply changes to the main app state
    setSelectedReciter(localReciter);
    setSelectedTafsir(localTafsir);
    setSelectedTranslation(localTranslation);
    setFontSize(localFontSize);
    setAutoPlay(localAutoPlay);
    setCurrentTheme(localTheme);
    setArabicFont(localArabicFont);

    const settingsToSave = {
      selectedReciter: localReciter,
      selectedTafsir: localTafsir,
      selectedTranslation: localTranslation,
      fontSize: localFontSize,
      autoPlay: localAutoPlay,
      theme: localTheme,
      arabicFont: localArabicFont,
    };

    try {
      if (userPreferences) {
        await updatePreferences(settingsToSave);
      }
      localStorage.setItem('quranSettings', JSON.stringify(settingsToSave));
      await loadPage();
      setIsModified(false);
      toast.success("تم حفظ جميع الإعدادات");
      onClose();
    } catch (error) {
      toast.error("خطأ في حفظ الإعدادات");
      console.error("Error updating preferences:", error);
    }
  };

  const reciters = [{ id: 7, name: "مشاري راشد العفاسي" }, { id: 1, name: "عبد الباسط عبد الصمد" }];
  const tafsirs = [{ id: 167, name: "تفسير الجلالين" }, { id: 168, name: "تفسير ابن كثير" }];
  const translations = [{ id: 131, name: "The Clear Quran" }, { id: 20, name: "Saheeh International" }];

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 font-ui">الإعدادات</h2>
        <div className="flex items-center gap-2">
          <button onClick={saveAllSettings} disabled={!isModified} className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${isModified ? 'bg-[var(--color-accent)] text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>
            <Save size={20} /><span className="font-ui text-sm">حفظ</span>
          </button>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X size={24} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 font-ui border-b pb-2">إعدادات الصوت</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-ui">القارئ المفضل</label>
            <select value={localReciter} onChange={(e) => setLocalReciter(parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] outline-none font-ui">
              {reciters.map((reciter) => (<option key={reciter.id} value={reciter.id}>{reciter.name}</option>))}
            </select>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 font-ui">تشغيل تلقائي للصفحات</label>
            <button onClick={() => setLocalAutoPlay(!localAutoPlay)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${localAutoPlay ? 'bg-[var(--color-accent)]' : 'bg-gray-200'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localAutoPlay ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 font-ui border-b pb-2">إعدادات العرض</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-ui">حجم الخط</label>
            <select value={localFontSize} onChange={(e) => setLocalFontSize(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] outline-none font-ui">
              <option value="small">صغير</option>
              <option value="medium">متوسط</option>
              <option value="large">كبير</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-ui">نوع الخط العربي</label>
            <select value={localArabicFont} onChange={(e) => setLocalArabicFont(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] outline-none font-ui">
              <option value="uthmani">الخط العثماني</option>
              <option value="indopak">الخط الهندي</option>
              <option value="qpc">خط مجمع الملك فهد</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-ui">المظهر</label>
            <div className="grid grid-cols-3 gap-3 mt-2">
              <button onClick={() => setLocalTheme('dark')} className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${localTheme === 'dark' ? 'bg-[var(--color-accent)] text-white ring-2 ring-[var(--color-accent)]' : 'bg-gray-100 hover:bg-gray-200'}`}>
                <Moon size={24} className="mb-1" /><span className="text-xs font-ui">داكن</span>
              </button>
              <button onClick={() => setLocalTheme('green')} className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${localTheme === 'green' ? 'bg-[var(--color-accent)] text-white ring-2 ring-[var(--color-accent)]' : 'bg-gray-100 hover:bg-gray-200'}`}>
                <Leaf size={24} className="mb-1" /><span className="text-xs font-ui">أخضر</span>
              </button>
              <button onClick={() => setLocalTheme('sepia')} className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${localTheme === 'sepia' ? 'bg-[var(--color-accent)] text-white ring-2 ring-[var(--color-accent)]' : 'bg-gray-100 hover:bg-gray-200'}`}>
                <BookOpen size={24} className="mb-1" /><span className="text-xs font-ui">بني فاتح</span>
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 font-ui border-b pb-2">إعدادات المحتوى</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-ui">التفسير المفضل</label>
            <select value={localTafsir} onChange={(e) => setLocalTafsir(parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] outline-none font-ui">
              {tafsirs.map((tafsir) => (<option key={tafsir.id} value={tafsir.id}>{tafsir.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-ui">الترجمة المفضلة</label>
            <select value={localTranslation} onChange={(e) => setLocalTranslation(parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] outline-none font-ui">
              {translations.map((translation) => (<option key={translation.id} value={translation.id}>{translation.name}</option>))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
