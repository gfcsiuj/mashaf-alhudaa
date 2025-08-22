import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { X, BarChart, TrendingUp, CalendarDays, Award } from 'lucide-react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { type Id } from "../../convex/_generated/dataModel";

interface KhatmahStatsProps {
  khatmahId: Id<"khatmahs">;
  onClose: () => void;
}

export function KhatmahStats({ khatmahId, onClose }: KhatmahStatsProps) {
  const dailyProgress = useQuery(api.khatmah.getDailyProgress, { khatmahId });

  const chartData = dailyProgress
    ?.map(d => ({
      name: new Date(d.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }),
      'صفحات': d.pagesRead,
    }))
    .reverse();

  const totalDays = dailyProgress?.length || 0;
  const totalPages = dailyProgress?.reduce((sum, d) => sum + d.pagesRead, 0) || 0;
  const dailyAverage = totalDays > 0 ? (totalPages / totalDays).toFixed(1) : 0;
  const bestDay = dailyProgress?.reduce((max, d) => d.pagesRead > max ? d.pagesRead : max, 0) || 0;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-main rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-main">
          <h2 className="text-xl font-bold text-main font-ui">إحصائيات الختمة</h2>
          <button onClick={onClose} className="p-2 bg-hover rounded-lg transition-colors">
            <X size={24} className="text-main" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-hover p-4 rounded-lg">
                    <p className="text-sm text-muted">متوسط القراءة</p>
                    <p className="text-2xl font-bold text-accent">{dailyAverage}</p>
                    <p className="text-xs text-muted">صفحة/يوم</p>
                </div>
                <div className="bg-hover p-4 rounded-lg">
                    <p className="text-sm text-muted">أفضل يوم</p>
                    <p className="text-2xl font-bold text-accent">{bestDay}</p>
                    <p className="text-xs text-muted">صفحة</p>
                </div>
                <div className="bg-hover p-4 rounded-lg">
                    <p className="text-sm text-muted">أيام القراءة</p>
                    <p className="text-2xl font-bold text-accent">{totalDays}</p>
                    <p className="text-xs text-muted">يوم</p>
                </div>
                <div className="bg-hover p-4 rounded-lg">
                    <p className="text-sm text-muted">إجمالي الصفحات</p>
                    <p className="text-2xl font-bold text-accent">{totalPages}</p>
                    <p className="text-xs text-muted">صفحة</p>
                </div>
            </div>

            {/* Chart */}
            <div className="w-full h-80 bg-hover p-4 rounded-lg">
                <h3 className="font-bold mb-4 text-main">الالتزام اليومي (آخر 30 يوم)</h3>
                {dailyProgress === undefined && <div className="text-center">جار تحميل الرسم البياني...</div>}
                {dailyProgress && dailyProgress.length > 0 && (
                    <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                        <XAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)' }} />
                        <YAxis tick={{ fill: 'var(--color-text-muted)' }} />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--color-bg-main)', border: '1px solid var(--color-border-main)' }} />
                        <Legend />
                        <Bar dataKey="صفحات" fill="var(--color-accent)" />
                        </RechartsBarChart>
                    </ResponsiveContainer>
                )}
                 {dailyProgress && dailyProgress.length === 0 && <div className="text-center h-full flex items-center justify-center">لا توجد بيانات لعرضها.</div>}
            </div>

            {/* Achievements */}
            <div>
                <h3 className="font-bold mb-4 text-main">الإنجازات</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {/* Placeholder for achievements */}
                    <div className="bg-hover p-4 rounded-lg text-center flex flex-col items-center justify-center text-muted opacity-50">
                        <Award size={32} className="mb-2" />
                        <p className="font-bold">إتمام الجزء الأول</p>
                        <small>(قيد التطوير)</small>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
