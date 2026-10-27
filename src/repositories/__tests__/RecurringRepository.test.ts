import { DatabaseSync } from 'node:sqlite';
import type * as SQLite from 'expo-sqlite';

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

let idCounter = 0;
jest.mock('expo-crypto', () => ({
  randomUUID: () => `test-uuid-${++idCounter}`,
}));

import { migration001Initial } from '@/db/migrations/001_initial';
import { migration002Recurring } from '@/db/migrations/002_recurring';
import { RecurringRepository } from '../RecurringRepository';

/**
 * Cria uma camada que expõe a interface assíncrona do expo-sqlite v58
 * sobre o DatabaseSync real do Node.js, permitindo testar transações e SQL real no Jest.
 */
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

describe('RecurringRepository & generateDue', () => {
  let db: SQLite.SQLiteDatabase;

  beforeEach(async () => {
    db = createSqliteAdapter();
    // Insere categoria padrão para testes
    await db.runAsync(
      `INSERT INTO categories (id, name, icon, color, type, is_default, created_at)
       VALUES ('cat-fixa', 'Moradia', 'Home', '#6366F1', 'expense', 1, '2026-01-01T00:00:00Z');`
    );
  });

  it('cria regra e primeira ocorrência atomicamente via createWithFirstOccurrence', async () => {
    const { rule, firstTransaction } = await RecurringRepository.createWithFirstOccurrence(
      {
        category_id: 'cat-fixa',
        type: 'expense',
        amount_cents: 200000,
        description: 'Aluguel Apartamento',
        frequency: 'monthly',
        day_of_month: 10,
        start_date: '2026-10-10',
      },
      '2026-10-10',
      db
    );

    expect(rule.id).toBeDefined();
    expect(rule.amount_cents).toBe(200000);
    expect(firstTransaction.recurring_rule_id).toBe(rule.id);
    expect(firstTransaction.occurrence_date).toBe('2026-10-10');

    // Ao rodar generateDue no mesmo dia, não gera duplicata
    const generated = await RecurringRepository.generateDue('2026-10-10', db);
    expect(generated).toBe(0);

    const txs = await db.getAllAsync('SELECT * FROM transactions WHERE recurring_rule_id = ?;', [
      rule.id,
    ]);
    expect(txs).toHaveLength(1);
  });

  it('gera ocorrências retroativas pendentes até a data informada (generateDue)', async () => {
    // Cria regra criada há 3 meses (10 de julho de 2026)
    const rule = await RecurringRepository.create(
      {
        category_id: 'cat-fixa',
        type: 'expense',
        amount_cents: 10000,
        description: 'Internet Fibra',
        frequency: 'monthly',
        day_of_month: 10,
        start_date: '2026-07-10',
        is_active: 1,
      },
      db
    );

    // Hoje é 26 de Outubro de 2026 -> Ocorrências devidas: Jul 10, Ago 10, Set 10, Out 10 = 4 ocorrências
    const generated = await RecurringRepository.generateDue('2026-10-26', db);
    expect(generated).toBe(4);

    const txs = await db.getAllAsync<{ occurrence_date: string }>(
      'SELECT occurrence_date FROM transactions WHERE recurring_rule_id = ? ORDER BY occurrence_date ASC;',
      [rule.id]
    );
    expect(txs.map((t) => t.occurrence_date)).toEqual([
      '2026-07-10',
      '2026-08-10',
      '2026-09-10',
      '2026-10-10',
    ]);
  });

  it('garante idempotência estrita: executar generateDue duas vezes seguidas não duplica nenhuma transação', async () => {
    const rule = await RecurringRepository.create(
      {
        category_id: 'cat-fixa',
        type: 'expense',
        amount_cents: 5000,
        description: 'Streaming',
        frequency: 'monthly',
        day_of_month: 1,
        start_date: '2026-08-01',
        is_active: 1,
      },
      db
    );

    const firstRun = await RecurringRepository.generateDue('2026-10-26', db);
    expect(firstRun).toBe(3); // Ago 01, Set 01, Out 01

    const secondRun = await RecurringRepository.generateDue('2026-10-26', db);
    expect(secondRun).toBe(0);

    const totalTxs = await db.getAllAsync(
      'SELECT * FROM transactions WHERE recurring_rule_id = ?;',
      [rule.id]
    );
    expect(totalTxs).toHaveLength(3);
  });

  it('não gera ocorrências quando a regra está pausada (is_active = 0)', async () => {
    const rule = await RecurringRepository.create(
      {
        category_id: 'cat-fixa',
        type: 'expense',
        amount_cents: 5000,
        description: 'Assinatura Academia',
        frequency: 'monthly',
        day_of_month: 5,
        start_date: '2026-08-05',
        is_active: 0, // Pausada
      },
      db
    );

    const generated = await RecurringRepository.generateDue('2026-10-26', db);
    expect(generated).toBe(0);

    // Reativa a regra
    await RecurringRepository.toggleActive(rule.id, true, db);
    const generatedAfterResume = await RecurringRepository.generateDue('2026-10-26', db);
    expect(generatedAfterResume).toBe(3); // Ago, Set, Out
  });

  it('ao excluir regra, as transações geradas anteriormente são mantidas como avulsas', async () => {
    const rule = await RecurringRepository.create(
      {
        category_id: 'cat-fixa',
        type: 'expense',
        amount_cents: 5000,
        description: 'Revista',
        frequency: 'monthly',
        day_of_month: 1,
        start_date: '2026-09-01',
      },
      db
    );

    await RecurringRepository.generateDue('2026-10-26', db);

    const txsBefore = await db.getAllAsync<{ id: string; recurring_rule_id: string }>(
      'SELECT id, recurring_rule_id FROM transactions WHERE recurring_rule_id = ?;',
      [rule.id]
    );
    expect(txsBefore).toHaveLength(2); // Set 01, Out 01

    // Exclui a regra
    await RecurringRepository.delete(rule.id, db);

    // Regra não existe mais
    const deletedRule = await RecurringRepository.getById(rule.id, db);
    expect(deletedRule).toBeNull();

    // Transações continuam no banco, com recurring_rule_id = NULL
    const txsAfter = await db.getAllAsync<{ id: string; recurring_rule_id: string | null }>(
      'SELECT id, recurring_rule_id FROM transactions WHERE id IN (?, ?);',
      [txsBefore[0].id, txsBefore[1].id]
    );
    expect(txsAfter).toHaveLength(2);
    expect(txsAfter[0].recurring_rule_id).toBeNull();
    expect(txsAfter[1].recurring_rule_id).toBeNull();
  });

  it('ao editar uma regra, altera apenas as ocorrências futuras', async () => {
    const rule = await RecurringRepository.create(
      {
        category_id: 'cat-fixa',
        type: 'expense',
        amount_cents: 10000,
        description: 'Plano Celular Antigo',
        frequency: 'monthly',
        day_of_month: 15,
        start_date: '2026-08-15',
      },
      db
    );

    // Gera ocorrências de Agosto e Setembro
    await RecurringRepository.generateDue('2026-09-20', db);

    const pastTxs = await db.getAllAsync<{ amount_cents: number; description: string }>(
      'SELECT amount_cents, description FROM transactions WHERE recurring_rule_id = ? ORDER BY date ASC;',
      [rule.id]
    );
    expect(pastTxs).toHaveLength(2);
    expect(pastTxs[0].amount_cents).toBe(10000);
    expect(pastTxs[0].description).toBe('Plano Celular Antigo');

    // Edita a regra para novo valor e descrição
    await RecurringRepository.update(
      {
        id: rule.id,
        category_id: 'cat-fixa',
        type: 'expense',
        amount_cents: 15000,
        description: 'Plano Celular 5G Ilimitado',
        frequency: 'monthly',
        day_of_month: 15,
        start_date: '2026-08-15',
      },
      db
    );

    // Gera ocorrência de Outubro
    await RecurringRepository.generateDue('2026-10-26', db);

    const allTxs = await db.getAllAsync<{ amount_cents: number; description: string; occurrence_date: string }>(
      'SELECT amount_cents, description, occurrence_date FROM transactions WHERE recurring_rule_id = ? ORDER BY occurrence_date ASC;',
      [rule.id]
    );

    expect(allTxs).toHaveLength(3);
    // As antigas continuam inalteradas
    expect(allTxs[0].amount_cents).toBe(10000);
    expect(allTxs[0].description).toBe('Plano Celular Antigo');
    expect(allTxs[1].amount_cents).toBe(10000);
    expect(allTxs[1].description).toBe('Plano Celular Antigo');

    // A nova ocorrência refletiu o valor e descrição atualizados
    expect(allTxs[2].amount_cents).toBe(15000);
    expect(allTxs[2].description).toBe('Plano Celular 5G Ilimitado');
    expect(allTxs[2].occurrence_date).toBe('2026-10-15');
  });
});
