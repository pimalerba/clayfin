/**
 * Utilitários para cálculo de luminância relativa e taxa de contraste WCAG 2.1.
 * Suporta formatos hex (#RGB, #RRGGBB, #RRGGBBAA) e rgba(r, g, b, a).
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * Converte uma string de cor hex ou rgba em componentes RGB normalizados (0-255) e alpha (0-1).
 */
export function parseColor(colorStr: string): RGB {
  const str = colorStr.trim().toLowerCase();

  // Caso rgba(r, g, b, a) ou rgb(r, g, b)
  if (str.startsWith('rgb')) {
    const match = str.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/);
    if (match) {
      return {
        r: Math.min(255, Math.max(0, parseFloat(match[1]))),
        g: Math.min(255, Math.max(0, parseFloat(match[2]))),
        b: Math.min(255, Math.max(0, parseFloat(match[3]))),
        a: match[4] !== undefined ? Math.min(1, Math.max(0, parseFloat(match[4]))) : 1,
      };
    }
  }

  // Caso hex
  if (str.startsWith('#')) {
    const hex = str.slice(1);
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
        a: 1,
      };
    }
    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: 1,
      };
    }
    if (hex.length === 8) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: parseInt(hex.slice(6, 8), 16) / 255,
      };
    }
  }

  // Fallback para preto se formato não for reconhecido
  return { r: 0, g: 0, b: 0, a: 1 };
}

/**
 * Mescla uma cor de primeiro plano (com possível transparência) sobre uma cor de fundo sólida.
 */
export function blendColors(foreground: RGB, background: RGB): RGB {
  const alpha = foreground.a;
  return {
    r: Math.round(alpha * foreground.r + (1 - alpha) * background.r),
    g: Math.round(alpha * foreground.g + (1 - alpha) * background.g),
    b: Math.round(alpha * foreground.b + (1 - alpha) * background.b),
    a: 1,
  };
}

/**
 * Calcula a luminância relativa de uma cor RGB (fórmula padrão WCAG 2.1).
 * Valores retornados variam de 0.0 (preto absoluto) a 1.0 (branco absoluto).
 */
export function getLuminance(rgb: RGB): number {
  const sRGB = [rgb.r / 255, rgb.g / 255, rgb.b / 255];
  const linear = sRGB.map((c) => {
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

/**
 * Calcula a taxa de contraste entre duas cores no formato string (#hex ou rgba).
 * Se o foreground possuir transparência (alpha < 1), mescla com o background primeiro.
 * Retorna valor entre 1:1 e 21:1.
 */
export function getContrastRatio(foregroundStr: string, backgroundStr: string): number {
  const fg = parseColor(foregroundStr);
  const bg = parseColor(backgroundStr);

  const effectiveFg = fg.a < 1 ? blendColors(fg, bg) : fg;
  const effectiveBg = bg.a < 1 ? blendColors(bg, { r: 255, g: 255, b: 255, a: 1 }) : bg;

  const l1 = getLuminance(effectiveFg);
  const l2 = getLuminance(effectiveBg);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Math.round(ratio * 100) / 100;
}

/**
 * Verifica se a taxa de contraste atende ao padrão WCAG AA:
 * - Texto normal (< 18pt regular ou < 14pt bold): razão >= 4.5:1
 * - Texto grande (>= 18pt regular ou >= 14pt bold) ou ícones/componentes UI: razão >= 3.0:1
 */
export function meetsWcagAA(
  foreground: string,
  background: string,
  isLargeTextOrComponent: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return isLargeTextOrComponent ? ratio >= 3.0 : ratio >= 4.5;
}
