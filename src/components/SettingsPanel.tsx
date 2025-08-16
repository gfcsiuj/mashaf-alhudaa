import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface SettingsPanelProps {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
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
    if (userPreferences) {
      setSettings({
        selectedReciter: userPreferences.selectedReciter || 7,
        selectedTafsir: userPreferences.selectedTafsir || 167,
        selectedTranslation: userPreferences.selectedTranslation || 131,
        theme: userPreferences.theme || "light",
        fontSize: userPreferences.fontSize || "medium",
        arabicFont: userPreferences.arabicFont || "uthmani",
        autoPlay: userPreferences.autoPlay || false,
        showTranslation: userPreferences.showTranslation || false,
        showTafsir: userPreferences.showTafsir || false,
      });
    }
  }, [userPreferences]);

  const handleSettingChange = async (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    try {
      await updatePreferences({ [key]: value });
      toast.success("تم حفظ الإعدادات");
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

  const translations = [
    { id: 131, name: "مجمع الملك فهد (إنجليزية)" },
    { id: 20, name: "صحيح الدولية" },
    { id: 84, name: "تقي عثماني (إنجليزية)" },
    { id: 31, name: "محمد حميد الله (فرنسية)" },
    { id: 83, name: "الشيخ عيسى غارسيا (إسبانية)" },
    { id: 77, name: "ترجمة ديانت (تركية)" },
    { id: 33, name: "وزارة الشؤون الإسلامية الإندونيسية" },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 font-ui">الإعدادات</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span className="text-xl">✕</span>
          </button>
        </div>

        {/* Settings Content */}
        <div className="flex-1 overflow-y-auto max-h-96 p-6 space-y-6">
          
          {/* Audio Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 font-ui">إعدادات الصوت</h3>
            
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
            <h3 className="text-lg font-semibold text-gray-800 font-ui">إعدادات العرض</h3>
            
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
              <select
                value={settings.theme}
                onChange={(e) => handleSettingChange('theme', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8b7355] focus:border-[#8b7355] outline-none font-ui"
              >
                <option value="light">فاتح (بني)</option>
                <option value="green">أخضر</option>
                <option value="dark">داكن</option>
                <option value="sepia">بني فاتح</option>
              </select>
            </div>
          </div>

          {/* Content Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 font-ui">إعدادات المحتوى</h3>
            
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-ui">
                الترجمة المفضلة
              </label>
              <select
                value={settings.selectedTranslation}
                onChange={(e) => handleSettingChange('selectedTranslation', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8b7355] focus:border-[#8b7355] outline-none font-ui"
              >
                {translations.map((translation) => (
                  <option key={translation.id} value={translation.id}>
                    {translation.name}
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
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 font-ui">إعدادات الأداء</h3>
            
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
    </div>
  );
}
