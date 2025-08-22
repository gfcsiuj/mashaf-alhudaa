import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { X, Play, Plus, BookOpen, BarChart2, Calendar, CheckCheck, Edit } from "lucide-react";
import { StartKhatmahModal } from './StartKhatmahModal';
import { KhatmahStats } from './KhatmahStats';

interface KhatmahPanelProps {
  onClose: () => void;
  onGoToPage: (page: number) => void;
}

export function KhatmahPanel({ onClose, onGoToPage }: KhatmahPanelProps) {
  const activeKhatmah = useQuery(api.khatmah.getActiveKhatmah);
  const completedKhatmahs = useQuery(api.khatmah.getCompletedKhatmahs);
  const readingProgress = useQuery(api.quran.getReadingProgress);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);

  const StatCard = ({ title, value, icon: Icon, unit }: { title: string, value: string | number, icon: React.ElementType, unit?: string }) => (
    <div className="bg-hover p-4 rounded-lg flex items-start gap-4">
      <div className="bg-accent/10 p-2 rounded-md">
        <Icon className="w-6 h-6 text-accent" />
      </div>
      <div>
        <p className="text-sm text-muted">{title}</p>
        <p className="text-xl font-bold text-main">{value} <span className="text-sm text-muted">{unit}</span></p>
      </div>
    </div>
  );

  const renderActiveKhatmah = () => {
    if (!activeKhatmah) return null;

    const pagesRead = activeKhatmah.currentPage > 1 ? activeKhatmah.currentPage - 1 : 0;
    const pagesRemaining = 604 - pagesRead;
    const progress = (pagesRead / 604) * 100;

    let expectedCompletionDate = "غير محدد";
    if (activeKhatmah.targetDate) {
        expectedCompletionDate = new Date(activeKhatmah.targetDate).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-accent">ختمتي الحالية</h3>
          <p className="text-sm text-muted">بدأت في: {new Date(activeKhatmah.startDate).toLocaleDateString('ar-EG')}</p>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-main">أنجزت</span>
            <span className="text-sm font-medium text-accent">{Math.floor(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div className="bg-accent h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
          <StatCard title="قرأت" value={pagesRead} unit="صفحة" icon={BookOpen} />
          <StatCard title="تبقى" value={pagesRemaining} unit="صفحة" icon={BarChart2} />
          <StatCard title="الورد اليومي" value={activeKhatmah.dailyGoalInPages} unit="صفحات" icon={CheckCheck} />
          <StatCard title="التاريخ المتوقع للختم" value={expectedCompletionDate} icon={Calendar} />
        </div>
        <div className="flex gap-2">
            <button
                onClick={() => {
                    onGoToPage(activeKhatmah.currentPage);
                    onClose();
                }}
                className="flex-1 px-4 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-ui flex items-center justify-center gap-2"
            >
                <Play size={18} />
                <span>أكمل القراءة</span>
            </button>
            <button className="px-4 py-3 bg-hover text-main rounded-lg flex items-center gap-2" disabled>
                <Edit size={16} /> <span>تعديل</span>
            </button>
            <button onClick={() => setShowStatsModal(true)} className="px-4 py-3 bg-hover text-main rounded-lg">عرض الإحصائيات</button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-main rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-main">
            <h2 className="text-xl font-bold text-main font-ui">متابعة الختمة</h2>
            <button onClick={onClose} className="p-2 bg-hover rounded-lg transition-colors">
              <X size={24} className="text-main" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activeKhatmah === undefined && <div className="text-center p-8">جار التحميل...</div>}

            {activeKhatmah === null && (
                 <div className="text-center space-y-4 py-8">
                    <p className="text-lg text-muted">ابدأ رحلتك المباركة في ختم القرآن الكريم. <br/> حدد هدفك ودعنا نساعدك على تحقيقه.</p>
                    <button
                        onClick={() => setShowStartModal(true)}
                        className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-ui flex items-center gap-2 mx-auto"
                    >
                        <Plus size={20} />
                        <span>ابدأ ختمة جديدة</span>
                    </button>
                </div>
            )}

            {activeKhatmah && renderActiveKhatmah()}

            {completedKhatmahs && completedKhatmahs.length > 0 && (
                <div className="mt-8 pt-6 border-t border-main">
                    <h4 className="font-bold text-lg mb-4">ختماتي السابقة</h4>
                    <div className="space-y-2">
                        {completedKhatmahs.map(khatmah => (
                            <div key={khatmah._id} className="bg-hover p-3 rounded-md text-sm text-muted flex justify-between items-center">
                                <span>ختمة مكتملة</span>
                                <span className="text-xs">{new Date(khatmah._creationTime).toLocaleDateString('ar-EG')}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

          </div>
        </div>
      </div>
      {showStartModal &&
        <StartKhatmahModal
            onClose={() => setShowStartModal(false)}
            lastPageRead={readingProgress?.lastPageRead || 1}
        />}
      {showStatsModal && activeKhatmah &&
        <KhatmahStats
            activeKhatmah={activeKhatmah}
            onClose={() => setShowStatsModal(false)}
        />}
    </>
  );
}
