import { getDatabase } from '@/db';
import { DEFAULT_OUTROS_EXPENSE_ID } from '@/db/seed';
import { Category, TransactionType } from '@/types';
import { generateId } from '@/utils/uuid';

export interface CreateCategoryInput {
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

export interface UpdateCategoryInput {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

export interface ICategoryRepository {
  getAll(type?: TransactionType): Promise<Category[]>;
  getById(id: string): Promise<Category | null>;
  create(input: CreateCategoryInput): Promise<Category>;
  update(input: UpdateCategoryInput): Promise<Category>;
  countTransactions(categoryId: string): Promise<number>;
  deleteOrReassign(categoryId: string, reassignToOutros?: boolean): Promise<void>;
}

export const CategoryRepository: ICategoryRepository = {
  async getAll(type?: TransactionType): Promise<Category[]> {
    const db = await getDatabase();
    if (type) {
      return db.getAllAsync<Category>(
        `SELECT * FROM categories WHERE type = ? ORDER BY is_default DESC, name ASC;`,
        [type]
      );
    }
    return db.getAllAsync<Category>(
      `SELECT * FROM categories ORDER BY type ASC, is_default DESC, name ASC;`
    );
  },

  async getById(id: string): Promise<Category | null> {
    const db = await getDatabase();
    return db.getFirstAsync<Category>(
      `SELECT * FROM categories WHERE id = ?;`,
      [id]
    );
  },

  async create(input: CreateCategoryInput): Promise<Category> {
    const db = await getDatabase();
    const id = generateId();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO categories (id, name, icon, color, type, is_default, created_at)
       VALUES (?, ?, ?, ?, ?, 0, ?);`,
      [id, input.name.trim(), input.icon, input.color, input.type, now]
    );

    return {
      id,
      name: input.name.trim(),
      icon: input.icon,
      color: input.color,
      type: input.type,
      is_default: 0,
      created_at: now,
    };
  },

  async update(input: UpdateCategoryInput): Promise<Category> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE categories
       SET name = ?, icon = ?, color = ?, type = ?
       WHERE id = ?;`,
      [input.name.trim(), input.icon, input.color, input.type, input.id]
    );
    const updated = await this.getById(input.id);
    if (!updated) {
      throw new Error('Categoria não encontrada após atualização.');
    }
    return updated;
  },

  async countTransactions(categoryId: string): Promise<number> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM transactions WHERE category_id = ?;`,
      [categoryId]
    );
    return row?.count ?? 0;
  },

  async deleteOrReassign(
    categoryId: string,
    reassignToOutros: boolean = false
  ): Promise<void> {
    const db = await getDatabase();

    if (categoryId === DEFAULT_OUTROS_EXPENSE_ID) {
      throw new Error('A categoria padrão "Outros" não pode ser excluída.');
    }

    const txCount = await this.countTransactions(categoryId);
    if (txCount > 0 && !reassignToOutros) {
      throw new Error(
        `Esta categoria possui ${txCount} transação(ões). Confirme para reatribuir para "Outros".`
      );
    }

    await db.withTransactionAsync(async () => {
      if (txCount > 0 && reassignToOutros) {
        // Garante que a categoria Outros existe
        const outros = await db.getFirstAsync<Category>(
          `SELECT * FROM categories WHERE id = ? OR LOWER(name) = 'outros' LIMIT 1;`,
          [DEFAULT_OUTROS_EXPENSE_ID]
        );
        const fallbackId = outros?.id ?? DEFAULT_OUTROS_EXPENSE_ID;

        await db.runAsync(
          `UPDATE transactions SET category_id = ? WHERE category_id = ?;`,
          [fallbackId, categoryId]
        );
      }

      await db.runAsync(`DELETE FROM categories WHERE id = ?;`, [categoryId]);
    });
  },
};
