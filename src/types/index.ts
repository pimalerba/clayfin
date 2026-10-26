export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
  is_default: number; // 0 ou 1
  created_at: string;
}

export interface Transaction {
  id: string;
  category_id: string;
  type: TransactionType;
  amount_cents: number;
  description: string | null;
  date: string; // ISO yyyy-MM-dd
  created_at: string;
}

export interface TransactionWithCategory extends Transaction {
  category_name: string;
  category_icon: string;
  category_color: string;
}

export interface Budget {
  id: string;
  category_id: string;
  month: string; // yyyy-MM
  limit_cents: number;
}

export interface BudgetWithUsage extends Budget {
  category_name: string;
  category_icon: string;
  category_color: string;
  spent_cents: number;
}

export interface Goal {
  id: string;
  name: string;
  icon: string;
  target_cents: number;
  deadline: string | null; // yyyy-MM-dd ou null
  created_at: string;
}

export interface GoalWithProgress extends Goal {
  current_cents: number;
  contributions_count: number;
}

export interface GoalContribution {
  id: string;
  goal_id: string;
  amount_cents: number; // positivo = aporte, negativo = retirada
  date: string; // yyyy-MM-dd
  created_at: string;
}

export interface MonthlySummaryReport {
  month: string;
  total_income_cents: number;
  total_expense_cents: number;
  balance_cents: number;
  top_expense_category: {
    category_id: string;
    category_name: string;
    category_icon: string;
    category_color: string;
    total_cents: number;
  } | null;
}

export interface CategoryExpenseSlice {
  category_id: string;
  category_name: string;
  category_icon: string;
  category_color: string;
  total_cents: number;
  percentage: number;
}

export interface MonthlyCashflowPoint {
  month: string; // yyyy-MM
  label: string; // ex.: Out
  income_cents: number;
  expense_cents: number;
}

export interface ClayfinBackupPayload {
  app: 'Clayfin';
  version: number;
  exported_at: string;
  data: {
    categories: Category[];
    transactions: Transaction[];
    budgets: Budget[];
    goals: Goal[];
    goal_contributions: GoalContribution[];
  };
}
