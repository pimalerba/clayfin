/**
 * Utilitários para exportação de dados em CSV formatado para o Excel brasileiro.
 * - Separador de campos: ponto e vírgula (;)
 * - Separador decimal: vírgula (,)
 * - Codificação: UTF-8 com BOM (\uFEFF) para compatibilidade nativa com Excel
 * - Proteção contra injeção de fórmulas CSV (Excel Formula Injection)
 */

export interface TransactionExportRow {
  date: string; // yyyy-MM-dd
  type: 'income' | 'expense';
  category_name: string;
  description: string | null;
  amount_cents: number;
}

export interface ExportCsvOptions {
  includeSign?: boolean; // Se true, despesas levam sinal negativo
}

export interface MonthlyReportExportData {
  month: string; // yyyy-MM
  monthLabel: string; // ex: "Outubro de 2026"
  totalIncomeCents: number;
  totalExpenseCents: number;
  netBalanceCents: number;
  categories: {
    name: string;
    type: 'income' | 'expense';
    totalCents: number;
    percentage: number;
  }[];
  budgets: {
    categoryName: string;
    limitCents: number;
    spentCents: number;
    percentage: number;
    status: 'normal' | 'warning' | 'exceeded';
  }[];
  goals: {
    name: string;
    targetCents: number;
    currentCents: number;
    percentage: number;
    deadline?: string | null;
  }[];
}

const FORMULA_PREFIX_REGEX = /^[\s]*[=+\-@\t\r]/;
const NUMERIC_DECIMAL_REGEX = /^[-+]?\d+(?:,\d+)?$/;

/**
 * Neutraliza células que possam conter injeção de fórmulas no Excel (=, +, -, @, \t, \r)
 * e aplica o escape de aspas e separadores conforme padrão RFC 4180.
 * Valores estritamente numéricos (como 1250,50 ou -35,00) são mantidos como número para o Excel.
 */
export function sanitizeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '""';
  }

  let str = String(value);

  // Se não for puramente numérico e começar com caractere executável de fórmula, neutraliza com apóstrofo (')
  const isPureNumber = NUMERIC_DECIMAL_REGEX.test(str.trim());
  if (!isPureNumber && FORMULA_PREFIX_REGEX.test(str)) {
    str = `'${str}`;
  }

  const needsQuotes =
    str.includes(';') ||
    str.includes('"') ||
    str.includes('\n') ||
    str.includes('\r') ||
    str.startsWith("'");

  const escaped = str.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : `"${escaped}"`;
}

/**
 * Converte valor em centavos para formato decimal brasileiro (ex: 125050 -> "1250,50").
 */
export function formatCentsToDecimal(cents: number, includeSign: boolean = false): string {
  const isNegative = cents < 0;
  const absCents = Math.abs(cents);
  const reais = Math.floor(absCents / 100);
  const centavos = String(absCents % 100).padStart(2, '0');
  const signPrefix = isNegative || (includeSign && cents < 0) ? '-' : '';
  return `${signPrefix}${reais},${centavos}`;
}

/**
 * Converte data ISO (yyyy-MM-dd) para formato brasileiro (dd/MM/yyyy).
 */
export function formatDateIsoToPtBR(isoDate: string): string {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return isoDate || '';
  }
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Gera arquivo CSV completo de transações com BOM UTF-8 e cabeçalho brasileiro.
 */
export function buildTransactionsCsv(
  rows: TransactionExportRow[],
  options: ExportCsvOptions = {}
): string {
  const BOM = '\uFEFF';
  const headers = ['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor (R$)'];
  const headerLine = headers.map(sanitizeCsvCell).join(';');

  if (rows.length === 0) {
    return `${BOM}${headerLine}\r\n`;
  }

  const lines = rows.map((row) => {
    const dateFormatted = formatDateIsoToPtBR(row.date);
    const typeLabel = row.type === 'income' ? 'Receita' : 'Despesa';
    const category = row.category_name;
    const description = row.description ?? '';
    const amountStr = formatCentsToDecimal(
      row.type === 'expense' && options.includeSign
        ? -row.amount_cents
        : row.amount_cents
    );

    return [
      sanitizeCsvCell(dateFormatted),
      sanitizeCsvCell(typeLabel),
      sanitizeCsvCell(category),
      sanitizeCsvCell(description),
      sanitizeCsvCell(amountStr),
    ].join(';');
  });

  return `${BOM}${headerLine}\r\n${lines.join('\r\n')}\r\n`;
}

/**
 * Gera arquivo CSV estruturado do Relatório Mensal consolidado.
 */
export function buildMonthlyReportCsv(data: MonthlyReportExportData): string {
  const BOM = '\uFEFF';
  const lines: string[] = [];

  // 1. Título e Resumo Geral
  lines.push(sanitizeCsvCell(`RELATÓRIO MENSAL CLAYFIN - ${data.monthLabel}`));
  lines.push('');
  lines.push(
    [
      sanitizeCsvCell('Receitas (R$)'),
      sanitizeCsvCell('Despesas (R$)'),
      sanitizeCsvCell('Saldo Líquido (R$)'),
    ].join(';')
  );
  lines.push(
    [
      sanitizeCsvCell(formatCentsToDecimal(data.totalIncomeCents)),
      sanitizeCsvCell(formatCentsToDecimal(data.totalExpenseCents)),
      sanitizeCsvCell(formatCentsToDecimal(data.netBalanceCents)),
    ].join(';')
  );
  lines.push('');

  // 2. Despesas por Categoria
  lines.push(sanitizeCsvCell('DESPESAS POR CATEGORIA'));
  lines.push(
    [
      sanitizeCsvCell('Categoria'),
      sanitizeCsvCell('Total (R$)'),
      sanitizeCsvCell('Participação (%)'),
    ].join(';')
  );

  const expenseCategories = data.categories.filter((c) => c.type === 'expense');
  if (expenseCategories.length === 0) {
    lines.push([sanitizeCsvCell('Nenhuma despesa registrada'), sanitizeCsvCell('0,00'), sanitizeCsvCell('0%')].join(';'));
  } else {
    for (const cat of expenseCategories) {
      lines.push(
        [
          sanitizeCsvCell(cat.name),
          sanitizeCsvCell(formatCentsToDecimal(cat.totalCents)),
          sanitizeCsvCell(`${cat.percentage.toFixed(1).replace('.', ',')}%`),
        ].join(';')
      );
    }
  }
  lines.push('');

  // 3. Orçamentos Mensais
  lines.push(sanitizeCsvCell('ORÇAMENTOS POR CATEGORIA'));
  lines.push(
    [
      sanitizeCsvCell('Categoria'),
      sanitizeCsvCell('Limite (R$)'),
      sanitizeCsvCell('Gasto Atual (R$)'),
      sanitizeCsvCell('Utilizado (%)'),
      sanitizeCsvCell('Situação'),
    ].join(';')
  );

  if (data.budgets.length === 0) {
    lines.push(
      [
        sanitizeCsvCell('Nenhum orçamento configurado'),
        sanitizeCsvCell('0,00'),
        sanitizeCsvCell('0,00'),
        sanitizeCsvCell('0%'),
        sanitizeCsvCell('-'),
      ].join(';')
    );
  } else {
    for (const b of data.budgets) {
      const statusLabel =
        b.status === 'exceeded'
          ? 'Excedido'
          : b.status === 'warning'
          ? 'Alerta'
          : 'Normal';
      lines.push(
        [
          sanitizeCsvCell(b.categoryName),
          sanitizeCsvCell(formatCentsToDecimal(b.limitCents)),
          sanitizeCsvCell(formatCentsToDecimal(b.spentCents)),
          sanitizeCsvCell(`${b.percentage.toFixed(1).replace('.', ',')}%`),
          sanitizeCsvCell(statusLabel),
        ].join(';')
      );
    }
  }
  lines.push('');

  // 4. Progresso das Metas (Cofrinhos)
  lines.push(sanitizeCsvCell('METAS FINANCEIRAS'));
  lines.push(
    [
      sanitizeCsvCell('Meta'),
      sanitizeCsvCell('Valor Alvo (R$)'),
      sanitizeCsvCell('Guardado (R$)'),
      sanitizeCsvCell('Concluído (%)'),
      sanitizeCsvCell('Data Limite'),
    ].join(';')
  );

  if (data.goals.length === 0) {
    lines.push(
      [
        sanitizeCsvCell('Nenhuma meta criada'),
        sanitizeCsvCell('0,00'),
        sanitizeCsvCell('0,00'),
        sanitizeCsvCell('0%'),
        sanitizeCsvCell('-'),
      ].join(';')
    );
  } else {
    for (const g of data.goals) {
      lines.push(
        [
          sanitizeCsvCell(g.name),
          sanitizeCsvCell(formatCentsToDecimal(g.targetCents)),
          sanitizeCsvCell(formatCentsToDecimal(g.currentCents)),
          sanitizeCsvCell(`${g.percentage.toFixed(1).replace('.', ',')}%`),
          sanitizeCsvCell(g.deadline ? formatDateIsoToPtBR(g.deadline) : 'Sem prazo'),
        ].join(';')
      );
    }
  }

  return `${BOM}${lines.join('\r\n')}\r\n`;
}
