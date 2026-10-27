import * as SQLite from 'expo-sqlite';
import { migration001Initial, Migration } from './001_initial';
import { migration002Recurring } from './002_recurring';

export const ALL_MIGRATIONS: Migration[] = [migration001Initial, migration002Recurring];

export async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const currentVersion = row?.user_version ?? 0;

  const pendingMigrations = ALL_MIGRATIONS.filter((m) => m.version > currentVersion).sort(
    (a, b) => a.version - b.version
  );

  for (const migration of pendingMigrations) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(migration.upSql);
      await db.execAsync(`PRAGMA user_version = ${migration.version};`);
    });
  }
}
