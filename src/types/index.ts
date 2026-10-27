export type TransactionType = 'income' | 'expense';
export type RecurringFrequency = 'weekly' | 'monthly' | 'yearly';

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
  recurring_rule_id?: string | null;
  occurrence_date?: string | null;
}

export interface TransactionWithCategory extends Transaction {
  category_name: string;
  category_icon: string;
  category_color: string;
}

export interface RecurringRule {
  id: string;
  category_id: string;
  type: TransactionType;
  amount_cents: number;
  description: string | null;
  frequency: RecurringFrequency;
  day_of_month: number | null; // 1-31 (mensal/anual)
  weekday: number | null; // 0-6 (semanal: 0=domingo, 6=sábado)
  start_date: string; // yyyy-MM-dd
  end_date: string | null; // yyyy-MM-dd
  is_active: number; // 0 ou 1
  created_at: string;
}

export interface RecurringRuleWithCategory extends RecurringRule {
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
  net_goal_contributions_cents: number;
  balance_cents: number;
  available_account_cents: number;
  total_saved_in_goals_cents: number;
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
