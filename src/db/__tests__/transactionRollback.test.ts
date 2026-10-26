/* eslint-disable @typescript-eslint/no-require-imports */
import type * as SQLite from 'expo-sqlite';
import type { runInTransaction as RunInTransactionType } from '@/db';

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

jest.mock('../migrations', () => ({
  runMigrations: jest.fn(),
}));

jest.mock('../seed', () => ({
  seedDefaultCategories: jest.fn(),
}));

const { runInTransaction } = require('@/db') as {
  runInTransaction: typeof RunInTransactionType;
};

/**
 * Mock em memória que reproduz fielmente a semântica transacional do expo-sqlite v58
 * com isolamento exclusivo, snapshot de estado e reversão automática (ROLLBACK) em falha.
 */
class InMemorySQLiteDatabase {
  public tables: Map<string, any[]> = new Map();
  public transactionDepth = 0;

  constructor(initialData: Record<string, any[]> = {}) {
    for (const [table, rows] of Object.entries(initialData)) {
      this.tables.set(table, JSON.parse(JSON.stringify(rows)));
    }
  }

  private cloneState(): Map<string, any[]> {
    const clone = new Map<string, any[]>();
    for (const [table, rows] of this.tables.entries()) {
      clone.set(table, JSON.parse(JSON.stringify(rows)));
    }
    return clone;
  }

  async execAsync(sql: string): Promise<void> {
    const commands = sql
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);

    for (const cmd of commands) {
      if (cmd.toUpperCase().startsWith('DELETE FROM')) {
        const parts = cmd.split(/\s+/);
        const tableName = parts[2];
        if (tableName && this.tables.has(tableName)) {
          this.tables.set(tableName, []);
        }
      }
    }
  }

  async runAsync(sql: string, params: any[] = []): Promise<any> {
    if (sql.toUpperCase().startsWith('INSERT INTO')) {
      const match = sql.match(/INSERT\s+(?:OR\s+IGNORE\s+)?INTO\s+(\w+)/i);
      const tableName = match?.[1] || '';
      if (!this.tables.has(tableName)) {
        this.tables.set(tableName, []);
      }

      // Simulação: se o parâmetro incluir '_TRIGGER_DB_ERROR_', lança erro como chave duplicada
      if (params.includes('_TRIGGER_DB_ERROR_')) {
        throw new Error('SQLite Error: UNIQUE constraint failed');
      }

      const rows = this.tables.get(tableName)!;
      rows.push({ id: params[0], rawParams: params });
      return { lastInsertRowId: rows.length, changes: 1 };
    }

    if (sql.toUpperCase().startsWith('DELETE FROM')) {
      const match = sql.match(/DELETE\s+FROM\s+(\w+)\s+WHERE\s+id\s*=\s*\?/i);
      if (match) {
        const tableName = match[1];
        const idToDelete = params[0];
        const rows = this.tables.get(tableName) || [];
        this.tables.set(
          tableName,
          rows.filter((r) => r.id !== idToDelete)
        );
      }
      return { lastInsertRowId: 0, changes: 1 };
    }

    return { lastInsertRowId: 0, changes: 0 };
  }

  async getFirstAsync<T>(sql: string, params: any[] = []): Promise<T | null> {
    const all = await this.getAllAsync<T>(sql, params);
    return all[0] ?? null;
  }

  async getAllAsync<T>(sql: string, params: any[] = []): Promise<T[]> {
    if (sql.includes('FROM transactions') && sql.includes('GROUP BY type')) {
      return [] as T[];
    }
    if (sql.includes('FROM goal_contributions')) {
      return [] as T[];
    }
    return [] as T[];
  }

  async withTransactionAsync<T>(task: () => Promise<T>): Promise<T> {
    return this.withExclusiveTransactionAsync(() => task());
  }

  async withExclusiveTransactionAsync<T>(
    task: (txn: InMemorySQLiteDatabase) => Promise<T>
  ): Promise<T> {
    this.transactionDepth++;
    const snapshot = this.cloneState();

    try {
      const result = await task(this);
      this.transactionDepth--;
      return result;
    } catch (error) {
      // ROLLBACK: Restaura o snapshot anterior
      this.tables = snapshot;
      this.transactionDepth--;
      throw error;
    }
  }
}

describe('Comportamento de Rollback e Atomicidade Transacional', () => {
  it('garante que runInTransaction faz commit quando todas as operações sucedem', async () => {
    const mockDb = new InMemorySQLiteDatabase({
      goals: [{ id: 'goal-1', name: 'Viagem' }],
      goal_contributions: [],
    });

    await runInTransaction(
      mockDb as unknown as SQLite.SQLiteDatabase,
      async (txn) => {
        await txn.runAsync(
          'INSERT INTO goal_contributions (id, goal_id, amount_cents) VALUES (?, ?, ?)',
          ['gc-1', 'goal-1', 5000]
        );
      }
    );

    expect(mockDb.tables.get('goal_contributions')).toHaveLength(1);
    expect(mockDb.tables.get('goal_contributions')![0].id).toBe('gc-1');
  });

  it('faz ROLLBACK completo se uma operação intermediária falhar, mantendo os dados intactos', async () => {
    const initialCategories = [
      { id: 'cat-1', name: 'Alimentação' },
      { id: 'cat-2', name: 'Lazer' },
    ];
    const initialTransactions = [{ id: 'tx-1', category_id: 'cat-1' }];

    const mockDb = new InMemorySQLiteDatabase({
      categories: initialCategories,
      transactions: initialTransactions,
    });

    // Operação composta: tenta apagar tudo e inserir dados novos.
    // O segundo INSERT falha propositalmente no meio do processo.
    await expect(
      runInTransaction(
        mockDb as unknown as SQLite.SQLiteDatabase,
        async (txn) => {
          // 1. Limpa tabela
          await txn.execAsync(
            'DELETE FROM transactions; DELETE FROM categories;'
          );

          // 2. Insere categoria nova (deveria reverter se o próximo passo falhar)
          await txn.runAsync(
            'INSERT INTO categories (id, name) VALUES (?, ?);',
            ['cat-new', 'Saúde']
          );

          // 3. Simula falha (ex.: chave duplicada ou erro de integridade)
          await txn.runAsync(
            'INSERT INTO transactions (id, category_id) VALUES (?, ?);',
            ['tx-broken', '_TRIGGER_DB_ERROR_']
          );
        }
      )
    ).rejects.toThrow('SQLite Error: UNIQUE constraint failed');

    // Estado anterior deve estar totalmente preservado (ROLLBACK bem-sucedido)
    expect(mockDb.tables.get('categories')).toEqual(initialCategories);
    expect(mockDb.tables.get('transactions')).toEqual(initialTransactions);
  });
});
