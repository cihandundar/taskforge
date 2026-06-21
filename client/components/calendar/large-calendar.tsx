'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api-client';
import { useSites } from '@/hooks/useSites';

interface CalendarNote {
  id: string;
  date: string; // YYYY-MM-DD format
  note: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  userId: string;
  userName: string;
  createdAt: string;
  siteId?: string | null;
  site?: {
    id: string;
    name: string;
    color: string;
    url: string;
  };
}

interface LargeCalendarProps {
  onDateSelect?: (date: Date) => void;
  selectedSiteId?: string;
}

const colorClasses = {
  blue: 'bg-blue-100 text-blue-800 border-blue-200',
  green: 'bg-green-100 text-green-800 border-green-200',
  yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  red: 'bg-red-100 text-red-800 border-red-200',
  purple: 'bg-purple-100 text-purple-800 border-purple-200',
};

const colorDots: Record<string, string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
};

const statusConfig = {
  todo: { label: 'Başlamadı', color: 'bg-gray-400', textColor: 'text-gray-600' },
  in_progress: { label: 'Devam Ediyor', color: 'bg-blue-500', textColor: 'text-blue-600' },
  completed: { label: 'Tamamlandı', color: 'bg-green-500', textColor: 'text-green-600' },
  cancelled: { label: 'İptal', color: 'bg-red-500', textColor: 'text-red-600' },
};

const statusIcons: Record<string, string> = {
  todo: '○',
  in_progress: '◑',
  completed: '●',
  cancelled: '⊘',
};

export function LargeCalendar({ onDateSelect, selectedSiteId: propSelectedSiteId }: LargeCalendarProps) {
  const { user } = useAuth();
  const { sites } = useSites();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMonth, setViewMonth] = useState(new Date());
  const [notes, setNotes] = useState<CalendarNote[]>([]);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [currentNoteDate, setCurrentNoteDate] = useState<string>('');
  const [currentNoteText, setCurrentNoteText] = useState('');
  const [currentNoteColor, setCurrentNoteColor] = useState<'blue' | 'green' | 'yellow' | 'red' | 'purple'>('blue');
  const [currentNoteSiteId, setCurrentNoteSiteId] = useState<string>('');
  const [currentNoteStatus, setCurrentNoteStatus] = useState<'todo' | 'in_progress' | 'completed' | 'cancelled'>('todo');
  const [viewMode, setViewMode] = useState<'personal' | 'all'>('personal');
  const [selectedSiteId, setSelectedSiteId] = useState<string>(propSelectedSiteId || '');
  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'in_progress' | 'completed' | 'cancelled'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [expandedDateCells, setExpandedDateCells] = useState<Set<string>>(new Set());

  useEffect(() => {
    const today = new Date();
    setViewMonth(today);
    setSelectedDate(today);
    onDateSelect?.(today);
    fetchNotes();
  }, [viewMode]);

  useEffect(() => {
    if (propSelectedSiteId !== undefined) {
      setSelectedSiteId(propSelectedSiteId);
    }
  }, [propSelectedSiteId]);

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const endpoint = viewMode === 'all' ? '/calendar/all' : '/calendar';
      const response = await apiClient.client.get(endpoint);

      if (response.data) {
        // Transform data to match CalendarNote interface
        const transformedData = response.data.map((note: any) => ({
          id: note.id,
          date: note.date,
          note: note.note,
          color: note.color,
          status: note.status || 'todo',
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
      setIsNoteModalOpen(false);
      return;
    }

    try {
      const noteData = {
        date: currentNoteDate,
        note: currentNoteText,
        color: currentNoteColor,
        status: currentNoteStatus,
        siteId: currentNoteSiteId || null,
      };

      if (editingNoteId) {
        // Update existing note
        await apiClient.client.put(`/calendar/${editingNoteId}`, noteData);
      } else {
        // Create new note
        await apiClient.client.post('/calendar', noteData);
      }

      await fetchNotes();
      setIsNoteModalOpen(false);
      setEditingNoteId(null);
      setCurrentNoteSiteId('');
    } catch (error) {
      console.error('Not kaydedilirken hata:', error);
    }
  };

  const deleteNote = async () => {
    try {
      if (editingNoteId) {
        await apiClient.client.delete(`/calendar/${editingNoteId}`);
        await fetchNotes();
      }
      setIsNoteModalOpen(false);
      setEditingNoteId(null);
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

  const openNoteModal = (dateString: string, noteToEdit?: CalendarNote) => {
    console.log('📝 Opening note modal:', { dateString, noteToEdit });
    setCurrentNoteDate(dateString);
    setEditingNoteId(noteToEdit?.id || null);
    setCurrentNoteText(noteToEdit?.note || '');
    setCurrentNoteColor(noteToEdit?.color || 'blue');
    setCurrentNoteSiteId(noteToEdit?.siteId || '');
    setCurrentNoteStatus(noteToEdit?.status || 'todo');
    setIsNoteModalOpen(true);
    console.log('✅ Modal state set to true');
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
    return notes.filter(n =>
      n.date === dateStr &&
      (!selectedSiteId || n.siteId === selectedSiteId) &&
      (statusFilter === 'all' || n.status === statusFilter)
    );
  };

  const toggleDateCellExpansion = (dateStr: string) => {
    setExpandedDateCells(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dateStr)) {
        newSet.delete(dateStr);
      } else {
        newSet.add(dateStr);
      }
      return newSet;
    });
  };

  const updateNoteStatus = async (noteId: string, newStatus: 'todo' | 'in_progress' | 'completed' | 'cancelled') => {
    try {
      const note = notes.find(n => n.id === noteId);
      if (note) {
        await apiClient.client.put(`/calendar/${noteId}`, {
          ...note,
          status: newStatus
        });
        await fetchNotes();
      }
    } catch (error) {
      console.error('Durum güncellenirken hata:', error);
    }
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
            {/* Status Filter */}
            <div className="flex items-center bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setStatusFilter('all')}
                className={`
                  px-3 py-2 rounded-lg text-sm font-medium transition
                  ${statusFilter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}
                `}
              >
                Tümü
              </button>
              <button
                onClick={() => setStatusFilter('todo')}
                className={`
                  px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5
                  ${statusFilter === 'todo' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}
                `}
              >
                <span className="text-gray-400">○</span>
                Başlamadı
              </button>
              <button
                onClick={() => setStatusFilter('in_progress')}
                className={`
                  px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5
                  ${statusFilter === 'in_progress' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}
                `}
              >
                <span className="text-blue-500">◑</span>
                Devam Eden
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`
                  px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5
                  ${statusFilter === 'completed' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}
                `}
              >
                <span className="text-green-500">●</span>
                Tamamlanan
              </button>
            </div>

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
            const isExpanded = expandedDateCells.has(dateStr);

            return (
              <div
                key={day}
                className={`
                  group border-r border-b border-gray-200 p-3 min-h-[120px] cursor-pointer
                  transition hover:bg-gray-50 relative
                  ${dayIsToday ? 'bg-blue-50' : 'bg-white'}
                `}
                onClick={() => selectDate(day)}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  console.log('📝 Double clicked on date:', dateStr);
                  openNoteModal(dateStr);
                }}
              >
                <div
                  className="flex items-center justify-between mb-2"
                >
                  <div className={`text-lg font-medium ${dayIsToday ? 'text-blue-600' : 'text-gray-900'}`}>
                    {day}
                    {dayIsToday && (
                      <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Bugün</span>
                    )}
                  </div>
                  {dayNotes.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDateCellExpansion(dateStr);
                      }}
                      className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition"
                    >
                      {isExpanded ? '▼' : `+${dayNotes.length - 1}`}
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  {dayNotes.slice(0, isExpanded ? undefined : 1).map((note) => {
                    const isMyNote = note.userId === user?.id;
                    const statusInfo = statusConfig[note.status];

                    return (
                      <div
                        key={note.id}
                        className={`
                          p-2 rounded-lg text-xs border relative group
                          ${colorClasses[note.color]}
                          ${!isMyNote ? 'opacity-80' : ''}
                        `}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            {/* Status Icon */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const statusCycle: Record<string, string> = {
                                  'todo': 'in_progress',
                                  'in_progress': 'completed',
                                  'completed': 'todo',
                                  'cancelled': 'todo'
                                };
                                updateNoteStatus(note.id, statusCycle[note.status] as any);
                              }}
                              className={`text-xs ${statusInfo.textColor} hover:opacity-70 transition`}
                              title={statusInfo.label}
                            >
                              {statusIcons[note.status]}
                            </button>

                            {/* Site Badge */}
                            {note.site && (
                              <span className="text-[10px] font-medium opacity-75 truncate">
                                {note.site.name}
                              </span>
                            )}
                          </div>

                          {isMyNote && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openNoteModal(dateStr, note);
                              }}
                              className="w-4 h-4 flex items-center justify-center rounded bg-white/50 hover:bg-white opacity-0 group-hover:opacity-100 transition"
                              title="Notu düzenle"
                            >
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                          )}
                        </div>

                        <p className="line-clamp-2 pr-4">{note.note}</p>

                        {!isMyNote && (
                          <span className="absolute bottom-1 right-1 text-[10px] font-medium opacity-60">
                            {note.userName?.split(' ')[0] || '?'}
                          </span>
                        )}

                        {isMyNote && (
                          <>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                await apiClient.client.delete(`/calendar/${note.id}`);
                                await fetchNotes();
                              }}
                              className="absolute bottom-1 right-1 w-4 h-4 flex items-center justify-center rounded bg-red-500/50 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition"
                              title="Notu sil"
                            >
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add Note Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('➕ Add note clicked for:', dateStr);
                    openNoteModal(dateStr);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  className="absolute bottom-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 opacity-0 group-hover:opacity-100 transition text-gray-600 text-xs"
                  title="Yeni not ekle"
                >
                  +
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
              {editingNoteId ? 'Notu Düzenle' : 'Yeni Not Ekle'} - {
                new Date(currentNoteDate).toLocaleDateString('tr-TR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })
              }
            </h3>

            <textarea
              value={currentNoteText}
              onChange={(e) => setCurrentNoteText(e.target.value)}
              placeholder="Notunuzu yazın..."
              className="w-full h-32 p-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              autoFocus
            />

            {/* Site Selection */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">İlgili Site (Opsiyonel)</label>
              <select
                value={currentNoteSiteId}
                onChange={(e) => setCurrentNoteSiteId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">Site seçilmedi</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>

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

            {/* Status Selection */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Durum</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(statusConfig).map(([status, config]) => (
                  <button
                    key={status}
                    onClick={() => setCurrentNoteStatus(status as any)}
                    className={`
                      px-3 py-2 rounded-lg text-sm font-medium border transition
                      ${currentNoteStatus === status
                        ? `${config.color.replace('bg-', 'bg-')} text-white border-transparent`
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <span className="mr-1">{statusIcons[status]}</span>
                    {config.label}
                  </button>
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
                onClick={() => {
                  setIsNoteModalOpen(false);
                  setEditingNoteId(null);
                }}
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
