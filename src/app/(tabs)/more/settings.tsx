import React from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import {
  ArrowLeft,
  Download,
  FolderKanban,
  Moon,
  Plus,
  ShieldCheck,
  Smartphone,
  Sun,
  Trash2,
  Upload,
} from 'lucide-react-native';
import { useAppTheme, useThemePreference } from '@/theme';
import {
  useCategories,
  useClearAllData,
  useExportBackup,
  useImportBackup,
  useLiquidGlass,
  useWindowClass,
} from '@/hooks';
import {
  ClayButton,
  ClayCard,
  ClayChip,
  GlassContainer,
  GlassSurface,
} from '@/components/ui';
import { DynamicIcon } from '@/utils/icons';
import {
  validateBackupFileSize,
  validateBackupPayload,
} from '@/utils/backup';
import { getTodayISO } from '@/utils/date';

export default function SettingsScreen() {
  const theme = useAppTheme();
  const { preference, setPreference } = useThemePreference();
  const isLiquidGlass = useLiquidGlass();
  const { maxContentWidth } = useWindowClass();
  const { data: categories = [] } = useCategories();
  const exportMutation = useExportBackup();
  const importMutation = useImportBackup();
  const clearAllMutation = useClearAllData();
  const isExecuting =
    exportMutation.isPending ||
    importMutation.isPending ||
    clearAllMutation.isPending;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/more');
    }
  };

  const handleExportBackup = async () => {
    try {
      const payload = await exportMutation.mutateAsync();
      const jsonContent = JSON.stringify(payload, null, 2);
      const filename = `clayfin-backup-${getTodayISO()}.json`;

      if (Platform.OS === 'web') {
        Alert.alert('Backup Gerado', jsonContent.slice(0, 400) + '...');
        return;
      }

      const backupFile = new File(Paths.cache, filename);
      if (backupFile.exists) {
        backupFile.delete();
      }
      backupFile.create();
      await backupFile.write(jsonContent);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(backupFile.uri, {
          mimeType: 'application/json',
          dialogTitle: 'Exportar Backup do Clayfin',
        });
      } else {
        Alert.alert('Backup salvo', `Arquivo salvo em: ${backupFile.uri}`);
      }
    } catch (err: any) {
      Alert.alert(
        'Erro ao exportar backup',
        err?.message ?? 'Não foi possível gerar o arquivo de backup.'
      );
    }
  };

  const handleImportBackup = async () => {
    try {
      const pickerResult = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/json', '*/*'],
        copyToCacheDirectory: true,
      });

      if (pickerResult.canceled || !pickerResult.assets?.[0]) {
        return;
      }

      const asset = pickerResult.assets[0];
      const selectedFile = new File(asset.uri);

      if (!selectedFile.exists) {
        Alert.alert('Erro', 'Arquivo selecionado não pôde ser lido.');
        return;
      }

      const fileSizeValidation = validateBackupFileSize(selectedFile.size ?? 0);
      if (!fileSizeValidation.valid) {
        Alert.alert('Arquivo Inválido', fileSizeValidation.error);
        return;
      }

      const fileText = await selectedFile.text();
      let rawJson: unknown;
      try {
        rawJson = JSON.parse(fileText);
      } catch {
        Alert.alert('Arquivo Inválido', 'O arquivo selecionado não contém um JSON válido.');
        return;
      }

      const payloadValidation = validateBackupPayload(rawJson);
      if (!payloadValidation.valid || !payloadValidation.payload) {
        Alert.alert('Arquivo Inválido', payloadValidation.error);
        return;
      }

      const backupData = payloadValidation.payload.data;
      const totalItems =
        backupData.transactions.length +
        backupData.categories.length +
        backupData.budgets.length +
        backupData.goals.length +
        (backupData.recurring_rules?.length ?? 0);

      Alert.alert(
        'Confirmar Restauração',
        `Deseja restaurar este backup (Versão ${payloadValidation.payload.version}) contendo:\n• ${backupData.categories.length} categorias\n• ${backupData.transactions.length} transações\n• ${backupData.budgets.length} orçamentos\n• ${backupData.goals.length} metas\n${backupData.recurring_rules ? `• ${backupData.recurring_rules.length} regras recorrentes\n` : ''}\nATENÇÃO: Todos os dados atuais deste dispositivo serão substituídos.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Substituir e Restaurar',
            style: 'destructive',
            onPress: async () => {
              try {
                await importMutation.mutateAsync(payloadValidation.payload!);
                Alert.alert(
                  'Backup Restaurado',
                  `${totalItems} itens importados com sucesso!`
                );
              } catch (importErr: any) {
                Alert.alert(
                  'Falha na importação',
                  importErr?.message ??
                    'Não foi possível restaurar os dados do backup.'
                );
              }
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert(
        'Erro ao importar',
        err?.message ?? 'Não foi possível ler o arquivo selecionado.'
      );
    }
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Apagar Todos os Dados (1/2)',
      'Tem certeza que deseja apagar todas as transações, orçamentos, metas e categorias personalizadas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, continuar',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirmação Final (2/2)',
              'Esta ação é irreversível e os dados existem apenas neste aparelho. Recomendamos exportar um backup antes. Apagar tudo agora?',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Apagar Tudo Permanentemente',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await clearAllMutation.mutateAsync();
                      Alert.alert(
                        'Dados Apagados',
                        'O aplicativo foi restaurado para o estado inicial.'
                      );
                    } catch (clearErr: any) {
                      Alert.alert(
                        'Erro ao apagar dados',
                        clearErr?.message ??
                          'Não foi possível apagar os dados do dispositivo. Tente novamente.'
                      );
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView
      edges={Platform.OS === 'ios' ? ['top', 'left', 'right'] : ['top']}
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          maxContentWidth
            ? {
                maxWidth: maxContentWidth,
                width: '100%',
                alignSelf: 'center',
              }
            : null,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          {isLiquidGlass ? (
            <GlassContainer spacing={8}>
              <Pressable
                onPress={handleBack}
                accessibilityRole="button"
                accessibilityLabel="Voltar para Mais"
              >
                <GlassSurface
                  interactive
                  tintColor={theme.isDark ? 'rgba(157, 133, 242, 0.20)' : 'rgba(122, 90, 248, 0.16)'}
                  borderRadius={14}
                  style={styles.backBtn}
                >
                  <ArrowLeft size={20} color={theme.colors.textPrimary} strokeWidth={2.4} />
                </GlassSurface>
              </Pressable>
            </GlassContainer>
          ) : (
            <Pressable
              onPress={handleBack}
              accessibilityRole="button"
              accessibilityLabel="Voltar para Mais"
              style={[
                styles.backBtn,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <ArrowLeft size={20} color={theme.colors.textPrimary} />
            </Pressable>
          )}
          <Text
            style={[theme.typography.h1, { color: theme.colors.textPrimary }]}
          >
            Configurações
          </Text>
        </View>

        <ClayCard variant="subtle" radius="xl" style={styles.privacyBanner}>
          <View style={styles.privacyRow}>
            <View
              style={[
                styles.shieldCircle,
                { backgroundColor: theme.colors.primaryLight },
              ]}
            >
              <ShieldCheck size={22} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  theme.typography.h3,
                  { color: theme.colors.textPrimary },
                ]}
              >
                100% Offline e Privado
              </Text>
              <Text
                style={[
                  theme.typography.bodySmall,
                  { color: theme.colors.textSecondary, marginTop: 2 },
                ]}
              >
                Seus dados ficam salvos exclusivamente no SQLite deste aparelho.
                Exporte um backup regularmente!
              </Text>
            </View>
          </View>
        </ClayCard>

        <ClayCard radius="xl" style={styles.sectionCard}>
          <Text
            style={[
              theme.typography.h3,
              { color: theme.colors.textPrimary, marginBottom: 4 },
            ]}
          >
            Aparência
          </Text>
          <Text
            style={[
              theme.typography.bodySmall,
              { color: theme.colors.textSecondary, marginBottom: 14 },
            ]}
          >
            Escolha o tema do aplicativo ou acompanhe as configurações do seu aparelho.
          </Text>

          <View style={styles.appearanceRow}>
            <ClayChip
              label="Automático"
              icon={
                <Smartphone
                  size={16}
                  color={preference === 'auto' ? '#FFFFFF' : theme.colors.textSecondary}
                />
              }
              selected={preference === 'auto'}
              onPress={() => setPreference('auto')}
              style={styles.appearanceChip}
            />
            <ClayChip
              label="Claro"
              icon={
                <Sun
                  size={16}
                  color={preference === 'light' ? '#FFFFFF' : theme.colors.textSecondary}
                />
              }
              selected={preference === 'light'}
              onPress={() => setPreference('light')}
              style={styles.appearanceChip}
            />
            <ClayChip
              label="Escuro"
              icon={
                <Moon
                  size={16}
                  color={preference === 'dark' ? '#FFFFFF' : theme.colors.textSecondary}
                />
              }
              selected={preference === 'dark'}
              onPress={() => setPreference('dark')}
              style={styles.appearanceChip}
            />
          </View>
        </ClayCard>

        <ClayCard radius="xl" style={styles.sectionCard}>
          <Text
            style={[
              theme.typography.h3,
              { color: theme.colors.textPrimary, marginBottom: 4 },
            ]}
          >
            Backup Manual (JSON)
          </Text>
          <Text
            style={[
              theme.typography.bodySmall,
              { color: theme.colors.textSecondary, marginBottom: 14 },
            ]}
          >
            Exporte seus dados para guardar na nuvem ou importe de outro
            dispositivo.
          </Text>

          <View style={styles.backupBtns}>
            <ClayButton
              title="Exportar Backup"
              onPress={handleExportBackup}
              disabled={isExecuting}
              loading={exportMutation.isPending}
              icon={<Download size={18} color="#FFFFFF" />}
              style={{ marginBottom: 10 }}
            />
            <ClayButton
              title="Importar de Arquivo JSON"
              variant="secondary"
              onPress={handleImportBackup}
              disabled={isExecuting}
              loading={importMutation.isPending}
              icon={<Upload size={18} color={theme.colors.textPrimary} />}
            />
          </View>
        </ClayCard>

        <ClayCard radius="xl" style={styles.sectionCard}>
          <View style={styles.catHeader}>
            <View style={styles.catTitleRow}>
              <FolderKanban size={20} color={theme.colors.primary} />
              <Text
                style={[
                  theme.typography.h3,
                  { color: theme.colors.textPrimary, marginLeft: 8 },
                ]}
              >
                Categorias ({categories.length})
              </Text>
            </View>
            <ClayButton
              title="Nova"
              size="sm"
              disabled={isExecuting}
              icon={<Plus size={16} color="#FFFFFF" />}
              onPress={() => router.push('/category-form')}
            />
          </View>

          <View style={styles.categoriesList}>
            {categories.map((cat) => (
              <ClayCard
                key={cat.id}
                variant="subtle"
                radius="md"
                padding={12}
                onPress={() => {
                  if (isExecuting) return;
                  router.push({
                    pathname: '/category-form',
                    params: { id: cat.id },
                  });
                }}
                style={styles.categoryItem}
              >
                <View style={styles.categoryItemRow}>
                  <View
                    style={[
                      styles.catBadge,
                      { backgroundColor: `${cat.color}24` },
                    ]}
                  >
                    <DynamicIcon name={cat.icon} size={18} color={cat.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        theme.typography.body,
                        {
                          color: theme.colors.textPrimary,
                          fontFamily: theme.fontFamilies.bold,
                        },
                      ]}
                    >
                      {cat.name}
                    </Text>
                    <Text
                      style={[
                        theme.typography.caption,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {cat.type === 'income' ? 'Receita' : 'Despesa'}
                      {cat.is_default ? ' • Padrão' : ' • Personalizada'}
                    </Text>
                  </View>
                </View>
              </ClayCard>
            ))}
          </View>
        </ClayCard>

        <ClayCard radius="xl" style={styles.sectionCard}>
          <Text
            style={[
              theme.typography.h3,
              { color: theme.colors.expense, marginBottom: 4 },
            ]}
          >
            Zona de Perigo
          </Text>
          <Text
            style={[
              theme.typography.bodySmall,
              { color: theme.colors.textSecondary, marginBottom: 14 },
            ]}
          >
            Apaga todas as movimentações, metas e orçamentos salvos neste
            dispositivo.
          </Text>
          <ClayButton
            title="Apagar Todos os Dados"
            variant="danger"
            icon={<Trash2 size={18} color="#FFFFFF" />}
            onPress={handleClearAllData}
            disabled={isExecuting}
            loading={clearAllMutation.isPending}
          />
        </ClayCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 110,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    marginBottom: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyBanner: {
    marginBottom: 16,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shieldCircle: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionCard: {
    marginBottom: 16,
  },
  appearanceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  appearanceChip: {
    flexGrow: 1,
  },
  backupBtns: {
    marginTop: 4,
  },
  catHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  catTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoriesList: {
    gap: 8,
  },
  categoryItem: {
    marginBottom: 2,
  },
  categoryItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catBadge: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
});
