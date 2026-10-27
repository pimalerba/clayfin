import { computeOccurrences, getNextOccurrence, getWeekdayYMD } from '../recurring';

describe('computeOccurrences (Função Pura)', () => {
  it('gera ocorrências mensais fixadas no dia 31 ajustando para o último dia em meses curtos', () => {
    const rule = {
      frequency: 'monthly' as const,
      start_date: '2026-01-31',
      end_date: null,
      day_of_month: 31,
      weekday: null,
      is_active: 1,
    };

    // 2026 não é bissexto: fev tem 28 dias; abril tem 30; maio tem 31
    const occurrences = computeOccurrences(rule, '2026-01-01', '2026-05-31');

    expect(occurrences).toEqual([
      '2026-01-31',
      '2026-02-28', // Fev/2026 ajustado para 28
      '2026-03-31',
      '2026-04-30', // Abr/2026 ajustado para 30
      '2026-05-31',
    ]);
  });

  it('ajusta dia 31 para 29 em fevereiro de ano bissexto', () => {
    const rule = {
      frequency: 'monthly' as const,
      start_date: '2024-01-31',
      end_date: null,
      day_of_month: 31,
      weekday: null,
      is_active: 1,
    };

    const occurrences = computeOccurrences(rule, '2024-02-01', '2024-02-29');
    expect(occurrences).toEqual(['2024-02-29']);
  });

  it('ajusta 29/02 em anos não bissextos para 28/02 em regras anuais', () => {
    const rule = {
      frequency: 'yearly' as const,
      start_date: '2024-02-29', // ano bissexto
      end_date: null,
      day_of_month: 29,
      weekday: null,
      is_active: 1,
    };

    const occurrences = computeOccurrences(rule, '2024-01-01', '2028-12-31');

    expect(occurrences).toEqual([
      '2024-02-29', // bissexto
      '2025-02-28', // não bissexto recai em 28
      '2026-02-28', // não bissexto recai em 28
      '2027-02-28', // não bissexto recai em 28
      '2028-02-29', // bissexto
    ]);
  });

  it('calcula ocorrências semanais com espaçamento estrito de 7 dias no weekday correto', () => {
    // 2026-10-05 é uma Segunda-feira (weekday = 1)
    expect(getWeekdayYMD('2026-10-05')).toBe(1);

    const rule = {
      frequency: 'weekly' as const,
      start_date: '2026-10-05',
      end_date: null,
      day_of_month: null,
      weekday: 1, // Segunda-feira
      is_active: 1,
    };

    const occurrences = computeOccurrences(rule, '2026-10-01', '2026-10-31');

    expect(occurrences).toEqual([
      '2026-10-05',
      '2026-10-12',
      '2026-10-19',
      '2026-10-26',
    ]);
  });

  it('respeita a data de término (end_date) estritamente', () => {
    const rule = {
      frequency: 'monthly' as const,
      start_date: '2026-01-15',
      end_date: '2026-03-20',
      day_of_month: 15,
      weekday: null,
      is_active: 1,
    };

    const occurrences = computeOccurrences(rule, '2026-01-01', '2026-12-31');

    expect(occurrences).toEqual([
      '2026-01-15',
      '2026-02-15',
      '2026-03-15',
      // abril não deve ser gerado pois 2026-04-15 > end_date (2026-03-20)
    ]);
  });

  it('retorna array vazio quando a regra está pausada (is_active = 0)', () => {
    const rule = {
      frequency: 'monthly' as const,
      start_date: '2026-01-15',
      end_date: null,
      day_of_month: 15,
      weekday: null,
      is_active: 0,
    };

    const occurrences = computeOccurrences(rule, '2026-01-01', '2026-12-31');
    expect(occurrences).toEqual([]);
  });

  it('retorna array vazio em caso de intervalo vazio ou invertido (fromDate > toDate)', () => {
    const rule = {
      frequency: 'monthly' as const,
      start_date: '2026-01-15',
      end_date: null,
      day_of_month: 15,
      weekday: null,
      is_active: 1,
    };

    expect(computeOccurrences(rule, '2026-12-31', '2026-01-01')).toEqual([]);
    expect(computeOccurrences(rule, '2026-05-16', '2026-05-14')).toEqual([]);
  });

  it('garante idempotência lógica: chamadas consecutivas produzem o mesmo resultado idêntico', () => {
    const rule = {
      frequency: 'monthly' as const,
      start_date: '2026-01-10',
      end_date: '2026-06-30',
      day_of_month: 10,
      weekday: null,
      is_active: 1,
    };

    const res1 = computeOccurrences(rule, '2026-01-01', '2026-04-30');
    const res2 = computeOccurrences(rule, '2026-01-01', '2026-04-30');

    expect(res1).toEqual(res2);
    expect(res1).toEqual(['2026-01-10', '2026-02-10', '2026-03-10', '2026-04-10']);
  });

  it('getNextOccurrence retorna a próxima data futura correta a partir de uma data de referência', () => {
    const rule = {
      frequency: 'monthly' as const,
      start_date: '2026-01-10',
      end_date: null,
      day_of_month: 10,
      weekday: null,
      is_active: 1,
    };

    expect(getNextOccurrence(rule, '2026-03-05')).toBe('2026-03-10');
    expect(getNextOccurrence(rule, '2026-03-10')).toBe('2026-03-10');
    expect(getNextOccurrence(rule, '2026-03-11')).toBe('2026-04-10');
  });
});
