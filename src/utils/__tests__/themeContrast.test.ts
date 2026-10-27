import { getContrastRatio, meetsWcagAA } from '../contrast';
import { lightColors, darkColors } from '../../theme/colors';

describe('Cálculo de Contraste WCAG 2.1 e Validação de Tokens de Tema', () => {
  describe('Função utilitária getContrastRatio e meetsWcagAA', () => {
    it('calcula contraste entre preto e branco corretamente (21:1)', () => {
      const ratio = getContrastRatio('#000000', '#FFFFFF');
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('calcula contraste de cores idênticas como 1:1', () => {
      const ratio = getContrastRatio('#FFFFFF', '#FFFFFF');
      expect(ratio).toBe(1);
    });

    it('suporta cores rgba com alpha sobre fundo', () => {
      const ratio = getContrastRatio('rgba(0, 0, 0, 0.5)', '#FFFFFF');
      expect(ratio).toBeGreaterThan(1);
      expect(ratio).toBeLessThan(21);
    });

    it('avalia conformidade WCAG AA para texto normal e grande', () => {
      expect(meetsWcagAA('#000000', '#FFFFFF', false)).toBe(true);
      expect(meetsWcagAA('#777777', '#FFFFFF', false)).toBe(false);
      expect(meetsWcagAA('#777777', '#FFFFFF', true)).toBe(true);
    });
  });

  describe('Tokens do Tema Claro (Light Mode)', () => {
    it('textPrimary possui contraste >= 4.5:1 com background e superfícies', () => {
      expect(meetsWcagAA(lightColors.textPrimary, lightColors.background)).toBe(true);
      expect(meetsWcagAA(lightColors.textPrimary, lightColors.surface)).toBe(true);
      expect(meetsWcagAA(lightColors.textPrimary, lightColors.surfaceElevated)).toBe(true);
      expect(getContrastRatio(lightColors.textPrimary, lightColors.background)).toBeGreaterThanOrEqual(7);
    });

    it('textSecondary possui contraste >= 4.5:1 com background e superfícies', () => {
      expect(meetsWcagAA(lightColors.textSecondary, lightColors.background)).toBe(true);
      expect(meetsWcagAA(lightColors.textSecondary, lightColors.surface)).toBe(true);
      expect(meetsWcagAA(lightColors.textSecondary, lightColors.surfaceElevated)).toBe(true);
      expect(getContrastRatio(lightColors.textSecondary, lightColors.surfaceElevated)).toBeGreaterThanOrEqual(4.5);
    });

    it('textMuted possui contraste >= 3.0:1 com superfícies (texto secundário/ícones)', () => {
      expect(meetsWcagAA(lightColors.textMuted, lightColors.surface, true)).toBe(true);
      expect(meetsWcagAA(lightColors.textMuted, lightColors.surfaceElevated, true)).toBe(true);
    });

    it('botão primário e de ação possui contraste satisfatório', () => {
      expect(meetsWcagAA(lightColors.primaryText, lightColors.primaryDark, false)).toBe(true);
      expect(meetsWcagAA(lightColors.primaryText, lightColors.primary, true)).toBe(true);
    });

    it('cores semânticas (income, expense, warning) possuem contraste AA', () => {
      expect(meetsWcagAA(lightColors.income, lightColors.surfaceElevated, false)).toBe(true);
      expect(meetsWcagAA(lightColors.expense, lightColors.surfaceElevated, false)).toBe(true);
      expect(meetsWcagAA(lightColors.warning, lightColors.surfaceElevated, false)).toBe(true);
    });
  });

  describe('Tokens do Tema Escuro (Dark Mode)', () => {
    it('textPrimary possui contraste >= 4.5:1 com background e superfícies', () => {
      expect(meetsWcagAA(darkColors.textPrimary, darkColors.background)).toBe(true);
      expect(meetsWcagAA(darkColors.textPrimary, darkColors.surface)).toBe(true);
      expect(meetsWcagAA(darkColors.textPrimary, darkColors.surfaceElevated)).toBe(true);
      expect(getContrastRatio(darkColors.textPrimary, darkColors.background)).toBeGreaterThanOrEqual(10);
    });

    it('textSecondary possui contraste >= 4.5:1 com background e superfícies', () => {
      expect(meetsWcagAA(darkColors.textSecondary, darkColors.background)).toBe(true);
      expect(meetsWcagAA(darkColors.textSecondary, darkColors.surface)).toBe(true);
      expect(meetsWcagAA(darkColors.textSecondary, darkColors.surfaceElevated)).toBe(true);
      expect(getContrastRatio(darkColors.textSecondary, darkColors.surfaceElevated)).toBeGreaterThanOrEqual(4.5);
    });

    it('textMuted possui contraste >= 3.0:1 com superfícies no modo escuro', () => {
      expect(meetsWcagAA(darkColors.textMuted, darkColors.surface, true)).toBe(true);
      expect(meetsWcagAA(darkColors.textMuted, darkColors.surfaceElevated, true)).toBe(true);
    });

    it('botão primário possui contraste satisfatório no modo escuro', () => {
      expect(meetsWcagAA(darkColors.primaryText, darkColors.primaryDark, false)).toBe(true);
      expect(meetsWcagAA(darkColors.primaryText, darkColors.primary, true)).toBe(true);
    });

    it('cores semânticas no modo escuro possuem contraste AA', () => {
      expect(meetsWcagAA(darkColors.income, darkColors.surface, false)).toBe(true);
      expect(meetsWcagAA(darkColors.income, darkColors.background)).toBe(true);
      expect(meetsWcagAA(darkColors.expense, darkColors.surface, false)).toBe(true);
      expect(meetsWcagAA(darkColors.expense, darkColors.background)).toBe(true);
      expect(meetsWcagAA(darkColors.warning, darkColors.surface, false)).toBe(true);
      expect(meetsWcagAA(darkColors.warning, darkColors.background)).toBe(true);
    });
  });
});
