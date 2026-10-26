import { getDatabase } from '@/db';
import { Budget, BudgetWithUsage } from '@/types';
import { getMonthDateRange } from '@/utils/date';
import { generateId } from '@/utils/uuid';

export interface UpsertBudgetInput {
  category_id: string;
  month: string; // yyyy-MM
  limit_cents: number;
}

export interface IBudgetRepository {
  getByMonthWithUsage(month: string): Promise<BudgetWithUsage[]>;
  upsert(input: UpsertBudgetInput): Promise<Budget>;
  delete(id: string): Promise<void>;
}

export const BudgetRepository: IBudgetRepository = {
  async getByMonthWithUsage(month: string): Promise<BudgetWithUsage[]> {
    const db = await getDatabase();
    const { startDate, endDate } = getMonthDateRange(month);

    return db.getAllAsync<BudgetWithUsage>(
      `SELECT
        b.id,
        b.category_id,
        b.month,
        b.limit_cents,
        c.name AS category_name,
        c.icon AS category_icon,
        c.color AS category_color,
        COALESCE(SUM(t.amount_cents), 0) AS spent_cents
       FROM budgets b
       INNER JOIN categories c ON c.id = b.category_id
       LEFT JOIN transactions t
         ON t.category_id = b.category_id
         AND t.type = 'expense'
         AND t.date >= ?
         AND t.date <= ?
       WHERE b.month = ?
       GROUP BY b.id, b.category_id, b.month, b.limit_cents, c.name, c.icon, c.color
       ORDER BY c.name ASC;`,
      [startDate, endDate, month]
    );
  },

  async upsert(input: UpsertBudgetInput): Promise<Budget> {
    const db = await getDatabase();
    const existing = await db.getFirstAsync<Budget>(
      `SELECT * FROM budgets WHERE category_id = ? AND month = ?;`,
      [input.category_id, input.month]
    );

    const cents = Math.trunc(input.limit_cents);

    if (existing) {
      await db.runAsync(
        `UPDATE budgets SET limit_cents = ? WHERE id = ?;`,
        [cents, existing.id]
      );
      return {
        ...existing,
        limit_cents: cents,
      };
    }

    const id = generateId();
    await db.runAsync(
      `INSERT INTO budgets (id, category_id, month, limit_cents)
       VALUES (?, ?, ?, ?);`,
      [id, input.category_id, input.month, cents]
    );

    return {
      id,
      category_id: input.category_id,
      month: input.month,
      limit_cents: cents,
    };
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM budgets WHERE id = ?;`, [id]);
  },
};
