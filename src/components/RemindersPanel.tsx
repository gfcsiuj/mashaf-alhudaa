import { useState, useEffect } from "react";
import { toast } from "sonner";

interface Reminder {
  id: string;
  pageNumber: number;
  note: string;
  createdAt: number;
}

interface RemindersPanelProps {
  onClose: () => void;
  currentPage: number;
}

export function RemindersPanel({ onClose, currentPage }: RemindersPanelProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [newNote, setNewNote] = useState("");
  const [selectedPage, setSelectedPage] = useState(currentPage);

  // Load reminders from localStorage
  useEffect(() => {
    const savedReminders = JSON.parse(localStorage.getItem('pageReminders') || '[]');
    setReminders(savedReminders);
  }, []);

  // Save reminders to localStorage
  const saveReminders = (updatedReminders: Reminder[]) => {
    localStorage.setItem('pageReminders', JSON.stringify(updatedReminders));
    setReminders(updatedReminders);
  };

  // Add new reminder
  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    const newReminder: Reminder = {
      id: Date.now().toString(),
      pageNumber: selectedPage,
      note: newNote.trim(),
      createdAt: Date.now(),
    };

    const updatedReminders = [...reminders, newReminder];
    saveReminders(updatedReminders);
    setNewNote("");
    toast.success("تم إضافة التذكير");
  };

  // Remove reminder
  const handleRemoveReminder = (id: string) => {
    const updatedReminders = reminders.filter(r => r.id !== id);
    saveReminders(updatedReminders);
    toast.success("تم حذف التذكير");
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 font-ui">التذكيرات</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span className="text-xl">✕</span>
          </button>
        </div>

        {/* Add New Reminder */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 font-ui">إضافة تذكير جديد</h3>
          <form onSubmit={handleAddReminder} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2 font-ui">
                  رقم الصفحة
                </label>
                <input
                  type="number"
                  min="1"
                  max="604"
                  value={selectedPage}
                  onChange={(e) => setSelectedPage(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8b7355] focus:border-[#8b7355] outline-none font-ui"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-ui">
                نص التذكير
              </label>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="اكتب تذكيرك هنا..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8b7355] focus:border-[#8b7355] outline-none font-ui"
                rows={3}
                dir="rtl"
              />
            </div>
            <button
              type="submit"
              disabled={!newNote.trim()}
              className="w-full px-4 py-2 bg-[#8b7355] text-white rounded-lg hover:bg-[#6b5b47] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-ui"
            >
              إضافة التذكير
            </button>
          </form>
        </div>

        {/* Reminders List */}
        <div className="flex-1 overflow-y-auto max-h-96">
          {reminders.length > 0 ? (
            <div className="p-4 space-y-3">
              <p className="text-sm text-gray-600 mb-4 font-ui">
                لديك {reminders.length} تذكير
              </p>
              {reminders
                .sort((a, b) => a.pageNumber - b.pageNumber)
                .map((reminder) => (
                  <div
                    key={reminder.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[#8b7355]">📌</span>
                        <span className="text-sm text-[#8b7355] font-medium font-ui">
                          صفحة {reminder.pageNumber}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveReminder(reminder.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded text-red-500 transition-all"
                        title="حذف التذكير"
                      >
                        <span className="text-sm">🗑️</span>
                      </button>
                    </div>
                    <p className="text-gray-800 mb-2 font-ui" dir="rtl">
                      {reminder.note}
                    </p>
                    <div className="text-xs text-gray-400 font-ui">
                      تم الإنشاء في {new Date(reminder.createdAt).toLocaleDateString('ar-SA')}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <span className="text-4xl mb-4 block">📌</span>
              <p className="font-ui">لا توجد تذكيرات</p>
              <p className="text-sm mt-2 font-ui">أضف تذكيرات لصفحات معينة لتذكيرك بها لاحقاً</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
