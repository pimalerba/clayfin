import * as SQLite from 'expo-sqlite';
import { runMigrations } from './migrations';
import { seedDefaultCategories } from './seed';

const DATABASE_NAME = 'clayfin.db';

let dbInstancePromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstancePromise) {
    dbInstancePromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      await db.execAsync('PRAGMA foreign_keys = ON;');
      await runMigrations(db);
      await seedDefaultCategories(db);
      return db;
    })();
  }
  return dbInstancePromise;
}
