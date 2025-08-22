import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { X, CheckCircle, Circle, Play, Plus } from "lucide-react";

interface KhatmahPanelProps {
  onClose: () => void;
}

export function KhatmahPanel({ onClose }: KhatmahPanelProps) {
  const activeKhatmah = useQuery(api.khatmah.getActiveKhatmah);
  const startKhatmah = useMutation(api.khatmah.startKhatmah);
  const [showNewKhatmahForm, setShowNewKhatmahForm] = useState(false);
  const [khatmahName, setKhatmahName] = useState("");

  const handleStartKhatmah = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!khatmahName.trim()) {
      toast.error("يرجى إدخال اسم للختمة");
      return;
    }
    try {
      await startKhatmah({ name: khatmahName });
      toast.success("تم بدء ختمة جديدة بنجاح!");
      setKhatmahName("");
      setShowNewKhatmahForm(false);
    } catch (error) {
      toast.error("حدث خطأ أثناء بدء الختمة");
      console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-main rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-main">
          <h2 className="text-xl font-bold text-main font-ui">متابعة الختمة</h2>
          <button onClick={onClose} className="p-2 bg-hover rounded-lg transition-colors">
            <X size={24} className="text-main" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeKhatmah === undefined && <div className="text-center">جار التحميل...</div>}
          {activeKhatmah === null && !showNewKhatmahForm && (
            <div className="text-center space-y-4">
              <p className="text-muted">ليس لديك أي ختمة نشطة حاليًا.</p>
              <button
                onClick={() => setShowNewKhatmahForm(true)}
                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-ui flex items-center gap-2 mx-auto"
              >
                <Plus size={18} />
                <span>ابدأ ختمة جديدة</span>
              </button>
            </div>
          )}

          {(showNewKhatmahForm || activeKhatmah === null) && !activeKhatmah && (
             <form onSubmit={handleStartKhatmah} className="space-y-4 bg-hover p-4 rounded-lg">
                <h3 className="font-bold text-lg text-main">ختمة جديدة</h3>
                <div>
                    <label htmlFor="khatmah-name" className="block text-sm font-medium text-muted mb-1">اسم الختمة (مثال: ختمة رمضان)</label>
                    <input
                        id="khatmah-name"
                        type="text"
                        value={khatmahName}
                        onChange={(e) => setKhatmahName(e.target.value)}
                        placeholder="أدخل اسمًا لختمتك"
                        className="w-full px-3 py-2 bg-main border-main border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none"
                    />
                </div>
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowNewKhatmahForm(false)} className="px-4 py-2 bg-secondary/20 text-main rounded-lg">إلغاء</button>
                    <button type="submit" className="px-4 py-2 bg-accent text-white rounded-lg">ابدأ</button>
                </div>
             </form>
          )}

          {activeKhatmah && (() => {
            const progress = (activeKhatmah.completedPages.length / 604) * 100;
            return (
                <div className="space-y-6">
                <div>
                    <h3 className="text-2xl font-bold text-accent">{activeKhatmah.name}</h3>
                    <p className="text-sm text-muted">بدأت في: {new Date(activeKhatmah.startDate).toLocaleDateString('ar-EG')}</p>
                </div>
                <div>
                    <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-main">التقدم</span>
                    <span className="text-sm font-medium text-accent">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                    <div
                        className="bg-accent h-4 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    ></div>
                    </div>
                    <p className="text-xs text-muted mt-1 text-center">{activeKhatmah.completedPages.length} / 604 صفحة</p>
                </div>

                <button
                    onClick={() => setShowNewKhatmahForm(true)}
                    className="w-full mt-4 px-4 py-2 border border-accent text-accent rounded-lg hover:bg-accent/10 transition-colors font-ui flex items-center gap-2 mx-auto justify-center"
                >
                    <Play size={18} />
                    <span>بدء ختمة جديدة (ستتوقف الحالية)</span>
                </button>
                </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
