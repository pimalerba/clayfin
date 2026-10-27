import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  FileText,
  FileSpreadsheet,
  Share2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { useAppTheme } from '@/theme';
import { useCategories } from '@/hooks/useCategories';
import { useExportData } from '@/hooks/useExportData';
import { useWindowClass } from '@/hooks/useWindowClass';
import {
  ClayButton,
  ClayCard,
  ClayChip,
  ClayModal,
  NativeDateField,
} from '@/components/ui';
import { MonthSelector } from '@/components/MonthSelector';
import { ExportPeriodType } from '@/repositories/ExportRepository';
import { getCurrentMonthISO, getTodayISO } from '@/utils/date';

export type ExportType = 'transactions' | 'monthly_report';
export type ExportReportFormat = 'csv' | 'pdf';

export interface ExportModalProps {
  visible: boolean;
  onClose: () => void;
  defaultMonth?: string;
  initialType?: ExportType;
}

export function ExportModal({
  visible,
  onClose,
  defaultMonth,
  initialType = 'monthly_report',
}: ExportModalProps) {
  const theme = useAppTheme();
  const { maxFormWidth } = useWindowClass();
  const { data: categories = [] } = useCategories();
  const {
    isExporting,
    exportTransactionsCsv,
    exportMonthlyReportCsv,
    exportMonthlyReportPdf,
  } = useExportData();

  const [exportType, setExportType] = useState<ExportType>(initialType);
  const [reportFormat, setReportFormat] = useState<ExportReportFormat>('pdf');
  const [selectedMonth, setSelectedMonth] = useState<string>(
    defaultMonth ?? getCurrentMonthISO()
  );

  // Filtros de transações
  const [periodType, setPeriodType] = useState<ExportPeriodType>('current_month');
  const [startDate, setStartDate] = useState<string>(getTodayISO());
  const [endDate, setEndDate] = useState<string>(getTodayISO());
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const handleExport = async () => {
    if (exportType === 'transactions') {
      const res = await exportTransactionsCsv({
        periodType,
        specificMonth: selectedMonth,
        startDate: periodType === 'custom_range' ? startDate : undefined,
        endDate: periodType === 'custom_range' ? endDate : undefined,
        type: filterType,
        categoryId: selectedCategoryId,
      });
      if (res) {
        onClose();
      }
    } else {
      if (reportFormat === 'pdf') {
        const res = await exportMonthlyReportPdf(selectedMonth);
        if (res) {
          onClose();
        }
      } else {
        const res = await exportMonthlyReportCsv(selectedMonth);
        if (res) {
          onClose();
        }
      }
    }
  };

  return (
    <ClayModal
      visible={visible}
      onClose={onClose}
      title="Exportar Dados"
      subtitle="Compartilhe seus registros em planilhas ou PDF."
      footer={
        <View style={styles.footerContainer}>
          <ClayButton
            title={isExporting ? 'Gerando arquivo...' : 'Gerar e Compartilhar'}
            icon={<Share2 size={18} color="#FFFFFF" />}
            onPress={handleExport}
            loading={isExporting}
            disabled={isExporting}
            size="lg"
          />
        </View>
      }
    >
      <View
        style={[
          styles.container,
          maxFormWidth ? { maxWidth: maxFormWidth, alignSelf: 'center', width: '100%' } : null,
        ]}
      >
        {/* 1. Escolha do Tipo de Exportação */}
        <Text style={[theme.typography.caption, styles.sectionHeader, { color: theme.colors.textSecondary }]}>
          O QUE VOCÊ DESEJA EXPORTAR?
        </Text>
        <View style={styles.chipRow}>
          <ClayChip
            label="Relatório Mensal"
            icon={<FileText size={16} color={exportType === 'monthly_report' ? '#FFFFFF' : theme.colors.textSecondary} />}
            selected={exportType === 'monthly_report'}
            onPress={() => setExportType('monthly_report')}
            style={styles.chipItem}
          />
          <ClayChip
            label="Planilha de Transações"
            icon={<FileSpreadsheet size={16} color={exportType === 'transactions' ? '#FFFFFF' : theme.colors.textSecondary} />}
            selected={exportType === 'transactions'}
            onPress={() => setExportType('transactions')}
            style={styles.chipItem}
          />
        </View>

        {/* 2. Opções do Relatório Mensal */}
        {exportType === 'monthly_report' ? (
          <>
            <Text style={[theme.typography.caption, styles.sectionHeader, { color: theme.colors.textSecondary }]}>
              FORMATO DO RELATÓRIO
            </Text>
            <View style={styles.chipRow}>
              <ClayChip
                label="Documento PDF"
                selected={reportFormat === 'pdf'}
                onPress={() => setReportFormat('pdf')}
                style={styles.chipItem}
              />
              <ClayChip
                label="Planilha CSV (Excel)"
                selected={reportFormat === 'csv'}
                onPress={() => setReportFormat('csv')}
                style={styles.chipItem}
              />
            </View>

            <Text style={[theme.typography.caption, styles.sectionHeader, { color: theme.colors.textSecondary }]}>
              MÊS DE REFERÊNCIA
            </Text>
            <MonthSelector
              selectedMonth={selectedMonth}
              onChangeMonth={setSelectedMonth}
            />
          </>
        ) : (
          /* 3. Opções da Planilha de Transações */
          <>
            <Text style={[theme.typography.caption, styles.sectionHeader, { color: theme.colors.textSecondary }]}>
              PERÍODO DAS TRANSAÇÕES
            </Text>
            <View style={styles.chipRowWrap}>
              <ClayChip
                label="Mês Atual"
                selected={periodType === 'current_month'}
                onPress={() => setPeriodType('current_month')}
              />
              <ClayChip
                label="Mês Específico"
                selected={periodType === 'specific_month'}
                onPress={() => setPeriodType('specific_month')}
              />
              <ClayChip
                label="Intervalo"
                selected={periodType === 'custom_range'}
                onPress={() => setPeriodType('custom_range')}
              />
              <ClayChip
                label="Todas as Transações"
                selected={periodType === 'all'}
                onPress={() => setPeriodType('all')}
              />
            </View>

            {periodType === 'specific_month' ? (
              <View style={{ marginTop: 8 }}>
                <MonthSelector
                  selectedMonth={selectedMonth}
                  onChangeMonth={setSelectedMonth}
                />
              </View>
            ) : null}

            {periodType === 'custom_range' ? (
              <View style={styles.rangeInputsRow}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <NativeDateField
                    label="Data Inicial"
                    value={startDate}
                    onChange={setStartDate}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <NativeDateField
                    label="Data Final"
                    value={endDate}
                    onChange={setEndDate}
                  />
                </View>
              </View>
            ) : null}

            {/* Filtros avançados opcionais */}
            <Pressable
              onPress={() => setShowAdvancedFilters((prev) => !prev)}
              style={styles.advancedToggleBtn}
              accessibilityRole="button"
            >
              <Text style={[theme.typography.caption, { color: theme.colors.primary }]}>
                {showAdvancedFilters ? 'Ocultar filtros de tipo e categoria' : 'Filtros adicionais (Tipo / Categoria)'}
              </Text>
              {showAdvancedFilters ? (
                <ChevronUp size={16} color={theme.colors.primary} />
              ) : (
                <ChevronDown size={16} color={theme.colors.primary} />
              )}
            </Pressable>

            {showAdvancedFilters ? (
              <ClayCard variant="subtle" radius="md" padding={12} style={styles.advancedCard}>
                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginBottom: 8 }]}>
                  TIPO DE TRANSAÇÃO:
                </Text>
                <View style={styles.chipRowWrap}>
                  <ClayChip
                    label="Todos"
                    selected={filterType === 'all'}
                    onPress={() => setFilterType('all')}
                  />
                  <ClayChip
                    label="Receitas"
                    selected={filterType === 'income'}
                    accentColor={theme.colors.income}
                    onPress={() => setFilterType('income')}
                  />
                  <ClayChip
                    label="Despesas"
                    selected={filterType === 'expense'}
                    accentColor={theme.colors.expense}
                    onPress={() => setFilterType('expense')}
                  />
                </View>

                {categories.length > 0 ? (
                  <>
                    <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 12, marginBottom: 8 }]}>
                      FILTRAR POR CATEGORIA:
                    </Text>
                    <View style={styles.chipRowWrap}>
                      <ClayChip
                        label="Todas as categorias"
                        selected={selectedCategoryId === null}
                        onPress={() => setSelectedCategoryId(null)}
                      />
                      {categories.map((cat) => (
                        <ClayChip
                          key={cat.id}
                          label={cat.name}
                          selected={selectedCategoryId === cat.id}
                          accentColor={cat.color}
                          onPress={() => setSelectedCategoryId(cat.id)}
                        />
                      ))}
                    </View>
                  </>
                ) : null}
              </ClayCard>
            ) : null}
          </>
        )}

        {/* 4. Aviso de Privacidade e Segurança */}
        <ClayCard variant="subtle" radius="md" padding={12} style={styles.warningBanner}>
          <View style={styles.warningRow}>
            <AlertTriangle size={20} color={theme.colors.warning} style={{ marginRight: 10 }} />
            <Text style={[theme.typography.bodySmall, { color: theme.colors.textSecondary, flex: 1 }]}>
              O arquivo gerado não é criptografado e contém dados financeiros confidenciais. Compartilhe apenas com pessoas ou serviços de sua confiança.
            </Text>
          </View>
        </ClayCard>
      </View>
    </ClayModal>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 8,
  },
  sectionHeader: {
    marginTop: 12,
    marginBottom: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  chipRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  chipItem: {
    flex: 1,
  },
  rangeInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  advancedToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    marginTop: 6,
  },
  advancedCard: {
    marginTop: 6,
    marginBottom: 10,
  },
  warningBanner: {
    marginTop: 16,
    marginBottom: 6,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  footerContainer: {
    width: '100%',
  },
});
