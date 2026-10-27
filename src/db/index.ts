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
        await db.execAsync('PRAGMA journal_mode = WAL;');
        await db.execAsync('PRAGMA foreign_keys = ON;');
        await db.execAsync('PRAGMA busy_timeout = 5000;');
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
 * Executa uma tarefa assíncrona dentro de uma transação SQLite atômica.
 * Utiliza `withTransactionAsync` na conexão principal com rollback automático em falhas,
 * garantindo atomicidade e evitando criação de conexões concorrentes que travam o banco
 * (`database is locked`) no Expo Go.
 */
export async function runInTransaction<T>(
  db: SQLite.SQLiteDatabase,
  task: (txn: SQLite.SQLiteDatabase) => Promise<T>
): Promise<T> {
  let result: T;
  await db.withTransactionAsync(async () => {
    result = await task(db);
  });
  return result!;
}
