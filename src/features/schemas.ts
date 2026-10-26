import { z } from 'zod';

export const transactionFormSchema = z.object({
  type: z.enum(['income', 'expense'], {
    required_error: 'Selecione o tipo de transação.',
  }),
  amount_cents: z
    .number({
      required_error: 'Informe o valor.',
    })
    .int('O valor deve ser inteiro.')
    .positive('O valor deve ser maior que R$ 0,00.'),
  category_id: z
    .string({
      required_error: 'Escolha uma categoria.',
    })
    .min(1, 'Escolha uma categoria.'),
  date: z
    .string({
      required_error: 'Informe a data.',
    })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD (ex.: 2026-10-26).'),
  description: z
    .string()
    .max(80, 'A descrição pode ter no máximo 80 caracteres.')
    .optional(),
});

export type TransactionFormData = z.infer<typeof transactionFormSchema>;

export const categoryFormSchema = z.object({
  name: z
    .string({
      required_error: 'Informe o nome da categoria.',
    })
    .trim()
    .min(2, 'O nome deve ter pelo menos 2 caracteres.')
    .max(30, 'O nome pode ter no máximo 30 caracteres.'),
  type: z.enum(['income', 'expense'], {
    required_error: 'Escolha o tipo da categoria.',
  }),
  icon: z.string().min(1, 'Escolha um ícone.'),
  color: z.string().min(4, 'Escolha uma cor.'),
});

export type CategoryFormData = z.infer<typeof categoryFormSchema>;

export const budgetFormSchema = z.object({
  category_id: z.string().min(1, 'Selecione uma categoria de despesa.'),
  limit_cents: z
    .number()
    .int()
    .positive('Informe um limite maior que R$ 0,00.'),
});

export type BudgetFormData = z.infer<typeof budgetFormSchema>;

export const goalFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Informe um nome com pelo menos 2 caracteres.')
    .max(40, 'O nome pode ter no máximo 40 caracteres.'),
  icon: z.string().min(1, 'Escolha um ícone.'),
  target_cents: z
    .number()
    .int()
    .positive('A meta deve ter valor maior que R$ 0,00.'),
  deadline: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.trim() === '' || /^\d{4}-\d{2}-\d{2}$/.test(val.trim()),
      'Data limite inválida. Use AAAA-MM-DD.'
    ),
});

export type GoalFormData = z.infer<typeof goalFormSchema>;

export const contributionFormSchema = z.object({
  mode: z.enum(['deposit', 'withdraw']),
  amount_cents: z
    .number()
    .int()
    .positive('Informe um valor maior que R$ 0,00.'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD.'),
});

export type ContributionFormData = z.infer<typeof contributionFormSchema>;
