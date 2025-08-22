import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { toast } from 'sonner';
import { X } from 'lucide-react';

const QURAN_TOTAL_PAGES = 604;

interface StartKhatmahModalProps {
  onClose: () => void;
  lastPageRead: number;
}

export function StartKhatmahModal({ onClose, lastPageRead }: StartKhatmahModalProps) {
  const [step, setStep] = useState(1);
  const [duration, setDuration] = useState(30); // in days
  const [startPage, setStartPage] = useState(1);
  const startKhatmah = useMutation(api.khatmah.startKhatmah);

  const dailyGoal = Math.ceil((QURAN_TOTAL_PAGES - startPage + 1) / duration);

  const handleStart = async () => {
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

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-main rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-main">
          <h2 className="text-xl font-bold text-main font-ui">ابدأ ختمة جديدة</h2>
          <button onClick={onClose} className="p-2 bg-hover rounded-lg transition-colors">
            <X size={24} className="text-main" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {/* Step 1: Goal */}
          <div>
            <label className="block text-lg font-medium text-main mb-2">متى تود أن تختم القرآن؟</label>
            <div className="flex gap-2">
              <button onClick={() => setDuration(30)} className={`flex-1 p-3 rounded-lg ${duration === 30 ? 'bg-accent text-white' : 'bg-hover'}`}>شهر</button>
              <button onClick={() => setDuration(60)} className={`flex-1 p-3 rounded-lg ${duration === 60 ? 'bg-accent text-white' : 'bg-hover'}`}>شهرين</button>
              <button onClick={() => setDuration(90)} className={`flex-1 p-3 rounded-lg ${duration === 90 ? 'bg-accent text-white' : 'bg-hover'}`}>3 أشهر</button>
            </div>
          </div>

          {/* Step 2: Plan */}
          <div className="bg-hover p-4 rounded-lg text-center">
            <p className="text-main">لتحقيق هدفك، تحتاج لقراءة <span className="font-bold text-accent text-lg">{dailyGoal}</span> صفحات يومياً.</p>
          </div>

          {/* Step 3: Starting Point */}
          <div>
            <label className="block text-lg font-medium text-main mb-2">من أين ستبدأ؟</label>
            <div className="flex gap-2">
                <button onClick={() => setStartPage(1)} className={`flex-1 p-3 rounded-lg ${startPage === 1 ? 'bg-accent text-white' : 'bg-hover'}`}>من الفاتحة</button>
                <button onClick={() => setStartPage(lastPageRead)} className={`flex-1 p-3 rounded-lg ${startPage === lastPageRead ? 'bg-accent text-white' : 'bg-hover'}`}>من آخر صفحة (ص {lastPageRead})</button>
            </div>
          </div>

          {/* Step 4: Reminders (Optional - UI only for now) */}
          <div className="flex items-center justify-between bg-hover p-3 rounded-lg">
            <label htmlFor="reminder" className="text-main">ذكرني يومياً بالورد</label>
            <div className="w-12 h-6 flex items-center bg-gray-300 rounded-full p-1 duration-300 cursor-pointer">
                <div className="bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out"></div>
            </div>
          </div>

          {/* Final Button */}
          <button onClick={handleStart} className="w-full mt-6 py-3 bg-accent text-white font-bold rounded-lg hover:bg-accent/90 transition-colors">
            بسم الله، لنبدأ
          </button>
        </div>
      </div>
    </div>
  );
}
