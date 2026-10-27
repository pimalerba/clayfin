import * as SQLite from 'expo-sqlite';
import { getDatabase } from '@/db';
import { MonthlyReportExportData, TransactionExportRow } from '@/utils/exportCsv';
import {
  getCurrentMonthISO,
  getMonthDateRange,
  formatMonthYearPtBR,
} from '@/utils/date';
import { calculateBudgetProgress } from '@/utils/progress';

export type ExportPeriodType =
  | 'current_month'
  | 'specific_month'
  | 'custom_range'
  | 'all';

export interface ExportFilterOptions {
  periodType: ExportPeriodType;
  specificMonth?: string; // yyyy-MM
  startDate?: string; // yyyy-MM-dd
  endDate?: string; // yyyy-MM-dd
  type?: 'all' | 'income' | 'expense';
  categoryId?: string | null;
}

export interface IExportRepository {
  getTransactionsForExport(
    filters: ExportFilterOptions,
    dbOrTxn?: SQLite.SQLiteDatabase
  ): Promise<TransactionExportRow[]>;

  getMonthlyReportData(
    month: string, // yyyy-MM
    dbOrTxn?: SQLite.SQLiteDatabase
  ): Promise<{
    summary: MonthlyReportExportData;
    transactions: TransactionExportRow[];
  }>;
}

export const ExportRepository: IExportRepository = {
  async getTransactionsForExport(
    filters: ExportFilterOptions,
    dbOrTxn?: SQLite.SQLiteDatabase
  ): Promise<TransactionExportRow[]> {
    const db = dbOrTxn ?? (await getDatabase());

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    // Filtro de período
    if (filters.periodType === 'current_month') {
      const current = getCurrentMonthISO();
      const { startDate, endDate } = getMonthDateRange(current);
      conditions.push('t.date >= ? AND t.date <= ?');
      params.push(startDate, endDate);
    } else if (filters.periodType === 'specific_month' && filters.specificMonth) {
      const { startDate, endDate } = getMonthDateRange(filters.specificMonth);
      conditions.push('t.date >= ? AND t.date <= ?');
      params.push(startDate, endDate);
    } else if (filters.periodType === 'custom_range') {
      if (filters.startDate) {
        conditions.push('t.date >= ?');
        params.push(filters.startDate);
      }
      if (filters.endDate) {
        conditions.push('t.date <= ?');
        params.push(filters.endDate);
      }
    }

    // Filtro de tipo
    if (filters.type && filters.type !== 'all') {
      conditions.push('t.type = ?');
      params.push(filters.type);
    }

    // Filtro de categoria
    if (filters.categoryId) {
      conditions.push('t.category_id = ?');
      params.push(filters.categoryId);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        t.date,
        t.type,
        c.name AS category_name,
        t.description,
        t.amount_cents
      FROM transactions t
      JOIN categories c ON c.id = t.category_id
      ${whereClause}
      ORDER BY t.date DESC, t.created_at DESC;
    `;

    return db.getAllAsync<TransactionExportRow>(query, params);
  },

  async getMonthlyReportData(
    month: string,
    dbOrTxn?: SQLite.SQLiteDatabase
  ): Promise<{
    summary: MonthlyReportExportData;
    transactions: TransactionExportRow[];
  }> {
    const db = dbOrTxn ?? (await getDatabase());
    const { startDate, endDate } = getMonthDateRange(month);

    // 1. Totais do mês
    const totalsRows = await db.getAllAsync<{
      type: 'income' | 'expense';
      total_cents: number;
    }>(
      `SELECT type, COALESCE(SUM(amount_cents), 0) AS total_cents
       FROM transactions
       WHERE date >= ? AND date <= ?
       GROUP BY type;`,
      [startDate, endDate]
    );

    let totalIncomeCents = 0;
    let totalExpenseCents = 0;
    for (const r of totalsRows) {
      if (r.type === 'income') totalIncomeCents = r.total_cents;
      if (r.type === 'expense') totalExpenseCents = r.total_cents;
    }
    const netBalanceCents = totalIncomeCents - totalExpenseCents;

    // 2. Despesas por Categoria no mês
    const categoryRows = await db.getAllAsync<{
      name: string;
      type: 'income' | 'expense';
      total_cents: number;
    }>(
      `SELECT c.name, t.type, COALESCE(SUM(t.amount_cents), 0) AS total_cents
       FROM transactions t
       JOIN categories c ON c.id = t.category_id
       WHERE t.date >= ? AND t.date <= ?
       GROUP BY c.id, t.type
       ORDER BY total_cents DESC;`,
      [startDate, endDate]
    );

    const categories = categoryRows.map((cat) => {
      const denom = cat.type === 'expense' ? totalExpenseCents : totalIncomeCents;
      const percentage = denom > 0 ? (cat.total_cents / denom) * 100 : 0;
      return {
        name: cat.name,
        type: cat.type,
        totalCents: cat.total_cents,
        percentage,
      };
    });

    // 3. Orçamentos configurados para o mês
    const budgetRows = await db.getAllAsync<{
      category_name: string;
      limit_cents: number;
      spent_cents: number;
    }>(
      `SELECT 
         c.name AS category_name,
         b.limit_cents,
         COALESCE((
           SELECT SUM(t.amount_cents)
           FROM transactions t
           WHERE t.category_id = b.category_id
             AND t.date >= ? AND t.date <= ?
         ), 0) AS spent_cents
       FROM budgets b
       JOIN categories c ON c.id = b.category_id
       WHERE b.month = ?
       ORDER BY c.name ASC;`,
      [startDate, endDate, month]
    );

    const budgets = budgetRows.map((b) => {
      const progress = calculateBudgetProgress(b.spent_cents, b.limit_cents);
      return {
        categoryName: b.category_name,
        limitCents: b.limit_cents,
        spentCents: b.spent_cents,
        percentage: progress.percentage,
        status: progress.alertLevel,
      };
    });

    // 4. Metas ativas e progresso
    const goalRows = await db.getAllAsync<{
      name: string;
      target_cents: number;
      current_cents: number;
      deadline: string | null;
    }>(
      `SELECT 
         g.name,
         g.target_cents,
         COALESCE(SUM(c.amount_cents), 0) AS current_cents,
         g.deadline
       FROM goals g
       LEFT JOIN goal_contributions c ON c.goal_id = g.id
       GROUP BY g.id
       ORDER BY g.created_at ASC;`
    );

    const goals = goalRows.map((g) => {
      const percentage =
        g.target_cents > 0
          ? Math.min(100, Math.max(0, (g.current_cents / g.target_cents) * 100))
          : 0;
      return {
        name: g.name,
        targetCents: g.target_cents,
        currentCents: g.current_cents,
        percentage,
        deadline: g.deadline,
      };
    });

    // 5. Transações do mês
    const transactions = await db.getAllAsync<TransactionExportRow>(
      `SELECT 
         t.date,
         t.type,
         c.name AS category_name,
         t.description,
         t.amount_cents
       FROM transactions t
       JOIN categories c ON c.id = t.category_id
       WHERE t.date >= ? AND t.date <= ?
       ORDER BY t.date DESC, t.created_at DESC;`,
      [startDate, endDate]
    );

    const summary: MonthlyReportExportData = {
      month,
      monthLabel: formatMonthYearPtBR(month),
      totalIncomeCents,
      totalExpenseCents,
      netBalanceCents,
      categories,
      budgets,
      goals,
    };

    return { summary, transactions };
  },
};
