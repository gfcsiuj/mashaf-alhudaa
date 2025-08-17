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
}

export function SettingsPage({ onClose, currentPage, loadPage, setSelectedReciter, setSelectedTafsir, setSelectedTranslation }: SettingsPageProps) {
  const [isModified, setIsModified] = useState(false);
  const userPreferences = useQuery(api.quran.getUserPreferences);
  const updatePreferences = useMutation(api.quran.updateUserPreferences);

  const [settings, setSettings] = useState({
    selectedReciter: 7,
    selectedTafsir: 167,
    selectedTranslation: 131,
    theme: "light",
    arabicFont: "uthmani",
    autoPlay: false,
  });

  useEffect(() => {
    const localSettings = JSON.parse(localStorage.getItem('quranSettings') || '{}');

    if (userPreferences) {
      setSettings({
        selectedReciter: userPreferences.selectedReciter || localSettings.selectedReciter || 7,
        selectedTafsir: userPreferences.selectedTafsir || localSettings.selectedTafsir || 167,
        selectedTranslation: userPreferences.selectedTranslation || localSettings.selectedTranslation || 131,
        theme: userPreferences.theme || localSettings.theme || "light",
        arabicFont: userPreferences.arabicFont || localSettings.arabicFont || "uthmani",
        autoPlay: userPreferences.autoPlay || localSettings.autoPlay || false,
      });
    } else {
      setSettings({
        selectedReciter: localSettings.selectedReciter || 7,
        selectedTafsir: localSettings.selectedTafsir || 167,
        selectedTranslation: localSettings.selectedTranslation || 131,
        theme: localSettings.theme || "light",
        arabicFont: localSettings.arabicFont || "uthmani",
        autoPlay: localSettings.autoPlay || false,
      });

      if (localSettings.selectedReciter) setSelectedReciter(localSettings.selectedReciter);
      if (localSettings.selectedTafsir) setSelectedTafsir(localSettings.selectedTafsir);
      if (localSettings.selectedTranslation) setSelectedTranslation(localSettings.selectedTranslation);
    }
  }, [userPreferences, setSelectedReciter, setSelectedTafsir, setSelectedTranslation]);

  const handleSettingChange = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setIsModified(true);

    if (key === 'selectedReciter') {
      setSelectedReciter(value);
    } else if (key === 'selectedTafsir') {
      setSelectedTafsir(value);
    } else if (key === 'selectedTranslation') {
      setSelectedTranslation(value);
    } else if (key === 'theme') {
      const localSettings = JSON.parse(localStorage.getItem('quranSettings') || '{}');
      localSettings[key] = value;
      localStorage.setItem('quranSettings', JSON.stringify(localSettings));

      document.documentElement.classList.remove('theme-light', 'theme-dark', 'theme-sepia', 'theme-green');

      if (value !== 'light') {
        document.documentElement.classList.add(`theme-${value}`);
      }
    }
  };

  const saveAllSettings = async () => {
    try {
      if (userPreferences) {
        await updatePreferences(settings);
      } else {
        localStorage.setItem('quranSettings', JSON.stringify(settings));
      }

      if (settings.selectedReciter || settings.selectedTafsir || settings.selectedTranslation) {
        await loadPage(currentPage);
      }

      setIsModified(false);
      toast.success("تم حفظ جميع الإعدادات");
      onClose(); // Close the page after saving
    } catch (error) {
      toast.error("خطأ في حفظ الإعدادات");
      console.error("Error updating preferences:", error);
    }
  };

  const reciters = [
    { id: 7, name: "مشاري راشد العفاسي" },
    { id: 1, name: "عبد الباسط عبد الصمد" },
    { id: 2, name: "عبد الرحمن السديس" },
    { id: 3, name: "سعود الشريم" },
    { id: 4, name: "محمد صديق المنشاوي" },
    { id: 5, name: "ماهر المعيقلي" },
    { id: 6, name: "أحمد العجمي" },
  ];

  const tafsirs = [
    { id: 167, name: "تفسير الجلالين" },
    { id: 168, name: "تفسير ابن كثير" },
    { id: 169, name: "تفسير الطبري" },
    { id: 170, name: "تفسير القرطبي" },
  ];

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 font-ui">الإعدادات</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={saveAllSettings}
            disabled={!isModified}
            className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${isModified ? 'bg-[#8b7355] text-white hover:bg-[#7a6548]' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
          >
            <Save size={20} />
            <span className="font-ui text-sm">حفظ</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">

        {/* Audio Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 font-ui border-b pb-2">إعدادات الصوت</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-ui">
              القارئ المفضل
            </label>
            <select
              value={settings.selectedReciter}
              onChange={(e) => handleSettingChange('selectedReciter', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8b7355] focus:border-[#8b7355] outline-none font-ui"
            >
              {reciters.map((reciter) => (
                <option key={reciter.id} value={reciter.id}>
                  {reciter.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 font-ui">
              تشغيل تلقائي للصوت
            </label>
            <button
              onClick={() => handleSettingChange('autoPlay', !settings.autoPlay)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.autoPlay ? 'bg-[#8b7355]' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.autoPlay ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Display Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 font-ui border-b pb-2">إعدادات العرض</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-ui">
              نوع الخط العربي
            </label>
            <select
              value={settings.arabicFont}
              onChange={(e) => handleSettingChange('arabicFont', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8b7355] focus:border-[#8b7355] outline-none font-ui"
            >
              <option value="uthmani">الخط العثماني</option>
              <option value="indopak">الخط الهندي</option>
              <option value="qpc">خط مجمع الملك فهد</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-ui">
              المظهر
            </label>
            <div className="grid grid-cols-4 gap-3 mt-2">
              <button
                onClick={() => handleSettingChange('theme', 'light')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${settings.theme === 'light' ? 'bg-[#8b7355] text-white ring-2 ring-[#8b7355]' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                <Sun size={24} className="mb-1" />
                <span className="text-xs font-ui">فاتح</span>
              </button>

              <button
                onClick={() => handleSettingChange('theme', 'dark')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${settings.theme === 'dark' ? 'bg-[#8b7355] text-white ring-2 ring-[#8b7355]' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                <Moon size={24} className="mb-1" />
                <span className="text-xs font-ui">داكن</span>
              </button>

              <button
                onClick={() => handleSettingChange('theme', 'green')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${settings.theme === 'green' ? 'bg-[#8b7355] text-white ring-2 ring-[#8b7355]' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                <Leaf size={24} className="mb-1" />
                <span className="text-xs font-ui">أخضر</span>
              </button>

              <button
                onClick={() => handleSettingChange('theme', 'sepia')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${settings.theme === 'sepia' ? 'bg-[#8b7355] text-white ring-2 ring-[#8b7355]' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                <BookOpen size={24} className="mb-1" />
                <span className="text-xs font-ui">بني فاتح</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 font-ui border-b pb-2">إعدادات المحتوى</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-ui">
              التفسير المفضل
            </label>
            <select
              value={settings.selectedTafsir}
              onChange={(e) => handleSettingChange('selectedTafsir', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8b7355] focus:border-[#8b7355] outline-none font-ui"
            >
              {tafsirs.map((tafsir) => (
                <option key={tafsir.id} value={tafsir.id}>
                  {tafsir.name}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>
    </div>
  );
}
