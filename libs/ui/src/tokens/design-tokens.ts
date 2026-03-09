// Design tokens as TypeScript constants — pour usage programmatique (animations, canvas, etc.)

export const Colors = {
  primary:        '#FF3A00',
  primaryLight:   '#FF6B3D',
  primaryDark:    '#CC2E00',
  secondary:      '#0D1B4B',
  secondaryLight: '#1A2E75',
  accent:         '#F5C400',
  accentDark:     '#C49B00',

  surface:        '#FFFFFF',
  background:     '#F8F9FA',
  surface2:       '#F1F3F5',

  textPrimary:    '#0D1B4B',
  textSecondary:  '#6B7280',
  textMuted:      '#9CA3AF',
  textInverse:    '#FFFFFF',

  border:         '#E5E7EB',

  success:        '#22C55E',
  warning:        '#F59E0B',
  error:          '#EF4444',
  info:           '#3B82F6',
} as const;

export const Typography = {
  fontHeading: "'Poppins', sans-serif",
  fontBody:    "'Inter', sans-serif",

  sizeXs:   '0.75rem',
  sizeSm:   '0.875rem',
  sizeBase: '1rem',
  sizeLg:   '1.125rem',
  sizeXl:   '1.25rem',
  size2xl:  '1.5rem',
  size3xl:  '1.875rem',
  size4xl:  '2.25rem',

  weightRegular:  400,
  weightMedium:   500,
  weightSemibold: 600,
  weightBold:     700,
} as const;

export const Spacing = {
  s1:  '0.25rem',
  s2:  '0.5rem',
  s3:  '0.75rem',
  s4:  '1rem',
  s5:  '1.25rem',
  s6:  '1.5rem',
  s8:  '2rem',
  s10: '2.5rem',
  s12: '3rem',
  s16: '4rem',
} as const;

export type ColorKey = keyof typeof Colors;