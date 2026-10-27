/* eslint-disable @typescript-eslint/no-require-imports */
import type * as SQLite from 'expo-sqlite';
import { migration001Initial } from '@/db/migrations/001_initial';
import { migration002Recurring } from '@/db/migrations/002_recurring';

const { DatabaseSync } = require('node:sqlite');

let idCounter = 0;
jest.mock('expo-crypto', () => ({
  randomUUID: () => `test-uuid-${++idCounter}`,
}));

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

const { ExportRepository } = require('../ExportRepository');

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

describe('ExportRepository', () => {
  let db: SQLite.SQLiteDatabase;

  beforeEach(async () => {
    db = createSqliteAdapter();

    // Insere categorias
    await db.runAsync(
      `INSERT INTO categories (id, name, icon, color, type, is_default, created_at)
       VALUES 
       ('cat-salario', 'Salário', 'Coins', '#44B988', 'income', 1, '2026-01-01T00:00:00Z'),
       ('cat-mercado', 'Mercado', 'ShoppingBag', '#F07167', 'expense', 1, '2026-01-01T00:00:00Z'),
       ('cat-lazer', 'Lazer', 'Gamepad2', '#72B7F9', 'expense', 1, '2026-01-01T00:00:00Z');`
    );

    // Insere transações em diferentes datas
    await db.runAsync(
      `INSERT INTO transactions (id, category_id, type, amount_cents, description, date, created_at)
       VALUES 
       ('tx-1', 'cat-salario', 'income', 500000, 'Salário Outubro', '2026-10-05', '2026-10-05T10:00:00Z'),
       ('tx-2', 'cat-mercado', 'expense', 15000, 'Supermercado', '2026-10-10', '2026-10-10T14:00:00Z'),
       ('tx-3', 'cat-lazer', 'expense', 8000, 'Cinema', '2026-10-20', '2026-10-20T20:00:00Z'),
       ('tx-4', 'cat-mercado', 'expense', 12000, 'Padaria', '2026-09-15', '2026-09-15T08:00:00Z');`
    );

    // Insere orçamentos
    await db.runAsync(
      `INSERT INTO budgets (id, category_id, month, limit_cents)
       VALUES 
       ('b-1', 'cat-mercado', '2026-10', 30000),
       ('b-2', 'cat-lazer', '2026-10', 10000);`
    );

    // Insere metas e aportes
    await db.runAsync(
      `INSERT INTO goals (id, name, target_cents, icon, deadline, created_at)
       VALUES 
       ('g-1', 'Fundo de Emergência', 1000000, 'ShieldCheck', '2026-12-31', '2026-01-01T00:00:00Z');`
    );
    await db.runAsync(
      `INSERT INTO goal_contributions (id, goal_id, amount_cents, date, created_at)
       VALUES 
       ('gc-1', 'g-1', 400000, '2026-10-06', '2026-10-06T12:00:00Z');`
    );
  });

  describe('getTransactionsForExport', () => {
    it('filtra por mês específico (2026-10)', async () => {
      const rows = await ExportRepository.getTransactionsForExport(
        {
          periodType: 'specific_month',
          specificMonth: '2026-10',
        },
        db
      );

      expect(rows).toHaveLength(3);
      expect(rows.map((r: any) => r.description)).toEqual([
        'Cinema',
        'Supermercado',
        'Salário Outubro',
      ]);
    });

    it('retorna todas as transações quando período for all', async () => {
      const rows = await ExportRepository.getTransactionsForExport(
        { periodType: 'all' },
        db
      );
      expect(rows).toHaveLength(4);
    });

    it('filtra por intervalo de datas customizado', async () => {
      const rows = await ExportRepository.getTransactionsForExport(
        {
          periodType: 'custom_range',
          startDate: '2026-10-01',
          endDate: '2026-10-15',
        },
        db
      );
      expect(rows).toHaveLength(2);
      expect(rows.map((r: any) => r.description)).toEqual([
        'Supermercado',
        'Salário Outubro',
      ]);
    });

    it('filtra por tipo (income)', async () => {
      const rows = await ExportRepository.getTransactionsForExport(
        {
          periodType: 'all',
          type: 'income',
        },
        db
      );
      expect(rows).toHaveLength(1);
      expect(rows[0].description).toBe('Salário Outubro');
    });

    it('filtra por categoria específica', async () => {
      const rows = await ExportRepository.getTransactionsForExport(
        {
          periodType: 'all',
          categoryId: 'cat-mercado',
        },
        db
      );
      expect(rows).toHaveLength(2);
      expect(rows.map((r: any) => r.description)).toEqual(['Supermercado', 'Padaria']);
    });
  });

  describe('getMonthlyReportData', () => {
    it('consolida totais, categorias, orçamentos e metas do mês', async () => {
      const { summary, transactions } = await ExportRepository.getMonthlyReportData(
        '2026-10',
        db
      );

      // Totais
      expect(summary.totalIncomeCents).toBe(500000);
      expect(summary.totalExpenseCents).toBe(23000); // 15000 + 8000
      expect(summary.netBalanceCents).toBe(477000);

      // Categorias de despesa
      const catMercado = summary.categories.find((c: any) => c.name === 'Mercado');
      expect(catMercado).toBeDefined();
      expect(catMercado.totalCents).toBe(15000);

      // Orçamentos
      expect(summary.budgets).toHaveLength(2);
      const bMercado = summary.budgets.find((b: any) => b.categoryName === 'Mercado');
      expect(bMercado.spentCents).toBe(15000);
      expect(bMercado.limitCents).toBe(30000);
      expect(bMercado.status).toBe('normal');

      // Metas
      expect(summary.goals).toHaveLength(1);
      expect(summary.goals[0].name).toBe('Fundo de Emergência');
      expect(summary.goals[0].currentCents).toBe(400000);
      expect(summary.goals[0].percentage).toBe(40);

      // Transações do mês
      expect(transactions).toHaveLength(3);
    });
  });
});
