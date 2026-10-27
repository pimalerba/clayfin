import { getDatabase, runInTransaction } from '@/db';
import { seedDefaultCategories } from '@/db/seed';
import {
  Budget,
  Category,
  ClayfinBackupPayload,
  Goal,
  GoalContribution,
  RecurringRule,
  Transaction,
} from '@/types';

const ONBOARDING_KEY = 'onboarding_completed';

export interface IBackupRepository {
  exportBackupData(): Promise<ClayfinBackupPayload>;
  importBackupData(payload: ClayfinBackupPayload): Promise<void>;
  clearAllData(): Promise<void>;
  isOnboardingCompleted(): Promise<boolean>;
  completeOnboarding(): Promise<void>;
}

export const BackupRepository: IBackupRepository = {
  async exportBackupData(): Promise<ClayfinBackupPayload> {
    const db = await getDatabase();
    const [
      categories,
      recurring_rules,
      transactions,
      budgets,
      goals,
      goal_contributions,
    ] = await Promise.all([
      db.getAllAsync<Category>(`SELECT * FROM categories ORDER BY created_at ASC;`),
      db.getAllAsync<RecurringRule>(`SELECT * FROM recurring_rules ORDER BY created_at ASC;`),
      db.getAllAsync<Transaction>(`SELECT * FROM transactions ORDER BY date ASC;`),
      db.getAllAsync<Budget>(`SELECT * FROM budgets ORDER BY month ASC;`),
      db.getAllAsync<Goal>(`SELECT * FROM goals ORDER BY created_at ASC;`),
      db.getAllAsync<GoalContribution>(
        `SELECT * FROM goal_contributions ORDER BY date ASC;`
      ),
    ]);

    return {
      app: 'Clayfin',
      version: 2,
      exported_at: new Date().toISOString(),
      data: {
        categories,
        recurring_rules,
        transactions,
        budgets,
        goals,
        goal_contributions,
      },
    };
  },

  async importBackupData(payload: ClayfinBackupPayload): Promise<void> {
    const db = await getDatabase();

    await runInTransaction(db, async (txn) => {
      await txn.execAsync(`
        DELETE FROM goal_contributions;
        DELETE FROM goals;
        DELETE FROM budgets;
        DELETE FROM transactions;
        DELETE FROM recurring_rules;
        DELETE FROM categories;
      `);

      for (const cat of payload.data.categories) {
        await txn.runAsync(
          `INSERT INTO categories (id, name, icon, color, type, is_default, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?);`,
          [
            cat.id,
            cat.name,
            cat.icon,
            cat.color,
            cat.type,
            cat.is_default ? 1 : 0,
            cat.created_at,
          ]
        );
      }

      if (payload.data.recurring_rules && payload.data.recurring_rules.length > 0) {
        for (const rule of payload.data.recurring_rules) {
          await txn.runAsync(
            `INSERT INTO recurring_rules (
              id, category_id, type, amount_cents, description, frequency, day_of_month, weekday, start_date, end_date, is_active, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [
              rule.id,
              rule.category_id,
              rule.type,
              Math.trunc(rule.amount_cents),
              rule.description ?? null,
              rule.frequency,
              rule.day_of_month ?? null,
              rule.weekday ?? null,
              rule.start_date,
              rule.end_date ?? null,
              rule.is_active ? 1 : 0,
              rule.created_at,
            ]
          );
        }
      }

      for (const tx of payload.data.transactions) {
        await txn.runAsync(
          `INSERT INTO transactions (
            id, category_id, type, amount_cents, description, date, created_at, recurring_rule_id, occurrence_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            tx.id,
            tx.category_id,
            tx.type,
            Math.trunc(tx.amount_cents),
            tx.description ?? null,
            tx.date,
            tx.created_at,
            tx.recurring_rule_id ?? null,
            tx.occurrence_date ?? null,
          ]
        );
      }

      for (const b of payload.data.budgets) {
        await txn.runAsync(
          `INSERT INTO budgets (id, category_id, month, limit_cents)
           VALUES (?, ?, ?, ?);`,
          [b.id, b.category_id, b.month, Math.trunc(b.limit_cents)]
        );
      }

      for (const g of payload.data.goals) {
        await txn.runAsync(
          `INSERT INTO goals (id, name, icon, target_cents, deadline, created_at)
           VALUES (?, ?, ?, ?, ?, ?);`,
          [
            g.id,
            g.name,
            g.icon,
            Math.trunc(g.target_cents),
            g.deadline ?? null,
            g.created_at,
          ]
        );
      }

      for (const gc of payload.data.goal_contributions) {
        await txn.runAsync(
          `INSERT INTO goal_contributions (id, goal_id, amount_cents, date, created_at)
           VALUES (?, ?, ?, ?, ?);`,
          [
            gc.id,
            gc.goal_id,
            Math.trunc(gc.amount_cents),
            gc.date,
            gc.created_at,
          ]
        );
      }

      // Garante que as categorias padrão existam mesmo se o backup não tinha alguma
      await seedDefaultCategories(txn, { inTransaction: true });
    });
  },

  async clearAllData(): Promise<void> {
    const db = await getDatabase();
    await runInTransaction(db, async (txn) => {
      await txn.execAsync(`
        DELETE FROM goal_contributions;
        DELETE FROM goals;
        DELETE FROM budgets;
        DELETE FROM transactions;
        DELETE FROM recurring_rules;
        DELETE FROM categories;
      `);
      await seedDefaultCategories(txn, { inTransaction: true });
    });
  },

  async isOnboardingCompleted(): Promise<boolean> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ value: string }>(
      `SELECT value FROM app_meta WHERE key = ?;`,
      [ONBOARDING_KEY]
    );
    return row?.value === '1';
  },

  async completeOnboarding(): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, '1');`,
      [ONBOARDING_KEY]
    );
  },
};
