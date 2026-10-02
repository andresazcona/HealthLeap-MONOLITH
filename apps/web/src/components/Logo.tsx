import { Box, Typography, useTheme } from '@mui/material';

/** Marca: cruz médica cuyo brazo derecho es una flecha hacia adelante. */
export function Marca({ size = 32 }: { size?: number }) {
  const t = useTheme();
  const fondo = t.palette.primary.main;
  const trazo = t.palette.primary.contrastText;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <rect width="48" height="48" rx="12" fill={fondo} />
      <path d="M22 13v22M12 24h20M28 17l7 7-7 7" fill="none" stroke={trazo} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ size = 32, sinTexto = false }: { size?: number; sinTexto?: boolean }) {
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.25 }} aria-label="HealthLeap">
      <Marca size={size} />
      {!sinTexto && (
        <Typography component="span" sx={{ fontSize: size * 0.62, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1 }}>
          Health<Box component="span" sx={{ color: 'primary.main' }}>Leap</Box>
        </Typography>
      )}
    </Box>
  );
}
