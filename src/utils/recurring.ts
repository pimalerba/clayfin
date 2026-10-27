import { getDaysInMonth } from 'date-fns';
import { RecurringRule } from '@/types';

export function parseYMD(ymd: string): { year: number; month: number; day: number } {
  const parts = ymd.split('-').map(Number);
  return { year: parts[0], month: parts[1], day: parts[2] };
}

export function formatYMD(year: number, month: number, day: number): string {
  const y = String(year).padStart(4, '0');
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Retorna o dia da semana (0 = Domingo, ..., 6 = Sábado) para uma data YYYY-MM-DD
 * sem sofrer desvios de fuso horário / horário de verão.
 */
export function getWeekdayYMD(ymd: string): number {
  const { year, month, day } = parseYMD(ymd);
  return new Date(year, month - 1, day, 12, 0, 0).getDay();
}

/**
 * Função PURA que calcula todas as ocorrências de uma regra recorrente dentro de um intervalo [fromDate, toDate].
 *
 * Regras implementadas:
 * - Datas estritamente em formato 'yyyy-MM-dd', sem armadilhas de UTC/fuso
 * - Respeita start_date, end_date e is_active (retorna [] se pausada)
 * - Mensal no dia 31: em meses curtos usa o último dia do mês (ex.: 28 ou 29 em fev, 30 em abr)
 * - Anual em 29/02: em anos não bissextos recai em 28/02
 * - Semanal: ocorre a cada 7 dias no dia da semana especificado
 * - Retorna array vazio se fromDate > toDate ou intervalo fora dos limites da regra
 */
export function computeOccurrences(
  rule: Pick<
    RecurringRule,
    'frequency' | 'start_date' | 'end_date' | 'day_of_month' | 'weekday' | 'is_active'
  >,
  fromDate: string,
  toDate: string
): string[] {
  if (rule.is_active === 0) {
    return [];
  }

  if (fromDate > toDate) {
    return [];
  }

  if (rule.end_date && fromDate > rule.end_date) {
    return [];
  }

  if (rule.start_date > toDate) {
    return [];
  }

  const effectiveStart = rule.start_date > fromDate ? rule.start_date : fromDate;
  const effectiveEnd =
    rule.end_date && rule.end_date < toDate ? rule.end_date : toDate;

  if (effectiveStart > effectiveEnd) {
    return [];
  }

  const occurrences: string[] = [];
  const startParsed = parseYMD(rule.start_date);

  switch (rule.frequency) {
    case 'monthly': {
      const targetDay = rule.day_of_month ?? startParsed.day;
      const { year: startY, month: startM } = parseYMD(effectiveStart);
      const { year: endY, month: endM } = parseYMD(effectiveEnd);

      let curY = startY;
      let curM = startM;

      while (curY < endY || (curY === endY && curM <= endM)) {
        const daysInCurMonth = getDaysInMonth(new Date(curY, curM - 1, 1));
        const actualDay = Math.min(targetDay, daysInCurMonth);
        const dateStr = formatYMD(curY, curM, actualDay);

        if (dateStr >= effectiveStart && dateStr <= effectiveEnd) {
          occurrences.push(dateStr);
        }

        curM++;
        if (curM > 12) {
          curM = 1;
          curY++;
        }
      }
      break;
    }

    case 'yearly': {
      const targetMonth = startParsed.month;
      const targetDay = rule.day_of_month ?? startParsed.day;
      const { year: startY } = parseYMD(effectiveStart);
      const { year: endY } = parseYMD(effectiveEnd);

      for (let y = startY; y <= endY; y++) {
        const daysInMonth = getDaysInMonth(new Date(y, targetMonth - 1, 1));
        const actualDay = Math.min(targetDay, daysInMonth);
        const dateStr = formatYMD(y, targetMonth, actualDay);

        if (dateStr >= effectiveStart && dateStr <= effectiveEnd) {
          occurrences.push(dateStr);
        }
      }
      break;
    }

    case 'weekly': {
      const targetWeekday =
        rule.weekday ?? getWeekdayYMD(rule.start_date);
      const { year: startY, month: startM, day: startD } = parseYMD(effectiveStart);
      const curW = getWeekdayYMD(effectiveStart);
      const diff = (targetWeekday - curW + 7) % 7;

      let curDate = new Date(startY, startM - 1, startD + diff, 12, 0, 0);

      while (true) {
        const dateStr = formatYMD(
          curDate.getFullYear(),
          curDate.getMonth() + 1,
          curDate.getDate()
        );

        if (dateStr > effectiveEnd) {
          break;
        }

        if (dateStr >= effectiveStart) {
          occurrences.push(dateStr);
        }

        curDate = new Date(
          curDate.getFullYear(),
          curDate.getMonth(),
          curDate.getDate() + 7,
          12,
          0,
          0
        );
      }
      break;
    }
  }

  return occurrences;
}

/**
 * Retorna a próxima data de ocorrência a partir de uma data de referência (inclusive).
 */
export function getNextOccurrence(
  rule: Pick<
    RecurringRule,
    'frequency' | 'start_date' | 'end_date' | 'day_of_month' | 'weekday' | 'is_active'
  >,
  referenceDate: string
): string | null {
  const { year, month, day } = parseYMD(referenceDate);
  const oneYearAhead = formatYMD(year + 2, month, day);
  const occurrences = computeOccurrences(rule, referenceDate, oneYearAhead);
  return occurrences[0] ?? null;
}
