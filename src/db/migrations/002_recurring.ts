import { Migration } from './001_initial';

export const migration002Recurring: Migration = {
  version: 2,
  name: '002_recurring_transactions',
  upSql: `
    CREATE TABLE IF NOT EXISTS recurring_rules (
      id TEXT PRIMARY KEY NOT NULL,
      category_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
      description TEXT,
      frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'yearly')),
      day_of_month INTEGER CHECK (day_of_month IS NULL OR (day_of_month >= 1 AND day_of_month <= 31)),
      weekday INTEGER CHECK (weekday IS NULL OR (weekday >= 0 AND weekday <= 6)),
      start_date TEXT NOT NULL,
      end_date TEXT,
      is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
      created_at TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
    );

    CREATE INDEX IF NOT EXISTS idx_recurring_rules_category ON recurring_rules(category_id);
    CREATE INDEX IF NOT EXISTS idx_recurring_rules_active ON recurring_rules(is_active);

    ALTER TABLE transactions ADD COLUMN recurring_rule_id TEXT NULL REFERENCES recurring_rules(id) ON DELETE SET NULL;
    ALTER TABLE transactions ADD COLUMN occurrence_date TEXT NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_recurring_occurrence ON transactions(recurring_rule_id, occurrence_date);
  `,
};
