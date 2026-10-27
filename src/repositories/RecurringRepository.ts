import type * as SQLite from 'expo-sqlite';
import { getDatabase, runInTransaction } from '@/db';
import {
  RecurringFrequency,
  RecurringRule,
  RecurringRuleWithCategory,
  Transaction,
  TransactionType,
} from '@/types';
import { computeOccurrences, formatYMD, parseYMD } from '@/utils/recurring';
import { generateId } from '@/utils/uuid';

export interface CreateRecurringRuleInput {
  category_id: string;
  type: TransactionType;
  amount_cents: number;
  description?: string | null;
  frequency: RecurringFrequency;
  day_of_month?: number | null;
  weekday?: number | null;
  start_date: string; // yyyy-MM-dd
  end_date?: string | null; // yyyy-MM-dd
  is_active?: number; // 0 ou 1
}

export interface UpdateRecurringRuleInput extends CreateRecurringRuleInput {
  id: string;
}

export interface IRecurringRepository {
  list(customDb?: SQLite.SQLiteDatabase): Promise<RecurringRuleWithCategory[]>;
  getById(id: string, customDb?: SQLite.SQLiteDatabase): Promise<RecurringRuleWithCategory | null>;
  create(input: CreateRecurringRuleInput, customDb?: SQLite.SQLiteDatabase): Promise<RecurringRule>;
  createWithFirstOccurrence(
    input: CreateRecurringRuleInput,
    firstOccurrenceDate: string,
    customDb?: SQLite.SQLiteDatabase
  ): Promise<{ rule: RecurringRule; firstTransaction: Transaction }>;
  update(input: UpdateRecurringRuleInput, customDb?: SQLite.SQLiteDatabase): Promise<RecurringRule>;
  delete(id: string, customDb?: SQLite.SQLiteDatabase): Promise<void>;
  toggleActive(id: string, isActive: boolean, customDb?: SQLite.SQLiteDatabase): Promise<void>;
  generateDue(today: string, customDb?: SQLite.SQLiteDatabase): Promise<number>;
}

export const RecurringRepository: IRecurringRepository = {
  async list(customDb?: SQLite.SQLiteDatabase): Promise<RecurringRuleWithCategory[]> {
    const db = customDb ?? (await getDatabase());
    return db.getAllAsync<RecurringRuleWithCategory>(
      `SELECT
        r.*,
        COALESCE(c.name, 'Sem categoria') AS category_name,
        COALESCE(c.icon, 'Tag') AS category_icon,
        COALESCE(c.color, '#6B6385') AS category_color
       FROM recurring_rules r
       LEFT JOIN categories c ON c.id = r.category_id
       ORDER BY r.created_at DESC;`
    );
  },

  async getById(
    id: string,
    customDb?: SQLite.SQLiteDatabase
  ): Promise<RecurringRuleWithCategory | null> {
    const db = customDb ?? (await getDatabase());
    return db.getFirstAsync<RecurringRuleWithCategory>(
      `SELECT
        r.*,
        COALESCE(c.name, 'Sem categoria') AS category_name,
        COALESCE(c.icon, 'Tag') AS category_icon,
        COALESCE(c.color, '#6B6385') AS category_color
       FROM recurring_rules r
       LEFT JOIN categories c ON c.id = r.category_id
       WHERE r.id = ?;`,
      [id]
    );
  },

  async create(
    input: CreateRecurringRuleInput,
    customDb?: SQLite.SQLiteDatabase
  ): Promise<RecurringRule> {
    const db = customDb ?? (await getDatabase());
    const id = generateId();
    const now = new Date().toISOString();
    const cleanDescription = input.description?.trim() || null;
    const cents = Math.trunc(input.amount_cents);
    const active = input.is_active ?? 1;

    await db.runAsync(
      `INSERT INTO recurring_rules (
        id, category_id, type, amount_cents, description, frequency, day_of_month, weekday, start_date, end_date, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        input.category_id,
        input.type,
        cents,
        cleanDescription,
        input.frequency,
        input.day_of_month ?? null,
        input.weekday ?? null,
        input.start_date,
        input.end_date ?? null,
        active,
        now,
      ]
    );

    return {
      id,
      category_id: input.category_id,
      type: input.type,
      amount_cents: cents,
      description: cleanDescription,
      frequency: input.frequency,
      day_of_month: input.day_of_month ?? null,
      weekday: input.weekday ?? null,
      start_date: input.start_date,
      end_date: input.end_date ?? null,
      is_active: active,
      created_at: now,
    };
  },

  async createWithFirstOccurrence(
    input: CreateRecurringRuleInput,
    firstOccurrenceDate: string,
    customDb?: SQLite.SQLiteDatabase
  ): Promise<{ rule: RecurringRule; firstTransaction: Transaction }> {
    const db = customDb ?? (await getDatabase());

    return runInTransaction(db, async (txn) => {
      const ruleId = generateId();
      const txId = generateId();
      const now = new Date().toISOString();
      const cleanDescription = input.description?.trim() || null;
      const cents = Math.trunc(input.amount_cents);
      const active = input.is_active ?? 1;

      // 1. Cria a regra recorrente
      await txn.runAsync(
        `INSERT INTO recurring_rules (
          id, category_id, type, amount_cents, description, frequency, day_of_month, weekday, start_date, end_date, is_active, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          ruleId,
          input.category_id,
          input.type,
          cents,
          cleanDescription,
          input.frequency,
          input.day_of_month ?? null,
          input.weekday ?? null,
          input.start_date,
          input.end_date ?? null,
          active,
          now,
        ]
      );

      // 2. Cria a primeira transação vinculada à regra
      await txn.runAsync(
        `INSERT INTO transactions (
          id, category_id, type, amount_cents, description, date, created_at, recurring_rule_id, occurrence_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          txId,
          input.category_id,
          input.type,
          cents,
          cleanDescription,
          firstOccurrenceDate,
          now,
          ruleId,
          firstOccurrenceDate,
        ]
      );

      const rule: RecurringRule = {
        id: ruleId,
        category_id: input.category_id,
        type: input.type,
        amount_cents: cents,
        description: cleanDescription,
        frequency: input.frequency,
        day_of_month: input.day_of_month ?? null,
        weekday: input.weekday ?? null,
        start_date: input.start_date,
        end_date: input.end_date ?? null,
        is_active: active,
        created_at: now,
      };

      const firstTransaction: Transaction = {
        id: txId,
        category_id: input.category_id,
        type: input.type,
        amount_cents: cents,
        description: cleanDescription,
        date: firstOccurrenceDate,
        created_at: now,
        recurring_rule_id: ruleId,
        occurrence_date: firstOccurrenceDate,
      };

      return { rule, firstTransaction };
    });
  },

  async update(
    input: UpdateRecurringRuleInput,
    customDb?: SQLite.SQLiteDatabase
  ): Promise<RecurringRule> {
    const db = customDb ?? (await getDatabase());
    const cleanDescription = input.description?.trim() || null;
    const cents = Math.trunc(input.amount_cents);

    await db.runAsync(
      `UPDATE recurring_rules
       SET category_id = ?, type = ?, amount_cents = ?, description = ?, frequency = ?, day_of_month = ?, weekday = ?, start_date = ?, end_date = ?
       WHERE id = ?;`,
      [
        input.category_id,
        input.type,
        cents,
        cleanDescription,
        input.frequency,
        input.day_of_month ?? null,
        input.weekday ?? null,
        input.start_date,
        input.end_date ?? null,
        input.id,
      ]
    );

    const updated = await this.getById(input.id, db);
    if (!updated) {
      throw new Error('Regra recorrente não encontrada.');
    }
    return updated;
  },

  async delete(id: string, customDb?: SQLite.SQLiteDatabase): Promise<void> {
    const db = customDb ?? (await getDatabase());
    await runInTransaction(db, async (txn) => {
      // Mantém as transações já geradas, tornando-as avulsas (desvinculadas)
      await txn.runAsync(
        `UPDATE transactions SET recurring_rule_id = NULL WHERE recurring_rule_id = ?;`,
        [id]
      );
      await txn.runAsync(`DELETE FROM recurring_rules WHERE id = ?;`, [id]);
    });
  },

  async toggleActive(
    id: string,
    isActive: boolean,
    customDb?: SQLite.SQLiteDatabase
  ): Promise<void> {
    const db = customDb ?? (await getDatabase());
    await db.runAsync(
      `UPDATE recurring_rules SET is_active = ? WHERE id = ?;`,
      [isActive ? 1 : 0, id]
    );
  },

  async generateDue(today: string, customDb?: SQLite.SQLiteDatabase): Promise<number> {
    const db = customDb ?? (await getDatabase());
    const MAX_OCCURRENCES_PER_RULE = 24;

    return runInTransaction(db, async (txn) => {
      const activeRules = await txn.getAllAsync<RecurringRule>(
        `SELECT * FROM recurring_rules WHERE is_active = 1 AND start_date <= ?;`,
        [today]
      );

      let totalGenerated = 0;

      for (const rule of activeRules) {
        // Encontra a data da última ocorrência já registrada no banco para esta regra
        const lastTx = await txn.getFirstAsync<{ max_occurrence: string | null }>(
          `SELECT MAX(occurrence_date) AS max_occurrence FROM transactions WHERE recurring_rule_id = ?;`,
          [rule.id]
        );

        let fromDate = rule.start_date;
        if (lastTx?.max_occurrence) {
          const { year, month, day } = parseYMD(lastTx.max_occurrence);
          const nextDay = new Date(year, month - 1, day + 1, 12, 0, 0);
          fromDate = formatYMD(
            nextDay.getFullYear(),
            nextDay.getMonth() + 1,
            nextDay.getDate()
          );
        }

        if (fromDate > today) {
          continue;
        }

        const occurrences = computeOccurrences(rule, fromDate, today);
        const cappedOccurrences = occurrences.slice(0, MAX_OCCURRENCES_PER_RULE);

        for (const occDate of cappedOccurrences) {
          const txId = generateId();
          const now = new Date().toISOString();

          // Idempotência garantida pelo índice UNIQUE(recurring_rule_id, occurrence_date) e INSERT OR IGNORE
          const result = await txn.runAsync(
            `INSERT OR IGNORE INTO transactions (
              id, category_id, type, amount_cents, description, date, created_at, recurring_rule_id, occurrence_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [
              txId,
              rule.category_id,
              rule.type,
              rule.amount_cents,
              rule.description,
              occDate,
              now,
              rule.id,
              occDate,
            ]
          );

          if (result.changes > 0) {
            totalGenerated += result.changes;
          }
        }
      }

      return totalGenerated;
    });
  },
};
