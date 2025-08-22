import { useState, useEffect } from "react";
import { useConvexAuth, useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Moon, Save, X, Leaf, BookOpen, Sun } from "lucide-react";
import { RecitersList } from "../components/RecitersList"; // <-- استيراد المكون الجديد

interface SettingsPageProps {
  onClose: () => void;
  loadPage: () => void;
  selectedReciter: number;
  selectedTafsir: number;
  selectedTranslation: number;
  fontSize: string;
  currentTheme: string;
  arabicFont: string;
  setSelectedReciter: (id: number) => void;
  setSelectedTafsir: (id: number) => void;
  setSelectedTranslation: (id: number) => void;
  setFontSize: (size: string) => void;
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
  currentTheme,
  arabicFont,
  setSelectedReciter,
  setSelectedTafsir,
  setSelectedTranslation,
  setFontSize,
  setCurrentTheme,
  setArabicFont,
}: SettingsPageProps) {
  const { isAuthenticated } = useConvexAuth();
  const [isModified, setIsModified] = useState(false);
  const [localReciter, setLocalReciter] = useState(selectedReciter);
  const [localTafsir, setLocalTafsir] = useState(selectedTafsir);
  const [localTranslation, setLocalTranslation] = useState(selectedTranslation);
  const [localFontSize, setLocalFontSize] = useState(fontSize);
  const [localTheme, setLocalTheme] = useState(currentTheme);
  const [localArabicFont, setLocalArabicFont] = useState(arabicFont);
  
  const [showRecitersPanel, setShowRecitersPanel] = useState(false); // <-- حالة جديدة لإظهار/إخفاء لوحة القراء

  const getReciters = useAction(api.quran.getReciters);
  const getTafsirs = useAction(api.quran.getTafsirs);
  const getTranslations = useAction(api.quran.getTranslations);
  const [reciters, setReciters] = useState<any[] | null>(null);
  const [tafsirs, setTafsirs] = useState<any[] | null>(null);
  const [translations, setTranslations] = useState<any[] | null>(null);

  const updatePreferences = useMutation(api.quran.updateUserPreferences);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recitersData, tafsirsData, translationsData] = await Promise.all([
          getReciters({}),
          getTafsirs({}),
          getTranslations({}),
        ]);
        setReciters(recitersData || []);
        setTafsirs(tafsirsData || []);
        setTranslations(translationsData || []);
      } catch (error) {
        toast.error("خطأ في تحميل بيانات الإعدادات");
        console.error("Failed to fetch settings data:", error);
        setReciters([]);
        setTafsirs([]);
        setTranslations([]);
      }
    };
    fetchData();
  }, [getReciters, getTafsirs, getTranslations]);

  const handleFontSizeChange = (newSize: string) => {
    setLocalFontSize(newSize);
    setFontSize(newSize); // Apply instantly
    setIsModified(true);
  };

  const handleGenericChange = <T,>(setter: (value: T) => void, value: T) => {
    setter(value);
    setIsModified(true);
  };

  const handleThemeChange = (theme: string) => {
    setLocalTheme(theme);
    setCurrentTheme(theme); // Apply theme instantly
    setIsModified(true);
  };

  const saveAllSettings = async () => {
    setSelectedReciter(localReciter);
    setSelectedTafsir(localTafsir);
    setSelectedTranslation(localTranslation);
    setFontSize(localFontSize);
    setCurrentTheme(localTheme);
    setArabicFont(localArabicFont);

    const settingsToSave = {
      selectedReciter: localReciter,
      selectedTafsir: localTafsir,
      selectedTranslation: localTranslation,
      fontSize: localFontSize,
      theme: localTheme,
      arabicFont: localArabicFont,
    };

    try {
      if (isAuthenticated) {
        await updatePreferences(settingsToSave);
      }
      localStorage.setItem('quranSettings', JSON.stringify(settingsToSave));
      setIsModified(false);
      toast.success("تم حفظ الإعدادات بنجاح");
      onClose();
    } catch (error) {
      toast.error("خطأ في حفظ الإعدادات");
      console.error("Error updating preferences:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-main text-main z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-main">
        <h2 className="text-xl font-bold font-ui">الإعدادات</h2>
        <div className="flex items-center gap-2">
          <button onClick={saveAllSettings} disabled={!isModified} className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${isModified ? 'bg-accent text-white' : 'bg-hover text-muted cursor-not-allowed'}`}>
            <Save size={18} />
            <span className="font-ui text-sm font-medium">حفظ</span>
          </button>
          <button onClick={onClose} className="p-2 bg-hover rounded-lg transition-colors"><X size={24} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Audio Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-main border-b border-main pb-2">إعدادات الصوت</h3>
          <div>
            <label className="block text-sm font-medium text-muted mb-2">القارئ المفضل</label>
            <div className="flex items-center gap-2">
              <span className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600">
                {reciters && reciters.find(r => r.id === localReciter)?.translated_name.name || "اختر قارئ"}
              </span>
              <button 
                onClick={() => setShowRecitersPanel(true)}
                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-ui"
              >
                تغيير
              </button>
            </div>
          </div>
        </div>

        {/* Display Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-main border-b border-main pb-2">إعدادات العرض</h3>
          <div>
            <label className="block text-sm font-medium text-muted mb-2">حجم الخط</label>
            <select value={localFontSize} onChange={(e) => handleFontSizeChange(e.target.value)} className="w-full px-3 py-2 bg-main border-main border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none">
              <option value="small">صغير</option>
              <option value="medium">متوسط</option>
              <option value="large">كبير</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted mb-2">نوع الخط العربي</label>
            <select value={localArabicFont} onChange={(e) => handleGenericChange(setLocalArabicFont, e.target.value)} className="w-full px-3 py-2 bg-main border-main border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none">
              <option value="uthmani">الخط العثماني</option>
              <option value="indopak">الخط الهندي</option>
              <option value="qpc">خط مجمع الملك فهد</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted mb-2">المظهر</label>
            <div className="grid grid-cols-4 gap-3 mt-2">
              <button onClick={() => handleThemeChange('light')} className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${localTheme === 'light' ? 'bg-accent text-white ring-2 ring-accent' : 'bg-hover'}`}>
                <Sun size={24} className="mb-1" /><span className="text-xs">فاتح</span>
              </button>
              <button onClick={() => handleThemeChange('dark')} className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${localTheme === 'dark' ? 'bg-accent text-white ring-2 ring-accent' : 'bg-hover'}`}>
                <Moon size={24} className="mb-1" /><span className="text-xs">داكن</span>
              </button>
              <button onClick={() => handleThemeChange('green')} className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${localTheme === 'green' ? 'bg-accent text-white ring-2 ring-accent' : 'bg-hover'}`}>
                <Leaf size={24} className="mb-1" /><span className="text-xs">أخضر</span>
              </button>
              <button onClick={() => handleThemeChange('sepia')} className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${localTheme === 'sepia' ? 'bg-accent text-white ring-2 ring-accent' : 'bg-hover'}`}>
                <BookOpen size={24} className="mb-1" /><span className="text-xs">بني فاتح</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-main border-b border-main pb-2">إعدادات المحتوى</h3>
          <div>
            <label className="block text-sm font-medium text-muted mb-2">التفسير المفضل</label>
            <select value={localTafsir} onChange={(e) => handleGenericChange(setLocalTafsir, parseInt(e.target.value))} className="w-full px-3 py-2 bg-main border-main border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none">
              {tafsirs === null ? <option>جار التحميل...</option> :
               tafsirs.length > 0 ? tafsirs.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>)) :
               <option>تعذر تحميل التفاسير</option>}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted mb-2">الترجمة المفضلة</label>
            <select value={localTranslation} onChange={(e) => handleGenericChange(setLocalTranslation, parseInt(e.target.value))} className="w-full px-3 py-2 bg-main border-main border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none">
              {translations === null ? <option>جار التحميل...</option> :
               translations.length > 0 ? translations.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>)) :
               <option>تعذر تحميل الترجمات</option>}
            </select>
          </div>
        </div>
      </div>

      {showRecitersPanel && (
        <RecitersList
          onClose={() => setShowRecitersPanel(false)}
          onSelectReciter={(reciterId) => {
            handleGenericChange(setLocalReciter, reciterId);
            setShowRecitersPanel(false);
          }}
          selectedReciter={localReciter}
        />
      )}
    </div>
  );
}
