import React, { useEffect } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Trash2, X } from 'lucide-react-native';
import { CATEGORY_PRESET_COLORS, useAppTheme } from '@/theme';
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useLiquidGlass,
  useUpdateCategory,
} from '@/hooks';
import { CategoryRepository } from '@/repositories';
import { DEFAULT_OUTROS_EXPENSE_ID } from '@/db/seed';
import {
  ClayButton,
  ClayCard,
  ClayChip,
  ClayInput,
  GlassContainer,
  GlassSurface,
} from '@/components/ui';
import { CategoryFormData, categoryFormSchema } from '@/features/schemas';
import { AVAILABLE_ICON_NAMES, DynamicIcon } from '@/utils/icons';

export default function CategoryFormScreen() {
  const theme = useAppTheme();
  const isLiquidGlass = useLiquidGlass();
  const params = useLocalSearchParams<{ id?: string }>();
  const isEditing = Boolean(params.id);

  const { data: categories = [] } = useCategories();
  const existingCategory = categories.find((c) => c.id === params.id);

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      type: 'expense',
      icon: 'Utensils',
      color: CATEGORY_PRESET_COLORS[0],
    },
  });

  const selectedType = watch('type');
  const selectedIcon = watch('icon');
  const selectedColor = watch('color');
  const isMutationPending =
    isSubmitting ||
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  useEffect(() => {
    if (existingCategory) {
      reset({
        name: existingCategory.name,
        type: existingCategory.type,
        icon: existingCategory.icon,
        color: existingCategory.color,
      });
    }
  }, [existingCategory, reset]);

  const onSubmit = async (values: CategoryFormData) => {
    try {
      if (isEditing && params.id) {
        await updateMutation.mutateAsync({
          id: params.id,
          ...values,
        });
      } else {
        await createMutation.mutateAsync(values);
      }
      router.back();
    } catch (err: any) {
      Alert.alert(
        'Erro ao salvar',
        err?.message ?? 'Não foi possível salvar a categoria.'
      );
    }
  };

  const handleDelete = async () => {
    if (!params.id) return;

    if (params.id === DEFAULT_OUTROS_EXPENSE_ID) {
      Alert.alert(
        'Ação não permitida',
        'A categoria padrão "Outros" é utilizada para reatribuição e não pode ser removida.'
      );
      return;
    }

    const txCount = await CategoryRepository.countTransactions(params.id);

    if (txCount > 0) {
      Alert.alert(
        'Categoria possui transações',
        `Existem ${txCount} transação(ões) vinculadas a "${existingCategory?.name}". Deseja reatribuí-las para "Outros" e excluir esta categoria?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Reatribuir e Excluir',
            style: 'destructive',
            onPress: async () => {
              await deleteMutation.mutateAsync({
                categoryId: params.id!,
                reassignToOutros: true,
              });
              router.back();
            },
          },
        ]
      );
      return;
    }

    Alert.alert(
      'Excluir categoria',
      `Deseja realmente excluir "${existingCategory?.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await deleteMutation.mutateAsync({
              categoryId: params.id!,
              reassignToOutros: false,
            });
            router.back();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView
      edges={Platform.OS === 'ios' ? ['bottom'] : ['top', 'bottom']}
      style={[
        styles.safe,
        {
          backgroundColor: isLiquidGlass
            ? 'transparent'
            : theme.colors.background,
        },
      ]}
    >
      <View
        style={[
          styles.header,
          Platform.OS === 'ios' ? { paddingTop: 18 } : null,
        ]}
      >
        <Text
          style={[
            theme.typography.h1,
            { color: isLiquidGlass ? '#1E1633' : theme.colors.textPrimary },
          ]}
        >
          {isEditing ? 'Editar Categoria' : 'Nova Categoria'}
        </Text>
        {isLiquidGlass ? (
          <GlassContainer spacing={8}>
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
            >
              <GlassSurface
                interactive
                tintColor="rgba(122, 90, 248, 0.16)"
                borderRadius={22}
                style={styles.iconBtn}
              >
                <X size={22} color="#1E1633" strokeWidth={2.4} />
              </GlassSurface>
            </Pressable>
          </GlassContainer>
        ) : (
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Fechar"
            style={[styles.iconBtn, { backgroundColor: theme.colors.surface }]}
          >
            <X size={22} color={theme.colors.textPrimary} />
          </Pressable>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ClayCard radius="xl" style={styles.formCard}>
          <View style={styles.typeRow}>
            <ClayChip
              label="Despesa"
              selected={selectedType === 'expense'}
              accentColor={theme.colors.expense}
              onPress={() => setValue('type', 'expense')}
              style={styles.typeChip}
            />
            <ClayChip
              label="Receita"
              selected={selectedType === 'income'}
              accentColor={theme.colors.income}
              onPress={() => setValue('type', 'income')}
              style={styles.typeChip}
            />
          </View>

          <Controller
            control={control}
            name="name"
            render={({ field: { value, onChange } }) => (
              <ClayInput
                label="Nome da Categoria"
                placeholder="Ex.: Pets, Assinaturas, Freelance..."
                value={value}
                onChangeText={onChange}
                errorMessage={errors.name?.message}
              />
            )}
          />

          <Text
            style={[
              theme.typography.bodySmall,
              styles.sectionLabel,
              { color: theme.colors.textSecondary },
            ]}
          >
            Cor
          </Text>
          <View style={styles.colorsGrid}>
            {CATEGORY_PRESET_COLORS.map((colorHex) => {
              const selected = selectedColor === colorHex;
              return (
                <Pressable
                  key={colorHex}
                  onPress={() => setValue('color', colorHex)}
                  accessibilityRole="button"
                  accessibilityLabel={`Cor ${colorHex}`}
                  style={[
                    styles.colorSwatch,
                    {
                      backgroundColor: colorHex,
                      borderWidth: selected ? 3 : 1.5,
                      borderColor: selected
                        ? theme.colors.textPrimary
                        : 'rgba(255,255,255,0.8)',
                    },
                  ]}
                >
                  {selected ? <Check size={18} color="#FFFFFF" /> : null}
                </Pressable>
              );
            })}
          </View>

          <Text
            style={[
              theme.typography.bodySmall,
              styles.sectionLabel,
              { color: theme.colors.textSecondary },
            ]}
          >
            Ícone
          </Text>
          <View style={styles.iconsGrid}>
            {AVAILABLE_ICON_NAMES.map((iconName) => {
              const selected = selectedIcon === iconName;
              return (
                <Pressable
                  key={iconName}
                  onPress={() => setValue('icon', iconName)}
                  accessibilityRole="button"
                  accessibilityLabel={`Ícone ${iconName}`}
                  style={[
                    styles.iconOption,
                    {
                      backgroundColor: selected
                        ? selectedColor
                        : theme.colors.background,
                    },
                  ]}
                >
                  <DynamicIcon
                    name={iconName}
                    size={20}
                    color={selected ? '#FFFFFF' : theme.colors.textPrimary}
                  />
                </Pressable>
              );
            })}
          </View>
        </ClayCard>

        <ClayButton
          title={isEditing ? 'Salvar Categoria' : 'Criar Categoria'}
          onPress={handleSubmit(onSubmit)}
          loading={
            isSubmitting ||
            createMutation.isPending ||
            updateMutation.isPending
          }
          disabled={isMutationPending}
          size="lg"
        />

        {isEditing && params.id !== DEFAULT_OUTROS_EXPENSE_ID ? (
          <ClayButton
            title="Excluir Categoria"
            onPress={handleDelete}
            variant="danger"
            icon={<Trash2 size={18} color="#FFFFFF" />}
            loading={deleteMutation.isPending}
            disabled={isMutationPending}
            style={{ marginTop: 12 }}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  formCard: {
    marginBottom: 20,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  typeChip: {
    flex: 1,
  },
  sectionLabel: {
    marginTop: 8,
    marginBottom: 10,
    marginLeft: 4,
    fontWeight: '600',
  },
  colorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  iconOption: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
