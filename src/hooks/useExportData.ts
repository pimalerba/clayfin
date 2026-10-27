import { useState, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { File, Paths } from 'expo-file-system';
import { format } from 'date-fns';
import {
  ExportFilterOptions,
  ExportRepository,
} from '@/repositories/ExportRepository';
import {
  buildMonthlyReportCsv,
  buildTransactionsCsv,
} from '@/utils/exportCsv';
import { generateReportHtml } from '@/utils/exportPdf';
import { getCurrentMonthISO } from '@/utils/date';

export function useExportData() {
  const [isExporting, setIsExporting] = useState(false);

  const exportTransactionsCsv = useCallback(
    async (filters: ExportFilterOptions) => {
      setIsExporting(true);
      try {
        const rows = await ExportRepository.getTransactionsForExport(filters);
        if (rows.length === 0) {
          Alert.alert(
            'Sem Transações',
            'Não foram encontradas transações no período selecionado.'
          );
          return null;
        }

        let filename = 'clayfin-transacoes-todas.csv';
        if (filters.periodType === 'current_month') {
          filename = `clayfin-transacoes-${getCurrentMonthISO()}.csv`;
        } else if (filters.periodType === 'specific_month' && filters.specificMonth) {
          filename = `clayfin-transacoes-${filters.specificMonth}.csv`;
        } else if (filters.periodType === 'custom_range') {
          const s = filters.startDate ?? 'inicio';
          const e = filters.endDate ?? 'fim';
          filename = `clayfin-transacoes-${s}-a-${e}.csv`;
        }

        const csvString = buildTransactionsCsv(rows);

        if (Platform.OS === 'web') {
          Alert.alert('CSV Gerado', csvString.slice(0, 500) + '...');
          return { count: rows.length, filename };
        }

        const tempFile = new File(Paths.cache, filename);
        if (tempFile.exists) {
          try {
            tempFile.delete();
          } catch {
            // Ignora falha de deleção prévia
          }
        }
        tempFile.create();
        await tempFile.write(csvString);

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(tempFile.uri, {
            mimeType: 'text/csv',
            dialogTitle: 'Exportar Transações - Clayfin',
            UTI: 'public.comma-separated-values-text',
          });
        } else {
          Alert.alert('Arquivo Pronto', `Arquivo salvo em: ${tempFile.uri}`);
        }

        return { count: rows.length, filename };
      } catch (err: any) {
        Alert.alert(
          'Erro ao exportar',
          err?.message ?? 'Não foi possível gerar a planilha CSV.'
        );
        return null;
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  const exportMonthlyReportCsv = useCallback(async (month: string) => {
    setIsExporting(true);
    try {
      const data = await ExportRepository.getMonthlyReportData(month);
      const filename = `clayfin-relatorio-${month}.csv`;
      const csvString = buildMonthlyReportCsv(data.summary);

      if (Platform.OS === 'web') {
        Alert.alert('Relatório CSV Gerado', csvString.slice(0, 500) + '...');
        return { filename };
      }

      const tempFile = new File(Paths.cache, filename);
      if (tempFile.exists) {
        try {
          tempFile.delete();
        } catch {
          // Ignora falha de deleção prévia
        }
      }
      tempFile.create();
      await tempFile.write(csvString);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(tempFile.uri, {
          mimeType: 'text/csv',
          dialogTitle: 'Exportar Relatório - Clayfin',
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        Alert.alert('Arquivo Pronto', `Arquivo salvo em: ${tempFile.uri}`);
      }

      return { filename };
    } catch (err: any) {
      Alert.alert(
        'Erro ao exportar relatório',
        err?.message ?? 'Não foi possível gerar o relatório CSV.'
      );
      return null;
    } finally {
      setIsExporting(false);
    }
  }, []);

  const exportMonthlyReportPdf = useCallback(async (month: string) => {
    setIsExporting(true);
    try {
      const data = await ExportRepository.getMonthlyReportData(month);
      const now = new Date();
      const generatedAtFormatted = format(now, 'dd/MM/yyyy HH:mm');

      const html = generateReportHtml({
        title: 'Relatório Financeiro',
        periodLabel: data.summary.monthLabel,
        generatedAtFormatted,
        summary: data.summary,
        transactions: data.transactions,
      });

      const { uri } = await Print.printToFileAsync({ html });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Exportar Relatório em PDF - Clayfin',
          UTI: '.pdf',
        });
      } else {
        Alert.alert('PDF Pronto', `Relatório gerado em: ${uri}`);
      }

      return { uri };
    } catch (err: any) {
      Alert.alert(
        'Erro ao gerar PDF',
        err?.message ?? 'Não foi possível compilar o relatório em PDF.'
      );
      return null;
    } finally {
      setIsExporting(false);
    }
  }, []);

  return {
    isExporting,
    exportTransactionsCsv,
    exportMonthlyReportCsv,
    exportMonthlyReportPdf,
  };
}
