import { useQuery } from '@tanstack/react-query';
import { ReportRepository } from '@/repositories';
import { queryKeys } from './queryKeys';

export function useMonthlySummary(month: string) {
  return useQuery({
    queryKey: queryKeys.reports.summary(month),
    queryFn: () => ReportRepository.getMonthlySummary(month),
  });
}

export function useExpensesByCategory(month: string) {
  return useQuery({
    queryKey: queryKeys.reports.expensesByCategory(month),
    queryFn: () => ReportRepository.getExpensesByCategory(month),
  });
}

export function useLastSixMonthsCashflow(endMonth: string) {
  return useQuery({
    queryKey: queryKeys.reports.cashflow(endMonth),
    queryFn: () => ReportRepository.getLastSixMonthsCashflow(endMonth),
  });
}
