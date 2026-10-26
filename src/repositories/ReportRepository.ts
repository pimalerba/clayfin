import * as SQLite from 'expo-sqlite';
import { getDatabase } from '@/db';
import {
  CategoryExpenseSlice,
  MonthlyCashflowPoint,
  MonthlySummaryReport,
} from '@/types';
import {
  formatShortMonthPtBR,
  getLastSixMonthsISO,
  getMonthDateRange,
} from '@/utils/date';

export interface IReportRepository {
  getMonthlySummary(month: string): Promise<MonthlySummaryReport>;
  getAvailableAccountBalance(dbOrTxn?: SQLite.SQLiteDatabase): Promise<number>;
  getExpensesByCategory(month: string): Promise<CategoryExpenseSlice[]>;
  getLastSixMonthsCashflow(endMonth: string): Promise<MonthlyCashflowPoint[]>;
}

export const ReportRepository: IReportRepository = {
  async getAvailableAccountBalance(
    dbOrTxn?: SQLite.SQLiteDatabase
  ): Promise<number> {
    const db = dbOrTxn ?? (await getDatabase());
    const txTotals = await db.getAllAsync<{
      type: 'income' | 'expense';
      total_cents: number;
    }>(
      `SELECT type, COALESCE(SUM(amount_cents), 0) AS total_cents
       FROM transactions
       GROUP BY type;`
    );

    let allIncome = 0;
    let allExpense = 0;
    for (const row of txTotals) {
      if (row.type === 'income') allIncome = row.total_cents;
      if (row.type === 'expense') allExpense = row.total_cents;
    }

    const goalRow = await db.getFirstAsync<{ net_saved_cents: number }>(
      `SELECT COALESCE(SUM(amount_cents), 0) AS net_saved_cents
       FROM goal_contributions;`
    );
    const allSavedInGoals = goalRow?.net_saved_cents ?? 0;

    return allIncome - allExpense - allSavedInGoals;
  },

  async getMonthlySummary(month: string): Promise<MonthlySummaryReport> {
    const db = await getDatabase();
    const { startDate, endDate } = getMonthDateRange(month);

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

    let totalIncome = 0;
    let totalExpense = 0;

    for (const row of totalsRows) {
      if (row.type === 'income') totalIncome = row.total_cents;
      if (row.type === 'expense') totalExpense = row.total_cents;
    }

    const monthGoalRow = await db.getFirstAsync<{ net_cents: number }>(
      `SELECT COALESCE(SUM(amount_cents), 0) AS net_cents
       FROM goal_contributions
       WHERE date >= ? AND date <= ?;`,
      [startDate, endDate]
    );
    const netGoalMonthCents = monthGoalRow?.net_cents ?? 0;

    const allSavedRow = await db.getFirstAsync<{ total_saved_cents: number }>(
      `SELECT COALESCE(SUM(amount_cents), 0) AS total_saved_cents
       FROM goal_contributions;`
    );
    const totalSavedInGoalsCents = allSavedRow?.total_saved_cents ?? 0;

    const availableAccountCents = await this.getAvailableAccountBalance();

    const topCategoryRow = await db.getFirstAsync<{
      category_id: string;
      category_name: string;
      category_icon: string;
      category_color: string;
      total_cents: number;
    }>(
      `SELECT
        c.id AS category_id,
        c.name AS category_name,
        c.icon AS category_icon,
        c.color AS category_color,
        COALESCE(SUM(t.amount_cents), 0) AS total_cents
       FROM transactions t
       INNER JOIN categories c ON c.id = t.category_id
       WHERE t.type = 'expense' AND t.date >= ? AND t.date <= ?
       GROUP BY c.id, c.name, c.icon, c.color
       ORDER BY total_cents DESC
       LIMIT 1;`,
      [startDate, endDate]
    );

    return {
      month,
      total_income_cents: totalIncome,
      total_expense_cents: totalExpense,
      net_goal_contributions_cents: netGoalMonthCents,
      balance_cents: totalIncome - totalExpense - netGoalMonthCents,
      available_account_cents: availableAccountCents,
      total_saved_in_goals_cents: totalSavedInGoalsCents,
      top_expense_category:
        topCategoryRow && topCategoryRow.total_cents > 0 ? topCategoryRow : null,
    };
  },

  async getExpensesByCategory(month: string): Promise<CategoryExpenseSlice[]> {
    const db = await getDatabase();
    const { startDate, endDate } = getMonthDateRange(month);

    const rows = await db.getAllAsync<{
      category_id: string;
      category_name: string;
      category_icon: string;
      category_color: string;
      total_cents: number;
    }>(
      `SELECT
        c.id AS category_id,
        c.name AS category_name,
        c.icon AS category_icon,
        c.color AS category_color,
        COALESCE(SUM(t.amount_cents), 0) AS total_cents
       FROM transactions t
       INNER JOIN categories c ON c.id = t.category_id
       WHERE t.type = 'expense' AND t.date >= ? AND t.date <= ?
       GROUP BY c.id, c.name, c.icon, c.color
       HAVING total_cents > 0
       ORDER BY total_cents DESC;`,
      [startDate, endDate]
    );

    const grandTotal = rows.reduce((acc, r) => acc + r.total_cents, 0);

    return rows.map((row) => ({
      ...row,
      percentage:
        grandTotal > 0
          ? Math.round((row.total_cents / grandTotal) * 1000) / 10
          : 0,
    }));
  },

  async getLastSixMonthsCashflow(endMonth: string): Promise<MonthlyCashflowPoint[]> {
    const db = await getDatabase();
    const months = getLastSixMonthsISO(endMonth);
    const firstRange = getMonthDateRange(months[0]);
    const lastRange = getMonthDateRange(months[months.length - 1]);

    const rows = await db.getAllAsync<{
      month: string;
      type: 'income' | 'expense';
      total_cents: number;
    }>(
      `SELECT
        substr(date, 1, 7) AS month,
        type,
        COALESCE(SUM(amount_cents), 0) AS total_cents
       FROM transactions
       WHERE date >= ? AND date <= ?
       GROUP BY substr(date, 1, 7), type
       ORDER BY month ASC;`,
      [firstRange.startDate, lastRange.endDate]
    );

    return months.map((m) => {
      const incomeRow = rows.find((r) => r.month === m && r.type === 'income');
      const expenseRow = rows.find((r) => r.month === m && r.type === 'expense');

      return {
        month: m,
        label: formatShortMonthPtBR(m),
        income_cents: incomeRow?.total_cents ?? 0,
        expense_cents: expenseRow?.total_cents ?? 0,
      };
    });
  },
};
