import { getDatabase } from '@/db';
import { Goal, GoalContribution, GoalWithProgress } from '@/types';
import { formatCentsToBRL } from '@/utils/currency';
import { generateId } from '@/utils/uuid';
import { ReportRepository } from './ReportRepository';

export interface CreateGoalInput {
  name: string;
  icon: string;
  target_cents: number;
  deadline?: string | null;
}

export interface UpdateGoalInput extends CreateGoalInput {
  id: string;
}

export interface AddContributionInput {
  goal_id: string;
  amount_cents: number; // positivo = aporte, negativo = retirada
  date: string; // yyyy-MM-dd
}

export interface IGoalRepository {
  getAllWithProgress(): Promise<GoalWithProgress[]>;
  getByIdWithProgress(id: string): Promise<GoalWithProgress | null>;
  getContributions(goalId: string): Promise<GoalContribution[]>;
  create(input: CreateGoalInput): Promise<Goal>;
  update(input: UpdateGoalInput): Promise<Goal>;
  delete(id: string): Promise<void>;
  addContribution(input: AddContributionInput): Promise<GoalContribution>;
  deleteContribution(id: string): Promise<void>;
}

export const GoalRepository: IGoalRepository = {
  async getAllWithProgress(): Promise<GoalWithProgress[]> {
    const db = await getDatabase();
    return db.getAllAsync<GoalWithProgress>(
      `SELECT
        g.*,
        COALESCE(SUM(gc.amount_cents), 0) AS current_cents,
        COUNT(gc.id) AS contributions_count
       FROM goals g
       LEFT JOIN goal_contributions gc ON gc.goal_id = g.id
       GROUP BY g.id
       ORDER BY g.created_at DESC;`
    );
  },

  async getByIdWithProgress(id: string): Promise<GoalWithProgress | null> {
    const db = await getDatabase();
    return db.getFirstAsync<GoalWithProgress>(
      `SELECT
        g.*,
        COALESCE(SUM(gc.amount_cents), 0) AS current_cents,
        COUNT(gc.id) AS contributions_count
       FROM goals g
       LEFT JOIN goal_contributions gc ON gc.goal_id = g.id
       WHERE g.id = ?
       GROUP BY g.id;`,
      [id]
    );
  },

  async getContributions(goalId: string): Promise<GoalContribution[]> {
    const db = await getDatabase();
    return db.getAllAsync<GoalContribution>(
      `SELECT * FROM goal_contributions
       WHERE goal_id = ?
       ORDER BY date DESC, created_at DESC;`,
      [goalId]
    );
  },

  async create(input: CreateGoalInput): Promise<Goal> {
    const db = await getDatabase();
    const id = generateId();
    const now = new Date().toISOString();
    const targetCents = Math.trunc(input.target_cents);
    const deadline = input.deadline?.trim() || null;

    await db.runAsync(
      `INSERT INTO goals (id, name, icon, target_cents, deadline, created_at)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [id, input.name.trim(), input.icon, targetCents, deadline, now]
    );

    return {
      id,
      name: input.name.trim(),
      icon: input.icon,
      target_cents: targetCents,
      deadline,
      created_at: now,
    };
  },

  async update(input: UpdateGoalInput): Promise<Goal> {
    const db = await getDatabase();
    const targetCents = Math.trunc(input.target_cents);
    const deadline = input.deadline?.trim() || null;

    await db.runAsync(
      `UPDATE goals
       SET name = ?, icon = ?, target_cents = ?, deadline = ?
       WHERE id = ?;`,
      [input.name.trim(), input.icon, targetCents, deadline, input.id]
    );

    const updated = await db.getFirstAsync<Goal>(
      `SELECT * FROM goals WHERE id = ?;`,
      [input.id]
    );
    if (!updated) {
      throw new Error('Meta não encontrada.');
    }
    return updated;
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM goals WHERE id = ?;`, [id]);
  },

  async addContribution(input: AddContributionInput): Promise<GoalContribution> {
    const db = await getDatabase();
    const id = generateId();
    const now = new Date().toISOString();
    const cents = Math.trunc(input.amount_cents);

    if (cents === 0) {
      throw new Error('O valor do aporte/retirada deve ser diferente de zero.');
    }

    if (cents > 0) {
      const availableInAccount =
        await ReportRepository.getAvailableAccountBalance();
      if (cents > availableInAccount) {
        throw new Error(
          `Saldo insuficiente em conta. Você possui ${formatCentsToBRL(
            Math.max(0, availableInAccount)
          )} disponível para guardar.`
        );
      }
    } else {
      const goal = await this.getByIdWithProgress(input.goal_id);
      const currentInGoal = Math.max(0, goal?.current_cents ?? 0);
      if (Math.abs(cents) > currentInGoal) {
        throw new Error(
          `Valor acima do disponível no cofrinho (${formatCentsToBRL(
            currentInGoal
          )}).`
        );
      }
    }

    await db.runAsync(
      `INSERT INTO goal_contributions (id, goal_id, amount_cents, date, created_at)
       VALUES (?, ?, ?, ?, ?);`,
      [id, input.goal_id, cents, input.date, now]
    );

    return {
      id,
      goal_id: input.goal_id,
      amount_cents: cents,
      date: input.date,
      created_at: now,
    };
  },

  async deleteContribution(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM goal_contributions WHERE id = ?;`, [id]);
  },
};
