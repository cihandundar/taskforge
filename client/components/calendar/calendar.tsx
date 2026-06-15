'use client';

import { useState, useEffect } from 'react';

interface CalendarProps {
  onDateSelect?: (date: Date) => void;
}

export function Calendar({ onDateSelect }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMonth, setViewMonth] = useState(new Date());

  useEffect(() => {
    setSelectedDate(new Date());
    setViewMonth(new Date());
  }, []);

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

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      viewMonth.getMonth() === today.getMonth() &&
      viewMonth.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    return (
      day === selectedDate.getDate() &&
      viewMonth.getMonth() === selectedDate.getMonth() &&
      viewMonth.getFullYear() === selectedDate.getFullYear()
    );
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(viewMonth);

  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  const prevMonthDays = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={previousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {monthNames[viewMonth.getMonth()]} {viewMonth.getFullYear()}
          </h2>
        </div>

        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Today Button */}
      <button
        onClick={goToToday}
        className="w-full mb-4 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
      >
        Bugün
      </button>

      {/* Day Names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-1">
        {/* Previous Month Days */}
        {Array.from({ length: prevMonthDays }).map((_, index) => (
          <div
            key={`prev-${index}`}
            className="h-10 flex items-center justify-center text-gray-300"
          >
            {new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 0).getDate() - prevMonthDays + index + 1}
          </div>
        ))}

        {/* Current Month Days */}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const dayIsToday = isToday(day);
          const dayIsSelected = isSelected(day);

          return (
            <button
              key={day}
              onClick={() => selectDate(day)}
              className={`
                h-10 flex items-center justify-center rounded-lg text-sm font-medium transition
                ${dayIsToday
                  ? 'bg-black text-white'
                  : dayIsSelected
                    ? 'bg-gray-200 text-gray-900'
                    : 'text-gray-900 hover:bg-gray-100'
                }
              `}
            >
              {day}
            </button>
          );
        })}

        {/* Next Month Days */}
        {Array.from({ length: (7 - (daysInMonth + prevMonthDays) % 7) % 7 }).map((_, index) => (
          <div
            key={`next-${index}`}
            className="h-10 flex items-center justify-center text-gray-300"
          >
            {index + 1}
          </div>
        ))}
      </div>

      {/* Selected Date Info */}
      {selectedDate && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Seçilen Tarih</p>
              <p className="text-sm font-medium text-gray-900">
                {selectedDate.toLocaleDateString('tr-TR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Hafta</p>
              <p className="text-sm font-medium text-gray-900">
                {Math.ceil((selectedDate.getDate() + new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 0).getDate()) / 7)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
