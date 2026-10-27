import { migration001Initial } from '../migrations/001_initial';
import { migration002Recurring } from '../migrations/002_recurring';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DatabaseSync } = require('node:sqlite');

describe('Migração 002 - Transações Recorrentes', () => {
  it('aplica a migração 002 sobre banco v1 com dados existentes e preserva todos os registros', () => {
    const db = new DatabaseSync(':memory:');
    db.exec('PRAGMA foreign_keys = ON;');

    // 1. Aplica migração 001 (estado v1)
    db.exec(migration001Initial.upSql);
    db.exec('PRAGMA user_version = 1;');

    // 2. Insere dados existentes no formato v1
    db.exec(`
      INSERT INTO categories (id, name, icon, color, type, is_default, created_at)
      VALUES
        ('cat-1', 'Salário', 'Briefcase', '#22C55E', 'income', 1, '2026-01-01T00:00:00Z'),
        ('cat-2', 'Aluguel', 'Home', '#EF4444', 'expense', 1, '2026-01-01T00:00:00Z');

      INSERT INTO transactions (id, category_id, type, amount_cents, description, date, created_at)
      VALUES
        ('tx-1', 'cat-1', 'income', 500000, 'Salário Janeiro', '2026-01-05', '2026-01-05T10:00:00Z'),
        ('tx-2', 'cat-2', 'expense', 150000, 'Aluguel Janeiro', '2026-01-10', '2026-01-10T10:00:00Z');
    `);

    const versionBefore = db.prepare('PRAGMA user_version;').get() as { user_version: number };
    expect(versionBefore.user_version).toBe(1);

    // 3. Executa migração 002
    db.exec(migration002Recurring.upSql);
    db.exec('PRAGMA user_version = 2;');

    const versionAfter = db.prepare('PRAGMA user_version;').get() as { user_version: number };
    expect(versionAfter.user_version).toBe(2);

    // 4. Confirma que os registros originais permanecem intactos
    const transactions = db.prepare('SELECT * FROM transactions ORDER BY date ASC;').all() as any[];
    expect(transactions).toHaveLength(2);

    expect(transactions[0].id).toBe('tx-1');
    expect(transactions[0].amount_cents).toBe(500000);
    expect(transactions[0].recurring_rule_id).toBeNull();
    expect(transactions[0].occurrence_date).toBeNull();

    expect(transactions[1].id).toBe('tx-2');
    expect(transactions[1].amount_cents).toBe(150000);
    expect(transactions[1].recurring_rule_id).toBeNull();
    expect(transactions[1].occurrence_date).toBeNull();

    // 5. Confirma que a tabela recurring_rules está operacional
    db.exec(`
      INSERT INTO recurring_rules (
        id, category_id, type, amount_cents, description, frequency, day_of_month, weekday, start_date, end_date, is_active, created_at
      ) VALUES (
        'rule-1', 'cat-2', 'expense', 150000, 'Aluguel Recorrente', 'monthly', 10, NULL, '2026-02-10', NULL, 1, '2026-02-01T00:00:00Z'
      );
    `);

    const rule = db.prepare('SELECT * FROM recurring_rules WHERE id = ?;').get('rule-1') as any;
    expect(rule.id).toBe('rule-1');
    expect(rule.description).toBe('Aluguel Recorrente');
    expect(rule.day_of_month).toBe(10);

    // 6. Insere ocorrência vinculada à regra
    db.exec(`
      INSERT INTO transactions (id, category_id, type, amount_cents, description, date, created_at, recurring_rule_id, occurrence_date)
      VALUES ('tx-rec-1', 'cat-2', 'expense', 150000, 'Aluguel Recorrente', '2026-02-10', '2026-02-10T00:00:00Z', 'rule-1', '2026-02-10');
    `);

    // 7. Testa a restrição UNIQUE em (recurring_rule_id, occurrence_date) para garantir idempotência
    expect(() => {
      db.exec(`
        INSERT INTO transactions (id, category_id, type, amount_cents, description, date, created_at, recurring_rule_id, occurrence_date)
        VALUES ('tx-rec-dup', 'cat-2', 'expense', 150000, 'Aluguel Recorrente Duplicado', '2026-02-10', '2026-02-10T01:00:00Z', 'rule-1', '2026-02-10');
      `);
    }).toThrow(/UNIQUE constraint failed/);

    // Transações sem regra (recurring_rule_id = NULL) continuam permitindo mesma data
    expect(() => {
      db.exec(`
        INSERT INTO transactions (id, category_id, type, amount_cents, description, date, created_at, recurring_rule_id, occurrence_date)
        VALUES ('tx-avulsa-1', 'cat-2', 'expense', 5000, 'Café', '2026-02-10', '2026-02-10T02:00:00Z', NULL, NULL);
        INSERT INTO transactions (id, category_id, type, amount_cents, description, date, created_at, recurring_rule_id, occurrence_date)
        VALUES ('tx-avulsa-2', 'cat-2', 'expense', 8000, 'Lanche', '2026-02-10', '2026-02-10T03:00:00Z', NULL, NULL);
      `);
    }).not.toThrow();
  });
});
