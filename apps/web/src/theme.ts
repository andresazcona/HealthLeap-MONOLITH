import { createTheme, alpha } from '@mui/material/styles';
import type { EstadoCita } from './lib/types';

// Sistema de diseño "Clinical Clarity" (design/stitch/.../DESIGN.md)
const base = {
  light: {
    primary: '#0F766E', primaryHover: '#115E59', primaryContainer: '#CCFBF1', onPrimaryContainer: '#115E59',
    secondary: '#475569', secondaryContainer: '#F1F5F9',
    bg: '#F8FAFC', surface: '#FFFFFF', surfaceContainer: '#F1F5F9', line: '#E2E8F0', outline: '#CBD5E1',
    text: '#131B2E', textMuted: '#475569', error: '#B42318', success: '#067647', warning: '#B54708',
  },
  dark: {
    primary: '#2DD4BF', primaryHover: '#5EEAD4', primaryContainer: '#134E4A', onPrimaryContainer: '#CCFBF1',
    secondary: '#94A3B8', secondaryContainer: '#1E293B',
    bg: '#0B1220', surface: '#111A2B', surfaceContainer: '#17223A', line: '#22304A', outline: '#334155',
    text: '#E6EAF2', textMuted: '#94A3B8', error: '#F97066', success: '#47CD89', warning: '#FDB022',
  },
};

export const estadoColores: Record<'light' | 'dark', Record<EstadoCita, { bg: string; fg: string; dot: string }>> = {
  light: {
    agendada: { bg: '#E0F2FE', fg: '#026AA2', dot: '#0284C7' },
    'en espera': { bg: '#FEF0C7', fg: '#B54708', dot: '#D97706' },
    atendida: { bg: '#D1FADF', fg: '#067647', dot: '#16A34A' },
    cancelada: { bg: '#F1F5F9', fg: '#475569', dot: '#94A3B8' },
  },
  dark: {
    agendada: { bg: '#0C2F44', fg: '#7DD3FC', dot: '#38BDF8' },
    'en espera': { bg: '#3D2A06', fg: '#FCD34D', dot: '#F59E0B' },
    atendida: { bg: '#0B3320', fg: '#86EFAC', dot: '#22C55E' },
    cancelada: { bg: '#1E293B', fg: '#94A3B8', dot: '#64748B' },
  },
};

export function crearTema(mode: 'light' | 'dark') {
  const c = base[mode];
  const sombra1 = mode === 'light' ? '0 1px 3px 0 rgba(15, 23, 42, 0.05)' : 'none';
  const sombra3 = '0 10px 15px -3px rgba(15, 23, 42, 0.06), 0 4px 6px -4px rgba(15, 23, 42, 0.04)';

  return createTheme({
    palette: {
      mode,
      primary: { main: c.primary, dark: c.primaryHover, contrastText: mode === 'light' ? '#FFFFFF' : '#04211E' },
      secondary: { main: c.secondary },
      error: { main: c.error },
      success: { main: c.success },
      warning: { main: c.warning },
      background: { default: c.bg, paper: c.surface },
      text: { primary: c.text, secondary: c.textMuted },
      divider: c.line,
    },
    shape: { borderRadius: 8 },
    typography: {
      fontFamily: '"Inter Variable", Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
      fontWeightBold: 600,
      h1: { fontSize: '2rem', fontWeight: 600, lineHeight: '40px', letterSpacing: '-0.01em' },
      h2: { fontSize: '1.5rem', fontWeight: 600, lineHeight: '32px' },
      h3: { fontSize: '1.25rem', fontWeight: 600, lineHeight: '28px' },
      h4: { fontSize: '1rem', fontWeight: 600, lineHeight: '24px', letterSpacing: '0.01em' },
      body1: { fontSize: '1rem', lineHeight: '24px', letterSpacing: '0.01em' },
      body2: { fontSize: '0.875rem', lineHeight: '20px', letterSpacing: '0.015em' },
      caption: { fontSize: '0.75rem', lineHeight: '16px', letterSpacing: '0.02em' },
      overline: { fontSize: '0.6875rem', fontWeight: 600, lineHeight: '14px', letterSpacing: '0.04em' },
      button: { textTransform: 'none', fontWeight: 500, letterSpacing: '0.01em' },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: { colorScheme: mode },
          body: { fontFeatureSettings: '"tnum" 1', backgroundColor: c.bg },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 8, minHeight: 40, paddingInline: 16 },
          outlined: { borderColor: c.outline, '&:hover': { backgroundColor: c.surfaceContainer, borderColor: c.primary } },
          text: { '&:hover': { backgroundColor: alpha(c.primaryContainer, 0.5) } },
          sizeLarge: { minHeight: 48 },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: { root: { backgroundImage: 'none' } },
      },
      MuiCard: {
        defaultProps: { variant: 'outlined' },
        styleOverrides: { root: { borderRadius: 12, borderColor: c.line, boxShadow: sombra1 } },
      },
      MuiDialog: {
        styleOverrides: { paper: { borderRadius: 12, boxShadow: sombra3 } },
      },
      MuiBackdrop: {
        styleOverrides: { root: { backgroundColor: 'rgba(15, 23, 42, 0.4)' } },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            backgroundColor: c.surface,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: c.outline },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: c.secondary },
          },
        },
      },
      MuiTextField: { defaultProps: { size: 'small', fullWidth: true } },
      MuiSelect: { defaultProps: { size: 'small' } },
      MuiTableCell: {
        styleOverrides: {
          root: { borderColor: c.line, paddingTop: 10, paddingBottom: 10 },
          head: { fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.02em', color: c.textMuted, backgroundColor: c.surfaceContainer },
        },
      },
      MuiChip: { styleOverrides: { root: { fontWeight: 500 } } },
      MuiTab: { styleOverrides: { root: { textTransform: 'none', fontWeight: 500, minHeight: 44 } } },
      MuiTooltip: { defaultProps: { arrow: true } },
    },
  });
}

export const tokens = base;
