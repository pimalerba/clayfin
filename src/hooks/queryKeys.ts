export const queryKeys = {
  categories: {
    all: ['categories'] as const,
    byType: (type?: string) => ['categories', type ?? 'all'] as const,
  },
  transactions: {
    all: ['transactions'] as const,
    list: (filters: Record<string, unknown>) => ['transactions', 'list', filters] as const,
    detail: (id: string) => ['transactions', 'detail', id] as const,
  },
  budgets: {
    all: ['budgets'] as const,
    byMonth: (month: string) => ['budgets', month] as const,
  },
  goals: {
    all: ['goals'] as const,
    detail: (id: string) => ['goals', 'detail', id] as const,
    contributions: (id: string) => ['goals', 'contributions', id] as const,
  },
  reports: {
    all: ['reports'] as const,
    summary: (month: string) => ['reports', 'summary', month] as const,
    expensesByCategory: (month: string) =>
      ['reports', 'expensesByCategory', month] as const,
    cashflow: (endMonth: string) => ['reports', 'cashflow', endMonth] as const,
  },
  onboarding: ['onboarding'] as const,
};
