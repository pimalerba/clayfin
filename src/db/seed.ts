import * as SQLite from 'expo-sqlite';
import { TransactionType } from '@/types';

export interface DefaultCategorySeed {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
  is_default: 1;
}

export const DEFAULT_OUTROS_EXPENSE_ID = '00000000-0000-4000-8000-000000000008';
export const DEFAULT_OUTROS_INCOME_ID = '00000000-0000-4000-8000-000000000009';

export const DEFAULT_CATEGORIES: DefaultCategorySeed[] = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    name: 'Alimentação',
    icon: 'Utensils',
    color: '#F07167',
    type: 'expense',
    is_default: 1,
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    name: 'Transporte',
    icon: 'Car',
    color: '#72B7F9',
    type: 'expense',
    is_default: 1,
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    name: 'Moradia',
    icon: 'Home',
    color: '#8A6FE8',
    type: 'expense',
    is_default: 1,
  },
  {
    id: '00000000-0000-4000-8000-000000000004',
    name: 'Lazer',
    icon: 'Gamepad2',
    color: '#F4A261',
    type: 'expense',
    is_default: 1,
  },
  {
    id: '00000000-0000-4000-8000-000000000005',
    name: 'Saúde',
    icon: 'HeartPulse',
    color: '#E76F9B',
    type: 'expense',
    is_default: 1,
  },
  {
    id: '00000000-0000-4000-8000-000000000006',
    name: 'Educação',
    icon: 'GraduationCap',
    color: '#56B4BA',
    type: 'expense',
    is_default: 1,
  },
  {
    id: '00000000-0000-4000-8000-000000000007',
    name: 'Salário',
    icon: 'Wallet',
    color: '#44B988',
    type: 'income',
    is_default: 1,
  },
  {
    id: DEFAULT_OUTROS_EXPENSE_ID,
    name: 'Outros',
    icon: 'MoreHorizontal',
    color: '#9B89B3',
    type: 'expense',
    is_default: 1,
  },
];

export async function seedDefaultCategories(
  db: SQLite.SQLiteDatabase,
  options?: { inTransaction?: boolean }
): Promise<void> {
  const now = new Date().toISOString();

  const insertAll = async (executor: SQLite.SQLiteDatabase) => {
    for (const cat of DEFAULT_CATEGORIES) {
      await executor.runAsync(
        `INSERT OR IGNORE INTO categories (id, name, icon, color, type, is_default, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [cat.id, cat.name, cat.icon, cat.color, cat.type, cat.is_default, now]
      );
    }
  };

  if (options?.inTransaction) {
    await insertAll(db);
  } else {
    await db.withTransactionAsync(async () => {
      await insertAll(db);
    });
  }
}
