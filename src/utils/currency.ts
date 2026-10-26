const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

/**
 * Formata um valor inteiro em centavos para moeda BRL (R$ 0,00).
 */
export function formatCentsToBRL(cents: number): string {
  const safeCents = Number.isFinite(cents) ? Math.trunc(cents) : 0;
  return brlFormatter.format(safeCents / 100);
}

/**
 * Converte uma string digitada (máscara da direita para a esquerda) em centavos inteiros.
 * Ex.: "1250" -> 1250 (R$ 12,50), "R$ 1.234,56" -> 123456.
 */
export function parseCurrencyInputToCents(rawInput: string): number {
  if (!rawInput) return 0;
  const digitsOnly = rawInput.replace(/\D/g, '');
  if (!digitsOnly) return 0;
  const parsed = parseInt(digitsOnly, 10);
  if (Number.isNaN(parsed) || parsed < 0) return 0;
  // Limite seguro (R$ 99.999.999,99 = 9_999_999_999 centavos)
  return Math.min(parsed, 9_999_999_999);
}

/**
 * Formata centavos para exibição dentro de inputs monetários.
 */
export function formatCentsForInput(cents: number): string {
  return formatCentsToBRL(Math.max(0, Math.trunc(cents || 0)));
}
