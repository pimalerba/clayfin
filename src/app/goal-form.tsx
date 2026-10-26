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
import { Calendar, Trash2, X } from 'lucide-react-native';
import { useAppTheme } from '@/theme';
import {
  useCreateGoal,
  useDeleteGoal,
  useGoalDetail,
  useLiquidGlass,
  useUpdateGoal,
} from '@/hooks';
import {
  ClayButton,
  ClayCard,
  ClayInput,
  GlassContainer,
  GlassSurface,
} from '@/components/ui';
import { GoalFormData, goalFormSchema } from '@/features/schemas';
import { AVAILABLE_ICON_NAMES, DynamicIcon } from '@/utils/icons';

export default function GoalFormScreen() {
  const theme = useAppTheme();
  const isLiquidGlass = useLiquidGlass();
  const params = useLocalSearchParams<{ id?: string }>();
  const isEditing = Boolean(params.id);

  const { data: existingGoal } = useGoalDetail(params.id);
  const createMutation = useCreateGoal();
  const updateMutation = useUpdateGoal();
  const deleteMutation = useDeleteGoal();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      name: '',
      icon: 'PiggyBank',
      target_cents: 0,
      deadline: '',
    },
  });

  const selectedIcon = watch('icon');
  const isMutationPending =
    isSubmitting ||
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  useEffect(() => {
    if (existingGoal) {
      reset({
        name: existingGoal.name,
        icon: existingGoal.icon,
        target_cents: existingGoal.target_cents,
        deadline: existingGoal.deadline ?? '',
      });
    }
  }, [existingGoal, reset]);

  const onSubmit = async (values: GoalFormData) => {
    try {
      const cleanDeadline = values.deadline?.trim() || null;
      if (isEditing && params.id) {
        await updateMutation.mutateAsync({
          id: params.id,
          name: values.name,
          icon: values.icon,
          target_cents: values.target_cents,
          deadline: cleanDeadline,
        });
      } else {
        await createMutation.mutateAsync({
          name: values.name,
          icon: values.icon,
          target_cents: values.target_cents,
          deadline: cleanDeadline,
        });
      }
      router.back();
    } catch (err: any) {
      Alert.alert(
        'Erro ao salvar',
        err?.message ?? 'Não foi possível salvar a meta.'
      );
    }
  };

  const handleDelete = () => {
    if (!params.id) return;
    Alert.alert(
      'Excluir Cofrinho',
      'Deseja excluir esta meta e todo o seu histórico de aportes?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await deleteMutation.mutateAsync(params.id!);
            router.replace('/(tabs)/more/goals');
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
          {isEditing ? 'Editar Meta' : 'Novo Cofrinho'}
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
          <Controller
            control={control}
            name="name"
            render={({ field: { value, onChange } }) => (
              <ClayInput
                label="Nome da Meta"
                placeholder="Ex.: Reserva de Emergência, Viagem..."
                value={value}
                onChangeText={onChange}
                errorMessage={errors.name?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="target_cents"
            render={({ field: { value, onChange } }) => (
              <ClayInput
                label="Valor-Alvo (R$)"
                isCurrency
                valueCents={value}
                onChangeCents={onChange}
                errorMessage={errors.target_cents?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="deadline"
            render={({ field: { value, onChange } }) => (
              <ClayInput
                label="Prazo Opcional (AAAA-MM-DD)"
                placeholder="Ex.: 2027-12-31 (ou deixe em branco)"
                value={value ?? ''}
                onChangeText={onChange}
                leftIcon={
                  <Calendar size={18} color={theme.colors.textSecondary} />
                }
                errorMessage={errors.deadline?.message}
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
            Ícone do Cofrinho
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
                        ? theme.colors.primary
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
          title={isEditing ? 'Salvar Alterações' : 'Criar Cofrinho'}
          onPress={handleSubmit(onSubmit)}
          loading={
            isSubmitting ||
            createMutation.isPending ||
            updateMutation.isPending
          }
          disabled={isMutationPending}
          size="lg"
        />

        {isEditing ? (
          <ClayButton
            title="Excluir Cofrinho"
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
  sectionLabel: {
    marginTop: 6,
    marginBottom: 10,
    marginLeft: 4,
    fontWeight: '600',
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
