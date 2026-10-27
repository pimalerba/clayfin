import { DatabaseSync } from 'node:sqlite';
import type * as SQLite from 'expo-sqlite';

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

jest.mock('@/db', () => {
  const actualDb = jest.requireActual('@/db');
  return {
    ...actualDb,
    getDatabase: jest.fn(),
  };
});

import { migration001Initial } from '@/db/migrations/001_initial';
import { migration002Recurring } from '@/db/migrations/002_recurring';
import { BackupRepository } from '../BackupRepository';
import { getDatabase } from '@/db';

function createSqliteAdapter(): SQLite.SQLiteDatabase {
  const syncDb = new DatabaseSync(':memory:');
  syncDb.exec('PRAGMA foreign_keys = ON;');
  syncDb.exec(migration001Initial.upSql);
  syncDb.exec(migration002Recurring.upSql);

  const adapter = {
    async execAsync(sql: string): Promise<void> {
      syncDb.exec(sql);
    },
    async runAsync(sql: string, params: any[] = []): Promise<any> {
      const stmt = syncDb.prepare(sql);
      const result = stmt.run(...params);
      return {
        lastInsertRowId: Number(result.lastInsertRowid),
        changes: Number(result.changes),
      };
    },
    async getFirstAsync<T>(sql: string, params: any[] = []): Promise<T | null> {
      const stmt = syncDb.prepare(sql);
      const row = stmt.get(...params);
      return (row as T) ?? null;
    },
    async getAllAsync<T>(sql: string, params: any[] = []): Promise<T[]> {
      const stmt = syncDb.prepare(sql);
      const rows = stmt.all(...params);
      return rows as T[];
    },
    async withTransactionAsync<T>(task: () => Promise<T>): Promise<T> {
      syncDb.exec('BEGIN IMMEDIATE;');
      try {
        const res = await task();
        syncDb.exec('COMMIT;');
        return res;
      } catch (err) {
        syncDb.exec('ROLLBACK;');
        throw err;
      }
    },
  };

  return adapter as unknown as SQLite.SQLiteDatabase;
}

describe('BackupRepository (Exportação, Importação e Rollback)', () => {
  let db: SQLite.SQLiteDatabase;

  beforeEach(async () => {
    db = createSqliteAdapter();
    (getDatabase as jest.Mock).mockResolvedValue(db);

    // Dados iniciais existentes
    await db.runAsync(
      `INSERT INTO categories (id, name, icon, color, type, is_default, created_at)
       VALUES ('cat-orig', 'Alimentação', 'Utensils', '#F07167', 'expense', 1, '2026-01-01');`
    );
    await db.runAsync(
      `INSERT INTO recurring_rules (id, category_id, type, amount_cents, description, frequency, day_of_month, weekday, start_date, is_active, created_at)
       VALUES ('rule-orig', 'cat-orig', 'expense', 5000, 'Assinatura', 'monthly', 10, NULL, '2026-01-10', 1, '2026-01-01');`
    );
    await db.runAsync(
      `INSERT INTO transactions (id, category_id, type, amount_cents, description, date, created_at, recurring_rule_id, occurrence_date)
       VALUES ('tx-orig', 'cat-orig', 'expense', 5000, 'Assinatura', '2026-01-10', '2026-01-10', 'rule-orig', '2026-01-10');`
    );
  });

  it('exporta backup na versão 2 contendo recurring_rules e transações vinculadas', async () => {
    const backup = await BackupRepository.exportBackupData();

    expect(backup.app).toBe('Clayfin');
    expect(backup.version).toBe(2);
    expect(backup.data.categories).toHaveLength(1);
    expect(backup.data.recurring_rules).toHaveLength(1);
    expect(backup.data.recurring_rules?.[0].id).toBe('rule-orig');
    expect(backup.data.transactions[0].recurring_rule_id).toBe('rule-orig');
  });

  it('importa backup v1 com sucesso (retrocompatibilidade)', async () => {
    const v1Payload = {
      app: 'Clayfin' as const,
      version: 1,
      exported_at: '2026-10-26T12:00:00Z',
      data: {
        categories: [
          {
            id: 'cat-v1',
            name: 'Saúde',
            icon: 'Heart',
            color: '#10B981',
            type: 'expense' as const,
            is_default: 1,
            created_at: '2026-02-01',
          },
        ],
        transactions: [
          {
            id: 'tx-v1',
            category_id: 'cat-v1',
            type: 'expense' as const,
            amount_cents: 8000,
            description: 'Farmácia',
            date: '2026-02-10',
            created_at: '2026-02-10',
          },
        ],
        budgets: [],
        goals: [],
        goal_contributions: [],
      },
    };

    await BackupRepository.importBackupData(v1Payload);

    const cats = await db.getAllAsync<{ id: string }>('SELECT id FROM categories WHERE id = ?;', ['cat-v1']);
    expect(cats).toHaveLength(1);

    const txs = await db.getAllAsync<{ id: string; recurring_rule_id: string | null }>(
      'SELECT id, recurring_rule_id FROM transactions WHERE id = ?;',
      ['tx-v1']
    );
    expect(txs).toHaveLength(1);
    expect(txs[0].recurring_rule_id).toBeNull();
  });

  it('faz ROLLBACK automático se a importação falhar no meio, preservando o estado anterior', async () => {
    // Payload malformado que causa falha no SQLite (ex.: chave estrangeira inválida)
    const brokenPayload = {
      app: 'Clayfin' as const,
      version: 2,
      exported_at: '2026-10-26T12:00:00Z',
      data: {
        categories: [
          {
            id: 'cat-nova',
            name: 'Nova Cat',
            icon: 'Tag',
            color: '#3B82F6',
            type: 'expense' as const,
            is_default: 1,
            created_at: '2026-03-01',
          },
        ],
        recurring_rules: [],
        transactions: [
          {
            id: 'tx-broken',
            category_id: 'cat-INEXISTENTE', // Viola RESTRICT FK
            type: 'expense' as const,
            amount_cents: 1000,
            description: 'Falha',
            date: '2026-03-05',
            created_at: '2026-03-05',
          },
        ],
        budgets: [],
        goals: [],
        goal_contributions: [],
      },
    };

    await expect(BackupRepository.importBackupData(brokenPayload)).rejects.toThrow();

    // Os dados anteriores foram inteiramente preservados pelo ROLLBACK
    const cats = await db.getAllAsync<{ id: string }>('SELECT id FROM categories WHERE id = ?;', ['cat-orig']);
    expect(cats).toHaveLength(1);

    const rules = await db.getAllAsync<{ id: string }>('SELECT id FROM recurring_rules WHERE id = ?;', ['rule-orig']);
    expect(rules).toHaveLength(1);

    const txs = await db.getAllAsync<{ id: string }>('SELECT id FROM transactions WHERE id = ?;', ['tx-orig']);
    expect(txs).toHaveLength(1);
  });
});
