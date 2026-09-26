export const colors = {
  background: '#0B0F17',
  surface: '#131A26',
  surfaceCard: '#1A2234',
  surfaceElevated: '#222E46',
  surfaceHighlight: '#2A3752',

  primary: '#6366F1',
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',

  accent: '#06B6D4',
  accentGlow: 'rgba(6, 182, 212, 0.15)',

  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',

  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',

  border: '#1E293B',
  borderHighlight: '#334155',
} as const;

export type Colors = typeof colors;
