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
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react-native';
import { useAppTheme } from '@/theme';
import {
  useCategories,
  useClearAllData,
  useExportBackup,
  useImportBackup,
  useLiquidGlass,
} from '@/hooks';
import {
  ClayButton,
  ClayCard,
  GlassContainer,
  GlassSurface,
} from '@/components/ui';
import { DynamicIcon } from '@/utils/icons';
import { validateBackupPayload } from '@/utils/backup';
import { getTodayISO } from '@/utils/date';

export default function SettingsScreen() {
  const theme = useAppTheme();
  const isLiquidGlass = useLiquidGlass();
  const { data: categories = [] } = useCategories();
  const exportMutation = useExportBackup();
  const importMutation = useImportBackup();
  const clearAllMutation = useClearAllData();

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
      const picked = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/plain', '*/*'],
        copyToCacheDirectory: true,
      });

      if (picked.canceled || !picked.assets || picked.assets.length === 0) {
        return;
      }

      const asset = picked.assets[0];
      const pickedFile = new File(asset.uri);
      const rawText = await pickedFile.text();

      const validation = validateBackupPayload(rawText);
      if (!validation.valid || !validation.payload) {
        Alert.alert(
          'Arquivo de Backup Inválido',
          validation.error ?? 'O arquivo selecionado não é válido.'
        );
        return;
      }

      const { categories: cats, transactions: txs, goals } =
        validation.payload.data;

      Alert.alert(
        'Confirmar Restauração de Backup',
        `O backup contém ${cats.length} categorias, ${txs.length} transações e ${goals.length} metas.\n\nIsso substituirá TODOS os dados atuais do dispositivo. Deseja continuar?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Sobrescrever e Importar',
            style: 'destructive',
            onPress: async () => {
              await importMutation.mutateAsync(validation.payload!);
              Alert.alert(
                'Backup Restaurado!',
                'Todos os seus dados foram importados com sucesso.'
              );
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
                    await clearAllMutation.mutateAsync();
                    Alert.alert(
                      'Dados Apagados',
                      'O aplicativo foi restaurado para o estado inicial.'
                    );
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
      edges={['top']}
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
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
                  tintColor="rgba(122, 90, 248, 0.16)"
                  borderRadius={14}
                  style={styles.backBtn}
                >
                  <ArrowLeft size={20} color="#1E1633" strokeWidth={2.4} />
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
              loading={exportMutation.isPending}
              icon={<Download size={18} color="#FFFFFF" />}
              style={{ marginBottom: 10 }}
            />
            <ClayButton
              title="Importar de Arquivo JSON"
              variant="secondary"
              onPress={handleImportBackup}
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
                onPress={() =>
                  router.push({
                    pathname: '/category-form',
                    params: { id: cat.id },
                  })
                }
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
              { color: theme.colors.expenseDark, marginBottom: 4 },
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
