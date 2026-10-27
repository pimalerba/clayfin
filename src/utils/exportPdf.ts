import { formatCentsToBRL } from './currency';
import { formatDateIsoToPtBR, formatCentsToDecimal, MonthlyReportExportData, TransactionExportRow } from './exportCsv';

/**
 * Escapa caracteres especiais para evitar XSS e quebra de marcação HTML.
 */
export function escapeHtml(str: string | number | null | undefined): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export interface PdfReportInput {
  title: string;
  periodLabel: string;
  generatedAtFormatted: string;
  summary: MonthlyReportExportData;
  transactions?: TransactionExportRow[];
}

/**
 * Gera o documento HTML estruturado para impressão em PDF.
 * Mantém layout claro (otimizado para impressão econômica em papel), tipografia limpa
 * e elementos visuais no estilo Clayfin.
 */
export function generateReportHtml(input: PdfReportInput): string {
  const { title, periodLabel, generatedAtFormatted, summary, transactions = [] } = input;

  const netBalanceClass = summary.netBalanceCents >= 0 ? 'color-income' : 'color-expense';

  const categoryRows = summary.categories
    .filter((c) => c.type === 'expense')
    .map(
      (cat) => `
      <tr>
        <td><strong>${escapeHtml(cat.name)}</strong></td>
        <td class="text-right">${escapeHtml(formatCentsToBRL(cat.totalCents))}</td>
        <td class="text-right">${escapeHtml(cat.percentage.toFixed(1))}%</td>
        <td style="width: 140px;">
          <div class="progress-bar">
            <div class="progress-fill fill-primary" style="width: ${Math.min(100, Math.max(0, cat.percentage))}%;"></div>
          </div>
        </td>
      </tr>
    `
    )
    .join('');

  const budgetRows = summary.budgets
    .map((b) => {
      const badgeClass =
        b.status === 'exceeded'
          ? 'badge-danger'
          : b.status === 'warning'
          ? 'badge-warning'
          : 'badge-normal';
      const badgeText =
        b.status === 'exceeded'
          ? 'Excedido'
          : b.status === 'warning'
          ? 'Alerta'
          : 'Normal';

      return `
      <tr>
        <td><strong>${escapeHtml(b.categoryName)}</strong></td>
        <td class="text-right">${escapeHtml(formatCentsToBRL(b.limitCents))}</td>
        <td class="text-right">${escapeHtml(formatCentsToBRL(b.spentCents))}</td>
        <td class="text-center"><span class="badge ${badgeClass}">${badgeText} (${escapeHtml(
        b.percentage.toFixed(0)
      )}%)</span></td>
      </tr>
    `;
    })
    .join('');

  const goalRows = summary.goals
    .map(
      (g) => `
      <tr>
        <td><strong>${escapeHtml(g.name)}</strong></td>
        <td class="text-right">${escapeHtml(formatCentsToBRL(g.targetCents))}</td>
        <td class="text-right">${escapeHtml(formatCentsToBRL(g.currentCents))}</td>
        <td class="text-right">${escapeHtml(g.percentage.toFixed(0))}%</td>
        <td style="width: 130px;">
          <div class="progress-bar">
            <div class="progress-fill fill-income" style="width: ${Math.min(100, Math.max(0, g.percentage))}%;"></div>
          </div>
        </td>
      </tr>
    `
    )
    .join('');

  const transactionRows = transactions
    .map((t) => {
      const isIncome = t.type === 'income';
      const typeLabel = isIncome ? 'Receita' : 'Despesa';
      const typeClass = isIncome ? 'color-income' : 'color-expense';
      const sign = isIncome ? '+' : '-';

      return `
      <tr>
        <td>${escapeHtml(formatDateIsoToPtBR(t.date))}</td>
        <td><span class="type-pill ${isIncome ? 'pill-income' : 'pill-expense'}">${typeLabel}</span></td>
        <td>${escapeHtml(t.category_name)}</td>
        <td>${escapeHtml(t.description || '-')}</td>
        <td class="text-right ${typeClass}"><strong>${sign} ${escapeHtml(formatCentsToBRL(t.amount_cents))}</strong></td>
      </tr>
    `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 14mm 18mm 14mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #2D264B;
      background-color: #FFFFFF;
      margin: 0;
      padding: 0;
      font-size: 12px;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #EAE5F5;
      padding-bottom: 14px;
      margin-bottom: 20px;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 800;
      color: #7E61E3;
      margin: 0 0 4px 0;
    }
    .report-subtitle {
      font-size: 14px;
      color: #5C537E;
      margin: 0;
      font-weight: 600;
    }
    .header-meta {
      text-align: right;
      font-size: 11px;
      color: #7C73A0;
    }
    .kpi-grid {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
    }
    .kpi-card {
      flex: 1;
      background: #FBF9FF;
      border: 1px solid #E4DEFA;
      border-radius: 12px;
      padding: 12px 14px;
      box-shadow: 0 2px 5px rgba(92, 73, 158, 0.05);
    }
    .kpi-label {
      font-size: 11px;
      font-weight: 700;
      color: #7C73A0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .kpi-value {
      font-size: 20px;
      font-weight: 800;
      margin: 0;
    }
    .color-income { color: #208557; }
    .color-expense { color: #D33829; }
    .color-primary { color: #7E61E3; }
    
    .section-title {
      font-size: 14px;
      font-weight: 800;
      color: #2D264B;
      margin: 22px 0 10px 0;
      padding-bottom: 4px;
      border-bottom: 1.5px solid #EAE5F5;
      display: flex;
      justify-content: space-between;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 11.5px;
    }
    th {
      background-color: #F3EFFC;
      color: #5C537E;
      font-weight: 700;
      text-align: left;
      padding: 7px 10px;
      border-top: 1px solid #E4DEFA;
      border-bottom: 1px solid #E4DEFA;
    }
    td {
      padding: 7px 10px;
      border-bottom: 1px solid #F0ECF8;
      color: #2D264B;
    }
    tr:nth-child(even) td {
      background-color: #FAF8FE;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    
    .progress-bar {
      height: 8px;
      background-color: #EAE5F5;
      border-radius: 4px;
      overflow: hidden;
      width: 100%;
    }
    .progress-fill {
      height: 100%;
      border-radius: 4px;
    }
    .fill-primary { background-color: #7E61E3; }
    .fill-income { background-color: #208557; }
    
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 700;
    }
    .badge-normal { background: #D9F6E8; color: #176342; }
    .badge-warning { background: #FFF0DF; color: #8A4106; }
    .badge-danger { background: #FFE2DF; color: #A62215; }

    .type-pill {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 6px;
      font-size: 9.5px;
      font-weight: 700;
    }
    .pill-income { background: #D9F6E8; color: #176342; }
    .pill-expense { background: #FFE2DF; color: #A62215; }

    .footer {
      margin-top: 30px;
      padding-top: 10px;
      border-top: 1px solid #EAE5F5;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #A199BE;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="brand-title">Clayfin</h1>
      <p class="report-subtitle">${escapeHtml(title)} — ${escapeHtml(periodLabel)}</p>
    </div>
    <div class="header-meta">
      <div><strong>Emissão:</strong> ${escapeHtml(generatedAtFormatted)}</div>
      <div>100% Offline e Privado</div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Total de Receitas</div>
      <p class="kpi-value color-income">+ ${escapeHtml(formatCentsToBRL(summary.totalIncomeCents))}</p>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Total de Despesas</div>
      <p class="kpi-value color-expense">- ${escapeHtml(formatCentsToBRL(summary.totalExpenseCents))}</p>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Saldo do Período</div>
      <p class="kpi-value ${netBalanceClass}">${escapeHtml(formatCentsToBRL(summary.netBalanceCents))}</p>
    </div>
  </div>

  ${
    summary.categories.filter((c) => c.type === 'expense').length > 0
      ? `
      <div class="section-title">
        <span>Despesas por Categoria</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Categoria</th>
            <th class="text-right">Total</th>
            <th class="text-right">Part. (%)</th>
            <th>Distribuição</th>
          </tr>
        </thead>
        <tbody>
          ${categoryRows}
        </tbody>
      </table>
    `
      : ''
  }

  ${
    summary.budgets.length > 0
      ? `
      <div class="section-title">
        <span>Orçamentos e Limites</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Categoria</th>
            <th class="text-right">Limite</th>
            <th class="text-right">Gasto</th>
            <th class="text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          ${budgetRows}
        </tbody>
      </table>
    `
      : ''
  }

  ${
    summary.goals.length > 0
      ? `
      <div class="section-title">
        <span>Metas Financeiras (Cofrinhos)</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Meta</th>
            <th class="text-right">Alvo</th>
            <th class="text-right">Guardado</th>
            <th class="text-right">Progresso</th>
            <th>Barra</th>
          </tr>
        </thead>
        <tbody>
          ${goalRows}
        </tbody>
      </table>
    `
      : ''
  }

  ${
    transactions.length > 0
      ? `
      <div class="section-title">
        <span>Transações do Período (${transactions.length})</span>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 75px;">Data</th>
            <th style="width: 65px;">Tipo</th>
            <th style="width: 120px;">Categoria</th>
            <th>Descrição</th>
            <th class="text-right" style="width: 100px;">Valor (R$)</th>
          </tr>
        </thead>
        <tbody>
          ${transactionRows}
        </tbody>
      </table>
    `
      : ''
  }

  <div class="footer">
    <span>Clayfin — Finanças Pessoais com Claymorphism</span>
    <span>Documento gerado localmente no dispositivo • Sem envio para servidores</span>
  </div>
</body>
</html>`;
}
