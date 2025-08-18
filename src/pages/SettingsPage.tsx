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
  const [isModified, setIsModified] = useState(false);
  const userPreferences = useQuery(api.quran.getUserPreferences);
  const updatePreferences = useMutation(api.quran.updateUserPreferences);

  const handleUiChange = (key: 'theme' | 'fontSize' | 'arabicFont', value: string) => {
    setIsModified(true);
    if (key === 'theme') {
      setCurrentTheme(value);
      const root = document.documentElement;
      root.classList.remove('theme-dark', 'theme-green', 'theme-sepia');
      root.classList.add(`theme-${value}`);
    } else if (key === 'fontSize') {
      setFontSize(value);
    } else if (key === 'arabicFont') {
      setArabicFont(value);
    }
  };

  const handleDataChange = (key: 'selectedReciter' | 'selectedTafsir' | 'selectedTranslation' | 'autoPlay', value: any) => {
    setIsModified(true);
    if (key === 'selectedReciter') setSelectedReciter(value);
    else if (key === 'selectedTafsir') setSelectedTafsir(value);
    else if (key === 'selectedTranslation') setSelectedTranslation(value);
    else if (key === 'autoPlay') setAutoPlay(value);
  };

  const saveAllSettings = async () => {
    const settingsToSave = {
      selectedReciter,
      selectedTafsir,
      selectedTranslation,
      fontSize,
      autoPlay,
      theme: currentTheme,
      arabicFont,
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
    <div className="fixed inset-0 bg-main text-main z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-main">
        <h2 className="text-xl font-bold font-ui">الإعدادات</h2>
        <div className="flex items-center gap-2">
          <button onClick={saveAllSettings} disabled={!isModified} className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${isModified ? 'bg-[var(--color-accent)] text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>
            <Save size={20} /><span className="font-ui text-sm">حفظ</span>
          </button>
          <button onClick={onClose} className="p-2 bg-hover rounded-lg transition-colors"><X size={24} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-main border-b border-main pb-2">إعدادات الصوت</h3>
          <div>
            <label className="block text-sm font-medium text-muted mb-2">القارئ المفضل</label>
            <select value={selectedReciter} onChange={(e) => handleDataChange('selectedReciter', parseInt(e.target.value))} className="w-full px-3 py-2 bg-main border-main border rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] outline-none">
              {reciters.map((reciter) => (<option key={reciter.id} value={reciter.id}>{reciter.name}</option>))}
            </select>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-muted">تشغيل تلقائي للصفحات</label>
            <button onClick={() => handleDataChange('autoPlay', !autoPlay)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoPlay ? 'bg-accent' : 'bg-gray-300'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoPlay ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-main border-b border-main pb-2">إعدادات العرض</h3>
          <div>
            <label className="block text-sm font-medium text-muted mb-2">حجم الخط</label>
            <select value={fontSize} onChange={(e) => handleUiChange('fontSize', e.target.value)} className="w-full px-3 py-2 bg-main border-main border rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] outline-none">
              <option value="small">صغير</option>
              <option value="medium">متوسط</option>
              <option value="large">كبير</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted mb-2">نوع الخط العربي</label>
            <select value={arabicFont} onChange={(e) => handleUiChange('arabicFont', e.target.value)} className="w-full px-3 py-2 bg-main border-main border rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] outline-none">
              <option value="uthmani">الخط العثماني</option>
              <option value="indopak">الخط الهندي</option>
              <option value="qpc">خط مجمع الملك فهد</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted mb-2">المظهر</label>
            <div className="grid grid-cols-3 gap-3 mt-2">
              <button onClick={() => handleUiChange('theme', 'dark')} className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${currentTheme === 'dark' ? 'bg-accent text-white ring-2 ring-[var(--color-accent)]' : 'bg-hover'}`}>
                <Moon size={24} className="mb-1" /><span className="text-xs">داكن</span>
              </button>
              <button onClick={() => handleUiChange('theme', 'green')} className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${currentTheme === 'green' ? 'bg-accent text-white ring-2 ring-[var(--color-accent)]' : 'bg-hover'}`}>
                <Leaf size={24} className="mb-1" /><span className="text-xs">أخضر</span>
              </button>
              <button onClick={() => handleUiChange('theme', 'sepia')} className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${currentTheme === 'sepia' ? 'bg-accent text-white ring-2 ring-[var(--color-accent)]' : 'bg-hover'}`}>
                <BookOpen size={24} className="mb-1" /><span className="text-xs">بني فاتح</span>
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-main border-b border-main pb-2">إعدادات المحتوى</h3>
          <div>
            <label className="block text-sm font-medium text-muted mb-2">التفسير المفضل</label>
            <select value={selectedTafsir} onChange={(e) => handleDataChange('selectedTafsir', parseInt(e.target.value))} className="w-full px-3 py-2 bg-main border-main border rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] outline-none">
              {tafsirs.map((tafsir) => (<option key={tafsir.id} value={tafsir.id}>{tafsir.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted mb-2">الترجمة المفضلة</label>
            <select value={selectedTranslation} onChange={(e) => handleDataChange('selectedTranslation', parseInt(e.target.value))} className="w-full px-3 py-2 bg-main border-main border rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] outline-none">
              {translations.map((translation) => (<option key={translation.id} value={translation.id}>{translation.name}</option>))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
