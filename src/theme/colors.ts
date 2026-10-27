export interface ThemeColors {
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceElevated: string;
  surfacePressed: string;
  surfaceSubtle: string;
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
  textPlaceholder: string;
  border: string;
  borderSubtle: string;
  clayHighlight: string;
  clayShadowInner: string;
  clayShadowOuter: string;
  overlay: string;
  inputBackground: string;
  inputBorder: string;
  cardGradientDefault: readonly [string, string];
  cardGradientSubtle: readonly [string, string];
  cardGradientPrimary: readonly [string, string];
  cardGradientIncome: readonly [string, string];
  cardGradientExpense: readonly [string, string];
  chartGrid: string;
  chartLabel: string;
  tabBarBackground: string;
  tabBarBorder: string;
  shadowColor: string;
}

export const lightColors: ThemeColors = {
  background: '#F2EFFA',
  backgroundSecondary: '#EAE5F5',
  surface: '#FBF9FF',
  surfaceElevated: '#FFFFFF',
  surfacePressed: '#EDE8F8',
  surfaceSubtle: '#F3EFFC',
  primary: '#7E61E3',
  primaryLight: '#E4DCFF',
  primaryDark: '#6648CE',
  primaryText: '#FFFFFF',
  secondary: '#72B7F9',
  secondaryLight: '#DDF0FF',
  income: '#208557',
  incomeLight: '#D9F6E8',
  incomeDark: '#176342',
  expense: '#D33829',
  expenseLight: '#FFE2DF',
  expenseDark: '#A62215',
  warning: '#B3580D',
  warningLight: '#FFF0DF',
  warningDark: '#8A4106',
  textPrimary: '#2D264B',
  textSecondary: '#5C537E',
  textMuted: '#7C73A0',
  textPlaceholder: '#9C93BC',
  border: '#E4DEFA',
  borderSubtle: '#EFEBFD',
  clayHighlight: 'rgba(255, 255, 255, 0.92)',
  clayShadowInner: 'rgba(138, 111, 232, 0.14)',
  clayShadowOuter: 'rgba(92, 73, 158, 0.14)',
  overlay: 'rgba(45, 38, 75, 0.45)',
  inputBackground: '#FFFFFF',
  inputBorder: '#E4DEFA',
  cardGradientDefault: ['#FFFFFF', '#F7F4FD'],
  cardGradientSubtle: ['#F6F3FC', '#ECE7F8'],
  cardGradientPrimary: ['#9980F2', '#7E61E3'],
  cardGradientIncome: ['#E6FAF0', '#D2F3E3'],
  cardGradientExpense: ['#FFECEA', '#FFE0DC'],
  chartGrid: 'rgba(138, 111, 232, 0.15)',
  chartLabel: '#5C537E',
  tabBarBackground: '#FBF9FF',
  tabBarBorder: '#E4DEFA',
  shadowColor: '#5C499E',
};

export const darkColors: ThemeColors = {
  background: '#140F22',
  backgroundSecondary: '#1C162E',
  surface: '#241D3B',
  surfaceElevated: '#2F264C',
  surfacePressed: '#1D1730',
  surfaceSubtle: '#1F1932',
  primary: '#8B70EC',
  primaryLight: '#34275E',
  primaryDark: '#6D4ECC',
  primaryText: '#FFFFFF',
  secondary: '#72B7F9',
  secondaryLight: '#1B3454',
  income: '#4EE2A2',
  incomeLight: '#14382A',
  incomeDark: '#2FB87C',
  expense: '#FF7E75',
  expenseLight: '#471B1B',
  expenseDark: '#D94E46',
  warning: '#FFB067',
  warningLight: '#442914',
  warningDark: '#DE8533',
  textPrimary: '#F5F2FF',
  textSecondary: '#B8AFDB',
  textMuted: '#8A7FA8',
  textPlaceholder: '#6E648C',
  border: '#362B54',
  borderSubtle: '#282040',
  clayHighlight: 'rgba(255, 255, 255, 0.12)',
  clayShadowInner: 'rgba(0, 0, 0, 0.38)',
  clayShadowOuter: 'rgba(0, 0, 0, 0.55)',
  overlay: 'rgba(6, 4, 12, 0.72)',
  inputBackground: '#1B152B',
  inputBorder: '#382E57',
  cardGradientDefault: ['#2A2244', '#201A35'],
  cardGradientSubtle: ['#231B39', '#1A142C'],
  cardGradientPrimary: ['#7A5DE6', '#6041CC'],
  cardGradientIncome: ['#18362B', '#11281F'],
  cardGradientExpense: ['#3E1E1E', '#2D1414'],
  chartGrid: 'rgba(255, 255, 255, 0.08)',
  chartLabel: '#B8AFDB',
  tabBarBackground: '#1C162E',
  tabBarBorder: '#2D2348',
  shadowColor: '#000000',
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
