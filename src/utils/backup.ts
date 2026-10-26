import { z } from 'zod';
import { ClayfinBackupPayload } from '@/types';

const categorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  icon: z.string().min(1),
  color: z.string().min(1),
  type: z.enum(['income', 'expense']),
  is_default: z.number().int().min(0).max(1),
  created_at: z.string().min(1),
});

const transactionSchema = z.object({
  id: z.string().min(1),
  category_id: z.string().min(1),
  type: z.enum(['income', 'expense']),
  amount_cents: z.number().int().positive(),
  description: z.string().nullable().optional().transform((v) => v ?? null),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (use AAAA-MM-DD)'),
  created_at: z.string().min(1),
});

const budgetSchema = z.object({
  id: z.string().min(1),
  category_id: z.string().min(1),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Mês inválido (use AAAA-MM)'),
  limit_cents: z.number().int().positive(),
});

const goalSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  icon: z.string().min(1),
  target_cents: z.number().int().positive(),
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  created_at: z.string().min(1),
});

const goalContributionSchema = z.object({
  id: z.string().min(1),
  goal_id: z.string().min(1),
  amount_cents: z
    .number()
    .int()
    .refine((v) => v !== 0, 'O valor deve ser diferente de zero'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  created_at: z.string().min(1),
});

export const clayfinBackupSchema = z.object({
  app: z.literal('Clayfin'),
  version: z.number().int().min(1),
  exported_at: z.string().min(1),
  data: z.object({
    categories: z.array(categorySchema),
    transactions: z.array(transactionSchema),
    budgets: z.array(budgetSchema),
    goals: z.array(goalSchema),
    goal_contributions: z.array(goalContributionSchema),
  }),
});

export interface BackupValidationResult {
  valid: boolean;
  payload?: ClayfinBackupPayload;
  error?: string;
}

/**
 * Função pura que valida uma string ou objeto JSON do backup do Clayfin.
 */
export function validateBackupPayload(rawInput: unknown): BackupValidationResult {
  try {
    const parsedJson =
      typeof rawInput === 'string' ? JSON.parse(rawInput) : rawInput;
    const result = clayfinBackupSchema.safeParse(parsedJson);

    if (!result.success) {
      const firstIssue = result.error.issues[0];
      return {
        valid: false,
        error: `Formato de backup inválido: ${firstIssue?.path.join('.') || 'arquivo'} (${firstIssue?.message || 'erro de esquema'})`,
      };
    }

    // Valida integridade referencial básica (category_id existe nas categorias do backup)
    const categoryIds = new Set(result.data.data.categories.map((c) => c.id));
    for (const tx of result.data.data.transactions) {
      if (!categoryIds.has(tx.category_id)) {
        return {
          valid: false,
          error: `Transação "${tx.id}" referencia uma categoria inexistente no backup.`,
        };
      }
    }

    const goalIds = new Set(result.data.data.goals.map((g) => g.id));
    for (const gc of result.data.data.goal_contributions) {
      if (!goalIds.has(gc.goal_id)) {
        return {
          valid: false,
          error: `Aporte "${gc.id}" referencia uma meta inexistente no backup.`,
        };
      }
    }

    return {
      valid: true,
      payload: result.data,
    };
  } catch {
    return {
      valid: false,
      error: 'O arquivo selecionado não é um JSON válido.',
    };
  }
}
