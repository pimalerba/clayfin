import { escapeHtml, generateReportHtml, PdfReportInput } from '../exportPdf';

describe('Geração de Relatório PDF/HTML (exportPdf)', () => {
  describe('escapeHtml', () => {
    it('escapa caracteres especiais de HTML corretamente', () => {
      expect(escapeHtml('A & B')).toBe('A &amp; B');
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
      expect(escapeHtml("João's")).toBe('João&#039;s');
    });

    it('trata valores nulos ou vazios', () => {
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
      expect(escapeHtml('')).toBe('');
    });
  });

  describe('generateReportHtml', () => {
    it('gera documento HTML completo para impressão com valores formatados e escape', () => {
      const input: PdfReportInput = {
        title: 'Relatório Mensal',
        periodLabel: 'Outubro de 2026',
        generatedAtFormatted: '27/10/2026 17:30',
        summary: {
          month: '2026-10',
          monthLabel: 'Outubro de 2026',
          totalIncomeCents: 500000,
          totalExpenseCents: 300000,
          netBalanceCents: 200000,
          categories: [
            {
              name: '<Mercado & Padaria>',
              type: 'expense',
              totalCents: 120000,
              percentage: 40,
            },
          ],
          budgets: [
            {
              categoryName: 'Alimentação',
              limitCents: 150000,
              spentCents: 120000,
              percentage: 80,
              status: 'warning',
            },
          ],
          goals: [
            {
              name: 'Reserva "Emergência"',
              targetCents: 1000000,
              currentCents: 500000,
              percentage: 50,
            },
          ],
        },
        transactions: [
          {
            date: '2026-10-15',
            type: 'expense',
            category_name: 'Alimentação',
            description: 'Compras no Carrefour "Online"',
            amount_cents: 120000,
          },
        ],
      };

      const html = generateReportHtml(input);

      // Metadados e título
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Clayfin');
      expect(html).toContain('Relatório Mensal — Outubro de 2026');
      expect(html).toContain('27/10/2026 17:30');

      // Escaping aplicado nos nomes das categorias e metas
      expect(html).toContain('&lt;Mercado &amp; Padaria&gt;');
      expect(html).toContain('Reserva &quot;Emergência&quot;');
      expect(html).toContain('Compras no Carrefour &quot;Online&quot;');

      // Não contém tags de script não escapadas
      expect(html).not.toContain('<Mercado');

      // Contém valores monetários
      expect(html).toContain('5.000,00');
      expect(html).toContain('3.000,00');
      expect(html).toContain('2.000,00');

      // Estilo para impressão (fundo branco, -webkit-print-color-adjust)
      expect(html).toContain('background-color: #FFFFFF');
      expect(html).toContain('-webkit-print-color-adjust: exact');
    });
  });
});
