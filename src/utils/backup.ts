import { z } from 'zod';
import { ClayfinBackupPayload } from '@/types';

export const CURRENT_BACKUP_VERSION = 2;
export const SUPPORTED_BACKUP_VERSIONS = [1, 2] as const;
export const MAX_BACKUP_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Valida o tamanho do arquivo antes de ler seu conteúdo na memória do JavaScript,
 * prevenindo estouro de memória (OOM crash) caso o usuário selecione um arquivo gigante.
 */
export function validateBackupFileSize(bytes: number): {
  valid: boolean;
  error?: string;
} {
  if (bytes > MAX_BACKUP_FILE_BYTES) {
    const mbLimit = MAX_BACKUP_FILE_BYTES / (1024 * 1024);
    const fileMb = (bytes / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `O arquivo selecionado (${fileMb} MB) excede o limite máximo permitido de ${mbLimit} MB.`,
    };
  }
  return { valid: true };
}

const categorySchema = z.object({
  id: z.string().min(1, 'ID de categoria obrigatório'),
  name: z.string().min(1, 'Nome de categoria obrigatório'),
  icon: z.string().min(1, 'Ícone obrigatório'),
  color: z.string().min(1, 'Cor obrigatória'),
  type: z.enum(['income', 'expense']),
  is_default: z.number().int().min(0).max(1),
  created_at: z.string().min(1),
});

const transactionSchema = z.object({
  id: z.string().min(1, 'ID de transação obrigatório'),
  category_id: z.string().min(1, 'Categoria obrigatória'),
  type: z.enum(['income', 'expense']),
  amount_cents: z.number().int().positive('O valor deve ser positivo'),
  description: z.string().nullable().optional().transform((v) => v ?? null),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (use AAAA-MM-DD)'),
  created_at: z.string().min(1),
  recurring_rule_id: z
    .string()
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  occurrence_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de ocorrência inválida')
    .nullable()
    .optional()
    .transform((v) => v ?? null),
});

const budgetSchema = z.object({
  id: z.string().min(1, 'ID de orçamento obrigatório'),
  category_id: z.string().min(1, 'Categoria do orçamento obrigatória'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Mês inválido (use AAAA-MM)'),
  limit_cents: z.number().int().positive('O limite deve ser positivo'),
});

const goalSchema = z.object({
  id: z.string().min(1, 'ID de meta obrigatório'),
  name: z.string().min(1, 'Nome da meta obrigatório'),
  icon: z.string().min(1, 'Ícone da meta obrigatório'),
  target_cents: z.number().int().positive('O valor alvo deve ser positivo'),
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data limite inválida')
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  created_at: z.string().min(1),
});

const goalContributionSchema = z.object({
  id: z.string().min(1, 'ID de movimentação obrigatório'),
  goal_id: z.string().min(1, 'Meta obrigatória'),
  amount_cents: z
    .number()
    .int()
    .refine((v) => v !== 0, 'O valor deve ser diferente de zero'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de movimentação inválida'),
  created_at: z.string().min(1),
});

const recurringRuleSchema = z.object({
  id: z.string().min(1, 'ID de regra obrigatório'),
  category_id: z.string().min(1, 'Categoria da regra obrigatória'),
  type: z.enum(['income', 'expense']),
  amount_cents: z.number().int().positive('O valor deve ser positivo'),
  description: z.string().nullable().optional().transform((v) => v ?? null),
  frequency: z.enum(['weekly', 'monthly', 'yearly']),
  day_of_month: z
    .number()
    .int()
    .min(1)
    .max(31)
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  weekday: z
    .number()
    .int()
    .min(0)
    .max(6)
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de início inválida'),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de término inválida')
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  is_active: z.number().int().min(0).max(1),
  created_at: z.string().min(1),
});

export const clayfinBackupSchema = z.object({
  app: z.literal('Clayfin', {
    errorMap: () => ({
      message: 'O arquivo não pertence ao aplicativo Clayfin.',
    }),
  }),
  version: z.number().int(),
  exported_at: z.string().min(1, 'Data de exportação obrigatória'),
  data: z.object({
    categories: z.array(categorySchema),
    transactions: z.array(transactionSchema),
    budgets: z.array(budgetSchema),
    goals: z.array(goalSchema),
    goal_contributions: z.array(goalContributionSchema),
    recurring_rules: z.array(recurringRuleSchema).optional().default([]),
  }),
});

export interface BackupValidationResult {
  valid: boolean;
  payload?: ClayfinBackupPayload;
  error?: string;
}

/**
 * Função pura que valida uma string ou objeto JSON do backup do Clayfin,
 * conferindo versão, estrutura, duplicidade de IDs e integridade referencial.
 */
export function validateBackupPayload(rawInput: unknown): BackupValidationResult {
  let parsedJson: any;
  try {
    parsedJson =
      typeof rawInput === 'string' ? JSON.parse(rawInput) : rawInput;
  } catch {
    return {
      valid: false,
      error: 'O arquivo selecionado não é um JSON válido.',
    };
  }

  if (typeof parsedJson !== 'object' || parsedJson === null) {
    return {
      valid: false,
      error: 'Conteúdo de backup inválido: esperado um objeto JSON.',
    };
  }

  // Validação estrita de versão do backup
  if (typeof parsedJson.version === 'number') {
    if (parsedJson.version > CURRENT_BACKUP_VERSION) {
      return {
        valid: false,
        error: `A versão deste backup (v${parsedJson.version}) é mais recente do que a versão suportada por este aplicativo (v${CURRENT_BACKUP_VERSION}). Por favor, atualize o Clayfin.`,
      };
    }
    if (!SUPPORTED_BACKUP_VERSIONS.includes(parsedJson.version as any)) {
      return {
        valid: false,
        error: `Versão de backup não suportada: v${parsedJson.version}. Apenas as versões 1 e 2 são aceitas.`,
      };
    }
  }

  const result = clayfinBackupSchema.safeParse(parsedJson);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const pathStr = firstIssue?.path.join('.') || 'arquivo';
    return {
      valid: false,
      error: `Formato de backup inválido em "${pathStr}": ${firstIssue?.message || 'estrutura incompatível'}.`,
    };
  }

  const {
    categories,
    transactions,
    budgets,
    goals,
    goal_contributions,
    recurring_rules,
  } = result.data.data;

  // 1. Validação de IDs duplicados dentro de cada coleção
  const seenCatIds = new Set<string>();
  for (const cat of categories) {
    if (seenCatIds.has(cat.id)) {
      return {
        valid: false,
        error: `ID de categoria duplicado no backup: "${cat.id}".`,
      };
    }
    seenCatIds.add(cat.id);
  }

  const seenTxIds = new Set<string>();
  for (const tx of transactions) {
    if (seenTxIds.has(tx.id)) {
      return {
        valid: false,
        error: `ID de transação duplicado no backup: "${tx.id}".`,
      };
    }
    seenTxIds.add(tx.id);
  }

  const seenBudgetIds = new Set<string>();
  for (const b of budgets) {
    if (seenBudgetIds.has(b.id)) {
      return {
        valid: false,
        error: `ID de orçamento duplicado no backup: "${b.id}".`,
      };
    }
    seenBudgetIds.add(b.id);
  }

  const seenGoalIds = new Set<string>();
  for (const g of goals) {
    if (seenGoalIds.has(g.id)) {
      return {
        valid: false,
        error: `ID de meta duplicado no backup: "${g.id}".`,
      };
    }
    seenGoalIds.add(g.id);
  }

  const seenContribIds = new Set<string>();
  for (const gc of goal_contributions) {
    if (seenContribIds.has(gc.id)) {
      return {
        valid: false,
        error: `ID de movimentação de meta duplicado no backup: "${gc.id}".`,
      };
    }
    seenContribIds.add(gc.id);
  }

  const seenRuleIds = new Set<string>();
  for (const rule of recurring_rules ?? []) {
    if (seenRuleIds.has(rule.id)) {
      return {
        valid: false,
        error: `ID de regra recorrente duplicado no backup: "${rule.id}".`,
      };
    }
    seenRuleIds.add(rule.id);
  }

  // 2. Validação de integridade referencial: transações -> categorias
  for (const tx of transactions) {
    if (!seenCatIds.has(tx.category_id)) {
      return {
        valid: false,
        error: `Transação "${tx.id}" faz referência a uma categoria inexistente no backup ("${tx.category_id}").`,
      };
    }
  }

  // 3. Validação de integridade referencial: orçamentos -> categorias
  for (const b of budgets) {
    if (!seenCatIds.has(b.category_id)) {
      return {
        valid: false,
        error: `Orçamento "${b.id}" faz referência a uma categoria inexistente no backup ("${b.category_id}").`,
      };
    }
  }

  // 4. Validação de integridade referencial: aportes -> metas
  for (const gc of goal_contributions) {
    if (!seenGoalIds.has(gc.goal_id)) {
      return {
        valid: false,
        error: `Movimentação "${gc.id}" faz referência a uma meta inexistente no backup ("${gc.goal_id}").`,
      };
    }
  }

  // 5. Validação de integridade referencial: regras recorrentes -> categorias
  for (const rule of recurring_rules ?? []) {
    if (!seenCatIds.has(rule.category_id)) {
      return {
        valid: false,
        error: `Regra recorrente "${rule.id}" faz referência a uma categoria inexistente no backup ("${rule.category_id}").`,
      };
    }
  }

  // 6. Validação de integridade referencial: transações recorrentes -> regras recorrentes
  for (const tx of transactions) {
    if (tx.recurring_rule_id && !seenRuleIds.has(tx.recurring_rule_id)) {
      return {
        valid: false,
        error: `Transação "${tx.id}" faz referência a uma regra recorrente inexistente no backup ("${tx.recurring_rule_id}").`,
      };
    }
  }

  // 7. Validação de unicidade do par (category_id, month) em orçamentos
  const seenBudgetPairs = new Set<string>();
  for (const b of budgets) {
    const pairKey = `${b.category_id}_${b.month}`;
    if (seenBudgetPairs.has(pairKey)) {
      return {
        valid: false,
        error: `Existe mais de um orçamento definido para a mesma categoria ("${b.category_id}") no mês "${b.month}".`,
      };
    }
    seenBudgetPairs.add(pairKey);
  }

  // 8. Validação de unicidade do par (recurring_rule_id, occurrence_date) em transações
  const seenRecurringPairs = new Set<string>();
  for (const tx of transactions) {
    if (tx.recurring_rule_id && tx.occurrence_date) {
      const pairKey = `${tx.recurring_rule_id}_${tx.occurrence_date}`;
      if (seenRecurringPairs.has(pairKey)) {
        return {
          valid: false,
          error: `Existe mais de uma transação no backup para a mesma regra ("${tx.recurring_rule_id}") na data de ocorrência "${tx.occurrence_date}".`,
        };
      }
      seenRecurringPairs.add(pairKey);
    }
  }

  return {
    valid: true,
    payload: result.data as ClayfinBackupPayload,
  };
}
