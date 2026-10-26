import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CategoryRepository,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@/repositories';
import { TransactionType } from '@/types';
import { queryKeys } from './queryKeys';

export function useCategories(type?: TransactionType) {
  return useQuery({
    queryKey: queryKeys.categories.byType(type),
    queryFn: () => CategoryRepository.getAll(type),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCategoryInput) => CategoryRepository.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateCategoryInput) => CategoryRepository.update(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      categoryId,
      reassignToOutros,
    }: {
      categoryId: string;
      reassignToOutros?: boolean;
    }) => CategoryRepository.deleteOrReassign(categoryId, reassignToOutros),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}
