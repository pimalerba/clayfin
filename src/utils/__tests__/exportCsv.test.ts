import {
  buildMonthlyReportCsv,
  buildTransactionsCsv,
  formatCentsToDecimal,
  formatDateIsoToPtBR,
  MonthlyReportExportData,
  sanitizeCsvCell,
  TransactionExportRow,
} from '../exportCsv';

describe('Exportação CSV para Excel Brasileiro (exportCsv)', () => {
  describe('sanitizeCsvCell e Proteção contra Injeção de Fórmulas', () => {
    it('escapa aspas duplas duplicando-as e envolvendo em aspas', () => {
      expect(sanitizeCsvCell('Café "Especial"')).toBe('"Café ""Especial"""');
    });

    it('envolve células com ponto e vírgula em aspas', () => {
      expect(sanitizeCsvCell('Mercado; Padaria')).toBe('"Mercado; Padaria"');
    });

    it('envolve células com quebra de linha em aspas', () => {
      expect(sanitizeCsvCell("Linha 1\nLinha 2")).toBe('"Linha 1\nLinha 2"');
    });

    it('neutraliza injeção de fórmulas com = prefixando com apóstrofo', () => {
      const sanitized = sanitizeCsvCell('=SUM(A1:A10)');
      expect(sanitized).toBe("\"'=SUM(A1:A10)\"");
    });

    it('neutraliza injeção de fórmulas com + prefixando com apóstrofo', () => {
      const sanitized = sanitizeCsvCell('+cmd|/c calc');
      expect(sanitized).toBe("\"'+cmd|/c calc\"");
    });

    it('neutraliza injeção de fórmulas com - prefixando com apóstrofo', () => {
      const sanitized = sanitizeCsvCell('-Desconto Promocional');
      expect(sanitized).toBe("\"'-Desconto Promocional\"");
    });

    it('neutraliza injeção de fórmulas com @ prefixando com apóstrofo', () => {
      const sanitized = sanitizeCsvCell('@username');
      expect(sanitized).toBe("\"'@username\"");
    });

    it('neutraliza caracteres perigosos precedidos por espaços ou tabs', () => {
      const sanitized = sanitizeCsvCell('   =1+1');
      expect(sanitized).toBe("\"'   =1+1\"");
    });

    it('trata valores nulos e indefinidos retornando aspas vazias', () => {
      expect(sanitizeCsvCell(null)).toBe('""');
      expect(sanitizeCsvCell(undefined)).toBe('""');
    });
  });

  describe('formatCentsToDecimal', () => {
    it('formata centavos com vírgula como separador decimal', () => {
      expect(formatCentsToDecimal(125050)).toBe('1250,50');
      expect(formatCentsToDecimal(99)).toBe('0,99');
      expect(formatCentsToDecimal(5)).toBe('0,05');
      expect(formatCentsToDecimal(0)).toBe('0,00');
    });

    it('formata valores negativos adequadamente', () => {
      expect(formatCentsToDecimal(-3500)).toBe('-35,00');
    });
  });

  describe('formatDateIsoToPtBR', () => {
    it('converte yyyy-MM-dd para dd/MM/yyyy', () => {
      expect(formatDateIsoToPtBR('2026-10-27')).toBe('27/10/2026');
      expect(formatDateIsoToPtBR('2026-01-05')).toBe('05/01/2026');
    });

    it('retorna valor original se não estiver no formato ISO esperado', () => {
      expect(formatDateIsoToPtBR('data-invalida')).toBe('data-invalida');
    });
  });

  describe('buildTransactionsCsv', () => {
    it('inicia com BOM UTF-8 (\\uFEFF) e cabeçalhos brasileiros com separador ;', () => {
      const csv = buildTransactionsCsv([]);
      expect(csv.charCodeAt(0)).toBe(0xfeff);
      expect(csv).toContain('"Data";"Tipo";"Categoria";"Descrição";"Valor (R$)"');
    });

    it('gera linhas formatadas com acentos e caracteres especiais', () => {
      const rows: TransactionExportRow[] = [
        {
          date: '2026-10-25',
          type: 'income',
          category_name: 'Salário & Bônus',
          description: 'Pagamento mensal; referente a Outubro',
          amount_cents: 650000,
        },
        {
          date: '2026-10-26',
          type: 'expense',
          category_name: 'Alimentação',
          description: '=2+2',
          amount_cents: 12550,
        },
      ];

      const csv = buildTransactionsCsv(rows);

      // Linha de receita
      expect(csv).toContain('"25/10/2026";"Receita";"Salário & Bônus";"Pagamento mensal; referente a Outubro";"6500,00"');
      // Linha com injeção de fórmula neutralizada
      expect(csv).toContain('"26/10/2026";"Despesa";"Alimentação";"\'=2+2";"125,50"');
    });

    it('suporta includeSign para exportar despesas com sinal negativo', () => {
      const rows: TransactionExportRow[] = [
        {
          date: '2026-10-26',
          type: 'expense',
          category_name: 'Transporte',
          description: 'Uber',
          amount_cents: 3500,
        },
      ];

      const csv = buildTransactionsCsv(rows, { includeSign: true });
      expect(csv).toContain('"Transporte";"Uber";"-35,00"');
    });
  });

  describe('buildMonthlyReportCsv', () => {
    it('gera relatório consolidado completo com todas as seções', () => {
      const reportData: MonthlyReportExportData = {
        month: '2026-10',
        monthLabel: 'Outubro de 2026',
        totalIncomeCents: 500000,
        totalExpenseCents: 350000,
        netBalanceCents: 150000,
        categories: [
          {
            name: 'Alimentação',
            type: 'expense',
            totalCents: 150000,
            percentage: 42.85,
          },
        ],
        budgets: [
          {
            categoryName: 'Alimentação',
            limitCents: 180000,
            spentCents: 150000,
            percentage: 83.33,
            status: 'warning',
          },
        ],
        goals: [
          {
            name: 'Viagem de Férias',
            targetCents: 800000,
            currentCents: 400000,
            percentage: 50,
            deadline: '2026-12-31',
          },
        ],
      };

      const csv = buildMonthlyReportCsv(reportData);

      expect(csv.charCodeAt(0)).toBe(0xfeff);
      expect(csv).toContain('RELATÓRIO MENSAL CLAYFIN - Outubro de 2026');
      expect(csv).toContain('"5000,00";"3500,00";"1500,00"');
      expect(csv).toContain('DESPESAS POR CATEGORIA');
      expect(csv).toContain('"Alimentação";"1500,00";"42,9%"');
      expect(csv).toContain('ORÇAMENTOS POR CATEGORIA');
      expect(csv).toContain('"Alimentação";"1800,00";"1500,00";"83,3%";"Alerta"');
      expect(csv).toContain('METAS FINANCEIRAS');
      expect(csv).toContain('"Viagem de Férias";"8000,00";"4000,00";"50,0%";"31/12/2026"');
    });

    it('lida com listas vazias de forma amigável no relatório', () => {
      const emptyReport: MonthlyReportExportData = {
        month: '2026-10',
        monthLabel: 'Outubro de 2026',
        totalIncomeCents: 0,
        totalExpenseCents: 0,
        netBalanceCents: 0,
        categories: [],
        budgets: [],
        goals: [],
      };

      const csv = buildMonthlyReportCsv(emptyReport);
      expect(csv).toContain('Nenhuma despesa registrada');
      expect(csv).toContain('Nenhum orçamento configurado');
      expect(csv).toContain('Nenhuma meta criada');
    });
  });
});
