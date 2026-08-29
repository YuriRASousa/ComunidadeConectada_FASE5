// Cores extraídas de lib/theme/app_theme.dart do app Flutter original,
// para manter a mesma identidade visual na versão React Native.
export const colors = {
  primaryBlue: '#0EA5E9', // Azul Sky 500
  primaryBlueLight: '#38BDF8',
  secondaryGreen: '#10B981', // Esmeralda
  primaryDark: '#0F172A', // Slate 900
  primaryDarkSoft: '#1E293B', // Slate 800
  textDark: '#1E293B', // Slate 800
  slate600: '#475569',
  slate400: '#94A3B8',
  scaffoldBg: '#F8FAFC', // Slate 50
  white: '#FFFFFF',
  grey300: '#D1D5DB',
  grey400: '#9CA3AF',
  grey500: '#6B7280',
  grey600: '#4B5563',
  danger: '#DC2626',
};

// Gradientes reaproveitados dos pontos em que o app Flutter original usava
// LinearGradient (ícone do onboarding, cabeçalho/botão do ConectaIA, FAB,
// header da Home) — mesma dupla de cores, agora centralizada aqui.
export const gradients = {
  brand: [colors.primaryBlue, colors.primaryBlueLight] as const,
  dark: [colors.primaryDark, colors.primaryDarkSoft] as const,
  brandDiagonal: { colors: [colors.primaryBlue, colors.primaryBlueLight] as const, start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
};

export const spacing = (n: number) => n * 4;
