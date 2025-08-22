import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { toast } from 'sonner';
import { X, Calendar, Book, Play, ArrowRight, ArrowLeft } from 'lucide-react';

const QURAN_TOTAL_PAGES = 604;

interface StartKhatmahModalProps {
  onClose: () => void;
  lastPageRead: number;
}

export function StartKhatmahModal({ onClose, lastPageRead }: StartKhatmahModalProps) {
  const [step, setStep] = useState(1);
  const [duration, setDuration] = useState<number | null>(30);
  const [customDate, setCustomDate] = useState('');
  const [startPage, setStartPage] = useState(1);
  const startKhatmah = useMutation(api.khatmah.startKhatmah);

  const calculateDailyGoal = () => {
    if (!duration) return 0;
    return Math.ceil((QURAN_TOTAL_PAGES - startPage + 1) / duration);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    setCustomDate(date);
    const target = new Date(date).getTime();
    const now = Date.now();
    const days = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    setDuration(days > 0 ? days : null);
  };

  const handleStart = async () => {
    if (!duration || duration <= 0) {
        toast.error("يرجى تحديد مدة زمنية صالحة.");
        return;
    }
    try {
      const targetDate = Date.now() + duration * 24 * 60 * 60 * 1000;
      await startKhatmah({ targetDate, startPage });
      toast.success("تم بدء ختمة جديدة بنجاح!");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("حدث خطأ أثناء بدء الختمة");
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1: // Goal Setting
        return (
          <div className="space-y-4">
            <label className="block text-lg font-medium text-main mb-2">متى تود أن تختم القرآن؟</label>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { setDuration(30); setCustomDate(''); }} className={`p-3 rounded-lg text-center ${duration === 30 ? 'bg-accent text-white' : 'bg-hover'}`}>في شهر</button>
              <button onClick={() => { setDuration(60); setCustomDate(''); }} className={`p-3 rounded-lg text-center ${duration === 60 ? 'bg-accent text-white' : 'bg-hover'}`}>في شهرين</button>
              <button onClick={() => { setDuration(90); setCustomDate(''); }} className={`p-3 rounded-lg text-center ${duration === 90 ? 'bg-accent text-white' : 'bg-hover'}`}>في 3 أشهر</button>
              <input type="date" value={customDate} onChange={handleDateChange} className={`p-3 rounded-lg bg-hover w-full text-center ${customDate ? 'bg-accent text-white' : ''}`} />
            </div>
          </div>
        );
      case 2: // Plan Review
        return (
            <div className="bg-hover p-6 rounded-lg text-center space-y-4">
                <h3 className="text-xl font-bold text-main">الخطة المقترحة</h3>
                <p className="text-main text-lg">لتحقيق هدفك، تحتاج لقراءة</p>
                <p className="font-bold text-accent text-5xl">{calculateDailyGoal()}</p>
                <p className="text-main text-lg">صفحات يومياً.</p>
            </div>
        );
      case 3: // Starting Point & Reminders
        return (
            <div className="space-y-4">
                <div>
                    <label className="block text-lg font-medium text-main mb-2">من أين ستبدأ؟</label>
                    <div className="flex gap-2">
                        <button onClick={() => setStartPage(1)} className={`flex-1 p-3 rounded-lg ${startPage === 1 ? 'bg-accent text-white' : 'bg-hover'}`}>من الفاتحة</button>
                        <button onClick={() => setStartPage(lastPageRead)} className={`flex-1 p-3 rounded-lg ${startPage === lastPageRead ? 'bg-accent text-white' : 'bg-hover'}`}>آخر صفحة (ص {lastPageRead})</button>
                    </div>
                </div>
                <div className="flex items-center justify-between bg-hover p-3 rounded-lg">
                    <label htmlFor="reminder" className="text-main">ذكرني يومياً بالورد</label>
                    <div className="w-12 h-6 flex items-center bg-gray-300 rounded-full p-1 duration-300 cursor-pointer">
                        <div className="bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out"></div>
                    </div>
                </div>
            </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-main rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-main">
          <h2 className="text-xl font-bold text-main font-ui">ابدأ ختمة جديدة</h2>
          <button onClick={onClose} className="p-2 bg-hover rounded-lg transition-colors">
            <X size={24} className="text-main" />
          </button>
        </div>

        <div className="p-8 flex-1 flex flex-col justify-between">
            {renderStepContent()}
            <div className="flex justify-between items-center mt-8">
                {step > 1 ? (
                    <button onClick={() => setStep(s => s - 1)} className="px-6 py-2 bg-hover text-main rounded-lg flex items-center gap-2">
                        <ArrowRight size={18} />
                        <span>السابق</span>
                    </button>
                ) : <div></div>}

                {step < 3 ? (
                    <button onClick={() => setStep(s => s + 1)} className="px-6 py-2 bg-accent text-white rounded-lg flex items-center gap-2" disabled={!duration}>
                        <span>التالي</span>
                        <ArrowLeft size={18} />
                    </button>
                ) : (
                    <button onClick={handleStart} className="px-6 py-2 bg-accent text-white font-bold rounded-lg">
                        بسم الله، لنبدأ
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
