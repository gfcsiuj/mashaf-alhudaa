import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
// Removed lucide-react imports due to compatibility issues

interface SettingsPanelProps {
  onClose: () => void;
  currentPage: number;
  loadPage: (pageNumber: number) => Promise<void>;
  setSelectedReciter: (reciterId: number) => void;
  setSelectedTafsir: (tafsirId: number) => void;
  setSelectedTranslation: (translationId: number) => void;
}

export function SettingsPanel({ onClose, currentPage, loadPage, setSelectedReciter, setSelectedTafsir, setSelectedTranslation }: SettingsPanelProps) {
  // State to track if settings have been modified
  const [isModified, setIsModified] = useState(false);
  const userPreferences = useQuery(api.quran.getUserPreferences);
  const updatePreferences = useMutation(api.quran.updateUserPreferences);
  
  const [settings, setSettings] = useState({
    selectedReciter: 7,
    selectedTafsir: 167,
    selectedTranslation: 131,
    theme: "light",
    fontSize: "medium",
    arabicFont: "uthmani",
    autoPlay: false,
    showTranslation: false,
    showTafsir: false,
  });

  // Update local state when preferences load
  useEffect(() => {
    // محاولة تحميل الإعدادات من localStorage أولاً
    const localSettings = JSON.parse(localStorage.getItem('quranSettings') || '{}');
    
    if (userPreferences) {
      // إذا كان المستخدم مسجلاً، استخدم إعداداته من قاعدة البيانات
      setSettings({
        selectedReciter: userPreferences.selectedReciter || localSettings.selectedReciter || 7,
        selectedTafsir: userPreferences.selectedTafsir || localSettings.selectedTafsir || 167,
        selectedTranslation: userPreferences.selectedTranslation || localSettings.selectedTranslation || 131,
        theme: userPreferences.theme || localSettings.theme || "light",
        fontSize: userPreferences.fontSize || localSettings.fontSize || "medium",
        arabicFont: userPreferences.arabicFont || localSettings.arabicFont || "uthmani",
        autoPlay: userPreferences.autoPlay || localSettings.autoPlay || false,
        showTranslation: userPreferences.showTranslation || localSettings.showTranslation || false,
        showTafsir: userPreferences.showTafsir || localSettings.showTafsir || false,
      });
    } else {
      // إذا كان المستخدم غير مسجل، استخدم الإعدادات من localStorage
      setSettings({
        selectedReciter: localSettings.selectedReciter || 7,
        selectedTafsir: localSettings.selectedTafsir || 167,
        selectedTranslation: localSettings.selectedTranslation || 131,
        theme: localSettings.theme || "light",
        fontSize: localSettings.fontSize || "medium",
        arabicFont: localSettings.arabicFont || "uthmani",
        autoPlay: localSettings.autoPlay || false,
        showTranslation: localSettings.showTranslation || false,
        showTafsir: localSettings.showTafsir || false,
      });
      
      // تحديث المتغيرات العامة
      if (localSettings.selectedReciter) setSelectedReciter(localSettings.selectedReciter);
      if (localSettings.selectedTafsir) setSelectedTafsir(localSettings.selectedTafsir);
      if (localSettings.selectedTranslation) setSelectedTranslation(localSettings.selectedTranslation);
    }
  }, [userPreferences, setSelectedReciter, setSelectedTafsir, setSelectedTranslation]);

  const handleSettingChange = async (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setIsModified(true);
    
    // Update global state variables based on the setting being changed
    if (key === 'selectedReciter') {
      setSelectedReciter(value);
      // تحديث الصوت فوراً عند تغيير القارئ
      try {
        // حفظ الإعداد في localStorage
        const localSettings = JSON.parse(localStorage.getItem('quranSettings') || '{}');
        localSettings[key] = value;
        localStorage.setItem('quranSettings', JSON.stringify(localSettings));
        
        // إعادة تحميل الصفحة الحالية لتحديث الصوت
        await loadPage(currentPage);
        toast.success("تم تغيير القارئ");
      } catch (error) {
        toast.error("خطأ في تحديث الصوت");
        console.error("Error updating audio:", error);
      }
    } else if (key === 'selectedTafsir') {
      setSelectedTafsir(value);
    } else if (key === 'selectedTranslation') {
      setSelectedTranslation(value);
    } else if (key === 'theme') {
      // تطبيق الثيم مباشرة عند تغييره
      // حفظ الثيم في localStorage مباشرة
      const localSettings = JSON.parse(localStorage.getItem('quranSettings') || '{}');
      localSettings[key] = value;
      localStorage.setItem('quranSettings', JSON.stringify(localSettings));
      
      // إزالة جميع فئات الثيم السابقة
      document.documentElement.classList.remove('theme-light', 'theme-dark', 'theme-sepia', 'theme-green');
      
      // إضافة فئة الثيم الجديد
      if (value !== 'light') { // الثيم الفاتح هو الافتراضي ولا يحتاج إلى فئة
        document.documentElement.classList.add(`theme-${value}`);
      }
    }
  };
  
  const saveAllSettings = async () => {
    try {
      // محاولة الحفظ في قاعدة البيانات
      try {
        await updatePreferences(settings);
      } catch (backendError) {
        // إذا فشل الحفظ في قاعدة البيانات (مثلاً: المستخدم غير مسجل)
        // قم بالحفظ في localStorage بدلاً من ذلك
        console.warn("Falling back to localStorage for settings", backendError);
        localStorage.setItem('quranSettings', JSON.stringify(settings));
      }
      
      // Reload current page to apply new settings
      if (settings.selectedReciter || settings.selectedTafsir || settings.selectedTranslation) {
        await loadPage(currentPage);
      }
      
      setIsModified(false);
      toast.success("تم حفظ جميع الإعدادات");
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
    <div className="fixed inset-0 bg-paper z-50 flex flex-col h-full w-full">
      <div className="w-full h-full overflow-auto bg-paper">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-paper z-10">
          <h2 className="text-2xl font-bold text-text font-ui">الإعدادات</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-ui flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              العودة
            </button>
            <button
              onClick={saveAllSettings}
              disabled={!isModified}
              className={`px-4 py-2 rounded-lg transition-colors font-ui ${isModified ? 'bg-[#8b7355] text-white hover:bg-[#7a6548]' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
            >
              حفظ التغييرات
            </button>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1 p-6 space-y-8 max-w-4xl mx-auto">
          
          {/* Audio Settings */}
          <div className="space-y-4 bg-paper p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold text-text font-ui border-b pb-2 mb-4">إعدادات الصوت</h3>
            
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
          <div className="space-y-4 bg-paper p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold text-text font-ui border-b pb-2 mb-4">إعدادات العرض</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-ui">
                حجم الخط
              </label>
              <select
                value={settings.fontSize}
                onChange={(e) => handleSettingChange('fontSize', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8b7355] focus:border-[#8b7355] outline-none font-ui"
              >
                <option value="small">صغير</option>
                <option value="medium">متوسط</option>
                <option value="large">كبير</option>
              </select>
            </div>

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
                  <span className="text-2xl mb-1">☀️</span>
                  <span className="text-xs font-ui">فاتح</span>
                </button>
                
                <button
                  onClick={() => handleSettingChange('theme', 'dark')}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${settings.theme === 'dark' ? 'bg-[#8b7355] text-white ring-2 ring-[#8b7355]' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  <span className="text-2xl mb-1">🌙</span>
                  <span className="text-xs font-ui">داكن</span>
                </button>
                
                <button
                  onClick={() => handleSettingChange('theme', 'green')}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${settings.theme === 'green' ? 'bg-[#8b7355] text-white ring-2 ring-[#8b7355]' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  <span className="text-2xl mb-1">🍃</span>
                  <span className="text-xs font-ui">أخضر</span>
                </button>
                
                <button
                  onClick={() => handleSettingChange('theme', 'sepia')}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${settings.theme === 'sepia' ? 'bg-[#8b7355] text-white ring-2 ring-[#8b7355]' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  <span className="text-2xl mb-1">📖</span>
                  <span className="text-xs font-ui">بني فاتح</span>
                </button>
              </div>
            </div>
          </div>

          {/* Content Settings */}
          <div className="space-y-4 bg-paper p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold text-text font-ui border-b pb-2 mb-4">إعدادات المحتوى</h3>
            
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

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 font-ui">
                إظهار الترجمة
              </label>
              <button
                onClick={() => handleSettingChange('showTranslation', !settings.showTranslation)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.showTranslation ? 'bg-[#8b7355]' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.showTranslation ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 font-ui">
                إظهار التفسير
              </label>
              <button
                onClick={() => handleSettingChange('showTafsir', !settings.showTafsir)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.showTafsir ? 'bg-[#8b7355]' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.showTafsir ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Performance Settings */}
          <div className="space-y-4 bg-paper p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold text-text font-ui border-b pb-2 mb-4">إعدادات الأداء</h3>
            
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2 font-ui">نصائح لتحسين الأداء</h4>
              <ul className="text-sm text-blue-700 space-y-1 font-ui">
                <li>• تأكد من اتصال إنترنت مستقر لتشغيل الصوت</li>
                <li>• أغلق التطبيقات الأخرى لتوفير الذاكرة</li>
                <li>• استخدم متصفح حديث للحصول على أفضل أداء</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="sticky bottom-0 bg-paper border-t border-gray-200 p-4 flex justify-between items-center">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-ui flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          العودة للمصحف
        </button>
        <button
          onClick={saveAllSettings}
          disabled={!isModified}
          className={`px-4 py-2 rounded-lg transition-colors font-ui ${isModified ? 'bg-[#8b7355] text-white hover:bg-[#7a6548]' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
        >
          حفظ جميع التغييرات
        </button>
      </div>
    </div>
  );
}
