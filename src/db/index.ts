import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { runMigrations } from './migrations';
import { seedDefaultCategories } from './seed';

const DATABASE_NAME = 'clayfin.db';

let dbInstancePromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Obtém ou inicializa a conexão com o banco de dados SQLite local.
 * Se a inicialização (abertura, migrações ou seed) falhar, fecha a conexão
 * parcialmente aberta e zera a promessa para permitir tentativas subsequentes (retry).
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstancePromise) {
    dbInstancePromise = (async () => {
      let db: SQLite.SQLiteDatabase | null = null;
      try {
        db = await SQLite.openDatabaseAsync(DATABASE_NAME);
        await db.execAsync('PRAGMA foreign_keys = ON;');
        await runMigrations(db);
        await seedDefaultCategories(db);
        return db;
      } catch (error) {
        dbInstancePromise = null;
        if (db) {
          try {
            await db.closeAsync();
          } catch {
            // Ignora erro no fechamento de conexão defeituosa
          }
        }
        throw error;
      }
    })();
  }
  return dbInstancePromise;
}

/**
 * Executa uma tarefa assíncrona dentro de uma transação exclusiva isolada.
 * - No iOS e Android nativos, utiliza `withExclusiveTransactionAsync` com a conexão `txn`
 *   dedicada, garantindo isolamento total contra leituras/escritas concorrentes.
 * - Na web ou em mocks onde `withExclusiveTransactionAsync` não estiver disponível,
 *   recorre a `withTransactionAsync` passando `db` como executor.
 */
export async function runInTransaction<T>(
  db: SQLite.SQLiteDatabase,
  task: (txn: SQLite.SQLiteDatabase) => Promise<T>
): Promise<T> {
  if (
    Platform.OS === 'web' ||
    typeof db.withExclusiveTransactionAsync !== 'function'
  ) {
    let result: T;
    await db.withTransactionAsync(async () => {
      result = await task(db);
    });
    return result!;
  }

  let result: T;
  await db.withExclusiveTransactionAsync(async (txn) => {
    result = await task(txn as unknown as SQLite.SQLiteDatabase);
  });
  return result!;
}

