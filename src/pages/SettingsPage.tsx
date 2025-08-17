import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Sun, Moon, Save, X, Leaf, BookOpen } from "lucide-react";

interface SettingsPageProps {
  onClose: () => void;
  currentPage: number;
  loadPage: (pageNumber: number) => Promise<void>;
  setSelectedReciter: (reciterId: number) => void;
  setSelectedTafsir: (tafsirId: number) => void;
  setSelectedTranslation: (translationId: number) => void;
  fontSize: string;
  setFontSize: (size: string) => void;
  autoPlay: boolean;
  setAutoPlay: (autoPlay: boolean) => void;
}

export function SettingsPage({ onClose, currentPage, loadPage, setSelectedReciter, setSelectedTafsir, setSelectedTranslation, fontSize, setFontSize, autoPlay, setAutoPlay }: SettingsPageProps) {
  const [isModified, setIsModified] = useState(false);
  const userPreferences = useQuery(api.quran.getUserPreferences);
  const updatePreferences = useMutation(api.quran.updateUserPreferences);

  const [settings, setSettings] = useState({
    selectedReciter: 7,
    selectedTafsir: 167,
    selectedTranslation: 131,
    theme: "sepia",
    arabicFont: "uthmani",
    autoPlay: false,
    fontSize: "medium",
  });

  useEffect(() => {
    const localSettings = JSON.parse(localStorage.getItem('quranSettings') || '{}');

    const initialSettings = {
      selectedReciter: localSettings.selectedReciter || 7,
      selectedTafsir: localSettings.selectedTafsir || 167,
      selectedTranslation: localSettings.selectedTranslation || 131,
      theme: localSettings.theme || "sepia",
      arabicFont: localSettings.arabicFont || "uthmani",
      autoPlay: localSettings.autoPlay || false,
      fontSize: localSettings.fontSize || "medium",
    };

    if (userPreferences) {
      initialSettings.selectedReciter = userPreferences.selectedReciter || initialSettings.selectedReciter;
      initialSettings.selectedTafsir = userPreferences.selectedTafsir || initialSettings.selectedTafsir;
      initialSettings.selectedTranslation = userPreferences.selectedTranslation || initialSettings.selectedTranslation;
      initialSettings.theme = userPreferences.theme || initialSettings.theme;
      initialSettings.arabicFont = userPreferences.arabicFont || initialSettings.arabicFont;
      initialSettings.autoPlay = userPreferences.autoPlay || initialSettings.autoPlay;
      initialSettings.fontSize = userPreferences.fontSize || initialSettings.fontSize;
    }

    setSettings(initialSettings);

    // Sync with parent state on initial load
    setSelectedReciter(initialSettings.selectedReciter);
    setSelectedTafsir(initialSettings.selectedTafsir);
    setSelectedTranslation(initialSettings.selectedTranslation);
    setFontSize(initialSettings.fontSize);
    setAutoPlay(initialSettings.autoPlay);

  }, [userPreferences]);

  const handleSettingChange = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setIsModified(true);

    // UI settings apply instantly
    if (key === 'fontSize') {
      setFontSize(value);
    } else if (key === 'theme') {
      const root = document.documentElement;
      root.classList.remove('theme-dark', 'theme-green', 'theme-sepia');
      root.classList.add(`theme-${value}`);
    } else if (key === 'autoPlay') {
      setAutoPlay(value);
    } else {
      // Data settings are just staged here
      if (key === 'selectedReciter') {
        setSelectedReciter(value);
      } else if (key === 'selectedTafsir') {
        setSelectedTafsir(value);
      } else if (key === 'selectedTranslation') {
        setSelectedTranslation(value);
      }
    }
  };

  const saveAllSettings = async () => {
    try {
      if (userPreferences) {
        await updatePreferences(settings);
      }
      // Always save to localStorage for guests or as a fallback
      localStorage.setItem('quranSettings', JSON.stringify(settings));

      // Reload page to apply new data settings
      await loadPage(currentPage);

      setIsModified(false);
      toast.success("تم حفظ جميع الإعدادات");
      onClose();
    } catch (error) {
      toast.error("خطأ في حفظ الإعدادات");
      console.error("Error updating preferences:", error);
    }
  };

  const reciters = [
    { id: 7, name: "مشاري راشد العفاسي" },
    { id: 1, name: "عبد الباسط عبد الصمد" },
    { id: 2, name: "عبد الرحمن السديس" },
  ];

  const tafsirs = [
    { id: 167, name: "تفسير الجلالين" },
    { id: 168, name: "تفسير ابن كثير" },
  ];

  const translations = [
    { id: 131, name: "The Clear Quran" },
    { id: 20, name: "Saheeh International" },
  ];

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 font-ui">الإعدادات</h2>
        <div className="flex items-center gap-2">
          <button onClick={saveAllSettings} disabled={!isModified} className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${isModified ? 'bg-[var(--color-accent)] text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>
            <Save size={20} />
            <span className="font-ui text-sm">حفظ</span>
          </button>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 font-ui border-b pb-2">إعدادات الصوت</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-ui">القارئ المفضل</label>
            <select value={settings.selectedReciter} onChange={(e) => handleSettingChange('selectedReciter', parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] outline-none font-ui">
              {reciters.map((reciter) => (<option key={reciter.id} value={reciter.id}>{reciter.name}</option>))}
            </select>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 font-ui">تشغيل تلقائي للصوت</label>
            <button onClick={() => handleSettingChange('autoPlay', !settings.autoPlay)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.autoPlay ? 'bg-[var(--color-accent)]' : 'bg-gray-200'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.autoPlay ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 font-ui border-b pb-2">إعدادات العرض</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-ui">حجم الخط</label>
            <select value={settings.fontSize} onChange={(e) => handleSettingChange('fontSize', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] outline-none font-ui">
              <option value="small">صغير</option>
              <option value="medium">متوسط</option>
              <option value="large">كبير</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-ui">نوع الخط العربي</label>
            <select value={settings.arabicFont} onChange={(e) => handleSettingChange('arabicFont', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] outline-none font-ui">
              <option value="uthmani">الخط العثماني</option>
              <option value="indopak">الخط الهندي</option>
              <option value="qpc">خط مجمع الملك فهد</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-ui">المظهر</label>
            <div className="grid grid-cols-3 gap-3 mt-2">
              <button onClick={() => handleSettingChange('theme', 'dark')} className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${settings.theme === 'dark' ? 'bg-[var(--color-accent)] text-white ring-2 ring-[var(--color-accent)]' : 'bg-gray-100 hover:bg-gray-200'}`}>
                <Moon size={24} className="mb-1" />
                <span className="text-xs font-ui">داكن</span>
              </button>
              <button onClick={() => handleSettingChange('theme', 'green')} className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${settings.theme === 'green' ? 'bg-[var(--color-accent)] text-white ring-2 ring-[var(--color-accent)]' : 'bg-gray-100 hover:bg-gray-200'}`}>
                <Leaf size={24} className="mb-1" />
                <span className="text-xs font-ui">أخضر</span>
              </button>
              <button onClick={() => handleSettingChange('theme', 'sepia')} className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${settings.theme === 'sepia' ? 'bg-[var(--color-accent)] text-white ring-2 ring-[var(--color-accent)]' : 'bg-gray-100 hover:bg-gray-200'}`}>
                <BookOpen size={24} className="mb-1" />
                <span className="text-xs font-ui">بني فاتح</span>
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 font-ui border-b pb-2">إعدادات المحتوى</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-ui">التفسير المفضل</label>
            <select value={settings.selectedTafsir} onChange={(e) => handleSettingChange('selectedTafsir', parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] outline-none font-ui">
              {tafsirs.map((tafsir) => (<option key={tafsir.id} value={tafsir.id}>{tafsir.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-ui">الترجمة المفضلة</label>
            <select value={settings.selectedTranslation} onChange={(e) => handleSettingChange('selectedTranslation', parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] outline-none font-ui">
              {translations.map((translation) => (<option key={translation.id} value={translation.id}>{translation.name}</option>))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
