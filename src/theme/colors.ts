export interface ThemeColors {
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceElevated: string;
  surfacePressed: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryText: string;
  secondary: string;
  secondaryLight: string;
  income: string;
  incomeLight: string;
  incomeDark: string;
  expense: string;
  expenseLight: string;
  expenseDark: string;
  warning: string;
  warningLight: string;
  warningDark: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  clayHighlight: string;
  clayShadowInner: string;
  clayShadowOuter: string;
  overlay: string;
}

export const lightColors: ThemeColors = {
  background: '#F2EFFA',
  backgroundSecondary: '#EAE5F5',
  surface: '#FBF9FF',
  surfaceElevated: '#FFFFFF',
  surfacePressed: '#EDE8F8',
  primary: '#8A6FE8',
  primaryLight: '#E4DCFF',
  primaryDark: '#6A4FD0',
  primaryText: '#FFFFFF',
  secondary: '#72B7F9',
  secondaryLight: '#DDF0FF',
  income: '#44B988',
  incomeLight: '#D9F6E8',
  incomeDark: '#2A8D63',
  expense: '#F07167',
  expenseLight: '#FFE2DF',
  expenseDark: '#C94A40',
  warning: '#F4A261',
  warningLight: '#FFF0DF',
  warningDark: '#C87836',
  textPrimary: '#2D264B',
  textSecondary: '#6E668F',
  textMuted: '#A199BE',
  border: '#E4DEFA',
  clayHighlight: 'rgba(255, 255, 255, 0.92)',
  clayShadowInner: 'rgba(138, 111, 232, 0.14)',
  clayShadowOuter: 'rgba(92, 73, 158, 0.14)',
  overlay: 'rgba(45, 38, 75, 0.45)',
};

export const darkColors: ThemeColors = {
  background: '#1B172B',
  backgroundSecondary: '#241F38',
  surface: '#2A2442',
  surfaceElevated: '#342D52',
  surfacePressed: '#211C35',
  primary: '#9D85F2',
  primaryLight: '#3D326B',
  primaryDark: '#7C62DC',
  primaryText: '#FFFFFF',
  secondary: '#72B7F9',
  secondaryLight: '#223B59',
  income: '#55CE9B',
  incomeLight: '#1E4637',
  incomeDark: '#3DA579',
  expense: '#F4837A',
  expenseLight: '#4D2525',
  expenseDark: '#D95D53',
  warning: '#F7B277',
  warningLight: '#4A3623',
  warningDark: '#D68C4E',
  textPrimary: '#F5F2FF',
  textSecondary: '#B8B0D9',
  textMuted: '#7E76A1',
  border: '#3B335B',
  clayHighlight: 'rgba(255, 255, 255, 0.10)',
  clayShadowInner: 'rgba(0, 0, 0, 0.35)',
  clayShadowOuter: 'rgba(0, 0, 0, 0.45)',
  overlay: 'rgba(10, 8, 20, 0.68)',
};

export const CATEGORY_PRESET_COLORS = [
  '#F07167', // Coral
  '#72B7F9', // Azul-bebê
  '#8A6FE8', // Lilás
  '#F4A261', // Pêssego
  '#44B988', // Menta
  '#E76F9B', // Rosa-argila
  '#56B4BA', // Turquesa-pastel
  '#9B89B3', // Lavanda-escuro
  '#E9C46A', // Amarelo-pastel
  '#6D9DC5', // Azul-sereno
];
