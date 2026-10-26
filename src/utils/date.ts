import {
  format,
  parseISO,
  addMonths,
  subMonths,
  isToday,
  isYesterday,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function getCurrentMonthISO(referenceDate: Date = new Date()): string {
  return format(referenceDate, 'yyyy-MM');
}

export function getTodayISO(referenceDate: Date = new Date()): string {
  return format(referenceDate, 'yyyy-MM-dd');
}

export function formatMonthYearPtBR(monthIso: string): string {
  const parsed = parseISO(`${monthIso}-01`);
  const formatted = format(parsed, "MMMM 'de' yyyy", { locale: ptBR });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatShortMonthPtBR(monthIso: string): string {
  const parsed = parseISO(`${monthIso}-01`);
  const formatted = format(parsed, 'MMM', { locale: ptBR }).replace('.', '');
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function shiftMonth(monthIso: string, delta: number): string {
  const baseDate = parseISO(`${monthIso}-01`);
  const next = delta >= 0 ? addMonths(baseDate, delta) : subMonths(baseDate, Math.abs(delta));
  return format(next, 'yyyy-MM');
}

export function getLastSixMonthsISO(endMonthIso: string): string[] {
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    months.push(shiftMonth(endMonthIso, -i));
  }
  return months;
}

export function formatDaySectionHeader(dateIso: string): string {
  const parsed = parseISO(dateIso);
  if (isToday(parsed)) {
    return `Hoje, ${format(parsed, "dd 'de' MMM", { locale: ptBR })}`;
  }
  if (isYesterday(parsed)) {
    return `Ontem, ${format(parsed, "dd 'de' MMM", { locale: ptBR })}`;
  }
  const full = format(parsed, "EEEE, dd 'de' MMMM", { locale: ptBR });
  return full.charAt(0).toUpperCase() + full.slice(1);
}

export function formatDateShortPtBR(dateIso: string): string {
  try {
    return format(parseISO(dateIso), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return dateIso;
  }
}

export function getMonthDateRange(monthIso: string): { startDate: string; endDate: string } {
  const base = parseISO(`${monthIso}-01`);
  return {
    startDate: format(startOfMonth(base), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(base), 'yyyy-MM-dd'),
  };
}
