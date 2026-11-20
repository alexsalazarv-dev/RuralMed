import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { CitaDB } from '../lib/supabase.ts';
import {
  getDayAvailability,
  toISODateLocal,
  parseISODateLocal,
} from '../lib/appointmentsService.ts';

interface AvailabilityCalendarProps {
  funcionarioId: number;
  occupiedCitas: CitaDB[];
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
}

const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  funcionarioId,
  occupiedCitas,
  selectedDate,
  onSelectDate,
}) => {
  const initialDate = selectedDate ? parseISODateLocal(selectedDate) : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();

  const canGoPrev = viewYear > todayYear || (viewYear === todayYear && viewMonth > todayMonth);

  const handlePrevMonth = () => {
    if (!canGoPrev) return;
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const calendarDays = useMemo(() => {
    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const startOffset = (firstOfMonth.getDay() + 6) % 7;

    const cells: Array<{
      dateStr: string | null;
      dayNum: number | null;
      availability?: ReturnType<typeof getDayAvailability>;
    }> = [];

    for (let i = 0; i < startOffset; i++) {
      cells.push({ dateStr: null, dayNum: null });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(viewYear, viewMonth, day);
      const dateStr = toISODateLocal(dateObj);
      const availability = getDayAvailability(occupiedCitas, funcionarioId, dateStr);
      cells.push({ dateStr, dayNum: day, availability });
    }

    return cells;
  }, [viewYear, viewMonth, occupiedCitas, funcionarioId]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4">
      {/* Month Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={handlePrevMonth}
          disabled={!canGoPrev}
          aria-label="Mes anterior"
          className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <span className="text-sm sm:text-base font-extrabold text-slate-900">
          {MONTHS[viewMonth]} {viewYear}
        </span>

        <button
          type="button"
          onClick={handleNextMonth}
          aria-label="Mes siguiente"
          className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1.5 mb-1.5 text-center">
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-[11px] font-bold text-slate-500 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {calendarDays.map((cell, idx) => {
          if (!cell.dateStr || !cell.dayNum || !cell.availability) {
            return <div key={`empty-${idx}`} className="h-11" />;
          }

          const { status, freeSlots } = cell.availability;
          const isSelected = selectedDate === cell.dateStr;

          if (status === 'past') {
            return (
              <button
                key={cell.dateStr}
                type="button"
                disabled
                className="h-11 rounded-xl flex flex-col items-center justify-center text-xs font-medium text-slate-300 bg-slate-50 cursor-not-allowed tabular-nums"
              >
                {cell.dayNum}
              </button>
            );
          }

          if (status === 'unavailable' || status === 'full') {
            return (
              <button
                key={cell.dateStr}
                type="button"
                disabled
                title={
                  status === 'full'
                    ? 'Agenda completa sin cupos libres'
                    : 'El profesional no atiende este día'
                }
                className="h-11 rounded-xl flex flex-col items-center justify-center text-xs font-bold bg-rose-50 border border-rose-200 text-rose-600 cursor-not-allowed tabular-nums"
              >
                <span className="leading-none">{cell.dayNum}</span>
                <span className="text-[9px] font-semibold leading-none mt-0.5 text-rose-500">
                  {status === 'full' ? 'Lleno' : 'No'}
                </span>
              </button>
            );
          }

          return (
            <button
              key={cell.dateStr}
              type="button"
              onClick={() => onSelectDate(cell.dateStr!)}
              title={`${freeSlots} cupos disponibles`}
              className={`h-11 rounded-xl flex flex-col items-center justify-center text-xs font-extrabold border transition-all cursor-pointer tabular-nums ${
                isSelected
                  ? 'bg-emerald-600 border-emerald-700 text-white shadow-sm ring-2 ring-emerald-200'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100'
              }`}
            >
              <span className="leading-none">{cell.dayNum}</span>
              <span
                className={`text-[9px] font-semibold leading-none mt-0.5 ${
                  isSelected ? 'text-emerald-100' : 'text-emerald-700'
                }`}
              >
                {freeSlots} {freeSlots === 1 ? 'cupo' : 'cupos'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Legend & Required Message */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-2">
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-emerald-100 border border-emerald-400 inline-block" />
            <span className="font-semibold text-emerald-900">Con cupos disponibles</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-rose-100 border border-rose-300 inline-block" />
            <span className="font-semibold text-rose-700">Sin cupos / No atiende</span>
          </div>
        </div>
        <p className="text-xs font-medium text-rose-700 flex items-start gap-1.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <span>Los días en rojo no están disponibles o tienen la agenda completa</span>
        </p>
      </div>
    </div>
  );
};
