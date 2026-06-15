'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface CalendarNote {
  id: string;
  date: string; // YYYY-MM-DD format
  note: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  userId: string;
  userName: string;
  createdAt: string;
}

interface LargeCalendarProps {
  onDateSelect?: (date: Date) => void;
}

const colorClasses = {
  blue: 'bg-blue-100 text-blue-800 border-blue-200',
  green: 'bg-green-100 text-green-800 border-green-200',
  yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  red: 'bg-red-100 text-red-800 border-red-200',
  purple: 'bg-purple-100 text-purple-800 border-purple-200',
};

export function LargeCalendar({ onDateSelect }: LargeCalendarProps) {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMonth, setViewMonth] = useState(new Date());
  const [notes, setNotes] = useState<CalendarNote[]>([]);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [currentNoteDate, setCurrentNoteDate] = useState<string>('');
  const [currentNoteText, setCurrentNoteText] = useState('');
  const [currentNoteColor, setCurrentNoteColor] = useState<'blue' | 'green' | 'yellow' | 'red' | 'purple'>('blue');
  const [viewMode, setViewMode] = useState<'personal' | 'all'>('personal');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const today = new Date();
    setViewMonth(today);
    setSelectedDate(today);
    onDateSelect?.(today);
    fetchNotes();
  }, [viewMode]);

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = viewMode === 'all'
        ? `${process.env.NEXT_PUBLIC_API_URL}/calendar/all`
        : `${process.env.NEXT_PUBLIC_API_URL}/calendar`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Transform data to match CalendarNote interface
        const transformedData = data.map((note: any) => ({
          id: note.id,
          date: note.date,
          note: note.note,
          color: note.color,
          userId: note.userId,
          userName: note.user?.name || 'Bilinmeyen',
          createdAt: note.createdAt,
        }));
        setNotes(transformedData);
      }
    } catch (error) {
      console.error('Notlar yüklenirken hata:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveNote = async () => {
    if (!currentNoteText.trim()) {
      await deleteNote();
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const existingNote = notes.find(n => n.date === currentNoteDate && n.userId === user?.id);

      let url = `${process.env.NEXT_PUBLIC_API_URL}/calendar`;
      let method = 'POST';

      if (existingNote) {
        url = `${process.env.NEXT_PUBLIC_API_URL}/calendar/${existingNote.id}`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: currentNoteDate,
          note: currentNoteText,
          color: currentNoteColor,
        }),
      });

      if (response.ok) {
        await fetchNotes();
        setIsNoteModalOpen(false);
      }
    } catch (error) {
      console.error('Not kaydedilirken hata:', error);
    }
  };

  const deleteNote = async () => {
    try {
      const token = localStorage.getItem('token');
      const existingNote = notes.find(n => n.date === currentNoteDate && n.userId === user?.id);

      if (existingNote) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/calendar/${existingNote.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          await fetchNotes();
        }
      }
      setIsNoteModalOpen(false);
    } catch (error) {
      console.error('Not silinirken hata:', error);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const previousMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1));
  };

  const goToToday = () => {
    const today = new Date();
    setViewMonth(today);
    setSelectedDate(today);
    onDateSelect?.(today);
  };

  const selectDate = (day: number) => {
    const newDate = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
    setSelectedDate(newDate);
    onDateSelect?.(newDate);
  };

  const openNoteModal = (dateString: string) => {
    setCurrentNoteDate(dateString);
    const existingNote = notes.find(n => n.date === dateString && n.userId === user?.id);
    setCurrentNoteText(existingNote?.note || '');
    setCurrentNoteColor(existingNote?.color || 'blue');
    setIsNoteModalOpen(true);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      viewMonth.getMonth() === today.getMonth() &&
      viewMonth.getFullYear() === today.getFullYear()
    );
  };

  const getNotesForDate = (day: number) => {
    const dateStr = `${viewMonth.getFullYear()}-${String(viewMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return notes.filter(n => n.date === dateStr);
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(viewMonth);

  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  const prevMonthDays = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

  return (
    <>
      <div className="h-full flex flex-col bg-white">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button
              onClick={previousMonth}
              className="p-3 hover:bg-gray-100 rounded-xl transition"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <h2 className="text-3xl font-bold text-gray-900">
              {monthNames[viewMonth.getMonth()]} {viewMonth.getFullYear()}
            </h2>

            <button
              onClick={nextMonth}
              className="p-3 hover:bg-gray-100 rounded-xl transition"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode('personal')}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition
                  ${viewMode === 'personal' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}
                `}
              >
                Sadece Benim
              </button>
              <button
                onClick={() => setViewMode('all')}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition
                  ${viewMode === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}
                `}
              >
                Tüm Takvimler
              </button>
            </div>

            <button
              onClick={goToToday}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
            >
              Bugün
            </button>
          </div>
        </div>

        {/* Day Names */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {dayNames.map((day) => (
            <div key={day} className="text-center py-4 text-sm font-semibold text-gray-600 uppercase tracking-wide">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 grid grid-cols-7 grid-rows-5 overflow-hidden">
          {/* Previous Month Days */}
          {Array.from({ length: prevMonthDays }).map((_, index) => (
            <div
              key={`prev-${index}`}
              className="border-r border-b border-gray-200 p-3 bg-gray-50"
            >
              <div className="text-gray-300 text-lg font-medium">
                {new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 0).getDate() - prevMonthDays + index + 1}
              </div>
            </div>
          ))}

          {/* Current Month Days */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const dayIsToday = isToday(day);
            const dayNotes = getNotesForDate(day);
            const dateStr = `${viewMonth.getFullYear()}-${String(viewMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const myNote = dayNotes.find(n => n.userId === user?.id);

            return (
              <div
                key={day}
                onClick={() => selectDate(day)}
                onDoubleClick={() => openNoteModal(dateStr)}
                className={`
                  border-r border-b border-gray-200 p-3 min-h-[120px] cursor-pointer
                  transition hover:bg-gray-50 relative
                  ${dayIsToday ? 'bg-blue-50' : 'bg-white'}
                `}
              >
                <div className={`text-lg font-medium mb-1 ${dayIsToday ? 'text-blue-600' : 'text-gray-900'}`}>
                  {day}
                  {dayIsToday && (
                    <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Bugün</span>
                  )}
                </div>

                <div className="space-y-1">
                  {dayNotes.map((note) => {
                    const isMyNote = note.userId === user?.id;
                    return (
                      <div
                        key={note.id}
                        className={`
                          p-2 rounded-lg text-xs border relative group
                          ${colorClasses[note.color]}
                          ${!isMyNote ? 'opacity-80' : ''}
                        `}
                      >
                        <p className="line-clamp-2 pr-4">{note.note}</p>
                        {!isMyNote && (
                          <span className="absolute bottom-1 right-1 text-[10px] font-medium opacity-60">
                            {note.userName?.split(' ')[0] || '?'}
                          </span>
                        )}
                        {isMyNote && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openNoteModal(dateStr);
                            }}
                            className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded bg-white/50 hover:bg-white opacity-0 group-hover:opacity-100 transition"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openNoteModal(dateStr);
                  }}
                  className="absolute bottom-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition opacity-0 hover:opacity-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            );
          })}

          {/* Next Month Days */}
          {Array.from({ length: (7 - (daysInMonth + prevMonthDays) % 7) % 7 }).map((_, index) => (
            <div
              key={`next-${index}`}
              className="border-r border-b border-gray-200 p-3 bg-gray-50"
            >
              <div className="text-gray-300 text-lg font-medium">
                {index + 1}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="px-8 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Çift tıklayarak not ekleyebilirsiniz</span>
              </div>
              {viewMode === 'all' && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  <span>Diğer kullanıcıların notları</span>
                </div>
              )}
            </div>
            <div>
              {selectedDate && (
                <span className="font-medium">
                  {selectedDate.toLocaleDateString('tr-TR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Note Modal */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {new Date(currentNoteDate).toLocaleDateString('tr-TR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </h3>

            <textarea
              value={currentNoteText}
              onChange={(e) => setCurrentNoteText(e.target.value)}
              placeholder="Notunuzu yazın..."
              className="w-full h-32 p-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              autoFocus
            />

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Renk</label>
              <div className="flex gap-2">
                {Object.entries(colorClasses).map(([color, classes]) => (
                  <button
                    key={color}
                    onClick={() => setCurrentNoteColor(color as any)}
                    className={`
                      w-8 h-8 rounded-full ${classes.split(' ')[0]}
                      ${currentNoteColor === color ? 'ring-2 ring-offset-2 ring-gray-900' : ''}
                    `}
                  />
                ))}
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={saveNote}
                className="flex-1 px-4 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition"
              >
                Kaydet
              </button>
              <button
                onClick={deleteNote}
                className="px-4 py-3 bg-red-100 text-red-700 rounded-xl font-medium hover:bg-red-200 transition"
              >
                Sil
              </button>
              <button
                onClick={() => setIsNoteModalOpen(false)}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
