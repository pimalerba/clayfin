import { getDatabase } from '@/db';
import {
  Transaction,
  TransactionType,
  TransactionWithCategory,
} from '@/types';
import { getMonthDateRange } from '@/utils/date';
import { generateId } from '@/utils/uuid';

export interface TransactionFilters {
  month?: string; // yyyy-MM
  type?: TransactionType;
  categoryId?: string | null;
  search?: string;
  limit?: number;
}

export interface CreateTransactionInput {
  category_id: string;
  type: TransactionType;
  amount_cents: number;
  description?: string | null;
  date: string; // yyyy-MM-dd
}

export interface UpdateTransactionInput extends CreateTransactionInput {
  id: string;
}

export interface ITransactionRepository {
  list(filters?: TransactionFilters): Promise<TransactionWithCategory[]>;
  getById(id: string): Promise<TransactionWithCategory | null>;
  create(input: CreateTransactionInput): Promise<Transaction>;
  update(input: UpdateTransactionInput): Promise<Transaction>;
  delete(id: string): Promise<void>;
}

export const TransactionRepository: ITransactionRepository = {
  async list(filters: TransactionFilters = {}): Promise<TransactionWithCategory[]> {
    const db = await getDatabase();
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filters.month) {
      const { startDate, endDate } = getMonthDateRange(filters.month);
      conditions.push('t.date >= ? AND t.date <= ?');
      params.push(startDate, endDate);
    }

    if (filters.type) {
      conditions.push('t.type = ?');
      params.push(filters.type);
    }

    if (filters.categoryId) {
      conditions.push('t.category_id = ?');
      params.push(filters.categoryId);
    }

    if (filters.search && filters.search.trim().length > 0) {
      const q = `%${filters.search.trim().toLowerCase()}%`;
      conditions.push(
        '(LOWER(COALESCE(t.description, "")) LIKE ? OR LOWER(c.name) LIKE ?)'
      );
      params.push(q, q);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limitClause = filters.limit ? `LIMIT ${Number(filters.limit)}` : '';

    return db.getAllAsync<TransactionWithCategory>(
      `SELECT
        t.*,
        c.name AS category_name,
        c.icon AS category_icon,
        c.color AS category_color
       FROM transactions t
       INNER JOIN categories c ON c.id = t.category_id
       ${whereClause}
       ORDER BY t.date DESC, t.created_at DESC
       ${limitClause};`,
      params
    );
  },

  async getById(id: string): Promise<TransactionWithCategory | null> {
    const db = await getDatabase();
    return db.getFirstAsync<TransactionWithCategory>(
      `SELECT
        t.*,
        c.name AS category_name,
        c.icon AS category_icon,
        c.color AS category_color
       FROM transactions t
       INNER JOIN categories c ON c.id = t.category_id
       WHERE t.id = ?;`,
      [id]
    );
  },

  async create(input: CreateTransactionInput): Promise<Transaction> {
    const db = await getDatabase();
    const id = generateId();
    const now = new Date().toISOString();
    const cleanDescription = input.description?.trim() || null;
    const cents = Math.trunc(input.amount_cents);

    await db.runAsync(
      `INSERT INTO transactions (id, category_id, type, amount_cents, description, date, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        input.category_id,
        input.type,
        cents,
        cleanDescription,
        input.date,
        now,
      ]
    );

    return {
      id,
      category_id: input.category_id,
      type: input.type,
      amount_cents: cents,
      description: cleanDescription,
      date: input.date,
      created_at: now,
    };
  },

  async update(input: UpdateTransactionInput): Promise<Transaction> {
    const db = await getDatabase();
    const cleanDescription = input.description?.trim() || null;
    const cents = Math.trunc(input.amount_cents);

    await db.runAsync(
      `UPDATE transactions
       SET category_id = ?, type = ?, amount_cents = ?, description = ?, date = ?
       WHERE id = ?;`,
      [
        input.category_id,
        input.type,
        cents,
        cleanDescription,
        input.date,
        input.id,
      ]
    );

    const updated = await db.getFirstAsync<Transaction>(
      `SELECT * FROM transactions WHERE id = ?;`,
      [input.id]
    );
    if (!updated) {
      throw new Error('Transação não encontrada.');
    }
    return updated;
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM transactions WHERE id = ?;`, [id]);
  },
};
